from ..models import db, Record, Parent
from flask_login import current_user


def check_client(first_name, middle_name, last_name, birthday):
    record = Record.query.filter(
        Record.first_name.ilike(first_name),
        Record.middle_name.ilike(middle_name),
        Record.last_name.ilike(last_name),
        Record.birthday == birthday
    ).first()

    print(f"Record: {record}")
    print(f"First Name: {Record.first_name.ilike(first_name)}")

    return {
        "record": {key: getattr(record, key, None) for key in [
            "id", "first_name", "middle_name", "last_name", "birthday", "ligitivity", "birthplace",
            "status", "address", "region", "province", "citymun", "brgy", "mother_id", "father_id", "recorded_by"
        ]}
    }

def check_parents(mother_data, father_data):
    mother = Parent.query.filter(
        Parent.first_name.ilike(mother_data.get("fname")),
        Parent.middle_name.ilike(mother_data.get("mname")),
        Parent.last_name.ilike(mother_data.get("lname")),
        Parent.birthday == mother_data.get("birthdate"),
        Parent.role == "MOTHER"
    ).first()

    father = Parent.query.filter(
        Parent.first_name.ilike(father_data.get("fname")),
        Parent.middle_name.ilike(father_data.get("mname")),
        Parent.last_name.ilike(father_data.get("lname")),
        Parent.birthday == father_data.get("birthdate"),
        Parent.role == "FATHER"
    ).first()

    print(f"Mother: {mother}")
    print(f"Father: {father}")

    return {
        "mother": {key: getattr(mother, key, None) for key in [
            "id", "first_name", "middle_name", "last_name", "birthday", "birthplace", "address"
        ]} if mother else {"id": None}, 
        
        "father": {key: getattr(father, key, None) for key in [
            "id", "first_name", "middle_name", "last_name", "birthday", "birthplace", "address"
        ]} if father else {"id": None}   
}

def check_parents_by_id(mother_id, father_id):
    mother = Parent.query.filter_by(id=mother_id).first()
    father = Parent.query.filter_by(id=father_id).first()

    print(f"Mother: {mother}")
    print(f"Father: {father}")

    return {
        "mother": {key: getattr(mother, key, None) for key in [
            "id", "first_name", "middle_name", "last_name", "birthday", "birthplace", "address"
        ]} if mother else None,
        "father": {key: getattr(father, key, None) for key in [
            "id", "first_name", "middle_name", "last_name", "birthday", "birthplace", "address"
        ]} if father else None
    }

def add_parent_if_not_exists(parent_data, role):
    print(f"Parent Data: {parent_data}")
    
    new_parent = Parent(
        first_name = parent_data["fname"],
        middle_name = parent_data["mname"],
        last_name = parent_data["lname"],
        birthday = parent_data["birthdate"],
        birthplace = parent_data["birthplace"],
        address = parent_data["address"],
        role = role.upper(),
        recorded_by = current_user.id
    )
    db.session.add(new_parent)
    db.session.commit()

    return new_parent.id  

