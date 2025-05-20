"""This module contains the api endpoints that are related to fido. It also contains the fido related application logic."""

import uuid

import fido2.webauthn
import flask_login
from fido2.server import Fido2Server
from fido2.webauthn import PublicKeyCredentialRpEntity, PublicKeyCredentialUserEntity, AuthenticatorSelectionCriteria
from flask import Blueprint, jsonify, request, abort, session
from flask_login import login_required, current_user
from cachetools import TTLCache


from ..models import db, User
from ..db import set_fido_info, load_user
from ..fidosession import start_fido_session, close_fido_session, get_user_id

from website.models.enums import UserRole
# This information is sent to the client (browser + fido-token). The browser verifies that the id matches the domain of
# the webpage.
rp = PublicKeyCredentialRpEntity(name="Demo server", id="localhost")
fido_server = Fido2Server(rp)

# Fido is a challenge-response authentication mechanism. To ensure that every challenge is only used once we store the
# challenges on the server (and not e.g. in a cookie). The TTLCache automatically removes all challenges that are older
# than 60 seconds. This reduces the amount of time that attackers have to provide a valid response.
active_challenges = TTLCache(1000, 60)

# The api endpoints are added to this blueprint. The server module adds this blueprints and the associated endpoints to
# flask.
api = Blueprint('api', __name__, url_prefix='/api')


@api.route("/register/begin", methods=["POST"])
def register_begin():
    """Clients call this endpoint to register a new fido token. The endpoint returns a challenge which is then processed
    by the fido token. The client uses the register_complete endpoint to send the signed challenge back to the server.
    flask-login ensures that this endpoint can only be accessed by authenticated users."""

    data = request.get_json()
    user_id = data.get('user_id') 
    temp_user = session.get(f"temp_user_{user_id}")

    print("Temp user: ", temp_user)
    print("User ID: ", user_id)

    if not temp_user:
        return jsonify({"status": "error", "message": "User ID is required"}), 400

    if temp_user.get("fido_info"):
        print(f"User already has a fido token registered. {temp_user.get("fido_info")}")
        session.pop(f"temp_user_{user_id}", None)
        return jsonify({"status": "error", "message": "fido has already been activated"}), 400
    else:
        print(f"User does not have a fido token registered. {temp_user.get("fido_info")}")

    # create a challenge for the client
    options, state = fido_server.register_begin(
        PublicKeyCredentialUserEntity(
            # according to the documentation the id should be unique and shouldn't contain user related information
            id=uuid.uuid4().bytes,
            # the client might present these fields to the user
            name=temp_user.get("username"),
            display_name=f'{temp_user.get("first_name")} {temp_user.get("last_name")}',
        ),
        # The token shouldn't ask the user to verify his identity (e.g. using a PIN). This would be redundant because
        # the user already verified his identity during the first login step (by providing his username and password).
        user_verification=fido2.webauthn.UserVerificationRequirement.DISCOURAGED,
    )

    # store some information (e.g. the challenge that was just send to the client) on the server. The register_complete
    # endpoint needs it to verify the response of the client.
    active_challenges[user_id] = state
    
    print('RUN SUCCESSFUL')

    return jsonify(dict(options)), 200

@api.route("/register/complete", methods=["POST"])
def register_complete():
    """This endpoint is called by the client to register a new fido token. The client first retrieves a challenge from
    register_begin which is then processed by the token. The final result is sent back to this api endpoint which
    validates it and persists it in the database. flask-login ensures that this endpoint can only be accessed by
    authenticated users."""
    data = request.get_json()
    user_id = data.get('user_id') 
    response = data.get('response') 
    
    if not user_id:
        return jsonify({"status": "error", "message": "User ID is required"}), 400

    temp_user_data = session.get(f"temp_user_{user_id}")
    if not temp_user_data:
        return jsonify({"status": "error", "message": "Temporary user data not found"}), 400

    if temp_user_data.get("fido_info"):
        return jsonify({"status": "error", "message": "FIDO has already been activated"}), 400

    fido_state = active_challenges.pop(user_id, None)
    if fido_state is None:
        print(f"No fido_state found for user_id: {user_id}")
        return jsonify({"status": "error", "message": "FIDO challenge expired or missing"}), 400

    try:
        auth_data = fido_server.register_complete(fido_state, response)
    except Exception as e:
        print(f"Error in register_complete: {e}")
        return jsonify({"status": "error", "message": "Invalid FIDO payload"}), 400

    try:
        # Inject FIDO info into temp user data
        temp_user_data["fido_info"] = auth_data.hex()

        # Create the user from temporary data
        user = User(**temp_user_data)

        db.session.add(user)
        db.session.commit()

        print(f"User created and FIDO info saved for user_id: {user.id}")
        session.pop(f"temp_user_{user_id}", None)  # cleanup temp data

    except Exception as e:
        db.session.rollback()
        session.pop(f"temp_user_{user_id}", None)
        print(f"Error saving new user: {e}")
        return jsonify({"status": "error", "message": "Failed to save user"}), 500

    return jsonify({"status": "OK", "type":"success", "message": "Register Successful"})


@api.route("/register-staff/begin", methods=["POST"])
def registerStaff_begin():
    """Begins FIDO registration for a staff user using the user ID."""
    data = request.get_json()
    user_id = data.get('user_id') 
    temp_user = session.get(f"temp_user_{user_id}")

    if not temp_user:
        return jsonify({"status": "error", "message": "User ID is required"}), 400

    # user = User.query.get(user_id)  
    
    # if not user:
    #     return jsonify({"status": "error", "message": "User not found"}), 404
    
    # print(f"User information: ", user)

    if temp_user.get("fido_info"):
        print(f"User already has a fido token registered. {temp_user.get("fido_info")}")
        session.pop(f"temp_user_{user_id}", None)
        return jsonify({"status": "error", "message": "fido has already been activated"}), 400
    else:
        print(f"User does not have a fido token registered. {temp_user.get("fido_info")}")

    # create a challenge for the client
    options, state = fido_server.register_begin(
        PublicKeyCredentialUserEntity(
            # according to the documentation the id should be unique and shouldn't contain user related information
            id=uuid.uuid4().bytes,
            # the client might present these fields to the user
            name=temp_user.get("username"),
            display_name=f'{temp_user.get("first_name")} {temp_user.get("last_name")}',
        ),
        # The token shouldn't ask the user to verify his identity (e.g. using a PIN). This would be redundant because
        # the user already verified his identity during the first login step (by providing his username and password).
        user_verification=fido2.webauthn.UserVerificationRequirement.DISCOURAGED,
    )

    # store some information (e.g. the challenge that was just send to the client) on the server. The register_complete
    # endpoint needs it to verify the response of the client.
    active_challenges[user_id] = state
    
    print('RUN SUCCESSFUL')

    return jsonify(dict(options)), 200

@api.route("/register-staff/complete", methods=["POST"])
@login_required
def registerStaff_complete():
    data = request.get_json()
    user_id = data.get('user_id') 
    response = data.get('response') 
    
    if not user_id:
        return jsonify({"status": "error", "message": "User ID is required"}), 400

    temp_user_data = session.get(f"temp_user_{user_id}")
    if not temp_user_data:
        return jsonify({"status": "error", "message": "Temporary user data not found"}), 400

    if temp_user_data.get("fido_info"):
        return jsonify({"status": "error", "message": "FIDO has already been activated"}), 400

    fido_state = active_challenges.pop(user_id, None)
    if fido_state is None:
        print(f"No fido_state found for user_id: {user_id}")
        return jsonify({"status": "error", "message": "FIDO challenge expired or missing"}), 400

    try:
        auth_data = fido_server.register_complete(fido_state, response)
    except Exception as e:
        print(f"Error in register_complete: {e}")
        return jsonify({"status": "error", "message": "Invalid FIDO payload"}), 400

    try:
        # Inject FIDO info into temp user data
        temp_user_data["fido_info"] = auth_data.hex()

        # Create the user from temporary data
        user = User(**temp_user_data)

        db.session.add(user)
        db.session.commit()

        print(f"User created and FIDO info saved for user_id: {user.id}")
        session.pop(f"temp_user_{user_id}", None)  # cleanup temp data

    except Exception as e:
        db.session.rollback()
        session.pop(f"temp_user_{user_id}", None)
        print(f"Error saving new user: {e}")
        return jsonify({"status": "error", "message": "Failed to save user"}), 500

    return jsonify({"status": "OK", "type":"success", "message": "Staff registered successfully"})

@api.route("/update/begin", methods=["POST"])
@login_required
def update_begin():
    print("UPDATE BEGIN")
    user_id = current_user.id

    try:
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'message': 'User not found.'}), 404

        # user.fido_info = None
        # db.session.commit()
        # print("FIDO info cleared successfully.")
        # print("Current USer fido info", current_user.fido_info)

        # if user.fido_info:
        #     return abort(400, "FIDO has already been activated")
        
        print('Current User Options:')
        print(dir(current_user))

        # Generate registration challenge
        options, state = fido_server.register_begin(
            PublicKeyCredentialUserEntity(
                id=uuid.uuid4().bytes,
                name=current_user.username,
                display_name=f'{current_user.first_name} {current_user.last_name}',
            ),
            user_verification=fido2.webauthn.UserVerificationRequirement.DISCOURAGED,
        )

        # Save challenge state
        active_challenges[current_user.id] = state
        print('Here is the Dict File')
        print(dict(options))
        return jsonify(dict(options))

    except Exception as e:
        db.session.rollback()
        print(f"Error during update_begin: {e}")
        return jsonify({'message': f"Internal Server Error: {str(e)}"}), 500

@api.route("/update/complete", methods=["POST"])
@login_required
def update_complete():
    fido_state = active_challenges.pop(current_user.id, None)
    if fido_state is None:
        return abort(400, 'No FIDO state available')

    try:
        auth_data = fido_server.register_complete(fido_state, request.json)
    except Exception as e:
        print(f"FIDO validation failed: {e}")
        return abort(400, 'Invalid payload')

    try:
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({'message': 'User not found.'}), 404

        user.fido_info = auth_data.hex()  # ✅ Update fido_info directly
        db.session.commit()

        return jsonify({"status": "OK"})
    except Exception as e:
        db.session.rollback()
        print(f"Error saving FIDO info: {e}")
        return jsonify({'message': 'Internal Server Error'}), 500

@api.route("/recover/begin", methods=["POST"])
def recover_begin():
    """Clients call this endpoint to register a new fido token. The endpoint returns a challenge which is then processed
    by the fido token. The client uses the register_complete endpoint to send the signed challenge back to the server.
    flask-login ensures that this endpoint can only be accessed by authenticated users."""

    data = request.get_json()
    user_id = data.get('user_id') 

    print("User ID: ", user_id)

    if not user_id:
        return jsonify({"status": "error", "message": "User ID is required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    
    if user.fido_info:
        print(f"User already has a fido token registered. {user.fido_info}")
        
    else:
        print(f"User does not have a fido token registered. {user.fido_info}")
        return jsonify({"status": "error", "message": "fido has hasn't been activated"}), 400

    # create a challenge for the client
    options, state = fido_server.register_begin(
        PublicKeyCredentialUserEntity(
            # according to the documentation the id should be unique and shouldn't contain user related information
            id=uuid.uuid4().bytes,
            # the client might present these fields to the user
            name=user.username,
            display_name=f'{user.first_name} {user.last_name}',
        ),
        # The token shouldn't ask the user to verify his identity (e.g. using a PIN). This would be redundant because
        # the user already verified his identity during the first login step (by providing his username and password).
        user_verification=fido2.webauthn.UserVerificationRequirement.DISCOURAGED,
    )

    # store some information (e.g. the challenge that was just send to the client) on the server. The register_complete
    # endpoint needs it to verify the response of the client.
    active_challenges[user_id] = state
    print(f"Stored challenge for user {user_id}: {active_challenges.get(user_id)}")

    print('RUN SUCCESSFUL')

    return jsonify(dict(options)), 200

@api.route("/recover/complete", methods=["POST"])
def recover_complete():
    """This endpoint is called by the client to register a new fido token. The client first retrieves a challenge from
    register_begin which is then processed by the token. The final result is sent back to this api endpoint which
    validates it and persists it in the database. flask-login ensures that this endpoint can only be accessed by
    authenticated users."""
    data = request.get_json()
    user_id = data.get('user_id') 
    response = data.get('response') 
    
    if not user_id:
        return jsonify({"status": "error", "message": "User ID is required"}), 400
    print("CHECKING FOR USER")
    user = User.query.get(user_id)
    if not user.fido_info:
        print("No fido info")
        return jsonify({"status": "error", "message": "FIDO has already been activated"}), 400

    print("FIDO STATE")
    fido_state = active_challenges.pop(user_id, None)
    if fido_state is None:
        print(f"No fido_state found for user_id: {user_id}")
        return jsonify({"status": "error", "message": "FIDO challenge expired or missing"}), 400

    print("REGISTER FIDO INFO")
    try:
        auth_data = fido_server.register_complete(fido_state, response)
    except Exception as e:
        print(f"Error in register_complete: {e}")
        return jsonify({"status": "error", "message": "Invalid FIDO payload"}), 400

    print("CHANGNG FIDO INFO")
    try:
        user.fido_info = auth_data.hex()  # ✅ Update fido_info directly
        db.session.commit()

        print(f"User created and FIDO info saved for user_id: {user.id}")

    except Exception as e:
        db.session.rollback()
        print(f"Error saving new user: {e}")
        return jsonify({"status": "error", "message": "Failed to save user"}), 500

    return jsonify({"status": "OK", "type":"success", "message": "Recovery Successful"})


@api.route("/authenticate/begin", methods=["POST"])
def authenticate_begin():
    """This endpoint is called by the client to perform the second factor login. The endpoint creates a challenge which
    is sent to the client. The client sends it to the fido token which signs it. The client then sends the signed
    challenge to the authenticate_complete endpoint. This endpoint can only be accessed if the user has already provided
    valid credentials (username and password)."""
    print('RUNNING AUTHENTICATE BEGIN')
    # which user is trying to log in? Is the user even logged in?
    user = load_user_from_fido_session()
    print(user)
    if user is None:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    print(f"User: {user}")
    print(f"fido_info: {user.fido_info}, type: {type(user.fido_info)}")


    # load the information about the token (they were persisted when the token was registered)
    credential_data = fido2.webauthn.AuthenticatorData.fromhex(user.fido_info).credential_data

    # create a new challenge
    options, state = fido_server.authenticate_begin(
        credentials=[
            credential_data
        ],
        # The token shouldn't ask the user to verify his identity (e.g. using a PIN). This would be redundant because
        # the user already verified his identity during the first login step (by providing his username and password).
        user_verification=fido2.webauthn.UserVerificationRequirement.REQUIRED
    )

    # store some information (e.g. the challenge that was just send to the client) on the server. The
    # authenticate_complete endpoint needs it to verify the response of the client.
    active_challenges[user.id] = state

    # send the challenge to the client
    return jsonify(dict(options))

@api.route("/authenticate/complete", methods=["POST"])
def authenticate_complete():
    """This endpoint is called by the client when the fido token has processed the challenge. The endpoint creates a
    new session for the user if the challenge has been signed correctly. The endpoint can only
    be accessed if the user has already provided his username and password. """

    # which user is trying to log in? Is the user even logged in?
    user = load_user_from_fido_session()
    if user is None:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    # The authenticate_begin endpoint created a challenge and persisted it on the server. This retrieves the challenge
    # and then deletes it from the cache. This ensures that an attacker has only one attempt per challenge to provide
    # valid information.
    fido_state = active_challenges.pop(user.id, None)
    if fido_state is None:
        print(f"Challenge expired or missing for user_id: {user.id}")
        return jsonify({"status": "error", "message": "no fido-state"}), 400

    # load the information about the token (they were persisted when the token was registered)
    credential_data = fido2.webauthn.AuthenticatorData.fromhex(user.fido_info).credential_data

    # ensure that the client signed the challenge correctly
    try:
        fido_server.authenticate_complete(
            fido_state,
            [credential_data],
            request.json,
        )
        print('AUTHENTICATION COMPLETE')
    except:
        return jsonify({"status": "error", "message": "invalid payload"}), 400

    # The fido session is only needed if the user 1) has already provided his username and password and 2) hasn't yet
    # authenticated himself using fido. We can close the fido session and create a "real" flask-login session.
    close_fido_session()
    flask_login.login_user(user)
    return jsonify({"status": "OK", "role": user.role.value  })

@api.route('/accounts/<int:account_id>', methods=['DELETE'])
@login_required
def delete_account(account_id):
    print("User Role ", current_user.role)

    if current_user.role != UserRole.ADMIN:  
        return jsonify({"error": "Unauthorized"}), 403

    # Fetch the record from DB
    account = User.query.get(account_id)  # or your model

    if not account:
        return jsonify({"error": "Record not found"}), 404

    try:
        db.session.delete(account)
        db.session.commit()
        return jsonify({"type": "success", "message": "User deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print("Error deleting record:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500
    

def load_user_from_fido_session() -> User:
    user_id = get_user_id()
    if user_id is None:
        return None

    user = load_user(user_id=user_id)
    if user is None:
        return None

    return user


