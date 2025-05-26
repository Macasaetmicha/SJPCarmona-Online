from flask import Blueprint, render_template, request, abort, flash, redirect, url_for, jsonify, current_app
from flask_login import login_required, current_user
from ..models import db, User, UserRole,AuditLog, Record, Request, Schedule, Parent, Baptism, Confirmation, Wedding, Death, Priest, Region, Province, CityMun, Barangay
from enum import Enum
from datetime import datetime, timedelta
import json
from sqlalchemy.sql import func
from rapidfuzz import fuzz
from sqlalchemy.orm import joinedload
from sqlalchemy import extract, text
import secrets
from flask_mail import Message
import os
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from werkzeug.security import generate_password_hash
from website import mail
import traceback 

api_db = Blueprint('api_db', __name__)

@api_db.route('/get-current-user')
@login_required
def get_current_user():
    userId = current_user.id
    first = current_user.first_name or ""
    middle = current_user.middle_name or ""
    last = current_user.last_name or ""
    full_name = ' '.join(f"{first} {middle} {last}".split()) 
    return jsonify({
        "id": userId,
        "name": full_name,
        "username": current_user.username,
        "email": current_user.email,
        "contact_number": current_user.contact_number,
        "role": current_user.role.value,
        "joined": current_user.date_created.strftime("%Y-%m-%d %H:%M:%S")
    })

@api_db.route("/get-regions", methods=["GET"])
def get_regions():
    regions = Region.query.order_by(Region.regDesc).all()
    return jsonify([{"id": r.regCode, "region_name": r.regDesc} for r in regions])

@api_db.route("/get-provinces/<int:regCode>", methods=["GET"])
def get_provinces(regCode):
    provinces = Province.query.filter_by(regCode=regCode).order_by(Province.provDesc).all()
    return jsonify([{"id": p.provCode, "province_name": p.provDesc} for p in provinces])

@api_db.route("/get-cities/<int:provCode>", methods=["GET"])
def get_cities(provCode):
    cities = CityMun.query.filter_by(provCode=provCode).order_by(CityMun.provCode).all() 
    return jsonify([{"id": c.citymunCode, "city_name": c.citymunDesc} for c in cities])

@api_db.route("/get-barangays/<int:citymunCode>", methods=["GET"])
def get_barangays(citymunCode):
    barangays = Barangay.query.filter_by(citymunCode=citymunCode).order_by(Barangay.brgyDesc).all()
    return jsonify([{"id": b.brgyCode, "barangay_name": b.brgyDesc} for b in barangays])

@api_db.route("/get-priests", methods=["GET"])
def get_priest():
    priest = Priest.query.filter(Priest.status == 'active').order_by(Priest.name).all()
    return jsonify([{"id": p.id, "priest_name": p.name} for p in priest])

@api_db.route("/get-all-priests", methods=["GET"])
def get_all_priest():
    priests = Priest.query.order_by(Priest.name).all()
    return jsonify([{"id": p.id, "priest_name": p.name} for p in priests])

@api_db.route('/records', methods=['GET'])
def get_records():
    records = Record.query.options(
        joinedload(Record.baptism),
        joinedload(Record.confirmation),
        joinedload(Record.death),
        joinedload(Record.wedding_groom),
        joinedload(Record.mother),
        joinedload(Record.father)
    ).all()

    # Cache regions/provinces/cities/barangays
    region_codes = list({r.region for r in records})
    province_codes = list({r.province for r in records})
    citymun_codes = list({r.citymun for r in records})
    brgy_codes = list({r.brgy for r in records})

    regions = {r.regCode: r.regDesc for r in Region.query.filter(Region.regCode.in_(region_codes)).all()}
    provinces = {p.provCode: p.provDesc for p in Province.query.filter(Province.provCode.in_(province_codes)).all()}
    citymuns = {c.citymunCode: c.citymunDesc for c in CityMun.query.filter(CityMun.citymunCode.in_(citymun_codes)).all()}
    brgys = {b.brgyCode: b.brgyDesc for b in Barangay.query.filter(Barangay.brgyCode.in_(brgy_codes)).all()}

    data = []
    for record in records:
        mother = record.mother
        father = record.father

        record_data = {
            "id": record.id,
            "first_name": record.first_name,
            "middle_name": record.middle_name,
            "last_name": record.last_name,
            "birthday": record.birthday.strftime('%Y-%m-%d'),
            "ligitivity": record.ligitivity.name,
            "birthplace": record.birthplace,
            "status": record.status.name,
            "address": record.address,
            "region": regions.get(record.region),
            "province": provinces.get(record.province),
            "citymun": citymuns.get(record.citymun),
            "brgy": brgys.get(record.brgy),

            "mother": {
                "id": mother.id if mother else None,
                "first_name": mother.first_name if mother else None,
                "middle_name": mother.middle_name if mother else None,
                "last_name": mother.last_name if mother else None,
                "birthday": mother.birthday.strftime('%Y-%m-%d') if mother and mother.birthday else None,
                "birthplace": mother.birthplace if mother else None,
                "address": mother.address if mother else None
            },
            "father": {
                "id": father.id if father else None,
                "first_name": father.first_name if father else None,
                "middle_name": father.middle_name if father else None,
                "last_name": father.last_name if father else None,
                "birthday": father.birthday.strftime('%Y-%m-%d') if father and father.birthday else None,
                "birthplace": father.birthplace if father else None,
                "address": father.address if father else None
            },
            "ceremonies": {
                "baptism": {
                    "index": record.baptism.rec_index if record.baptism else None,
                    "book": record.baptism.rec_book if record.baptism else None,
                    "page": record.baptism.rec_page if record.baptism else None,
                    "line": record.baptism.rec_line if record.baptism else None
                },
                "confirmation": {
                    "index": record.confirmation.rec_index if record.confirmation else None,
                    "book": record.confirmation.rec_book if record.confirmation else None,
                    "page": record.confirmation.rec_page if record.confirmation else None,
                    "line": record.confirmation.rec_line if record.confirmation else None
                },
                "wedding": {
                    "index": record.wedding_groom.rec_index if record.wedding_groom else None,
                    "book": record.wedding_groom.rec_book if record.wedding_groom else None,
                    "page": record.wedding_groom.rec_page if record.wedding_groom else None,
                    "line": record.wedding_groom.rec_line if record.wedding_groom else None
                },
                "death": {
                    "index": record.death.rec_index if record.death else None,
                    "book": record.death.rec_book if record.death else None,
                    "page": record.death.rec_page if record.death else None,
                    "line": record.death.rec_line if record.death else None
                }
            }
        }

        data.append(record_data)

    return jsonify({"data": data})

@api_db.route('/record/view/<int:record_id>', methods=['GET'])
def get_records_view(record_id):
    record = Record.query.filter_by(id=record_id).first()

    data = []
    
    record_data = {
        "id": record.id,
        "first_name": record.first_name,
        "middle_name": record.middle_name,
        "last_name": record.last_name,
        "birthday": record.birthday.strftime('%Y-%m-%d'),
        "ligitivity": record.ligitivity.name,
        "birthplace": record.birthplace,
        "status": record.status.name,
        "address": record.address,
        
        "region": {
            "id": record.region,
            "desc": Region.query.get(record.region).regDesc if record.region else None
        } if record.region else None,
        "province": {
            "id": record.province,
            "desc": Province.query.filter_by(provCode=record.province).first().provDesc if record.province else None
        } if record.province else None,
        "citymun": {
            "id": record.citymun,
            "desc": CityMun.query.filter_by(citymunCode=record.citymun).first().citymunDesc if record.citymun else None
        } if record.citymun else None,
        "brgy": {
            "id": record.brgy,
            "desc": Barangay.query.filter_by(brgyCode=record.brgy).first().brgyDesc if record.brgy else None
        } if record.brgy else None,

        # Fetch Parents Information
        "mother": {
            "id": record.mother_id,
            "first_name": Parent.query.get(record.mother_id).first_name if record.mother_id else None,
            "middle_name": Parent.query.get(record.mother_id).middle_name if record.mother_id else None,
            "last_name": Parent.query.get(record.mother_id).last_name if record.mother_id else None,
            "birthday": Parent.query.get(record.mother_id).birthday.strftime('%Y-%m-%d') if record.mother_id else None,
            "birthplace": Parent.query.get(record.mother_id).birthplace if record.mother_id else None,
            "address": Parent.query.get(record.mother_id).address if record.mother_id else None
        },
        "father": {
            "id": record.father_id,
            "first_name": Parent.query.get(record.father_id).first_name if record.father_id else None,
            "middle_name": Parent.query.get(record.father_id).middle_name if record.father_id else None,
            "last_name": Parent.query.get(record.father_id).last_name if record.father_id else None,
            "birthday": Parent.query.get(record.father_id).birthday.strftime('%Y-%m-%d') if record.father_id else None,
            "birthplace": Parent.query.get(record.father_id).birthplace if record.father_id else None,
            "address": Parent.query.get(record.father_id).address if record.father_id else None
        },

        # Fetch Ceremonies with Index, Book, Page, Line
        "ceremonies": {
            "baptism": {
                "index": record.baptism.rec_index if record.baptism else None,
                "book": record.baptism.rec_book if record.baptism else None,
                "page": record.baptism.rec_page if record.baptism else None,
                "line": record.baptism.rec_line if record.baptism else None
            },
            "confirmation": {
                "index": record.confirmation.rec_index if record.confirmation else None,
                "book": record.confirmation.rec_book if record.confirmation else None,
                "page": record.confirmation.rec_page if record.confirmation else None,
                "line": record.confirmation.rec_line if record.confirmation else None
            },
            "wedding": {
                "groom": {
                    "index": record.wedding_groom.rec_index if record.wedding_groom else None,
                    "book": record.wedding_groom.rec_book if record.wedding_groom else None,
                    "page": record.wedding_groom.rec_page if record.wedding_groom else None,
                    "line": record.wedding_groom.rec_line if record.wedding_groom else None
                },
                "bride": {
                    "index": record.wedding_bride.rec_index if record.wedding_bride else None,
                    "book": record.wedding_bride.rec_book if record.wedding_bride else None,
                    "page": record.wedding_bride.rec_page if record.wedding_bride else None,
                    "line": record.wedding_bride.rec_line if record.wedding_bride else None
                }
            },
            "death": {
                "index": record.death.rec_index if record.death else None,
                "book": record.death.rec_book if record.death else None,
                "page": record.death.rec_page if record.death else None,
                "line": record.death.rec_line if record.death else None
            }
        }
    }
    data.append(record_data)

   
    return jsonify({"data": data})

@api_db.route('/baptism', methods=['GET'])
def get_baptisms():
    # Eager load relationships: record → mother, father; and priest
    baptisms = Baptism.query.options(
        joinedload(Baptism.record).joinedload(Record.mother),
        joinedload(Baptism.record).joinedload(Record.father),
        joinedload(Baptism.priest)
    ).all()

    # Collect all needed location codes for batch querying
    region_codes = set()
    province_codes = set()
    citymun_codes = set()
    brgy_codes = set()

    for b in baptisms:
        if b.record:
            region_codes.add(b.record.region)
            province_codes.add(b.record.province)
            citymun_codes.add(b.record.citymun)
            brgy_codes.add(b.record.brgy)

    # Batch load location data into dictionaries
    regions = {r.regCode: r.regDesc for r in Region.query.filter(Region.regCode.in_(region_codes)).all()}
    provinces = {p.provCode: p.provDesc for p in Province.query.filter(Province.provCode.in_(province_codes)).all()}
    citymuns = {c.citymunCode: c.citymunDesc for c in CityMun.query.filter(CityMun.citymunCode.in_(citymun_codes)).all()}
    brgys = {b.brgyCode: b.brgyDesc for b in Barangay.query.filter(Barangay.brgyCode.in_(brgy_codes)).all()}

    data = []
    for baptism in baptisms:
        record = baptism.record
        if not record:
            continue  # Skip if no linked record

        mother = record.mother
        father = record.father
        priest = baptism.priest

        baptism_data = {
            "id": baptism.id,
            "baptism_date": baptism.baptism_date.strftime('%Y-%m-%d') if baptism.baptism_date else None,
            "sponsorA": baptism.sponsorA,
            "residenceA": baptism.residenceA,
            "sponsorB": baptism.sponsorB,
            "residenceB": baptism.residenceB,
            "rec_index": baptism.rec_index,
            "rec_book": baptism.rec_book,
            "rec_page": baptism.rec_page,
            "rec_line": baptism.rec_line,
            "record": {
                "id": record.id,
                "first_name": record.first_name,
                "middle_name": record.middle_name,
                "last_name": record.last_name,
                "birthday": record.birthday.strftime('%Y-%m-%d') if record.birthday else None,
                "address": record.address,
                "province": provinces.get(record.province),
                "citymun": citymuns.get(record.citymun),
                "brgy": brgys.get(record.brgy)
            },
            "priest": {
                "id": priest.id if priest else None,
                "name": priest.name if priest else None
            },
            "mother": {
                "id": mother.id if mother else None,
                "first_name": mother.first_name if mother else None,
                "middle_name": mother.middle_name if mother else None,
                "last_name": mother.last_name if mother else None
            },
            "father": {
                "id": father.id if father else None,
                "first_name": father.first_name if father else None,
                "middle_name": father.middle_name if father else None,
                "last_name": father.last_name if father else None
            }
        }

        data.append(baptism_data)

    return jsonify({"data": data})

@api_db.route('/baptism/view/<int:bapt_id>', methods=['GET'])
def get_baptisms_view(bapt_id):
    baptism = Baptism.query.filter_by(id=bapt_id).first()
  
    data = []
    
    record = Record.query.get(baptism.record_id)  # Get associated record
    priest = Priest.query.get(baptism.priest_id)  # Get associated priest
    region = Region.query.filter_by(regCode=record.region).first()
    province = Province.query.filter_by(provCode=record.province).first()
    citymun = CityMun.query.filter_by(citymunCode=record.citymun).first()
    brgy = Barangay.query.filter_by(brgyCode=record.brgy).first()

    mother = Parent.query.get(record.mother_id) if record and record.mother_id else None  # Get mother info
    father = Parent.query.get(record.father_id) if record and record.father_id else None  # Get father info
    
    baptism_data = {
        "id": baptism.id,
        "baptism_date": baptism.baptism_date.strftime('%Y-%m-%d'),
        "sponsorA": baptism.sponsorA,
        "residenceA": baptism.residenceA,
        "sponsorB": baptism.sponsorB,
        "residenceB": baptism.residenceB,
        "rec_index": baptism.rec_index,
        "rec_book": baptism.rec_book,
        "rec_page": baptism.rec_page,
        "rec_line": baptism.rec_line,

        # Fetch Related Record Data
        "record": {
            "id": record.id if record else None,
            "first_name": record.first_name if record else None,
            "middle_name": record.middle_name if record else None,
            "last_name": record.last_name if record else None,
            "birthday": record.birthday.strftime('%Y-%m-%d') if record else None,
            "birthplace": record.birthplace if record else None,
            "ligitivity": record.ligitivity.name if record and record.ligitivity else None,
            "address": record.address if record else None,
            "region": region.regDesc if region else None,
            "province": province.provDesc if province else None,
            "citymun": citymun.citymunDesc if citymun else None,
            "brgy": brgy.brgyDesc if brgy else None
        },

        # Fetch Related Priest Data
        "priest": {
            "id": priest.id if priest else None,
            "name": priest.name if priest else None
        },

        #Fetch Related Parents Data
        "mother": {
            "id": mother.id if mother else None,
            "first_name": mother.first_name if mother else None,
            "middle_name": mother.middle_name if mother else None,
            "last_name": mother.last_name if mother else None
        },
        "father": {
            "id": father.id if father else None,
            "first_name": father.first_name if father else None,
            "middle_name": father.middle_name if father else None,
            "last_name": father.last_name if father else None
        }
    }
    
    data.append(baptism_data)
  
    return jsonify({"data": data})

@api_db.route('/confirmation', methods=['GET'])
def get_confirmation():
    confirmations = Confirmation.query.options(
        joinedload(Confirmation.record).joinedload(Record.mother),
        joinedload(Confirmation.record).joinedload(Record.father),
        joinedload(Confirmation.priest)
    ).all()

    # Collect all location codes first for batch querying
    region_codes = set()
    province_codes = set()
    citymun_codes = set()
    brgy_codes = set()

    for c in confirmations:
        record = c.record
        if record:
            region_codes.add(record.region)
            province_codes.add(record.province)
            citymun_codes.add(record.citymun)
            brgy_codes.add(record.brgy)

    # Batch load location data into dictionaries
    regions = {r.regCode: r.regDesc for r in Region.query.filter(Region.regCode.in_(region_codes)).all()}
    provinces = {p.provCode: p.provDesc for p in Province.query.filter(Province.provCode.in_(province_codes)).all()}
    citymuns = {c.citymunCode: c.citymunDesc for c in CityMun.query.filter(CityMun.citymunCode.in_(citymun_codes)).all()}
    brgys = {b.brgyCode: b.brgyDesc for b in Barangay.query.filter(Barangay.brgyCode.in_(brgy_codes)).all()}

    data = []
    for confirmation in confirmations:
        record = confirmation.record
        priest = confirmation.priest
        mother = record.mother if record else None
        father = record.father if record else None

        confirmation_data = {
            "id": confirmation.id,
            "confirmation_date": confirmation.confirmation_date.strftime('%Y-%m-%d') if confirmation.confirmation_date else None,

            "record": {
                "id": record.id if record else None,
                "first_name": record.first_name if record else None,
                "middle_name": record.middle_name if record else None,
                "last_name": record.last_name if record else None,
                "birthday": record.birthday.strftime('%Y-%m-%d') if record and record.birthday else None,
                "address": record.address if record else None,
                "province": provinces.get(record.province) if record else None,
                "citymun": citymuns.get(record.citymun) if record else None,
                "brgy": brgys.get(record.brgy) if record else None
            },

            "priest": {
                "id": priest.id if priest else None,
                "name": priest.name if priest else None
            },

            "mother": {
                "id": mother.id if mother else None,
                "first_name": mother.first_name if mother else None,
                "middle_name": mother.middle_name if mother else None,
                "last_name": mother.last_name if mother else None
            },
            "father": {
                "id": father.id if father else None,
                "first_name": father.first_name if father else None,
                "middle_name": father.middle_name if father else None,
                "last_name": father.last_name if father else None
            }
        }
        data.append(confirmation_data)

    return jsonify({"data": data})

@api_db.route('/confirmation/view/<int:conf_id>', methods=['GET'])
def get_confirmations_view(conf_id):
    confirmation = Confirmation.query.filter_by(id=conf_id).first()
 
    data = []

    record = Record.query.get(confirmation.record_id)  # Get associated record
    priest = Priest.query.get(confirmation.priest_id)  # Get associated priest
    region = Region.query.filter_by(regCode=record.region).first()
    province = Province.query.filter_by(provCode=record.province).first()
    citymun = CityMun.query.filter_by(citymunCode=record.citymun).first()
    brgy = Barangay.query.filter_by(brgyCode=record.brgy).first()
    mother = Parent.query.get(record.mother_id) if record and record.mother_id else None  # Get mother info
    father = Parent.query.get(record.father_id) if record and record.father_id else None  # Get father info

    confirmation_data = {
        "id": confirmation.id,
        "confirmation_date": confirmation.confirmation_date.strftime('%Y-%m-%d'),
        "church_baptized": confirmation.church_baptized,
        "sponsorA": confirmation.sponsorA,
        "sponsorB": confirmation.sponsorB,
        "rec_index": confirmation.rec_index,
        "rec_book": confirmation.rec_book,
        "rec_page": confirmation.rec_page,
        "rec_line": confirmation.rec_line,

        # Fetch Related Record Data
        "record": {
            "id": record.id if record else None,
            "first_name": record.first_name if record else None,
            "middle_name": record.middle_name if record else None,
            "last_name": record.last_name if record else None,
            "birthday": record.birthday.strftime('%Y-%m-%d') if record else None,
            "birthplace": record.birthplace if record else None,
            "ligitivity": record.ligitivity.name if record and record.ligitivity else None,
            "address": record.address if record else None,
            "region": region.regDesc if region else None,
            "province": province.provDesc if province else None,
            "citymun": citymun.citymunDesc if citymun else None,
            "brgy": brgy.brgyDesc if brgy else None
        },

        # Fetch Related Priest Data
        "priest": {
            "id": priest.id if priest else None,
            "name": priest.name if priest else None
        },

        #Fetch Related Parents Data
        "mother": {
            "id": mother.id if mother else None,
            "first_name": mother.first_name if mother else None,
            "middle_name": mother.middle_name if mother else None,
            "last_name": mother.last_name if mother else None
        },
        "father": {
            "id": father.id if father else None,
            "first_name": father.first_name if father else None,
            "middle_name": father.middle_name if father else None,
            "last_name": father.last_name if father else None
        }
    }
    data.append(confirmation_data)

    return jsonify({"data": data})

@api_db.route('/wedding', methods=['GET'])
def get_wedding():
    weddings = (
        Wedding.query
        .options(
            joinedload(Wedding.groom_record),
            joinedload(Wedding.bride_record),
            joinedload(Wedding.priest)
        )
        .all()
    )

    data = []
    for wedding in weddings:
        groom_record = wedding.groom_record
        bride_record = wedding.bride_record
        priest = wedding.priest

        # Address lookups (not eager-loadable unless you model them)
        groom_province = Province.query.filter_by(provCode=groom_record.province).first() if groom_record else None
        groom_citymun = CityMun.query.filter_by(citymunCode=groom_record.citymun).first() if groom_record else None
        groom_brgy = Barangay.query.filter_by(brgyCode=groom_record.brgy).first() if groom_record else None

        bride_province = Province.query.filter_by(provCode=bride_record.province).first() if bride_record else None
        bride_citymun = CityMun.query.filter_by(citymunCode=bride_record.citymun).first() if bride_record else None
        bride_brgy = Barangay.query.filter_by(brgyCode=bride_record.brgy).first() if bride_record else None

        wedding_data = {
            "id": wedding.id,
            "wedding_date": wedding.wedding_date.strftime('%Y-%m-%d'),

            "groom": {
                "groom_id": groom_record.id if groom_record else None,
                "first_name": groom_record.first_name if groom_record else None,
                "middle_name": groom_record.middle_name if groom_record else None,
                "last_name": groom_record.last_name if groom_record else None,
                "birthday": groom_record.birthday.strftime('%Y-%m-%d') if groom_record and groom_record.birthday else None,
                "address": groom_record.address if groom_record else None,
                "province": groom_province.provDesc if groom_province else None,
                "citymun": groom_citymun.citymunDesc if groom_citymun else None,
                "brgy": groom_brgy.brgyDesc if groom_brgy else None
            },
            "bride": {
                "bride_id": bride_record.id if bride_record else None,
                "first_name": bride_record.first_name if bride_record else None,
                "middle_name": bride_record.middle_name if bride_record else None,
                "last_name": bride_record.last_name if bride_record else None,
                "birthday": bride_record.birthday.strftime('%Y-%m-%d') if bride_record and bride_record.birthday else None,
                "address": bride_record.address if bride_record else None,
                "province": bride_province.provDesc if bride_province else None,
                "citymun": bride_citymun.citymunDesc if bride_citymun else None,
                "brgy": bride_brgy.brgyDesc if bride_brgy else None
            },

            "priest": {
                "id": priest.id if priest else None,
                "name": priest.name if priest else None
            }
        }

        data.append(wedding_data)

    return jsonify({"data": data})

@api_db.route('/wedding/view/<int:wedd_id>', methods=['GET'])
def get_weddings_view(wedd_id):
    wedding = Wedding.query.filter_by(id=wedd_id).first()

    data = []

    groom_record = Record.query.get(wedding.groom_record_id)  # Get associated record
    bride_record = Record.query.get(wedding.bride_record_id)  # Get associated record
    priest = Priest.query.get(wedding.priest_id)  # Get associated priest
    groom_region = Region.query.filter_by(regCode=groom_record.region).first()
    groom_province = Province.query.filter_by(provCode=groom_record.province).first()
    groom_citymun = CityMun.query.filter_by(citymunCode=groom_record.citymun).first()
    groom_brgy = Barangay.query.filter_by(brgyCode=groom_record.brgy).first()
    bride_region = Region.query.filter_by(regCode=bride_record.region).first()
    bride_province = Province.query.filter_by(provCode=bride_record.province).first()
    bride_citymun = CityMun.query.filter_by(citymunCode=bride_record.citymun).first()
    bride_brgy = Barangay.query.filter_by(brgyCode=bride_record.brgy).first()
    # groom_mother = Parent.query.get(groom_record.mother_id) if groom_record and groom_record.mother_id else None  # Get mother info
    # groom_father = Parent.query.get(groom_record.father_id) if groom_record and groom_record.father_id else None  # Get father info
    # bride_mother = Parent.query.get(bride_record.mother_id) if bride_record and bride_record.mother_id else None  # Get mother info
    # bride_father = Parent.query.get(bride_record.father_id) if bride_record and bride_record.father_id else None  # Get father info

    wedding_data = {
        "id": wedding.id,
        "wedding_date": wedding.wedding_date.strftime('%Y-%m-%d'),
        "sponsorA": wedding.sponsorA,
        "sponsorB": wedding.sponsorB,
        "license_number": wedding.license_number,
        "civil_date": wedding.civil_date.strftime('%Y-%m-%d') if wedding.civil_date else None,
        "civil_place": wedding.civil_place,
        "rec_index": wedding.rec_index,
        "rec_book": wedding.rec_book,
        "rec_page": wedding.rec_page,
        "rec_line": wedding.rec_line,

        # Fetch Related Record Data
        "groom": {
            "groom_id": groom_record.id,
            "first_name": groom_record.first_name if groom_record else None,
            "middle_name": groom_record.middle_name if groom_record else None,
            "last_name": groom_record.last_name if groom_record else None,
            "birthday": groom_record.birthday.strftime('%Y-%m-%d') if groom_record else None,
            "ligitivity": groom_record.ligitivity.name if groom_record and groom_record.ligitivity else None,
            "birthplace": groom_record.birthplace if groom_record else None,
            "status": groom_record.status.name if groom_record and groom_record.status else None,
            "address": groom_record.address if groom_record else None,
            "region": groom_region.regDesc if groom_region else None,
            "province": groom_province.provDesc if groom_province else None,
            "citymun": groom_citymun.citymunDesc if groom_citymun else None,
            "brgy": groom_brgy.brgyDesc if groom_brgy else None
        },
        "bride": {
            "bride_id": bride_record.id,
            "first_name": bride_record.first_name if bride_record else None,
            "middle_name": bride_record.middle_name if bride_record else None,
            "last_name": bride_record.last_name if bride_record else None,
            "birthday": bride_record.birthday.strftime('%Y-%m-%d') if bride_record else None,
            "ligitivity": bride_record.ligitivity.name if bride_record and bride_record.ligitivity else None,
            "birthplace": bride_record.birthplace if bride_record else None,
            "status": bride_record.status.name if bride_record and bride_record.status else None,
            "address": bride_record.address if bride_record else None,
            "region": bride_region.regDesc if bride_region else None,
            "province": bride_province.provDesc if bride_province else None,
            "citymun": bride_citymun.citymunDesc if bride_citymun else None,
            "brgy": bride_brgy.brgyDesc if bride_brgy else None
        },

        # Fetch Related Priest Data
        "priest": {
            "id": priest.id if priest else None,
            "name": priest.name if priest else None
        },

        #Fetch Related Parents Data
        # "groom_mother": {
        #     "id": groom_mother.id if groom_mother else None,
        #     "first_name": groom_mother.first_name if groom_mother else None,
        #     "middle_name": groom_mother.middle_name if groom_mother else None,
        #     "last_name": groom_mother.last_name if groom_mother else None
        # },
        # "groom_father": {
        #     "id": groom_father.id if groom_father else None,
        #     "first_name": groom_father.first_name if groom_father else None,
        #     "middle_name": groom_father.middle_name if groom_father else None,
        #     "last_name": groom_father.last_name if groom_father else None
        # },
        # "bride_mother": {
        #     "id": bride_mother.id if bride_mother else None,
        #     "first_name": bride_mother.first_name if bride_mother else None,
        #     "middle_name": bride_mother.middle_name if bride_mother else None,
        #     "last_name": bride_mother.last_name if bride_mother else None
        # },
        # "bride_father": {
        #     "id": bride_father.id if bride_father else None,
        #     "first_name": bride_father.first_name if bride_father else None,
        #     "middle_name": bride_father.middle_name if bride_father else None,
        #     "last_name": bride_father.last_name if bride_father else None
        # }
    }
    data.append(wedding_data)


    return jsonify({"data": data})

@api_db.route('/death', methods=['GET'])
def get_death():
    deaths = (
        Death.query
        .options(
            joinedload(Death.record).joinedload(Record.mother),
            joinedload(Death.record).joinedload(Record.father),
            joinedload(Death.priest)
        )
        .all()
    )

    data = []
    for death in deaths:
        record = death.record
        priest = death.priest
        mother = record.mother if record else None
        father = record.father if record else None

        province = Province.query.filter_by(provCode=record.province).first() if record else None
        citymun = CityMun.query.filter_by(citymunCode=record.citymun).first() if record else None
        brgy = Barangay.query.filter_by(brgyCode=record.brgy).first() if record else None

        death_data = {
            "id": death.id,
            "death_date": death.death_date.strftime('%Y-%m-%d'),

            "record": {
                "id": record.id if record else None,
                "first_name": record.first_name if record else None,
                "middle_name": record.middle_name if record else None,
                "last_name": record.last_name if record else None,
                "birthday": record.birthday.strftime('%Y-%m-%d') if record and record.birthday else None,
                "address": record.address if record else None,
                "province": province.provDesc if province else None,
                "citymun": citymun.citymunDesc if citymun else None,
                "brgy": brgy.brgyDesc if brgy else None
            },

            "priest": {
                "id": priest.id if priest else None,
                "name": priest.name if priest else None
            },

            "mother": {
                "id": mother.id if mother else None,
                "first_name": mother.first_name if mother else None,
                "middle_name": mother.middle_name if mother else None,
                "last_name": mother.last_name if mother else None
            },
            "father": {
                "id": father.id if father else None,
                "first_name": father.first_name if father else None,
                "middle_name": father.middle_name if father else None,
                "last_name": father.last_name if father else None
            }
        }

        data.append(death_data)

    return jsonify({"data": data})

@api_db.route('/death/view/<int:death_id>', methods=['GET'])
def get_deaths_view(death_id):
    death = Death.query.filter_by(id=death_id).first()

    data = []
    record = Record.query.get(death.record_id)  # Get associated record
    priest = Priest.query.get(death.priest_id)  # Get associated priest
    region = Region.query.filter_by(regCode=record.region).first()
    province = Province.query.filter_by(provCode=record.province).first()
    citymun = CityMun.query.filter_by(citymunCode=record.citymun).first()
    brgy = Barangay.query.filter_by(brgyCode=record.brgy).first()
    mother = Parent.query.get(record.mother_id) if record and record.mother_id else None  # Get mother info
    father = Parent.query.get(record.father_id) if record and record.father_id else None  # Get father info

    death_data = {
        "id": death.id,
        "death_date": death.death_date.strftime('%Y-%m-%d'),
        "burial_date": death.burial_date.strftime('%Y-%m-%d'),
        "contact_person": death.contact_person,
        "cp_address": death.cp_address,
        "cause_of_death": death.cause_of_death,
        "burial_place": death.burial_place,
        "rec_index": death.rec_index,
        "rec_book": death.rec_book,
        "rec_page": death.rec_page,
        "rec_line": death.rec_line,

        # Fetch Related Record Data
        "record": {
            "id": record.id if record else None,
            "first_name": record.first_name if record else None,
            "middle_name": record.middle_name if record else None,
            "last_name": record.last_name if record else None,
            "birthday": record.birthday.strftime('%Y-%m-%d') if record else None,
            "birthplace": record.birthplace if record else None,
            "ligitivity": record.ligitivity.name if record and record.ligitivity else None,
            "address": record.address if record else None,
            "region": region.regDesc if region else None,
            "province": province.provDesc if province else None,
            "citymun": citymun.citymunDesc if citymun else None,
            "brgy": brgy.brgyDesc if brgy else None
        },

        # Fetch Related Priest Data
        "priest": {
            "id": priest.id if priest else None,
            "name": priest.name if priest else None
        },

        #Fetch Related Parents Data
        "mother": {
            "id": mother.id if mother else None,
            "first_name": mother.first_name if mother else None,
            "middle_name": mother.middle_name if mother else None,
            "last_name": mother.last_name if mother else None
        },
        "father": {
            "id": father.id if father else None,
            "first_name": father.first_name if father else None,
            "middle_name": father.middle_name if father else None,
            "last_name": father.last_name if father else None
        }
    }
    data.append(death_data)

 
    return jsonify({"data": data})

@api_db.route('/priest', methods=['GET'])
def get_priests():
    priests = Priest.query.all()

    data = []
    for priest in priests:
        priest_data = {
            "id": priest.id,
            "name": priest.name,
            "position": priest.position.label if priest.position else None,
            "church": priest.church,
            "status": priest.status.name if priest.status else None
        }
        data.append(priest_data)

    return jsonify({"data": data})

@api_db.route('/priest/view/<int:priest_id>', methods=['GET'])
def get_priests_view(priest_id):
    priest = Priest.query.filter_by(id=priest_id).first()
   
    data = []

    baptism_count = Baptism.query.filter_by(priest_id=priest.id).count()
    confirmation_count = Confirmation.query.filter_by(priest_id=priest.id).count()
    wedding_count = Wedding.query.filter_by(priest_id=priest.id).count()
    death_count = Death.query.filter_by(priest_id=priest.id).count()
    
    priest_data = {
        "id": priest.id,
        "name": priest.name,
        "position": priest.position.name,
        "church": priest.church,
        "status": priest.status.name,
        "baptisms": baptism_count,
        "confirmations": confirmation_count,
        "weddings": wedding_count,
        "deaths": death_count

    }
    data.append(priest_data)


    return jsonify({"data": data})


@api_db.route('/get-records-count', methods=['GET'])
def get_records_count():
    start_date_str = request.args.get('start')
    end_date_str = request.args.get('end')

    start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)  # Add 1 day for exclusive upper bound

    record_count = Record.query.filter(
        Record.date_created.between(start_date, end_date)
    ).count()
    bapt_count = Baptism.query.filter(
        Baptism.date_created.between(start_date, end_date)
    ).count()
    conf_count = Confirmation.query.filter(
        Confirmation.date_created.between(start_date, end_date)
    ).count()
    wedd_count = Wedding.query.filter(
        Wedding.date_created.between(start_date, end_date)
    ).count()
    death_count = Death.query.filter(
        Death.date_created.between(start_date, end_date)
    ).count()
    req_count = Request.query.filter(
        Request.requested_at.between(start_date, end_date)
    ).count()

    return jsonify({
        "record": record_count,
        "baptism": bapt_count,
        "confirmation": conf_count,
        "wedding": wedd_count,
        "death": death_count,
        "request": req_count,
        "start_date": start_date,
        "end_date": end_date
    })

def format_ceremony_date(year, month, day):
    if not year:
        return ''
    if not month:
        return str(year)
    if not day:
        return f"{year}-{int(month):02d}"
    return f"{year}-{int(month):02d}-{int(day):02d}"


@api_db.route('/get_report_data')
def get_report_data():
    report_type = request.args.get('type')
    filters = request.args.get('filters')

    if filters:
        filters = json.loads(filters)
    else:
        filters = {}


    data = []

    if report_type == 'record':
        query = Record.query
        if filters.get('civilStatus'):
            query = query.filter(Record.status == filters['civilStatus'])
        if filters.get('ligitivity'):
            query = query.filter(Record.ligitivity == filters['ligitivity'])
        records = query.all()

        data = [{
            'id': r.id,
            'name': f"{r.first_name} {r.middle_name or ''} {r.last_name}".strip(),
            'birthday': r.birthday.strftime('%b %d, %Y') if r.birthday else '',
            'ligitivity': r.ligitivity.value if r.ligitivity else '',
            'birthplace': r.birthplace,
            'status': r.status.value if r.status else '',
            'address': f"{r.address} {r.barangay.brgyDesc} {r.barangay.citymun.citymunDesc} {r.barangay.citymun.province.provDesc} {r.barangay.citymun.province.region.regDesc}",
            'mother': r.mother,
            'father': r.father,
            'updatedon': r.updated_at.strftime('%b %d, %Y %I:%M %p') if r.updated_at else '',
            'staff': f"{r.user.first_name} {r.user.last_name}".strip(),
        } for r in records]

    elif report_type == 'baptism':
        query = Baptism.query

        if filters.get('date_start') and filters.get('date_end'):
            date_start = datetime.strptime(filters.get('date_start'), '%Y-%m-%d')
            date_end = datetime.strptime(filters.get('date_end'), '%Y-%m-%d')

            # Apply the filter to the query
            query = query.filter(Baptism.baptism_date >= date_start, Baptism.baptism_date <= date_end)

        if filters.get('priest'):
            query = query.filter(Baptism.priest.has(id=filters['priest']))

        # Filter logic for Baptism
        if filters.get('index'):
            query = query.filter(Baptism.rec_index == filters['index'])
        if filters.get('book'):
            query = query.filter(Baptism.rec_book == filters['book'])
        if filters.get('page'):
            query = query.filter(Baptism.rec_page == filters['page'])
        if filters.get('line'):
            query = query.filter(Baptism.rec_line == filters['line'])
        baptism = query.all()

        data = [{
            'id': b.id,
            'name': f"{b.record.first_name} {b.record.middle_name or ''} {b.record.last_name}".strip(),
            'birthday': b.record.birthday.strftime('%b %d, %Y') if b.record.birthday else '',
            'baptismdate': b.baptism_date.strftime('%b %d, %Y') if b.baptism_date else '',
            'sponsor1': f"{b.sponsorA} ({b.residenceA})".strip(),
            'sponsor2': f"{b.sponsorB} ({b.residenceB})".strip(),
            'priest': b.priest,
            'location': f"{b.rec_index}-{b.rec_book}-{b.rec_page}-{b.rec_line}".strip(),
            'updatedon': b.updated_at.strftime('%b %d, %Y %I:%M %p') if b.updated_at else '',
            'staff': f"{b.user.first_name} {b.user.last_name}".strip(),
        } for b in baptism]

    elif report_type == 'confirmation':
        query = Confirmation.query
        if filters.get('date_start') and filters.get('date_end'):
            date_start = datetime.strptime(filters.get('date_start'), '%Y-%m-%d')
            date_end = datetime.strptime(filters.get('date_end'), '%Y-%m-%d')

            # Apply the filter to the query
            query = query.filter(Confirmation.confirmation_date >= date_start, Confirmation.confirmation_date <= date_end)
        if filters.get('priest'):
            query = query.filter(Confirmation.priest.has(id=filters['priest']))
        if filters.get('index'):
            query = query.filter(Confirmation.rec_index == filters['index'])
        if filters.get('book'):
            query = query.filter(Confirmation.rec_book == filters['book'])
        if filters.get('page'):
            query = query.filter(Confirmation.rec_page == filters['page'])
        if filters.get('line'):
            query = query.filter(Confirmation.rec_line == filters['line'])
        confirmation = query.all()

        data = [{
            'id': c.id,
            'name': f"{c.record.first_name} {c.record.middle_name or ''} {c.record.last_name}".strip(),
            'birthday': c.record.birthday.strftime('%b %d, %Y') if c.record.birthday else '',
            'confirmationdate': c.confirmation_date.strftime('%b %d, %Y') if c.confirmation_date else '',
            'sponsor': f"{c.sponsorA}, {c.sponsorB}".strip(),
            'churchbaptized': c.church_baptized,
            'priest': c.priest,
            'location': f"{c.rec_index}-{c.rec_book}-{c.rec_page}-{c.rec_line}".strip(),
            'updatedon': c.updated_at.strftime('%b %d, %Y %I:%M %p') if c.updated_at else '',
            'staff': f"{c.user.first_name} {c.user.last_name}".strip(),
        } for c in confirmation]

    elif report_type == 'wedding':
        query = Wedding.query
        if filters.get('date_start') and filters.get('date_end'):
            date_start = datetime.strptime(filters.get('date_start'), '%Y-%m-%d')
            date_end = datetime.strptime(filters.get('date_end'), '%Y-%m-%d')

            # Apply the filter to the query
            query = query.filter(Wedding.wedding_date >= date_start, Wedding.wedding_date <= date_end)
        if filters.get('priest'):
            query = query.filter(Wedding.priest.has(id=filters['priest']))
        if filters.get('index'):
            query = query.filter(Wedding.rec_index == filters['index'])
        if filters.get('book'):
            query = query.filter(Wedding.rec_book == filters['book'])
        if filters.get('page'):
            query = query.filter(Wedding.rec_page == filters['page'])
        if filters.get('line'):
            query = query.filter(Wedding.rec_line == filters['line'])
        wedding = query.all()

        data = [{
            'id': w.id,
            'groom': f"{w.groom_record.first_name} {w.groom_record.middle_name or ''} {w.groom_record.last_name}".strip(),
            'bride': f"{w.bride_record.first_name} {w.bride_record.middle_name or ''} {w.bride_record.last_name}".strip(),
            'weddingdate': w.wedding_date.strftime('%b %d, %Y') if w.wedding_date else '',
            'sponsor': f"{w.sponsorA}, {w.sponsorB}".strip(),
            'licensenumber': w.license_number,
            'civildate': w.civil_date.strftime('%b %d, %Y') if w.civil_date else '',
            'civillocation': w.civil_place,
            'priest': w.priest,
            'location': f"{w.rec_index}-{w.rec_book}-{w.rec_page}-{w.rec_line}".strip(),
            'updatedon': w.updated_at.strftime('%b %d, %Y %I:%M %p') if w.updated_at else '',
            'staff': f"{w.user.first_name} {w.user.last_name}".strip(),
        } for w in wedding]

    elif report_type == 'death':
        query = Death.query
        if filters.get('date_start') and filters.get('date_end'):
            date_start = datetime.strptime(filters.get('date_start'), '%Y-%m-%d')
            date_end = datetime.strptime(filters.get('date_end'), '%Y-%m-%d')

            # Apply the filter to the query
            query = query.filter(Death.death_date >= date_start, Death.death_date <= date_end)
        if filters.get('cause'):
            query = query.filter(Death.cause_of_death.ilike(f"%{filters['cause']}%"))
        if filters.get('priest'):
            query = query.filter(Death.priest.has(id=filters['priest']))
        if filters.get('index'):
            query = query.filter(Death.rec_index == filters['index'])
        if filters.get('book'):
            query = query.filter(Death.rec_book == filters['book'])
        if filters.get('page'):
            query = query.filter(Death.rec_page == filters['page'])
        if filters.get('line'):
            query = query.filter(Death.rec_line == filters['line'])
        death = query.all()

        data = [{
            'id': d.id,
            'name': f"{d.record.first_name} {d.record.middle_name or ''} {d.record.last_name}".strip(),
            'birthday': d.record.birthday.strftime('%b %d, %Y') if d.record.birthday else '',
            'deathdate': d.death_date.strftime('%b %d, %Y') if d.death_date else '',
            'burialdate': d.burial_date.strftime('%b %d, %Y') if d.burial_date else '',
            'buriallocation': d.burial_place,
            'causeofdeath': d.cause_of_death,
            'contactperson': d.contact_person,
            'address': d.cp_address,
            'priest': d.priest,
            'location': f"{d.rec_index}-{d.rec_book}-{d.rec_page}-{d.rec_line}".strip(),
            'updatedon': d.updated_at.strftime('%b %d, %Y %I:%M %p') if d.updated_at else '',
            'staff': f"{d.user.first_name} {d.user.last_name}".strip(),
        } for d in death]

    elif report_type == 'priest':
        query = Priest.query
        if filters.get('status'):
            query = query.filter(Priest.status == filters['status'])
        if filters.get('position'):
            query = query.filter(Priest.position == filters['position'])
        
        priest = query.all()

        data = [{
            'id': p.id,
            'name': p.name,
            'church': p.church,
            'position': p.position,
            'status': p.status.value
        } for p in priest]

    elif report_type == 'request':
        query = Request.query
        if filters.get('date_start') and filters.get('date_end'):
            date_start = datetime.strptime(filters.get('date_start'), '%Y-%m-%d')
            date_end = datetime.strptime(filters.get('date_end'), '%Y-%m-%d')

            # Apply the filter to the query
            query = query.filter(Request.requested_at >= date_start, Request.requested_at <= date_end)

        if filters.get('reqStatus'):
            query = query.filter(Request.status == filters['reqStatus'])
        
        if filters.get('ceremony'):
            query = query.filter(Request.ceremony == filters['ceremony'])

        requests = query.all()

        data = [{
            'id': req.id,
            'requestor': f"{req.user.first_name} {req.user.middle_name or ''} {req.user.last_name}".strip(),
            'nameondocument': req.rec_name,
            'ceremonytype': req.ceremony.value,
            'ceremonydate': format_ceremony_date(req.ceremony_year, req.ceremony_month, req.ceremony_day),
            'status': req.status.value,
            'requestdate': req.requested_at.strftime('%b %d, %Y %I:%M %p') if req.requested_at else '',
            'completiondate': req.processed_at.strftime('%b %d, %Y %I:%M %p') if req.processed_at else '',
            'completedby': f"{req.completed_by_user.first_name} {req.completed_by_user.last_name}".strip()
        } for req in requests]

    else:
        return jsonify({'error': 'Invalid report type'}), 400

    processed_data = []
    for item in data:
        processed_item = item.copy()

        if 'position' in processed_item and isinstance(processed_item['position'], Enum):
            processed_item['position'] = processed_item['position'].label

        for parent in ['mother', 'father']:
            if parent in processed_item and processed_item[parent] is not None:
                parent_obj = processed_item[parent]
                processed_item[parent] = f"{parent_obj.first_name} {parent_obj.last_name}".strip()

        if 'priest' in processed_item and processed_item['priest'] is not None and hasattr(processed_item['priest'], 'name'):
            processed_item['priest'] = processed_item['priest'].name

        processed_data.append(processed_item)

    return jsonify(processed_data)

@api_db.route('/get-schedule')
def get_schedule():
    events = Schedule.query.all()

    

    event_data = []
    for event in events:

        status_value = event.status.value
        category_value = event.category.value

        # Determine the status class based on the event status
        status_class = ''
        if status_value == 'active':
            status_class = 'active-event'
        elif status_value == 'canceled':
            status_class = 'canceled-event'
        elif status_value == 'postponed':
            status_class = 'postponed-event'
        elif status_value == 'holiday':
            status_class = 'holiday-event'

        # Determine the category class based on the event category
        category_class = ''
        if category_value == 'parish':
            category_class = 'event-parish'
        elif category_value == 'request':
            category_class = 'event-request'
        elif category_value == 'holiday':
            category_class = 'event-holiday'
        else:
            category_class = 'event-other'

        # Append the event data with status and category classes
        event_data.append({
            'id': event.id,
            'title': event.title,
            'start': event.start_date.isoformat(),
            'end': event.end_date.isoformat(),
            'description': event.description,
            'category': category_value,
            'status': status_value,
            'className': [status_class, category_class]  # Add the classes here
        })

 
    return jsonify(event_data)

@api_db.route('/get-request')
def get_requests():
    requests = Request.query.all()
   


    request_data = []
    for request in requests:
        requestor = f"{request.user.first_name} {request.user.last_name}" if request.user else "Unknown"

        status_value = request.status.value
        ceremony_value = request.ceremony.value

        # Determine the status class based on the event status
        status_class = ''
        if status_value == 'ready':
            status_class = 'ready-req'
        elif status_value == 'rejected':
            status_class = 'rejected-req'
        elif status_value == 'cancelled':
            status_class = 'cancelled-req'
        elif status_value == 'completed':
            status_class = 'completed-req'
        elif status_value == 'pending':
            status_class = 'pending-req'
        elif status_value == 'processing':
            status_class = 'processing-req'
        
        category_class = 'event-request'
        # Convert pickup_date to datetime and set the start and end times
        pickup_datetime = datetime.combine(request.pickup_date, datetime.min.time())  # Combine date with 00:00:00
        start_datetime = pickup_datetime.replace(hour=8, minute=0, second=0, microsecond=0)  # Set start time to 8 AM
        end_datetime = pickup_datetime.replace(hour=17, minute=0, second=0, microsecond=0)  # Set end time to 5 PM

        # Append the event data with status and category classes
        request_data.append({
            'id': request.id,
            'requestor': requestor,
            'rec_name': request.rec_name,
            'cer_date': format_ceremony_date(request.cer_year, request.cer_month, request.cer_day),
            'relationship': request.relationship,
            'ceremony': ceremony_value,
            'status': status_value,
            'remarks': request.remarks,
            'requested_at': request.requested_at.isoformat(),
            'processed_at': request.processed_at.isoformat() if request.processed_at else 'N/A',
            'pickup_date': request.pickup_date.isoformat(),
            'start': start_datetime.isoformat(),  # Start time (8 AM)
            'end': end_datetime.isoformat(),      # End time (5 PM)
            'className': [status_class, category_class]  # Add the classes here
        })



    return jsonify({"data": request_data})

@api_db.route('/request-client')
def get_ClientRequests():

    requests = Request.query.filter_by(user_id=current_user.id)


    request_data = []
    for request in requests:
        requestor = f"{request.user.first_name} {request.user.last_name}" if request.user else "Unknown"
        status_value = request.status.value
        ceremony_value = request.ceremony.value

        # Determine the status class
        status_class = {
            'ready': 'ready-req',
            'rejected': 'rejected-req',
            'cancelled': 'cancelled-req',
            'completed': 'completed-req',
            'pending': 'pending-req',
            'processing': 'processing-req'
        }.get(status_value, '')

        category_class = 'event-request'

        pickup_datetime = datetime.combine(request.pickup_date, datetime.min.time())
        start_datetime = pickup_datetime.replace(hour=8, minute=0, second=0)
        end_datetime = pickup_datetime.replace(hour=17, minute=0, second=0)

        request_data.append({
            'id': request.id,
            'requestor': requestor,
            'rec_name': request.rec_name,
            'cer_date': format_ceremony_date(request.cer_year, request.cer_month, request.cer_day),
            'relationship': request.relationship,
            'ceremony': ceremony_value,
            'status': status_value,
            'remarks': request.remarks,
            'requested_at': request.requested_at.isoformat(),
            'processed_at': request.processed_at.isoformat() if request.processed_at else 'N/A',
            'pickup_date': request.pickup_date.isoformat(),
            'start': start_datetime.isoformat(),
            'end': end_datetime.isoformat(),
            'className': [status_class, category_class]
        })

    return jsonify({"data": request_data})


@api_db.route('/get-request/count', methods=['GET'])
def get_request_count():
    status_counts = (
        db.session.query(Request.status, db.func.count(Request.id))
        .group_by(Request.status)
        .all()
    )

  
    return jsonify({status.value: count for status, count in status_counts})

@api_db.route('/request/view/<int:req_id>', methods=['GET'])
def get_requests_view(req_id):
    request = Request.query.filter_by(id=req_id).first()
   
    data = []
    user = User.query.get(request.user_id)  # Get associated record    
    request_data = {
        "id": request.id,
        "ceremony": request.ceremony.name,
        "rec_name" : request.rec_name,
        "cer_date": format_ceremony_date(request.cer_year, request.cer_month, request.cer_day),
        "relationship" : request.relationship,
        "status": request.status.name,
        "requested_at": request.requested_at.strftime('%Y-%m-%d'),
        "processed_at": request.processed_at.strftime('%Y-%m-%d') if request.processed_at else None,
        "remarks" : request.remarks,
        "pickup_date": request.pickup_date.strftime('%Y-%m-%d'),


        # Fetch Related Record Data
        "user": {
            "id": user.id if user else None,
            "first_name": user.first_name if user else None,
            "middle_name": user.middle_name if user else None,
            "last_name": user.last_name if user else None,
            "email": user.email if user else None,
            "cont_no": user.contact_number if user else None
        },
    }
    data.append(request_data)

  

    return jsonify({"data": data})

@api_db.route('/search-record', methods=['POST'])
def search_record():
    data = request.get_json()
    ceremony = data.get('ceremony', '').lower()
    rec_name = data.get('rec_name', '')
    cer_year = data.get('cer_year', '')
    cer_month = data.get('cer_month', '')
    cer_day = data.get('cer_day', '')

    model_map = {
        'baptism': Baptism,
        'confirmation': Confirmation,
        'wedding': Wedding,
        'death': Death
    }

    # Get the model based on the ceremony
    Model = model_map.get(ceremony)
    if not Model:
        return jsonify({"found": False}), 400
        

    # Determine the ceremony_date column
    if ceremony == "baptism":
        ceremony_date_column = Model.baptism_date
    elif ceremony == "confirmation":
        ceremony_date_column = Model.confirmation_date
    elif ceremony == "wedding":
        ceremony_date_column = Model.wedding_date
    elif ceremony == "death":
        ceremony_date_column = Model.death_date
    else:
        return jsonify({"found": False, "error": "Invalid ceremony type"}), 400

    # Get all records for this ceremony and date

    # Start base query
    query = db.session.query(Model)

    # Apply filters dynamically
    if cer_year.strip():
        query = query.filter(extract('year', ceremony_date_column) == int(cer_year))
    if cer_month.strip():
        query = query.filter(extract('month', ceremony_date_column) == int(cer_month))
    if cer_day.strip():
        query = query.filter(extract('day', ceremony_date_column) == int(cer_day))


    # Final records
    records = query.all()

    # Now we need to do fuzzy matching with the full name
    # Process name to search
    name_parts = rec_name.split()
    full_name = " ".join(name_parts)  # Full name
    ceremony_date = f"{cer_year}-{cer_month.zfill(2) if cer_month else '??'}-{cer_day.zfill(2) if cer_day else '??'}"

    matched_records = []
    for record in records:
        if ceremony == "wedding":
            groom = record.groom_record
            bride = record.bride_record

            groom_full_name = f"{groom.first_name} {groom.middle_name or ''} {groom.last_name}".strip()
            bride_full_name = f"{bride.first_name} {bride.middle_name or ''} {bride.last_name}".strip()

            if fuzz.ratio(full_name.lower(), groom_full_name.lower()) > 80:
                matched_records.append({
                    "record": record,
                    "matched_person": groom,
                    "matched_name": groom_full_name
                })
            elif fuzz.ratio(full_name.lower(), bride_full_name.lower()) > 80:
                matched_records.append({
                    "record": record,
                    "matched_person": bride,
                    "matched_name": bride_full_name
                })
        else:
            person = record.record
            record_full_name = f"{person.first_name} {person.middle_name or ''} {person.last_name}".strip()
            if fuzz.ratio(full_name.lower(), record_full_name.lower()) > 80:
                matched_records.append({
                    "record": record,
                    "matched_person": person,
                    "matched_name": record_full_name
                })
    if matched_records:
        # If there are more than 3 matches, return them all in a list
        if len(matched_records) > 1:
            return jsonify({
                "found": True,
                "matches": [{
                    "name": match["matched_name"],
                    "id": match["record"].id,
                    "ceremony": ceremony,
                    "ceremony_date": ceremony_date
                } for match in matched_records]
            })
        else:
            # Return the matched record data for the best match
            return jsonify({
                "found": True,
                "matches": [{
                    "name": match["matched_name"],
                    "id": match["record"].id,
                    "ceremony": ceremony,
                    "ceremony_date": ceremony_date
                } for match in matched_records]
            })
    else:
        return jsonify({"found": False})

@api_db.route('/account', methods=['GET'])
def get_accounts():
    users = User.query.all()

    data = []
    for user in users:
        user_data = {
            "id": user.id,
            "first_name": user.first_name if user.first_name else "",
            "middle_name": user.middle_name if user.middle_name else "",
            "last_name": user.last_name if user.last_name else "",
            "username": user.username,
            "contact_number": user.contact_number,
            "email": user.email,
            "role": user.role.name,
            "date_joined": user.date_created.strftime('%Y-%m-%d')
        }
        data.append(user_data)
    
   

    return jsonify({"data": data})

@api_db.route('/audit-logs', methods=['GET'])
def get_audits():
    logs = AuditLog.query.all()

    data = []
    for log in logs:
        log_data = {
            "changed_at": log.changed_at.strftime('%Y-%m-%d %H:%M:%S'),
            "action": log.action,
            "table_name": log.table_name,
            "record_id": log.record_id or "N/A",
            "changed_by": log.changed_by,
            "changed_by_info": log.changed_by_info,
            "old_data": log.old_data,
            "new_data": log.new_data,
        }
        data.append(log_data)
    

    return jsonify({"data": data})


def get_serializer():
    return URLSafeTimedSerializer(current_app.secret_key)

@api_db.route('/request-password-reset', methods=['POST'])
def reset_pass_req():
    try:
        data = request.get_json()
     
        email = data.get('email')

        if not email:
            return jsonify({"message": "Email is required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"message": "No account found with this email"}), 404

        serializer = get_serializer()
        reset_token = serializer.dumps(user.id, salt='password-reset-salt')

        reset_link = url_for('api_db.reset_password', token=reset_token, _external=True)

        msg = Message(
            subject="Password Reset",
            recipients=[email],
            body=f"Reset your password using this link (valid for 1 hour): {reset_link}"
        )
        mail.send(msg)

        return jsonify({"message": "Reset email sent."}), 200

    except Exception as e:
     
        return jsonify({"message": "Error sending email"}), 500
    
@api_db.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    token = request.args.get('token') if request.method == 'GET' else request.form.get('token')
    serializer = get_serializer()

    try:
        user_id = serializer.loads(token, salt='password-reset-salt', max_age=3600)
    except SignatureExpired:
        return "The reset link has expired.", 400
    except BadSignature:
        return "Invalid reset token.", 400

    user = User.query.get(user_id)
    if not user:
        return "User not found.", 404

    if request.method == 'POST':
        try:
            new_password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')

            if new_password != confirm_password:
                return "Passwords do not match.", 400

            user.password = generate_password_hash(new_password)
            db.session.commit()

            flash("Password updated successfully. You can now log in.", "success")
            return redirect('/login')  # adjust path to your login route
        except Exception as e:
            db.session.rollback()
          
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500 

    return render_template('reset_password.html', token=token)

@api_db.route('/check-phone', methods=['POST'])
def check_phone():
    data = request.get_json()
    phone = data.get('phone')

    if not phone:
        return jsonify({"status": "error", "message": "Phone number is required"}), 400

    # Check if any user already has this phone number
    existing_user = User.query.filter_by(contact_number=phone).first()

    if existing_user:
        return jsonify({"status": "exists", "message": "Phone number is already in use"}), 200
    else:
        return jsonify({"status": "available", "message": "Phone number is available"}), 200
    
@api_db.route('/update-phone', methods=['POST'])
@login_required
def update_phone():
    data = request.get_json()
    new_phone = data.get('contact_number')

    if not new_phone:
        return jsonify({"status": "error", "message": "Phone number is required"}), 400

    # Optional: Validate format (e.g., starts with 09 and 11 digits total)
    if not new_phone.startswith('09') or len(new_phone) != 11:
        return jsonify({"status": "error", "message": "Invalid phone number format"}), 400

    try:
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        user.contact_number = new_phone
        db.session.commit()

        return jsonify({"status": "success", "message": "Phone number updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Failed to update phone number: {str(e)}"}), 500
