from flask import Flask 
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from os import path
import os
from flask_migrate import Migrate
from flask_mail import Mail

from .config.config import Config

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
mail = Mail()

def create_app():
    app = Flask(__name__, static_url_path="")

    # app.config['SECRET_KEY'] = 'secretkey'
    app.secret_key = os.urandom(32)  # Used for session.
    app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
    
    db.init_app(app)
    migrate.init_app(app, db)

    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    from .models import User, Request, Schedule, Record, Parent, Priest, Baptism, Confirmation, Wedding, Death

    # Register the audit listener module here:
    with app.app_context():
        from .controllers import audit
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints
    from .controllers.views import views
    from .controllers.auth import auth
    from .controllers.admin import admin
    from .controllers.api import api as fido_bp
    from .controllers.api_db import api_db as api_db
    from .controllers.api_routes import api_route as api_route
    
    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')
    app.register_blueprint(admin, url_prefix='/admin')
    app.register_blueprint(fido_bp)
    app.register_blueprint(api_db, url_prefix='/api_db')
    app.register_blueprint(api_route)

    #Mail Configurations
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = 'sjp.carmonacavite@gmail.com'  # your email
    app.config['MAIL_PASSWORD'] = 'hlha qnpm tfjl raul'  # use app password for Gmail
    app.config['MAIL_DEFAULT_SENDER'] = ('St. Joseph Carmona Online', 'sjp.carmonacavite@gmail.com')

    mail.init_app(app)

    return app
