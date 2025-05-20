from .models.user import User  # Import the User model from the models folder
from . import db
import bcrypt
import flask_login
from sqlalchemy.exc import IntegrityError


class UsernameAlreadyExistsException(Exception):
    pass


def create_user(username: str, firstname: str, middlename:str, lastname: str, contact_number: str, email: str, password: str) -> User:
    """This function creates a new user without fido. Fido can be added in a second step using the function
    set_fido_info."""

    # Ensure that this username or email is not already in use
    existing_user = load_user(username=username)
    if existing_user is not None:
        raise UsernameAlreadyExistsException("Username already exists.")
    
    existing_email = load_user(email=email)
    if existing_email is not None:
        raise UsernameAlreadyExistsException("Email already exists.")

    # Create a new user instance
    user = User(username=username, first_name=firstname, middle_name=middlename, last_name=lastname,
                contact_number=contact_number, email=email, password=password)

    # Persist the user to the database
    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise UsernameAlreadyExistsException("Username or email already exists.")
    
    # Return the newly created user
    return user


def load_user(username: str = '', user_id: int = -1, email: str = '') -> User:
    """This function accepts a username and/or user_id and retrieves the user. It returns None if the user does not exist."""

    if username == '' and user_id < 0 and email == '':
        raise ValueError('username, user_id, or email must be specified to retrieve a user')

    if user_id >= 0:
        # Load user by id
        user = User.query.get(user_id)
        if user is None:
            return None
        return user

    # Retrieve user by username
    if username != '':
        user = User.query.filter_by(username=username).first()
        return user

    # Retrieve user by email
    if email != '':
        user = User.query.filter_by(email=email).first()
        return user


def set_fido_info(user_id: int, fido_info: str):
    """This function adds fido to an already existing user."""

    # Load the user
    user = load_user(user_id=user_id)
    if user is None:
        raise ValueError('User does not exist')

    # Set the fido information
    user.fido_info = fido_info

    # Update the user in the database
    db.session.commit()


def authenticate_user(username: str, password: str) -> User:
    """This function validates the provided username and password and returns the User object if the credentials are
    correct. Otherwise, the function returns None."""

    # Load user
    user = load_user(username=username)
    if user is None:
        return None

    # Compare the provided password with the real password
    if not bcrypt.checkpw(password.encode('utf-8'), bytes.fromhex(user.password)):
        return None

    return user
