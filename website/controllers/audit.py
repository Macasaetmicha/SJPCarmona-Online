from .. import db
from sqlalchemy import event
from ..models import AuditLog
from datetime import datetime, date, timezone
from flask_login import current_user

def get_current_user_info():
    try:
        username = current_user.username
        user_snapshot = {
            "email": getattr(current_user, "email", None),
            "full_name": f"{getattr(current_user, 'first_name', '')} {getattr(current_user, 'last_name', '')}".strip(),
        }
        return username, user_snapshot
    except Exception:
        return "system", None

def to_serializable(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    elif hasattr(value, "__tablename__"): 
        return str(value)
    elif hasattr(value, "name"):
        return value.name
    elif hasattr(value, "value"): 
        return value.value
    return value


def serialize_model(model_instance):
    data = {}
    for column in model_instance.__table__.columns:
        value = getattr(model_instance, column.name)
        data[column.name] = to_serializable(value)
    return data


@event.listens_for(db.session, "before_flush")
def audit_before_flush(session, flush_context, instances):
    username, user_snapshot = get_current_user_info()

    for obj in session.new:
        if isinstance(obj, AuditLog):
            continue
        audit = AuditLog(
            table_name=obj.__tablename__,
            record_id=None,
            action='INSERT',
            changed_by=username,
            changed_by_info=user_snapshot,
            old_data=None,
            new_data=serialize_model(obj)
        )
        session.add(audit)

    for obj in session.dirty:
        if isinstance(obj, AuditLog):
            continue
        state = db.inspect(obj)
        if not state.modified:
            continue
        old_data = {}
        new_data = {}
        for attr in state.attrs:
            hist = attr.history
            if not hist.has_changes():
                continue
            old_value = hist.deleted[0] if hist.deleted else None
            new_value = hist.added[0] if hist.added else None

            old_data[attr.key] = to_serializable(old_value)
            new_data[attr.key] = to_serializable(new_value)

        audit = AuditLog(
            table_name=obj.__tablename__,
            record_id=getattr(obj, 'id', None),
            action='UPDATE',
            changed_by=username,
            changed_by_info=user_snapshot,
            old_data=old_data,
            new_data=new_data
        )
        session.add(audit)

    for obj in session.deleted:
        if isinstance(obj, AuditLog):
            continue
        audit = AuditLog(
            table_name=obj.__tablename__,
            record_id=getattr(obj, 'id', None),
            action='DELETE',
            changed_by=username,
            changed_by_info=user_snapshot,
            old_data=serialize_model(obj),
            new_data=None
        )
        session.add(audit)
