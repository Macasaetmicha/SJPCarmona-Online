from . import db
from flask_login import UserMixin
from sqlalchemy.sql import func
from sqlalchemy import Enum
from .enums import UserRole

class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(255), nullable=False)
    middle_name = db.Column(db.String(255), nullable=True)
    last_name = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(255), unique=False, nullable=False)
    contact_number = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    fido_info = db.Column(db.Text, default="")

    date_created = db.Column(db.DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    role = db.Column(Enum(UserRole), default=UserRole.CLIENT, nullable=False)

    otp_code = db.Column(db.String(6), nullable=True)
    otp_expiration = db.Column(db.DateTime, nullable=True)
    
    baptism = db.relationship('Baptism', back_populates='user', uselist=False)
    confirmation = db.relationship('Confirmation', back_populates='user', uselist=False)
    wedding = db.relationship('Wedding', back_populates='user', uselist=False)
    death = db.relationship('Death', back_populates='user', uselist=False)

    record = db.relationship("Record", back_populates="user")
    requests = db.relationship("Request", back_populates="user", foreign_keys='Request.user_id')
    completed_requests = db.relationship("Request", back_populates="user", foreign_keys='Request.completed_by')



    def __repr__(self):
        return f"<User {self.username}>"

