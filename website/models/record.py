from . import db
from sqlalchemy.sql import func
from sqlalchemy import Enum
from .enums import Ligitivity, CivilStatus
from .wedding import Wedding  

class Record(db.Model):
    __tablename__ = 'record'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(255), nullable=False)
    middle_name = db.Column(db.String(255), nullable=True)
    last_name = db.Column(db.String(255), nullable=False)
    birthday = db.Column(db.Date, nullable=False)
    ligitivity = db.Column(Enum(Ligitivity), nullable=False)
    birthplace = db.Column(db.String(255), nullable=False)
    status = db.Column(Enum(CivilStatus), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    region = db.Column(db.String(255), db.ForeignKey('refregion.regCode'), nullable=False)
    province = db.Column(db.String(255), db.ForeignKey('refprovince.provCode'), nullable=False)
    citymun = db.Column(db.String(255), db.ForeignKey('refcitymun.citymunCode'), nullable=False)
    brgy = db.Column(db.String(255), db.ForeignKey('refbrgy.brgyCode'), nullable=False)

    mother_id = db.Column(db.Integer, db.ForeignKey('parent.id'), nullable=False)
    father_id = db.Column(db.Integer, db.ForeignKey('parent.id'), nullable=False)

    date_created = db.Column(db.DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)
    recorded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Relationships
    baptism = db.relationship('Baptism', back_populates='record', uselist=False)
    confirmation = db.relationship('Confirmation', back_populates='record', uselist=False)
    wedding_groom = db.relationship('Wedding', foreign_keys=[Wedding.groom_record_id], back_populates='groom_record', uselist=False)
    wedding_bride = db.relationship('Wedding', foreign_keys=[Wedding.bride_record_id], back_populates='bride_record', uselist=False)
    death = db.relationship('Death', back_populates='record', uselist=False)

    user = db.relationship('User', back_populates='record', lazy=True)

    barangay = db.relationship('Barangay', backref=db.backref('requests', lazy=True))
    