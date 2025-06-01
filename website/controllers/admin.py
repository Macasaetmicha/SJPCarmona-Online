from flask import Blueprint, render_template, request, abort, flash, redirect, url_for, jsonify
from flask_login import login_required, current_user
from ..models import db, User, UserRole, AuditLog
from .api_db import get_records_count

admin = Blueprint('admin', __name__)

@admin.route('/dashboard')
@login_required
def dashboard():
    print(current_user.role)
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('views.home'))
    return render_template("dashboard.html", active_page='dashboard', user=current_user, UserRole=UserRole)

@admin.route('/records', methods=['GET', 'POST'])
@login_required
def records():
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('views.home'))
    
    return render_template("records.html", active_page='records', user=current_user, UserRole=UserRole)

@admin.route('/priest')
@login_required
def preist():
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('views.home'))
    return render_template("priest.html", active_page='priest', user=current_user, UserRole=UserRole)

@admin.route('/baptism')
@login_required
def baptism():
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('views.home'))
    return render_template("baptism.html", active_page='baptism', user=current_user, UserRole=UserRole)

@admin.route('/confirmation')
@login_required
def confirmation():
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('views.home'))
    return render_template("confirmation.html", active_page='confirmation', user=current_user, UserRole=UserRole)

@admin.route('/wedding')
@login_required
def wedding():
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('views.home'))
    return render_template("wedding.html", active_page='wedding', user=current_user, UserRole=UserRole)

@admin.route('/death')
@login_required
def death():
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('views.home'))
    return render_template("death.html", active_page='death', user=current_user, UserRole=UserRole)

@admin.route('/requests')
@login_required
def requests():
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('views.home'))
    
    return render_template("request.html", active_page='requestAdmin', user=current_user, UserRole=UserRole)

@admin.route('/report')
@login_required
def report():
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('views.home'))
    
    return render_template("reports.html", active_page='report', user=current_user, UserRole=UserRole)

@admin.route('/audit-log')
@login_required
def audit_log():
    if current_user.role not in [UserRole.ADMIN]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('views.home'))
    logs = AuditLog.query.order_by(AuditLog.changed_at.desc()).all()
    return render_template("audit.html", active_page='audit', logs=logs, user=current_user, UserRole=UserRole)

@admin.route('/accounts')
@login_required
def accounts():
    if current_user.role not in [UserRole.ADMIN]:
        flash('You do not have the credential to access this page.', category='warning')
        return redirect(url_for('views.home'))
    
    return render_template("accounts.html", active_page='accounts', user=current_user, UserRole=UserRole)

