from flask import Blueprint, render_template, request, flash, redirect, url_for, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import flask_login
from flask_login import login_user, login_required, logout_user, current_user
from ..models import User, UserRole
from ..db import create_user, UsernameAlreadyExistsException
import re
from ..fidosession import get_user_id, close_fido_session, start_fido_session
from ..models import db, User, UserRole, Record, Request, Schedule, Parent, Baptism, Confirmation, Wedding, Death, Priest, Region, Province, CityMun, Barangay
import traceback 
import uuid
from .sms_service import send_verification_sms
import random
from datetime import datetime, timedelta, timezone
import pytz
from flask_mail import Message
from website import mail

auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['GET', 'POST'])
def login():
    try:
        logout_user()
    
        if current_user.is_authenticated:
            return redirect('/')
    
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
    
            user = User.query.filter_by(email=email).first()
    
            if user:
                if check_password_hash(user.password, password):
                    start_fido_session(user.id)
                    return redirect('/login_fido')
                else:
                    flash('Incorrect password, try again.', category='error')
            else:
                flash('Email does not exist.', category='error')
    
        return render_template("login.html", active_page='login', user=current_user, UserRole=UserRole)
    except Exception as e:
        import traceback
        traceback.print_exc() 
        return jsonify({"message": "Error sending email"}), 500

@auth.route('/login_fido')
def login_fido():
    """This route returns the HTML for the fido-login page. This page can only be accessed if the user has a valid
    fido-session."""

    # logged-in users don't have to log in
    if flask_login.current_user.is_authenticated:
        return redirect("/home")

    # check if there is a fido-session
    user_id = get_user_id()
    print('USER ID CHECK2')
    print(user_id)
    if user_id is None:
        return redirect('/login')
    
    user = User.query.get(user_id)
    if not user:
        return redirect('/login')
    
    phone = user.contact_number
    masked_phone = f"****{phone[-4:]}" if phone and len(phone) >= 4 else None

    return render_template(
        "login_fido.html", 
        active_page='login', 
        user=user, 
        masked_phone=masked_phone,
        UserRole=UserRole)

@auth.route('/signup', methods=['GET', 'POST'])
def signup():
    logout_user()

    if current_user.is_authenticated:
        return redirect('/')

    return render_template("signup.html", active_page='signup', user=current_user, UserRole=UserRole)

@auth.route('/signup-user', methods=['POST'])
def signupUser():
    try:    
        print("POST METHOD")
        data = request.form.to_dict()

        first_name = request.form.get('fname')
        middle_name = request.form.get('mname')
        last_name = request.form.get('lname')
        username = request.form.get('username')
        contact_number = request.form.get('contact_number')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        hashed_password = generate_password_hash(password, method='pbkdf2:sha256', salt_length=8)
        
        existing_user = User.query.filter(
            and_(
                User.first_name.ilike(first_name),
                User.middle_name.ilike(middle_name) if middle_name else User.middle_name.is_(None),
                User.last_name.ilike(last_name)
            )
        ).first()

        if existing_user:
            return jsonify({
                "error": "A user with the same name already exists.",
                "type": "warning"
            }), 409

        if User.query.filter_by(username=username).first():
            return jsonify({
                "error": "Username already exists.",
                "type": "warning"
            }), 409

        if not re.match(r'^09\d{9}$', contact_number):
            return jsonify({
                "error": "Invalid contact number format. Use 09XXXXXXXXX.",
                "type": "warning"
            }), 400
            
        if User.query.filter_by(contact_number=contact_number).first():
            return jsonify({
                "error": "Contact Number already used.",
                "type": "warning"
            }), 409

        if User.query.filter_by(email=email).first():
            return jsonify({
                "error": "Email already exists.",
                "type": "warning"
            }), 409

        if len(password) < 8:
            return jsonify({
                "error": "Password must be at least 8 characters long.",
                "type": "warning"
            }), 400
            
        if password != confirm_password:
            return jsonify({
                "error": "Passwords do not match.",
                "type": "warning"
            }), 409

        # Generate a temporary UUID
        temp_id = str(uuid.uuid4())

        # Store the data server-side
        session[f"temp_user_{temp_id}"] = {
            "username": username,
            "first_name": first_name,
            "middle_name": middle_name,
            "last_name": last_name,
            "contact_number": contact_number,
            "email": email,
            "password": hashed_password,
            "role": UserRole.CLIENT.value
        }

        print("SUCCESS\n\n")

        return jsonify({
            "status": "ok",
            "type":"info",
            "message": "Account data received. Proceed with authentication.",
            "temp_id": temp_id  # or store in server-side session
        })
    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        traceback.print_exc()
        return jsonify({
            "error": "Server error occurred.",
            "details": str(e),
            "type": "error"
        }), 500

# @auth.route('/signup_fido', methods=['GET', 'POST'])
# def signup_fido():
#     temp_id = request.args.get('temp_id')
#     if not temp_id:
#         # Optionally handle missing temp_id, e.g., redirect to signup or show error
#         flash("Missing temp_id. Please start signup again.", "error")
#         return redirect(url_for('auth.signup'))

#     print("Signup FIDO Reached with temp_id:", temp_id)
#     return render_template("signup_fido.html", active_page='signup', temp_id=temp_id)

from sqlalchemy import and_

@auth.route("/submit-account", methods=["POST"])
@login_required
def submit_account():
    try:
        data = request.form.to_dict()

        first_name = request.form.get('fname')
        middle_name = request.form.get('mname')
        last_name = request.form.get('lname')
        username = request.form.get('username')
        contact_number = request.form.get('contact_number')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        hashed_password = generate_password_hash(password, method='pbkdf2:sha256', salt_length=8)

        existing_user = User.query.filter(
            and_(
                User.first_name.ilike(first_name),
                User.middle_name.ilike(middle_name) if middle_name else User.middle_name.is_(None),
                User.last_name.ilike(last_name)
            )
        ).first()

        if existing_user:
            return jsonify({
                "error": "A user with the same name already exists.",
                "type": "warning"
            }), 409

        if User.query.filter_by(username=username).first():
            return jsonify({
                "error": "Username already exists.",
                "type": "warning"
            }), 409

        if not re.match(r'^09\d{9}$', contact_number):
            return jsonify({
                "error": "Invalid contact number format. Use 09XXXXXXXXX.",
                "type": "warning"
            }), 400

        if User.query.filter_by(contact_number=contact_number).first():
            return jsonify({
                "error": "Contact Number already used.",
                "type": "warning"
            }), 409

        if User.query.filter_by(email=email).first():
            return jsonify({
                "error": "Email already exists.",
                "type": "warning"
            }), 409

        if len(password) < 8:
            return jsonify({
                "error": "Password must be at least 8 characters long.",
                "type": "warning"
            }), 400
            
        if password != confirm_password:
            return jsonify({
                "error": "Passwords do not match.",
                "type": "warning"
            }), 409

        # Generate a temporary UUID
        temp_id = str(uuid.uuid4())

        # Store the data server-side
        session[f"temp_user_{temp_id}"] = {
            "username": username,
            "first_name": first_name,
            "middle_name": middle_name,
            "last_name": last_name,
            "contact_number": contact_number,
            "email": email,
            "password": hashed_password,
            "role": UserRole.STAFF.value
        }

        # new_user = User(
        #     username=username,
        #     first_name=first_name,
        #     middle_name=middle_name,
        #     last_name=last_name,
        #     contact_number=contact_number,
        #     email=email,
        #     password=hashed_password,
        #     role=UserRole.STAFF
        # )

        # db.session.add(new_user)
        # db.session.commit()

        return jsonify({
            "status": "ok",
            "type":"info",
            "message": "Account data received. Proceed with authentication.",
            "temp_id": temp_id  # or store in server-side session
        })

        # return jsonify({
        #     "message": "Proceed to authentication",
        #     "user_id": new_user.id,
        #     "type": "success"
        # }), 200

    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        traceback.print_exc()
        return jsonify({
            "error": "Server error occurred.",
            "details": str(e),
            "type": "error"
        }), 500

@auth.route("/edit-account/<int:user_id>", methods=["PUT"])
def edit_account(user_id):
    try:
        data = request.form or request.json
        print(f"Edit request data: {data}")

        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found.", "type": "error"}), 404

        # Prepare new values
        fname = data.get("fname", user.first_name)
        mname = data.get("mname", user.middle_name or "")
        lname = data.get("lname", user.last_name)
        username = data.get("username", user.username)
        email = data.get("email", user.email)

        # Check for duplicate name
        duplicate_name = User.query.filter(
            User.first_name == fname,
            User.middle_name == mname,
            User.last_name == lname,
            User.id != user_id
        ).first()
        if duplicate_name:
            return jsonify({
                "message": "Another user with the same full name already exists.",
                "type": "error"
            }), 400

        # Check for duplicate username
        if 'username' in data:
            existing_user = User.query.filter(User.username == username, User.id != user_id).first()
            if existing_user:
                return jsonify({"message": "Username already taken.", "type": "error"}), 400

        # Check for duplicate email
        if 'email' in data:
            existing_email = User.query.filter(User.email == email, User.id != user_id).first()
            if existing_email:
                return jsonify({"message": "Email already in use.", "type": "error"}), 400

        # Update user fields
        user.first_name = fname
        user.middle_name = mname
        user.last_name = lname
        user.username = username
        user.contact_number = data.get("contact_number", user.contact_number)
        user.email = email

        db.session.commit()

        return jsonify({
            "message": "User account updated successfully!",
            "type": "success"
        }), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({
            "message": f"An error occurred: {str(e)}",
            "type": "error"
        }), 500

@auth.route('/send-otp', methods=['POST'])
def send_otp():
    try:

        data = request.get_json()
        user_id = data.get('user_id')
        phone = data.get('phone')

        if not user_id or not phone:
            return jsonify({'error': 'User ID and phone number are required'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Normalize phone numbers if needed (e.g. remove spaces, dashes)
        normalized_input_phone = phone.strip()
        normalized_user_phone = user.contact_number.strip()

        # Check if phone matches the one on record
        if normalized_input_phone != normalized_user_phone:
            return jsonify({'error': 'Phone number does not match our records'}), 401


        # # Generate 6-digit OTP
        # otp = f"{random.randint(100000, 999999)}"
        otp = 123456
        manila = pytz.timezone("Asia/Manila")
        now_local = datetime.now(manila)
        expiration = now_local + timedelta(minutes=5)

        # expiration = datetime.now(timezone.utc) + timedelta(minutes=5)
        
        # Store in DB
        user.otp_code = otp
        user.otp_expiration = expiration
        db.session.commit()

        # # Send SMS
        # message = f'Your OTP is {otp}. It will expire in 5 minutes.'
        # result = send_verification_sms(phone, message, sender_name='SJP Carmona')

        # if result:
        #     return jsonify({'message': 'OTP sent successfully'}), 200
        # else:
        #     return jsonify({'error': 'Failed to send OTP'}), 500
        return jsonify({'message': 'OTP sent successfully'}), 200
    except Exception as e:
        print("Error in send_otp:", e)
        return jsonify({'error': 'Server error backend'}), 500

@auth.route('/send-otp-email', methods=['POST'])
def send_otp_email():
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if not user.email:
            return jsonify({'error': 'User has no email address on record'}), 400

        otp = f"{random.randint(100000, 999999)}"
        # Generate or reuse OTP logic
        # otp = 123456  # For testing; use: f"{random.randint(100000, 999999)}" in production

        manila = pytz.timezone("Asia/Manila")
        now_local = datetime.now(manila)
        expiration = now_local + timedelta(minutes=5)

        # Store OTP in DB
        user.otp_code = otp
        user.otp_expiration = expiration
        db.session.commit()

        # Send OTP via Email
        msg = Message(
            subject='Your OTP Code for Account Recovery',
            recipients=[user.email],
            body=f'Your OTP is: {otp}. It will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.'
        )
        mail.send(msg)

        return jsonify({'message': 'OTP sent successfully to email'}), 200

    except Exception as e:
        print("Error in send_otp_email:", e)
        return jsonify({'error': 'Server error while sending email OTP'}), 500


@auth.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        print("START VERIFICATION")
        data = request.get_json()
        user_id = data.get('user_id')
        submitted_otp = data.get('otp')
    
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
    
        print(f"USER OTP: '{submitted_otp}' (len={len(submitted_otp)})")
        print(f"DB OTP:   '{user.otp_code}' (len={len(user.otp_code)})")
    
        if user.otp_code != submitted_otp:
            print("OTP ARE NOT THE SAME")
            return jsonify({'error': 'Incorrect OTP'}), 400
        
        otp_exp = user.otp_expiration
        if otp_exp.tzinfo is None:
            otp_exp = otp_exp.replace(tzinfo=timezone.utc)
    
        if datetime.now(timezone.utc) > otp_exp:
            return jsonify({'error': 'OTP expired'}), 400
    
        # Invalidate OTP
        user.otp_code = None
        user.otp_expiration = None
        db.session.commit()
        print("REACHED THE END")
    
        return jsonify({'success': True, 'message': 'OTP verified successfully'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'Invalid or expired OTP'}), 400

@auth.route('/recover_fido')
def recover_fido():
    """This route returns the HTML for the fido-login page. This page can only be accessed if the user has a valid
    fido-session."""

    # logged-in users don't have to log in
    if flask_login.current_user.is_authenticated:
        return redirect("/home")

    # check if there is a fido-session
    user_id = get_user_id()
    print('USER ID CHECK2')
    print(user_id)
    if user_id:
        close_fido_session()

    user = User.query.get(user_id)
    if not user:
        return redirect('/login')
    
    return render_template(
        "recover_fido.html", 
        active_page='login', 
        user=user,
        UserRole=UserRole)


@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))
