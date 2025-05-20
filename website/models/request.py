from . import db
from sqlalchemy.sql import func
from sqlalchemy import Enum
from .enums import RequestStatus, Ceremonies


class Request(db.Model):
    __tablename__ = 'request'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    ceremony = db.Column(Enum(Ceremonies), nullable=False)
    rec_name = db.Column(db.String(255), nullable=False)
    cer_year = db.Column(db.Integer, nullable=False)
    cer_month = db.Column(db.SmallInteger, nullable=True)  
    cer_day = db.Column(db.SmallInteger, nullable=True)
    relationship = db.Column(db.String(255), nullable=False)
    status = db.Column(Enum(RequestStatus), nullable=False, default=RequestStatus.pending)
    remarks = db.Column(db.String(255), nullable=True)
    pickup_date = db.Column(db.Date, nullable=True)

    requested_at = db.Column(db.DateTime(timezone=True), default=func.now(), nullable=False)
    processed_at = db.Column(db.DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    completed_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    user = db.relationship('User', foreign_keys=[user_id], back_populates='requests', lazy='select')
    completed_by_user = db.relationship('User', foreign_keys=[completed_by], back_populates='completed_requests')
