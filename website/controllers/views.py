from flask import Blueprint, render_template, redirect, url_for, request
from flask_login import login_required, current_user
from ..models import db, User, UserRole, Request

views = Blueprint('views', __name__)

@views.route('/')
def index():
    return redirect(url_for('auth.login')) 

@views.route('/home')
@login_required
def home():
    user_requests = Request.query.filter_by(user_id=current_user.id).all()

    # Optionally, you can process the data (e.g., convert enums to strings)
    # Example:
    for req in user_requests:
        req.type = req.ceremony.value  # assuming enum ceremony
        req.status = req.status.value  # assuming enum status
    print("These are the User Requests: ", user_requests)
    return render_template("home.html", active_page='home', user_requests=user_requests, user=current_user, UserRole=UserRole)

@views.route('/request')
@login_required
def request():
    return render_template("request_client.html", active_page='request', user=current_user, UserRole=UserRole)

# Request form page
@views.route('/request-form', methods=['GET', 'POST'])
@login_required
def request_form():
    return render_template('request_form.html', active_page='request', user=current_user, UserRole=UserRole)

@views.route('/setting')
@login_required
def setting():
    return render_template("setting.html", active_page='setting', user=current_user, UserRole=UserRole)