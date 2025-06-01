from flask import Blueprint, render_template, request, abort, flash, redirect, url_for, jsonify
from flask_login import login_required, current_user
from ..models import db, User, UserRole, Record, Request, Schedule, Parent, Baptism, Confirmation, Wedding, Death, Priest, Region, Province, CityMun, Barangay
from .utilities import check_client, check_parents, check_parents_by_id, add_parent_if_not_exists
import traceback 
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from website.models.enums import RequestStatus, Ceremonies
from datetime import date
from sqlalchemy import func

api_route = Blueprint('api_route', __name__)

@api_route.route("/check_record", methods=["POST"])
def check_record():
    try:
        print(f"Form request.form: {request.form}")
        
        data = request.form

        print("Received Keys:", list(data.keys()))

        client = check_client(
            data.get("fname"), data.get("mname"), data.get("lname"), data.get("birthdate")
        )

        print(f"Client: {client}")

        if client["record"]["id"]: 
            mother_id = client["record"]["mother_id"]
            father_id = client["record"]["father_id"]
            
            parents = check_parents_by_id(mother_id, father_id) 
            
            client["record"]["ligitivity"] = str(client["record"]["ligitivity"])
            client["record"]["ligitivity"] = client["record"]["ligitivity"].split(".")[-1].lower() 
            client["record"]["status"] = str(client["record"]["status"])
            client["record"]["status"] = client["record"]["status"].split(".")[-1].lower()
            
            return jsonify({
                "exists": True,
                "client": client["record"],
                "parents": parents
            }), 200
        
        return jsonify({
            "message": "Client does not exist",
            "type": "info"
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        return jsonify({"error": str(e)}), 500

@api_route.route('/delete-record/<int:rec_id>', methods=['DELETE'])
def delete_record(rec_id):
    try:

        print(f"Deleting record with ID: {rec_id}")
        record = Record.query.get(rec_id)

        if not record:
            return jsonify({"success": False, "message": "Record not found"}), 404

        db.session.delete(record)
        db.session.commit()

        return jsonify({"success": True, "message": "Record deleted successfully"}), 200
    
    except IntegrityError as e:
        db.session.rollback()
        print(f"Integrity Error: {e}")
        return jsonify({
            "message": "Record has an existing ceremony and cannot be deleted.",
            "error": str(e),
            "type": "error"
        }), 400


    except Exception as e:
        db.session.rollback()
        print("Error deleting record:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

@api_route.route("/edit-record/<int:record_id>", methods=["PUT"])
def edit_record(record_id):
    try:
        print(f"Form request.form: {request.form}")
        data = request.form

        print("Received Keys:", list(data.keys()))

        mother_data = {
            "fname": data.get("mofname"),
            "mname": data.get("momname"),
            "lname": data.get("molname"),
            "birthday": data.get("mobirthdate"),
            "birthplace": data.get("mobirthplace"),
            "address": data.get("moaddress")
        }

        father_data = {
            "fname": data.get("fafname"),
            "mname": data.get("famname"),
            "lname": data.get("falname"),
            "birthday": data.get("fabirthdate"),
            "birthplace": data.get("fabirthplace"),
            "address": data.get("faaddress")
        }

        mother_id = None
        father_id = None

        if data.get("rec_moID"):
            existing_mother = Parent.query.filter_by(
                first_name=mother_data["fname"],
                middle_name=mother_data["mname"],
                last_name=mother_data["lname"],
                birthday=mother_data["birthday"],
                role="MOTHER"
            ).first()

            if existing_mother:
                existing_mother.birthplace = mother_data["birthplace"]
                existing_mother.address = mother_data["address"]
                mother_id = existing_mother.id
            else:
                mother = Parent.query.get(data.get("rec_moID"))
                if mother:
                    mother.first_name = mother_data["fname"]
                    mother.middle_name = mother_data["mname"]
                    mother.last_name = mother_data["lname"]
                    mother.birthday = mother_data["birthday"]
                    mother.birthplace = mother_data["birthplace"]
                    mother.address = mother_data["address"]
                    mother_id = mother.id

        if data.get("rec_faID"):
            existing_father = Parent.query.filter_by(
                first_name=father_data["fname"],
                middle_name=father_data["mname"],
                last_name=father_data["lname"],
                birthday=father_data["birthday"],
                role="FATHER"
            ).first()

            if existing_father:
                existing_father.birthplace = father_data["birthplace"]
                existing_father.address = father_data["address"]
                father_id = existing_father.id
            else:
                father = Parent.query.get(data.get("rec_faID"))
                if father:
                    father.first_name = father_data["fname"]
                    father.middle_name = father_data["mname"]
                    father.last_name = father_data["lname"]
                    father.birthday = father_data["birthday"]
                    father.birthplace = father_data["birthplace"]
                    father.address = father_data["address"]
                    father_id = father.id

        if data.get("rec_id"):
            client = Record.query.get(data.get("rec_id"))
            if client:
                client.first_name = data.get("fname")
                client.middle_name = data.get("mname")
                client.last_name = data.get("lname")
                client.birthday = data.get("birthdate")
                client.ligitivity = data.get("ligitivity")
                client.birthplace = data.get("birthplace")
                client.status = data.get("civilStatus")
                client.address = data.get("addressLine")
                client.region = data.get("region")
                client.province = data.get("province")
                client.citymun = data.get("cityMun")
                client.brgy = data.get("barangay")
                if mother_id:
                    client.mother_id = mother_id
                if father_id:
                    client.father_id = father_id
        else:
            return jsonify({
                "message": "Client ID is required for editing.",
                "type": "error"
            }), 400

        db.session.commit()

        return jsonify({
            "message": "Record updated successfully!",
            "type": "success"
        }), 200

    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



@api_route.route("/submit-baptism", methods=["POST"])
def submit_baptism():
    try:
        print(f"Form request.form: {request.form}")
        
        data = request.form

        print("Received Keys:", list(data.keys()))

        mother_data = {
                "fname": data.get("mofname"),
                "mname": data.get("momname"),
                "lname": data.get("molname"),
                "birthdate": data.get("mobirthdate"),
                "birthplace": data.get("mobirthplace"),
                "address": data.get("moaddress")
            }

        father_data = {
            "fname": data.get("fafname"),
            "mname": data.get("famname"),
            "lname": data.get("falname"),
            "birthdate": data.get("fabirthdate"),
            "birthplace": data.get("fabirthplace"),
            "address": data.get("faaddress")
        }
        
        if data.get("rec_moID") and data.get("rec_faID"):
            mother_id = data.get("rec_moID")
            father_id = data.get("rec_faID")
        elif any(mother_data.values()) or any(father_data.values()):
            parents = check_parents(mother_data, father_data)

            print(f"Parents: {parents}")
            if not parents["mother"]["id"]:
                print("Adding Mother")
                print(f"Mother Data: {mother_data}")
                mother_id = add_parent_if_not_exists(mother_data, "MOTHER")
            else:
                mother_id = parents["mother"]["id"]  

            if not parents["father"]["id"]:
                print("Adding Father")
                print(f"Father Data: {father_data}")
                father_id = add_parent_if_not_exists(father_data, "FATHER")
            else:
                father_id = parents["father"]["id"]  
        else:
            return jsonify({
                "message": "There was an error in adding Parent Information. Please Try again later.",
                "type": "error"
            }), 200

        if data.get("rec_id"):
            client_id = data.get("rec_id")
        elif any([data.get("fname"), data.get("mname"), data.get("lname"), data.get("birthdate")]):
            client = check_client(
                data.get("fname"), data.get("mname"), data.get("lname"), data.get("birthdate")
            )

            print(f"Client: {client}")

            if client["record"]["id"] is None:
                new_client = Record(
                    first_name=data.get("fname"),
                    middle_name=data.get("mname"),
                    last_name=data.get("lname"),
                    birthday=data.get("birthdate"),
                    ligitivity=data.get("ligitivity"),
                    birthplace=data.get("birthplace"),
                    status=data.get("civilStatus"),
                    address=data.get("addressLine"),
                    region=data.get("region"),
                    province=data.get("province"),
                    citymun=data.get("cityMun"),
                    brgy=data.get("barangay"),
                    mother_id=mother_id,
                    father_id=father_id,
                    recorded_by=current_user.id
                )
                db.session.add(new_client)
                db.session.commit()
                client_id = new_client.id  
            else:
                client_id = client["record"]["id"]
        else:
            return jsonify({
                "message": "There was an error in adding Client Data. Please Try again later.",
                "type": "error"
            }), 200

        baptism = Baptism.query.filter(Baptism.record_id == client_id).first()

        if baptism is None:
            existing_baptism = Baptism.query.filter_by(
                rec_index=data.get("rec_index"),
                rec_book=data.get("rec_book"),
                rec_page=data.get("rec_page"),
                rec_line=data.get("rec_line")
            ).first()

            if existing_baptism:
                return jsonify({
                    "message": "A baptism record already exists in this Record Location!",
                    "type": "error"
                }), 200
            else:
                new_baptism = Baptism(
                    record_id=client_id,
                    baptism_date=data.get("baptDate"),
                    sponsorA=data.get("sponsorA"),
                    residenceA=data.get("residenceA"),
                    sponsorB=data.get("sponsorB"),
                    residenceB=data.get("residenceB"),
                    priest_id=data.get("priest"),
                    rec_index=data.get("rec_index"),
                    rec_book=data.get("rec_book"),
                    rec_page=data.get("rec_page"),
                    rec_line=data.get("rec_line"),
                    recorded_by=current_user.id
                    )
                db.session.add(new_baptism)
                db.session.commit()

                return jsonify({
                    "message": "Baptism record submitted successfully!",
                    "type" : "success"
                }), 200
        else:
            return jsonify({
                "message": "Client has exisitng Baptism Record",
                "type" : "error"
            }), 200
    
    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@api_route.route("/edit-baptism/<int:baptism_id>", methods=["PUT"])
def edit_baptism(baptism_id):
    try:
        print(f"Form request.form: {request.form}")

        data = request.form or request.json
        print("Received Keys:", list(data.keys()))

        baptism = Baptism.query.get(baptism_id)
        if not baptism:
            return jsonify({
                "message": "Baptism record not found.",
                "type": "error"
            }), 404

        duplicate_baptism = Baptism.query.filter(
            Baptism.id != baptism_id,
            Baptism.rec_index == data.get("rec_index"),
            Baptism.rec_book == data.get("rec_book"),
            Baptism.rec_page == data.get("rec_page"),
            Baptism.rec_line == data.get("rec_line")
        ).first()

        if duplicate_baptism:
            return jsonify({
                "message": "Another baptism record already exists in this Record Location!",
                "type": "error"
            }), 200

        baptism.baptism_date = data.get("baptDate", baptism.baptism_date)
        baptism.sponsorA = data.get("sponsorA", baptism.sponsorA)
        baptism.residenceA = data.get("residenceA", baptism.residenceA)
        baptism.sponsorB = data.get("sponsorB", baptism.sponsorB)
        baptism.residenceB = data.get("residenceB", baptism.residenceB)
        baptism.priest_id = data.get("priestEdit", baptism.priest_id)
        baptism.rec_index = data.get("rec_index", baptism.rec_index)
        baptism.rec_book = data.get("rec_book", baptism.rec_book)
        baptism.rec_page = data.get("rec_page", baptism.rec_page)
        baptism.rec_line = data.get("rec_line", baptism.rec_line)

        db.session.commit()

        return jsonify({
            "message": "Baptism record updated successfully!",
            "type": "success"
        }), 200

    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@api_route.route('/delete-baptism/<int:bapt_id>', methods=['DELETE'])
def delete_baptism(bapt_id):
    try:

        print(f"Deleting Baptism record with ID: {bapt_id}")
        baptism = Baptism.query.get(bapt_id)

        if not baptism:
            return jsonify({"success": False, "message": "Record not found"}), 404

        db.session.delete(baptism)
        db.session.commit()

        return jsonify({"success": True, "message": "Record deleted successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        print("Error deleting record:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

@api_route.route("/submit-confirmation", methods=["POST"])
def submit_confirmation():
    try:
        print(f"Form request.form: {request.form}")
        
        data = request.form

        print("Received Keys:", list(data.keys()))

        mother_data = {
                "fname": data.get("mofname"),
                "mname": data.get("momname"),
                "lname": data.get("molname"),
                "birthdate": data.get("mobirthdate"),
                "birthplace": data.get("mobirthplace"),
                "address": data.get("moaddress")
            }

        father_data = {
            "fname": data.get("fafname"),
            "mname": data.get("famname"),
            "lname": data.get("falname"),
            "birthdate": data.get("fabirthdate"),
            "birthplace": data.get("fabirthplace"),
            "address": data.get("faaddress")
        }
        
        if data.get("rec_moID") and data.get("rec_faID"):
            mother_id = data.get("rec_moID")
            father_id = data.get("rec_faID")
        elif any(mother_data.values()) or any(father_data.values()):
            parents = check_parents(mother_data, father_data)

            print(f"Parents: {parents}")
            if not parents["mother"]["id"]:
                print("Adding Mother")
                print(f"Mother Data: {mother_data}")
                mother_id = add_parent_if_not_exists(mother_data, "MOTHER")
            else:
                mother_id = parents["mother"]["id"]  

            if not parents["father"]["id"]:
                print("Adding Father")
                print(f"Father Data: {father_data}")
                father_id = add_parent_if_not_exists(father_data, "FATHER")
            else:
                father_id = parents["father"]["id"]  
        else:
            return jsonify({
                "message": "There was an error in adding Parent Information. Please Try again later.",
                "type": "error"
            }), 200

        if data.get("rec_id"):
            client_id = data.get("rec_id")
        elif any([data.get("fname"), data.get("mname"), data.get("lname"), data.get("birthdate")]):
            client = check_client(
                data.get("fname"), data.get("mname"), data.get("lname"), data.get("birthdate")
            )

            print(f"Client: {client}")

            if client["record"]["id"] is None:
                full_address = f"{data.get("addressLine")}, {data.get("barangay")}, {data.get("cityMun")}, {data.get("province")}, {data.get("region")}"

                print(f"Full Address: {full_address}")

                new_client = Record(
                    first_name=data.get("fname"),
                    middle_name=data.get("mname"),
                    last_name=data.get("lname"),
                    birthday=data.get("birthdate"),
                    ligitivity=data.get("ligitivity"),
                    birthplace=data.get("birthplace"),
                    status=data.get("civilStatus"),
                    address=data.get("addressLine"),
                    region=data.get("region"),
                    province=data.get("province"),
                    citymun=data.get("cityMun"),
                    brgy=data.get("barangay"),
                    mother_id=mother_id,
                    father_id=father_id,
                    recorded_by=current_user.id
                )
                db.session.add(new_client)
                db.session.commit()
                client_id = new_client.id  
            else:
                client_id = client["record"]["id"]
        else:
            return jsonify({
                "message": "There was an error in adding Client Data. Please Try again later.",
                "type": "error"
            }), 200

        confirmation = Confirmation.query.filter(Confirmation.record_id == client_id).first()

        if confirmation is None:
            existing_confirmation = Confirmation.query.filter_by(
                rec_index=data.get("rec_index"),
                rec_book=data.get("rec_book"),
                rec_page=data.get("rec_page"),
                rec_line=data.get("rec_line")
            ).first()

            if existing_confirmation:
                return jsonify({
                    "message": "A confirmation record already exists in this Record Location!",
                    "type": "error"
                }), 200
            else:
                new_confirmation = Confirmation(
                    record_id=client_id,
                    confirmation_date=data.get("confDate"),
                    church_baptized=data.get("church_baptized"),
                    sponsorA=data.get("sponsorA"),
                    sponsorB=data.get("sponsorB"),
                    priest_id=data.get("priest"),
                    rec_index=data.get("rec_index"),
                    rec_book=data.get("rec_book"),
                    rec_page=data.get("rec_page"),
                    rec_line=data.get("rec_line"),
                    recorded_by=current_user.id
                    )
                db.session.add(new_confirmation)
                db.session.commit()

                return jsonify({
                    "message": "Confirmation record submitted successfully!",
                    "type" : "success"
                }), 200
        else:
            return jsonify({
                "message": "Client has exisitng Confirmation Record",
                "type" : "error"
            }), 200
    
    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        return jsonify({"error": str(e)}), 500

@api_route.route("/edit-confirmation/<int:confirmation_id>", methods=["PUT"])
def edit_confirmation(confirmation_id):
    try:
        print(f"Form request.form: {request.form}")
        
        data = request.form

        print("Received Keys:", list(data.keys()))

        confirmation = Confirmation.query.get(confirmation_id)
        if not confirmation:
            return jsonify({
                "message": "Confirmation record not found.",
                "type": "error"
            }), 404
        
        duplicate_confirmation = Confirmation.query.filter(
            Confirmation.id != confirmation_id,
            Confirmation.rec_index == data.get("rec_index"),
            Confirmation.rec_book == data.get("rec_book"),
            Confirmation.rec_page == data.get("rec_page"),
            Confirmation.rec_line == data.get("rec_line")
        ).first()

        if duplicate_confirmation:
            return jsonify({
                "message": "Another confirmation record already exists in this Record Location!",
                "type": "error"
            }), 200

        confirmation.confirmation_date = data.get("confDate", confirmation.confirmation_date)
        confirmation.church_baptized = data.get("church_baptized", confirmation.church_baptized)
        confirmation.sponsorA = data.get("sponsorA", confirmation.sponsorA)
        confirmation.sponsorB = data.get("sponsorB", confirmation.sponsorB)
        confirmation.priest_id = data.get("priestEdit", confirmation.priest_id)
        confirmation.rec_index = data.get("rec_index", confirmation.rec_index)
        confirmation.rec_book = data.get("rec_book", confirmation.rec_book)
        confirmation.rec_page = data.get("rec_page", confirmation.rec_page)
        confirmation.rec_line = data.get("rec_line", confirmation.rec_line)

        db.session.commit()

        return jsonify({
            "message": "Confirmation record updated successfully!",
            "type": "success"
        }), 200

    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
  
@api_route.route('/delete-confirmation/<int:conf_id>', methods=['DELETE'])
def delete_confirmation(conf_id):
    try:

        print(f"Deleting Confirmation record with ID: {conf_id}")
        confirmation = Confirmation.query.get(conf_id)

        if not confirmation:
            return jsonify({"success": False, "message": "Record not found"}), 404

        db.session.delete(confirmation)
        db.session.commit()

        return jsonify({"success": True, "message": "Record deleted successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        print("Error deleting record:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

@api_route.route("/submit-wedding", methods=["POST"])
def submit_wedding():
    try:
        print(f"Form request.form: {request.form}")
        
        data = request.form

        print("Received Keys:", list(data.keys()))

        groom_mother_data = {
                "fname": data.get("GroomMoFname"),
                "mname": data.get("GroomMoMname"),
                "lname": data.get("GroomMoLname"),
                "birthdate": data.get("GroomMoBirthdate"),
                "birthplace": data.get("GroomMoBirthplace"),
                "address": data.get("GroomMoAddress")
            }

        groom_father_data = {
            "fname": data.get("GroomFaFname"),
            "mname": data.get("GroomFaMname"),
            "lname": data.get("GroomFaLname"),
            "birthdate": data.get("GroomFaBirthdate"),
            "birthplace": data.get("GroomFaBirthplace"),
            "address": data.get("GroomFaAddress")
        }
        
        if data.get("rec_GroomMoID") and data.get("rec_GroomFaID"):
            groom_mother_id = data.get("rec_GroomMoID")
            groom_father_id = data.get("rec_GroomFaID")
        elif any(groom_mother_data.values()) or any(groom_father_data.values()):
            parents = check_parents(groom_mother_data, groom_father_data)

            print(f"Parents: {parents}")
            if not parents["mother"]["id"]:
                print("Adding Mother")
                print(f"Mother Data: {groom_mother_data}")
                groom_mother_id = add_parent_if_not_exists(groom_mother_data, "MOTHER")
            else:
                groom_mother_id = parents["mother"]["id"]  

            if not parents["father"]["id"]:
                print("Adding Father")
                print(f"Father Data: {groom_father_data}")
                groom_father_id = add_parent_if_not_exists(groom_father_data, "FATHER")
            else:
                groom_father_id = parents["father"]["id"]  
        else:
            return jsonify({
                "message": "There was an error in adding Parent Information. Please Try again later.",
                "type": "error"
            }), 200

        if data.get("rec_GroomID"):
            groom_client_id = data.get("rec_GroomID")
            print(f"Groom Client ID: {groom_client_id}")
        elif any([data.get("weddGroomFname"), data.get("weddGroomMname"), data.get("weddGroomLname"), data.get("weddGroomBirthdate")]):
            groom = check_client(
                data.get("weddGroomFname"), data.get("weddGroomMname"), data.get("weddGroomLname"), data.get("weddGroomBirthdate")
            )

            print(f"Client: {groom}")

            if groom["record"]["id"] is None:
                new_groom = Record(
                    first_name=data.get("weddGroomFname"),
                    middle_name=data.get("weddGroomMname"),
                    last_name=data.get("weddGroomLname"),
                    birthday=data.get("weddGroomBirthdate"),
                    ligitivity=data.get("GroomLigitivity"),
                    birthplace=data.get("weddGroomBirthplace"),
                    status=data.get("GroomCivilStatus"),
                    address=data.get("GroomAddressLine"),
                    region=data.get("GroomRegion"),
                    province=data.get("GroomProvince"),
                    citymun=data.get("GroomCity"),
                    brgy=data.get("GroomBarangay"),
                    mother_id=groom_mother_id,
                    father_id=groom_father_id,
                    recorded_by=current_user.id
                )
                db.session.add(new_groom)
                db.session.commit()
                groom_client_id = new_groom.id  
            else:
                groom_client_id = groom["record"]["id"]
        else:
            return jsonify({
                "message": "There was an error in adding Client Data. Please Try again later.",
                "type": "error"
            }), 200

        bride_mother_data = {
                "fname": data.get("BrideMoFname"),
                "mname": data.get("BrideMoMname"),
                "lname": data.get("BrideMoLname"),
                "birthdate": data.get("BrideMoBirthdate"),
                "birthplace": data.get("BrideMoBirthplace"),
                "address": data.get("BrideMoAddress")
            }

        bride_father_data = {
            "fname": data.get("BrideFaFname"),
            "mname": data.get("BrideFaMname"),
            "lname": data.get("BrideFaLname"),
            "birthdate": data.get("BrideFaBirthdate"),
            "birthplace": data.get("BrideFaBirthplace"),
            "address": data.get("BrideFaAddress")
        }
        
        if data.get("rec_BrideMoID") and data.get("rec_BrideFaID"):
            bride_mother_id = data.get("rec_BrideMoID")
            bride_father_id = data.get("rec_BrideFaID")
        elif any(bride_mother_data.values()) or any(bride_father_data.values()):
            parents = check_parents(bride_mother_data, bride_father_data)

            print(f"Parents: {parents}")
            if not parents["mother"]["id"]:
                print("Adding Mother")
                print(f"Mother Data: {bride_mother_data}")
                bride_mother_id = add_parent_if_not_exists(bride_mother_data, "MOTHER")
            else:
                bride_mother_id = parents["mother"]["id"]  

            if not parents["father"]["id"]:
                print("Adding Father")
                print(f"Father Data: {bride_father_data}")
                bride_father_id = add_parent_if_not_exists(bride_father_data, "FATHER")
            else:
                bride_father_id = parents["father"]["id"]  
        else:
            return jsonify({
                "message": "There was an error in adding Parent Information. Please Try again later.",
                "type": "error"
            }), 200

        if data.get("rec_BrideID"):
            bride_client_id = data.get("rec_BrideID")
        elif any([data.get("weddBrideFname"), data.get("weddBrideMname"), data.get("weddBrideLname"), data.get("weddBrideBirthdate")]):
            bride = check_client(
                data.get("weddBrideFname"), data.get("weddBrideMname"), data.get("weddBrideLname"), data.get("weddBrideBirthdate")
            )

            print(f"Client: {bride}")

            if bride["record"]["id"] is None:

                new_bride = Record(
                    first_name=data.get("weddBrideFname"),
                    middle_name=data.get("weddBrideMname"),
                    last_name=data.get("weddBrideLname"),
                    birthday=data.get("weddBrideBirthdate"),
                    ligitivity=data.get("BrideLigitivity"),
                    birthplace=data.get("weddBrideBirthplace"),
                    status=data.get("BrideCivilStatus"),
                    address=data.get("BrideAddressLine"),
                    region=data.get("BrideRegion"),
                    province=data.get("BrideProvince"),
                    citymun=data.get("BrideCity"),
                    brgy=data.get("BrideBarangay"),
                    mother_id=bride_mother_id,
                    father_id=bride_father_id,
                    recorded_by=current_user.id
                )
                db.session.add(new_bride)
                db.session.commit()
                bride_client_id = new_bride.id  
            else:
                bride_client_id = bride["record"]["id"]
        else:
            return jsonify({
                "message": "There was an error in adding Client Data. Please Try again later.",
                "type": "error"
            }), 200

        wedding = Wedding.query.filter(
            (Wedding.groom_record_id == groom_client_id) & (Wedding.bride_record_id == bride_client_id)
        ).first()

        if wedding is None:
            exisiting_wedding = Wedding.query.filter_by(
                rec_index=data.get("rec_index"),
                rec_book=data.get("rec_book"),
                rec_page=data.get("rec_page"),
                rec_line=data.get("rec_line")
            ).first()

            if exisiting_wedding:
                return jsonify({
                    "message": "A wedding record already exists in this Record Location!",
                    "type": "error"
                }), 200
            else:
                new_wedding = Wedding(
                    groom_record_id=groom_client_id,
                    bride_record_id=bride_client_id,
                    wedding_date=data.get("weddDate"),
                    sponsorA=data.get("sponsorA"),
                    sponsorB=data.get("sponsorB"),
                    license_number=data.get("license_number"),
                    civil_date=data.get("civil_date"),
                    civil_place=data.get("civil_place"),
                    priest_id=data.get("priest"),
                    rec_index=data.get("rec_index"),
                    rec_book=data.get("rec_book"),
                    rec_page=data.get("rec_page"),
                    rec_line=data.get("rec_line"),
                    recorded_by=current_user.id
                    )
                db.session.add(new_wedding)
                db.session.commit()

                return jsonify({
                    "message": "Wedding record submitted successfully!",
                    "type" : "success"
                }), 200
        else:
            return jsonify({
                "message": "Client has exisitng Wedding Record",
                "type" : "error"
            }), 200
    
    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        return jsonify({"error": str(e)}), 500

@api_route.route("/edit-wedding/<int:wedding_id>", methods=["PUT"])
def edit_wedding(wedding_id):
    try:
        print(f"Form request.form: {request.form}")
        
        data = request.form

        print("Received Keys:", list(data.keys()))

        wedding = Wedding.query.get(wedding_id)
        if not wedding:
            return jsonify({
                "message": "Wedding record not found.",
                "type": "error"
            }), 404
        
        duplicate_wedding = Wedding.query.filter(
            Wedding.id != wedding_id,
            Wedding.rec_index == data.get("rec_index"),
            Wedding.rec_book == data.get("rec_book"),
            Wedding.rec_page == data.get("rec_page"),
            Wedding.rec_line == data.get("rec_line")
        ).first()

        if duplicate_wedding:
            return jsonify({
                "message": "Another wedding record already exists in this Record Location!",
                "type": "error"
            }), 200

        wedding.wedding_date = data.get("weddDate", wedding.wedding_date)

        wedding.license_number = data.get("license_number", wedding.license_number)
        wedding.civil_date = data.get("civil_date", wedding.civil_date)
        wedding.civil_place = data.get("civil_place", wedding.civil_place)

        wedding.sponsorA = data.get("sponsorA", wedding.sponsorA)
        wedding.sponsorB = data.get("sponsorB", wedding.sponsorB)
        wedding.priest_id = data.get("priestEdit", wedding.priest_id)
        wedding.rec_index = data.get("rec_index", wedding.rec_index)
        wedding.rec_book = data.get("rec_book", wedding.rec_book)
        wedding.rec_page = data.get("rec_page", wedding.rec_page)
        wedding.rec_line = data.get("rec_line", wedding.rec_line)

        db.session.commit()

        return jsonify({
            "message": "Wedding record updated successfully!",
            "type": "success"
        }), 200

    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
  
@api_route.route('/delete-wedding/<int:wedd_id>', methods=['DELETE'])
def delete_wedding(wedd_id):
    try:

        print(f"Deleting Wedding record with ID: {wedd_id}")
        wedding = Wedding.query.get(wedd_id)

        if not wedding:
            return jsonify({"success": False, "message": "Record not found"}), 404

        db.session.delete(wedding)
        db.session.commit()

        return jsonify({"success": True, "message": "Record deleted successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        print("Error deleting record:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

@api_route.route("/submit-death", methods=["POST"])
def submit_death():
    try:
        print(f"Form request.form: {request.form}")
        
        data = request.form

        print("Received Keys:", list(data.keys()))

        mother_data = {
                "fname": data.get("mofname"),
                "mname": data.get("momname"),
                "lname": data.get("molname"),
                "birthdate": data.get("mobirthdate"),
                "birthplace": data.get("mobirthplace"),
                "address": data.get("moaddress")
            }

        father_data = {
            "fname": data.get("fafname"),
            "mname": data.get("famname"),
            "lname": data.get("falname"),
            "birthdate": data.get("fabirthdate"),
            "birthplace": data.get("fabirthplace"),
            "address": data.get("faaddress")
        }
        
        if data.get("rec_moID") and data.get("rec_faID"):
            mother_id = data.get("rec_moID")
            father_id = data.get("rec_faID")
        elif any(mother_data.values()) or any(father_data.values()):
            parents = check_parents(mother_data, father_data)

            print(f"Parents: {parents}")
            if not parents["mother"]["id"]:
                print("Adding Mother")
                print(f"Mother Data: {mother_data}")
                mother_id = add_parent_if_not_exists(mother_data, "MOTHER")
            else:
                mother_id = parents["mother"]["id"]  

            if not parents["father"]["id"]:
                print("Adding Father")
                print(f"Father Data: {father_data}")
                father_id = add_parent_if_not_exists(father_data, "FATHER")
            else:
                father_id = parents["father"]["id"]  
        else:
            return jsonify({
                "message": "There was an error in adding Parent Information. Please Try again later.",
                "type": "error"
            }), 200

        if data.get("rec_id"):
            client_id = data.get("rec_id")
        elif any([data.get("fname"), data.get("mname"), data.get("lname"), data.get("birthdate")]):
            client = check_client(
                data.get("fname"), data.get("mname"), data.get("lname"), data.get("birthdate")
            )

            print(f"Client: {client}")

            if client["record"]["id"] is None:
                full_address = f"{data.get("addressLine")}, {data.get("barangay")}, {data.get("cityMun")}, {data.get("province")}, {data.get("region")}"

                print(f"Full Address: {full_address}")

                new_client = Record(
                    first_name=data.get("fname"),
                    middle_name=data.get("mname"),
                    last_name=data.get("lname"),
                    birthday=data.get("birthdate"),
                    ligitivity=data.get("ligitivity"),
                    birthplace=data.get("birthplace"),
                    status=data.get("civilStatus"),
                    address=data.get("addressLine"),
                    region=data.get("region"),
                    province=data.get("province"),
                    citymun=data.get("cityMun"),
                    brgy=data.get("barangay"),
                    mother_id=mother_id,
                    father_id=father_id,
                    recorded_by=current_user.id
                )
                db.session.add(new_client)
                db.session.commit()
                client_id = new_client.id  
            else:
                client_id = client["record"]["id"]
        else:
            return jsonify({
                "message": "There was an error in adding Client Data. Please Try again later.",
                "type": "error"
            }), 200

        death = Death.query.filter(Death.record_id == client_id).first()

        if death is None:
            existing_death = Death.query.filter_by(
                rec_index=data.get("rec_index"),
                rec_book=data.get("rec_book"),
                rec_page=data.get("rec_page"),
                rec_line=data.get("rec_line")
            ).first()

            if existing_death:
                return jsonify({
                    "message": "A death record already exists in this Record Location!",
                    "type": "error"
                }), 200
            else:
                new_death = Death(
                    record_id=client_id,
                    death_date=data.get("deathDate"),
                    burial_date=data.get("burialDate"),
                    contact_person=data.get("contact_person"),
                    cp_address=data.get("cp_address"),
                    cause_of_death=data.get("cause_death"),
                    burial_place=data.get("burialPlace"),
                    priest_id=data.get("priest"),
                    rec_index=data.get("rec_index"),
                    rec_book=data.get("rec_book"),
                    rec_page=data.get("rec_page"),
                    rec_line=data.get("rec_line"),
                    recorded_by=current_user.id
                    )
                db.session.add(new_death)
                db.session.commit()

                return jsonify({
                    "message": "Death record submitted successfully!",
                    "type" : "success"
                }), 200
        else:
            return jsonify({
                "message": "Client has exisitng Death Record",
                "type" : "error"
            }), 200
    
    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        return jsonify({"error": str(e)}), 500

@api_route.route("/edit-death/<int:death_id>", methods=["PUT"])
def edit_death(death_id):
    try:
        print(f"Form request.form: {request.form}")
        
        data = request.form

        print("Received Keys:", list(data.keys()))

        death = Death.query.get(death_id)
        if not death:
            return jsonify({
                "message": "Death record not found.",
                "type": "error"
            }), 404
        
        duplicate_death = Death.query.filter(
            Death.id != death_id,
            Death.rec_index == data.get("rec_index"),
            Death.rec_book == data.get("rec_book"),
            Death.rec_page == data.get("rec_page"),
            Death.rec_line == data.get("rec_line")
        ).first()

        if duplicate_death:
            return jsonify({
                "message": "Another death record already exists in this Record Location!",
                "type": "error"
            }), 200

        death.death_date = data.get("deathDate", death.death_date)

        death.burial_date = data.get("burialDate", death.burial_date)
        death.contact_person = data.get("contact_person", death.contact_person)
        death.cp_address = data.get("cp_address", death.cp_address)
        death.cause_of_death = data.get("cause_death", death.cause_of_death)
        death.burial_place = data.get("burialPlace", death.burial_place)

        death.priest_id = data.get("priestEdit", death.priest_id)
        death.rec_index = data.get("rec_index", death.rec_index)
        death.rec_book = data.get("rec_book", death.rec_book)
        death.rec_page = data.get("rec_page", death.rec_page)
        death.rec_line = data.get("rec_line", death.rec_line)

        db.session.commit()

        return jsonify({
            "message": "Wedding record updated successfully!",
            "type": "success"
        }), 200

    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
  
@api_route.route('/delete-death/<int:death_id>', methods=['DELETE'])
def delete_death(death_id):
    try:

        print(f"Deleting Death record with ID: {death_id}")
        death = Death.query.get(death_id)

        if not death:
            return jsonify({"success": False, "message": "Record not found"}), 404

        db.session.delete(death)
        db.session.commit()

        return jsonify({"success": True, "message": "Record deleted successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        print("Error deleting record:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500
  
@api_route.route("/submit-priest", methods=["POST"])
def submit_priest():
    try:
        print(f"Form request.form: {request.form}")
        
        data = request.form

        print("Received Keys:", list(data.keys()))

        priest_name = data.get("name")

        if "Father " not in priest_name and "Fr. " not in priest_name:
            priest_name = f"Fr. {priest_name}"  


        priest = Priest.query.filter(
            Priest.name.ilike(priest_name)
        ).first()

        if priest is None:
            new_priest = Priest(
                name=priest_name,
                status=data.get("status"),
                church=data.get("church"),
                position=data.get("position"),
                recorded_by=current_user.id
                )
            db.session.add(new_priest)
            db.session.commit()

            return jsonify({
                "message": "Priest Added Successfully!",
                "type" : "success"
            }), 200
        else:
            return jsonify({
                "message": "Priest has an exisitng record.",
                "type" : "error"
            }), 200
    
    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@api_route.route('/edit-priest/<int:priest_id>', methods=['PUT'])
def edit_priest(priest_id):
    data = request.form or request.json
    priest = Priest.query.get(priest_id)
    if not priest:
        return jsonify({'error': 'Priest not found'}), 404
    
    priest_name = data.get("name")
    
    if "Father " not in priest_name and "Fr. " not in priest_name:
            priest_name = f"Fr. {priest_name}"  

    duplicate = Priest.query.filter(
        Priest.id != priest_id,
        Priest.name == priest_name
    ).first()

    if duplicate:
        return jsonify({
            "error": "A priest with the same details already exists."
        }), 400


    priest.name = priest_name
    priest.position = data.get('position', priest.position)
    priest.status = data.get('status', priest.status)
    priest.church = data.get('church', priest.church)  

    try:
        db.session.commit()
        return jsonify({
                "message": "Priest updated Successfully!",
                "type" : "success"
            }), 200

    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@api_route.route('/delete-priest/<int:priest_id>', methods=['DELETE'])
def delete_priest(priest_id):
    try:

        print(f"Deleting Priest with ID: {priest_id}")
        priest = Priest.query.get(priest_id)

        if not priest:
            return jsonify({"success": False, "message": "Priest not found"}), 404

        db.session.delete(priest)
        db.session.commit()

        return jsonify({"success": True, "message": "Priest deleted successfully"}), 200
    
    except IntegrityError:
        db.session.rollback()  
        return jsonify({
            "message": "Priest has an existing recorded ceremony and cannot be deleted.",
            "type": "error"
        }), 400 

    except Exception as e:
        db.session.rollback()
        print("Error deleting priest:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

@api_route.route("/submit-schedule", methods=["POST"])
def submit_event():
    try:
        print(f"Form request.form: {request.form}")
        
        data = request.form

        print("Received Keys:", list(data.keys()))

        title = data.get("eventTitle")
        start_date = data.get("eventStart")
        end_date = data.get("eventEnd")
        category = data.get("eventCategory")
        status = data.get("eventStatus")
        description = data.get("eventDescription")

        if not title or not start_date or not end_date or not category or not status:
            return jsonify({"message": "Missing required fields", "type": "error"}), 400
        
        start_datetime = datetime.fromisoformat(start_date)
        end_datetime = datetime.fromisoformat(end_date)

        existing_event = Schedule.query.filter_by(title=title, start_date=start_datetime, end_date=end_datetime).first()

        if existing_event:
            return jsonify({
                "message": "Event already exists.",
                "type": "error"
            }), 200
        
        new_event = Schedule(
            title=title,
            start_date=start_datetime,
            end_date=end_datetime,
            category=category,
            status=status,
            description=description,
            recorded_by=current_user.id  
        )

        db.session.add(new_event)
        db.session.commit()

        return jsonify({
            "message": "Event Added Successfully!",
            "type": "success"
        }), 200

    except Exception as e:
        db.session.rollback() 
        print("ERROR OCCURRED:", str(e))
        return jsonify({"error": str(e)}), 500

@api_route.route('/edit-schedule/<int:schedId>', methods=['PUT'])
def edit_event(schedId):
    data = request.form or request.json
    schedule = Schedule.query.get(schedId)

    if not schedule:
        return jsonify({'error': 'Schedule not found'}), 404

    schedule.title = data.get('eventTitleEdit', schedule.title)
    schedule.start_date = data.get('eventStartEdit', schedule.start_date)
    schedule.end_date = data.get('eventEndEdit', schedule.end_date)
    schedule.category = data.get('eventCategoryEdit', schedule.category)
    schedule.status = data.get('eventStatusEdit', schedule.status)
    schedule.description = data.get('eventDescriptionEdit', schedule.description)

    print("Data from edit:", data)
    print("Data from db:", schedule)

    try:
        db.session.commit()
        return jsonify({
                "message": "Schedule updated Successfully!",
                "type" : "success"
            }), 200

    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@api_route.route('/delete-schedule/<int:schedId>', methods=['DELETE'])
def delete_event(schedId):
    try:

        print(f"Deleting Schedule with ID: {schedId}")
        schedule = Schedule.query.get(schedId)

        if not schedule:
            return jsonify({"success": False, "message": "Schedule not found"}), 404

        db.session.delete(schedule)
        db.session.commit()

        return jsonify({"success": True, "message": "Schedule deleted successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        print("Error deleting schedule:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

@api_route.route('/update-request-status/<int:request_id>', methods=['POST'])
def edit_req_status(request_id):
    data = request.get_json()
    new_status = data.get('status')
    
    req = Request.query.get_or_404(request_id)
    try:
        req.status = RequestStatus[new_status]
        db.session.commit()
        return jsonify({
                "message": "Request updated Successfully!",
                "type" : "success"
            }), 200
    

    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@api_route.route("/submit-request", methods=["POST"])
def submit_request():
    try:
        print(f"Form request.form: {request.form}")
        data = request.form

        print("Received Keys:", list(data.keys()))

        ceremony = data.get("ceremony", )
        rec_name = " ".join(filter(None, [
            data.get("recFirstName", "").strip(),
            data.get("recMiddleName", "").strip(),
            data.get("recLastName", "").strip()
        ]))

        relationship = data.get("relationship")
        status = data.get("status")
        remarks = data.get("remarks")
        pickup_date = data.get("pickup_date") or None

        print("\n\nInformation From the form: ", rec_name)

        cer_year = int(data.get("cer_year")) if data.get("cer_year") else None
        cer_month = int(data.get("cer_month")) if data.get("cer_month") else None
        cer_day = int(data.get("cer_day")) if data.get("cer_day") else None

        cer_date = None
        if cer_year and cer_month and cer_day:
            try:
                cer_date = date(cer_year, cer_month, cer_day)
            except ValueError:
                pass 

        new_request = Request(
            user_id=current_user.id,
            ceremony=ceremony,
            rec_name=rec_name,
            cer_year=cer_year,
            cer_month=cer_month,
            cer_day=cer_day,
            relationship=relationship,
            status=status,
            remarks=remarks,
            pickup_date=pickup_date or None 
        )

        db.session.add(new_request)
        db.session.commit()

        return jsonify({
                "message": "Request made Successfully!",
                "type" : "success"
            }), 200

        return jsonify({"success": True, "message": "Request submitted successfully."})

    except Exception as e:
        db.session.rollback()
        print("ERROR OCCURRED:", str(e))  
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
 
@api_route.route("/check-avail-dates")
def get_full_pickup_dates():
    results = (
        db.session.query(Request.pickup_date, func.count(Request.id).label('count'))
        .group_by(Request.pickup_date)
        .having(func.count(Request.id) >= 3)
        .all()
    )
    
    full_dates = [r.pickup_date.isoformat() for r in results]
    
    return jsonify(full_dates)

@api_route.route('/delete-request/<int:reqId>', methods=['DELETE'])
def delete_request(reqId):
    try:

        print(f"Deleting Request with ID: {reqId}")
        request = Request.query.get(reqId)

        if not request:
            return jsonify({"success": False, "message": "Request not found"}), 404

        db.session.delete(request)
        db.session.commit()

        return jsonify({"success": True, "message": "Request deleted successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        print("Error deleting schedule:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

@api_route.route('/edit-clientReq', methods=['POST'])
def update_request_status():
    print("EDITING CLIENT STATUS AS cancelled")
    data = request.json
    record_id = data.get('id')
    new_status = data.get('status')

    request_obj = Request.query.get(record_id)
    if request_obj:
        request_obj.status = new_status
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'error': 'Not found'}), 404
