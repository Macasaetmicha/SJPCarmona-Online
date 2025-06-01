from . import db
from sqlalchemy.sql import func
from sqlalchemy import Enum
from .enums import ParentRole

class Parent(db.Model):
    __tablename__ = 'parent'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(255), nullable=False)
    middle_name = db.Column(db.String(255), nullable=True)
    last_name = db.Column(db.String(255), nullable=False)
    birthday = db.Column(db.Date, nullable=False)
    birthplace = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    role = db.Column(Enum(ParentRole), nullable=False)
    
    date_created = db.Column(db.DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)
    recorded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Relationships
    children_as_mother = db.relationship('Record', foreign_keys='Record.mother_id', backref='mother', lazy=True)
    children_as_father = db.relationship('Record', foreign_keys='Record.father_id', backref='father', lazy=True)