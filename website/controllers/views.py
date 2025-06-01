from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from ..models import db, User, UserRole, Request

views = Blueprint('views', __name__)

@views.route('/')
def index():
    return redirect(url_for('auth.login')) 

@views.route('/home')
@login_required
def home():
    if current_user.role not in [UserRole.CLIENT]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('auth.login'))
    user_requests = Request.query.filter_by(user_id=current_user.id).all()

    for req in user_requests:
        req.type = req.ceremony.value 
        req.status = req.status.value 
    print("These are the User Requests: ", user_requests)
    return render_template("home.html", active_page='home', user_requests=user_requests, user=current_user, UserRole=UserRole)

@views.route('/request')
@login_required
def request():
    if current_user.role not in [UserRole.CLIENT]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('auth.login'))
    return render_template("request_client.html", active_page='request', user=current_user, UserRole=UserRole)

@views.route('/request-form', methods=['GET', 'POST'])
@login_required
def request_form():
    if current_user.role not in [UserRole.CLIENT]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('auth.login'))
    return render_template('request_form.html', active_page='request', user=current_user, UserRole=UserRole)

@views.route('/setting')
@login_required
def setting():
    if current_user.role not in [UserRole.CLIENT]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('auth.login'))
    return render_template("setting.html", active_page='setting', user=current_user, UserRole=UserRole)