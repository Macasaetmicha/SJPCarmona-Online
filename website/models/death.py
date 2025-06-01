from . import db
from sqlalchemy.sql import func

class Death(db.Model):
    __tablename__ = 'death'
    id = db.Column(db.Integer, primary_key=True, nullable=False)
    death_date = db.Column(db.Date, nullable=False)
    record_id = db.Column(db.Integer, db.ForeignKey('record.id'), nullable=False)
    
    burial_date = db.Column(db.Date, nullable=False)
    contact_person = db.Column(db.String(255), nullable=False)
    cp_address = db.Column(db.String(255), nullable=False)
    cause_of_death = db.Column(db.String(255), nullable=False)
    burial_place = db.Column(db.String(255), nullable=False)
    
    priest_id = db.Column(db.Integer, db.ForeignKey('priest.id'), nullable=False)
    rec_index = db.Column(db.String(255), nullable=False)
    rec_book = db.Column(db.String(255), nullable=False)
    rec_page = db.Column(db.Integer, nullable=False)
    rec_line = db.Column(db.Integer, nullable=False)

    date_created = db.Column(db.DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)
    recorded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='death', lazy=True)
    record = db.relationship('Record', back_populates='death', lazy=True)

    


    
