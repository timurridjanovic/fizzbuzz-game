import os
import webapp2
import jinja2
import hmac
import re
from string import letters
import time
import logging
import json
import random
import hashlib


from google.appengine.ext import db
from google.appengine.api import memcache

template_dir = os.path.join(os.path.dirname(__file__), 'templates')
jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(template_dir), autoescape = True)


#Handler + login + logout + set secure cookie
class Handler(webapp2.RequestHandler):
    def write(self, *a, **kw):
        self.response.out.write(*a, **kw)

    def render_str(self, template, **params):
        t = jinja_env.get_template(template)
        return t.render(params)


    def render(self, template, **kw):
        self.write(self.render_str(template, **kw))

    def set_secure_cookie(self, name, val):
        cookie_val = make_secure_val(val)
        self.response.headers.add_header(
            'Set-Cookie',
            '%s=%s; Path=/' % (name, cookie_val))

    def read_secure_cookie(self, name):
        cookie_val = self.request.cookies.get(name)
        return cookie_val and check_secure_val(cookie_val)

    def login(self, user):
        self.set_secure_cookie('user_id', str(user.key().id()))

    def logout(self):
        self.response.headers.add_header('Set-Cookie', 'user_id=; Path=/')

    def initialize(self, *a, **kw):
        webapp2.RequestHandler.initialize(self, *a, **kw)
        uid = self.read_secure_cookie('user_id')
        self.user = uid and Users.by_id(int(uid))

   
               
#pages
class Index(Handler):
    def get(self):
        self.render("index.html")


#game page
class Game(Index):
    def get(self):
        if self.user:
	    username = self.user.username
	    highscore = memcache.get(username+' highscore')
	    logging.error(highscore)
	    if not highscore:
	    	u = Users.all().filter('username =', username).get()
		highscore = 0
		if u.highscore is not None:
			memcache.set(username+' highscore', u.highscore)
			highscore = u.highscore
			logging.error('just set highscore in memcache')
	    
            self.render('game.html', user = self.user, username = username, highscore = highscore)  
        else:
            self.render('game.html')


    def post(self):
        username = self.request.get("login_username")
        password = self.request.get("login_password")
	logging.error(username)
        
        u = Users.login(username, password)
        if u:
            self.login(u)
            self.redirect("/game")
        else:
            msg = "Invalid login!"
            self.render("game.html", login_error = msg)

#Ajax to store new high score
class Ajax(Index):
	def post(self):
		username = self.request.get("username")
		logging.error(username)
		highscore = int(self.request.get('highscore'))
		result = Users.all().filter('username =', username).get()
		if result:
			result.highscore = highscore
			result.put()
			memcache.set(username + ' highscore', highscore)
			self.response.out.headers['Content-Type'] = 'text/json'
			self.response.out.write(json.dumps('successfully updated highscore'))


#Ajax to display High Scores
class HighScores(Index):
	def post(self):
		request = self.request.get('request')
		logging.error(request)
		results = Users.all().order('-highscore')
		result = []
		for r in results.run(limit=21):
			result.append(str(r.username) + ': ' + str(r.highscore))
		logging.error(result)
		self.response.out.write(json.dumps({'result': result}))



#model for users
def users_key(group = 'default'):
    return db.Key.from_path('users', group)

class Users(db.Model):
    username = db.StringProperty(required = True)
    password = db.StringProperty(required = True)
    email = db.StringProperty(required = True)
    highscore = db.IntegerProperty(default=0)
    created = db.DateTimeProperty(auto_now_add = True)

    @classmethod
    def by_id(cls, uid):
        return Users.get_by_id(uid, parent = users_key())

    @classmethod
    def by_name(cls, name):
        u = Users.all().filter('username =', name).get()
        return u

    @classmethod
    def register(cls, name, pw, email = None):
        pw_hash = make_pw_hash(name, pw)
        return Users(parent = users_key(),
                    username = name,
                    password = pw_hash,
                    email = email)

    @classmethod
    def login(cls, name, pw):
        u = cls.by_name(name)
        if u and valid_pw(name, pw, u.password):
            return u




#Signup
class Signup(Index):
	def get(self):
		self.render("signup.html")

	def post(self):
        	have_error = False
        	have_user = False
        	username = self.request.get("username")
        	password = self.request.get("password")
        	verify = self.request.get("verify")
        	email = self.request.get("email")

        	params = dict(username=username, email=email)
        
        	users = Users.all()
        	if users.filter("username =", username).get():
            		have_error = True
            		params['user_exists_error'] = "This user is already registered!"  


        	if not valid_username(username):
            		params['username_error'] = "You have not entered a valid username!"
            		have_error = True
        
        	if not valid_password(password):
            		params['password_error'] = "You have not entered a valid password!"
            		have_error = True
        	elif verify != password:
            		params['verify_error'] = "Your passwords didn't match!"
            		have_error = True

        	if not valid_email(email):
            		params['email_error'] = "You have not entered a valid email!"
            		have_error = True

        	if have_error:
            		self.render("signup.html", **params)
        	else:
            		u = Users.register(username, password, email)
            		key = u.put()
            		self.login(u)
            
            		self.redirect("/game")

#Logout

class Logout(Index):
	def get(self):
		self.logout()
		self.redirect('/game')

#utils
USER_RE = re.compile(r"^[a-zA-Z0-9_-]{3,20}$")
def valid_username(username):
    return username and USER_RE.match(username)

SECRET = 'Timur'
def hash_str(s):
    return hmac.new(SECRET, str(s)).hexdigest()

def make_secure_val(s):
    return "%s|%s" % (s, hash_str(s))

def check_secure_val(h):
	val = h.split('|')[0]
	if h == make_secure_val(val):
		return val

PASS_RE = re.compile(r"^.{3,20}$")
def valid_password(password):
    return password and PASS_RE.match(password)

EMAIL_RE  = re.compile(r'^[\S]+@[\S]+\.[\S]+$')
def valid_email(email):
    return email and EMAIL_RE.match(email)

def make_salt(length = 5):
    return ''.join(random.choice(letters) for x in xrange(length))

def make_pw_hash(name, pw, salt = None):
    if not salt:
        salt = make_salt()
    h = hashlib.sha256(name + pw + salt).hexdigest()
    return '%s,%s' % (salt, h)

def valid_pw(name, password, h):
    salt = h.split(',')[0]
    return h == make_pw_hash(name, password, salt)


app = webapp2.WSGIApplication([('/', Index), ('/game', Game), ('/signup', Signup), ('/logout', Logout), ('/ajax', Ajax), ('/highscores', HighScores)], 
		debug=True)
