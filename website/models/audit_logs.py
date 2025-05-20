# models.py

from datetime import datetime
from . import db

class AuditLog(db.Model):
    __tablename__ = 'audit_log'

    id = db.Column(db.BigInteger, primary_key=True)
    table_name = db.Column(db.String(255), nullable=False)
    record_id = db.Column(db.BigInteger, nullable=True)
    action = db.Column(db.Enum('INSERT', 'UPDATE', 'DELETE'), nullable=False)
    changed_by = db.Column(db.String(255), nullable=False)  
    changed_by_info = db.Column(db.JSON, nullable=True)     # optional snapshot like {"email": ..., "full_name": ...}
    changed_at = db.Column(db.TIMESTAMP, nullable=False, server_default=db.func.current_timestamp())
    old_data = db.Column(db.JSON, nullable=True)
    new_data = db.Column(db.JSON, nullable=True)
