from . import db
from sqlalchemy.sql import func
from sqlalchemy import Enum
from .enums import PriestStatus, PriestPosition

class Priest(db.Model):
    __tablename__ = 'priest'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    position = db.Column(Enum(PriestPosition), nullable=False)
    church = db.Column(db.String(255), nullable=False)
    status = db.Column(Enum(PriestStatus), nullable=False)
    
    date_created = db.Column(db.DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)
    recorded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Relationships
    baptism = db.relationship('Baptism', backref='priest', lazy=True)
    confirmation = db.relationship('Confirmation', backref='priest', lazy=True)
    wedding = db.relationship('Wedding', backref='priest', lazy=True)
    death = db.relationship('Death', backref='priest', lazy=True)