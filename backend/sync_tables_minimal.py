from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
# Get absolute path for sqlite DB
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'instance', 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Import models
import models
models.db = db # monkey patch db
for name, cls in models.__dict__.items():
    if isinstance(cls, type) and issubclass(cls, db.Model):
        setattr(models, name, cls)

with app.app_context():
    try:
        db.create_all()
        print('Tables created')
    except Exception as e:
        print('Error:', e)
