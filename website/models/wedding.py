from . import db
from sqlalchemy.sql import func


class Wedding(db.Model):
    __tablename__ = 'wedding'
    id = db.Column(db.Integer, primary_key=True, nullable=False)
    wedding_date = db.Column(db.Date, nullable=False)
    groom_record_id = db.Column(db.Integer, db.ForeignKey('record.id'), nullable=False)
    bride_record_id = db.Column(db.Integer, db.ForeignKey('record.id'), nullable=False)
    
    sponsorA = db.Column(db.String(255), nullable=False)
    sponsorB = db.Column(db.String(255), nullable=False)
    license_number = db.Column(db.String(255), nullable=False)
    civil_date = db.Column(db.Date, nullable=False)
    civil_place = db.Column(db.String(255), nullable=False)
    
    priest_id = db.Column(db.Integer, db.ForeignKey('priest.id'), nullable=False)
    rec_index = db.Column(db.String(255), nullable=False)
    rec_book = db.Column(db.String(255), nullable=False)
    rec_page = db.Column(db.Integer, nullable=False)
    rec_line = db.Column(db.Integer, nullable=False)

    date_created = db.Column(db.DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)
    recorded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='wedding', lazy=True)
    groom_record = db.relationship('Record', foreign_keys=[groom_record_id], back_populates='wedding_groom')
    bride_record = db.relationship('Record', foreign_keys=[bride_record_id], back_populates='wedding_bride')


    


    
