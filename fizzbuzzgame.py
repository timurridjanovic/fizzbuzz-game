import os
import webapp2
import jinja2
import hmac
import re
from string import letters
import time
import logging
import json

from google.appengine.ext import db
from google.appengine.api import memcache

template_dir = os.path.join(os.path.dirname(__file__), 'templates')
jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(template_dir), autoescape = True)



class Handler(webapp2.RequestHandler):
    def write(self, *a, **kw):
        self.response.out.write(*a, **kw)

    def render_str(self, template, **params):
        t = jinja_env.get_template(template)
        return t.render(params)

    def render(self, template, **kw):
        self.write(self.render_str(template, **kw))

   
               

class Index(Handler):
    def get(self):
        self.render("index.html")

class Game(Index):
    def get(self):
	self.render("game.html")


app = webapp2.WSGIApplication([('/', Index), ('/game', Game)], 
		debug=True)
