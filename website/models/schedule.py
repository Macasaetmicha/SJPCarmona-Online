from . import db
from sqlalchemy import Enum
from sqlalchemy.sql import func
from .enums import SchedStatus, SchedType, Ceremonies

class Schedule(db.Model):
    __tablename__ = 'schedule'  

    id = db.Column(db.Integer, primary_key=True, autoincrement=True) 
    title = db.Column(Enum(Ceremonies), nullable=False)  
    start_date = db.Column(db.DateTime, nullable=False)  
    end_date = db.Column(db.DateTime, nullable=False) 
    description = db.Column(db.String(255), nullable=True)  
    category = db.Column(Enum(SchedType), nullable=False)  
    status = db.Column(Enum(SchedStatus), nullable=False)  
    date_created = db.Column(db.DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    recorded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  

    def __repr__(self):
        return f"<Event {self.title}>"
