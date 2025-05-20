document.addEventListener('click', function(e) {
    const editButton = e.target.closest('button[class*="edit-btn-"]');
    
    if (editButton) {
        const id = editButton.dataset.id;
        const category = [...editButton.classList]
            .find(c => c.startsWith('edit-btn-'))
            .replace('edit-btn-', '');
        
        handleEdit(category, id);
    }
});

function handleEdit(category, id) {
    let url, formSelector, modalSelector, fieldMap = null;  // Initialize fieldMap to null

    switch (category) {
        case 'priest':
            url = `/api_db/priest/view/${id}`;
            formSelector = '#priestEditForm';
            modalSelector = '#editPriestModal';
            break;
        case 'baptism':
            url = `/api_db/baptism/view/${id}`;
            formSelector = '#baptismEditForm';
            modalSelector = '#editBaptismModal';
            fieldMap = {
                'id': 'id',
                'baptDate': 'baptism_date',
                'priestEdit': 'priest.id',
                'sponsorA': 'sponsorA',
                'residenceA': 'residenceA',
                'sponsorB': 'sponsorB',
                'residenceB': 'residenceB',
                'rec_index': 'rec_index',
                'rec_book': 'rec_book',
                'rec_page': 'rec_page',
                'rec_line': 'rec_line'
            };       
            break;
        case 'confirmation':
            url = `/api_db/confirmation/view/${id}`;
            formSelector = '#confirmationEditForm';
            modalSelector = '#editConfirmationModal';
            fieldMap = {
                'id': 'id',
                'confDate': 'confirmation_date',
                'church_baptized': 'church_baptized',
                'priestEdit': 'priest.id',
                'sponsorA': 'sponsorA',
                'sponsorB': 'sponsorB',
                'rec_index': 'rec_index',
                'rec_book': 'rec_book',
                'rec_page': 'rec_page',
                'rec_line': 'rec_line'
            };  
            break;
        case 'wedding':
            url = `/api_db/wedding/view/${id}`;
            formSelector = '#weddingEditForm';
            modalSelector = '#editWeddingModal';
            fieldMap = {
                'id': 'id',
                'weddDate': 'wedding_date',
                'priestEdit': 'priest.id',
                'sponsorA': 'sponsorA',
                'sponsorB': 'sponsorB',
                'license_number': 'license_number',
                'civil_date': 'civil_date',
                'civil_place': 'civil_place',
                'rec_index': 'rec_index',
                'rec_book': 'rec_book',
                'rec_page': 'rec_page',
                'rec_line': 'rec_line'
            };  
            break;
        case 'death':
            url = `/api_db/death/view/${id}`;
            formSelector = '#deathEditForm';
            modalSelector = '#editDeathModal';
            fieldMap = {
                'id': 'id',
                'deathDate': 'death_date',
                'priestEdit': 'priest.id',
                'burialDate': 'burial_date',
                'contact_person': 'contact_person',
                'cp_address': 'cp_address',
                'cause_death': 'cause_of_death',
                'burialPlace': 'burial_place',
                'rec_index': 'rec_index',
                'rec_book': 'rec_book',
                'rec_page': 'rec_page',
                'rec_line': 'rec_line'
            };  
            break;
        case 'record':
            url = `/api_db/record/view/${id}`;
            formSelector = '#recordEditForm';
            modalSelector = '#editRecordModal';
            fieldMap = {
                'rec_id': 'id',
                'fname': 'first_name',
                'mname': 'middle_name',
                'lname': 'last_name',
                'birthdate': 'birthday',
                'ligitivity': 'ligitivity',
                'birthplace': 'birthplace',
                'civilStatus': 'status',
                'addressLine': 'address',
                'region': 'region.id',
                'province': 'province.id',
                'city': 'citymun.id',
                'barangay': 'brgy.id',
                'rec_moID': 'mother.id',
                'mofname': 'mother.first_name',
                'momname': 'mother.middle_name',
                'molname': 'mother.last_name',
                'mobirthdate': 'mother.birthday',
                'mobirthplace': 'mother.birthplace',
                'moaddress': 'mother.address',
                'rec_faID': 'father.id',
                'fafname': 'father.first_name',
                'famname': 'father.middle_name',
                'falname': 'father.last_name',
                'fabirthdate': 'father.birthday',
                'fabirthplace': 'father.birthplace',
                'faaddress': 'father.address'
            };  
            break;
    
        default:
            console.warn(`Unknown category: ${category}`);
            return;
    }

    fetch(url)
        .then(res => res.json())
        .then(response => {
            const data = response.data[0];  
            console.log('Data received:', data);
            populateForm(formSelector, data, fieldMap);  
            $(modalSelector).modal("show");
        })
        .catch(err => {
            console.error(`Failed to load ${category} data:`, err);
        });
}

function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => acc && acc[key] ? acc[key] : undefined, obj);
}

function populateForm(formSelector, data, fieldMap = null) {
    const form = document.querySelector(formSelector);
    console.log('Populating form with data:', data, "Form:", form);

    if (!form) return;

    if (fieldMap) {
        console.log('FieldMap provided.');
        Object.keys(fieldMap).forEach(inputName => {
            const field = form.querySelector(`[name="${inputName}"]`);
            const dataKey = fieldMap[inputName];

            console.log('Processing Field:', field, 'Input Name:', inputName, 'Data Key:', dataKey);

            if (field) {
                const value = getNestedValue(data, dataKey); 

                if (value !== undefined) {
                    console.log('Field found:', field, 'Data Key:', dataKey, 'Data Value:', value);

                    if (field.type === 'radio') {
                        console.log('Field is a RADIO button.');
                        document.querySelectorAll(`[name="${inputName}"]`).forEach(radio => {
                            if (radio.value == value) {
                                radio.checked = true;
                            }
                        });
                    } else if (field.tagName === 'SELECT') {
                        console.log('Field is a SELECT element.');
                        const options = field.querySelectorAll('option');
                        options.forEach(option => {
                            if (option.value == value) { 
                                option.selected = true;
                            }
                        });
                    } else {
                        field.value = value;
                    }
        
                }

                if ($(field).hasClass("datepicker")) {
                    console.log('This is the value:', value, 'Field:', field);

                    $(field).datepicker("update", value); 
                }

                if ($(field).is("#region")) {
                    const regionId = getNestedValue(data, "region.id");
                    const provinceId = getNestedValue(data, "province.id");
                    const citymunId = getNestedValue(data, "citymun.id");
                    const barangayId = getNestedValue(data, "brgy.id");

                    console.log("Extracted IDs:", { regionId, provinceId, citymunId, barangayId });

                    fetch(`/api_db/get-provinces/${regionId}`)
                        .then(response => response.json())
                        .then(provinces => {
                            $(".province-dropdown").empty().append('<option value="">Select Province</option>');
                            provinces.forEach(province => {
                                $(".province-dropdown").append(`<option value="${province.id}">${province.province_name}</option>`);
                            });

                            $(".province-dropdown").val(provinceId).trigger("change");
                        });

                    fetch(`/api_db/get-cities/${provinceId}`)
                        .then(response => response.json())
                        .then(cities => {
                            $(".city-dropdown").empty().append('<option value="">Select City</option>');
                            cities.forEach(city => {
                                $(".city-dropdown").append(`<option value="${city.id}">${city.city_name}</option>`);
                            });

                            $(".city-dropdown").val(citymunId).trigger("change");
                        });

                    fetch(`/api_db/get-barangays/${citymunId}`)
                        .then(response => response.json())
                        .then(barangays => {
                            $(".barangay-dropdown").empty().append('<option value="">Select Barangay</option>');
                            barangays.forEach(barangay => {
                                $(".barangay-dropdown").append(`<option value="${barangay.id}">${barangay.barangay_name}</option>`);
                            });

                            $(".barangay-dropdown").val(barangayId);
                        });
                }
            }
        });
    } else {
        console.log('No fieldMap provided, populating directly from data object.');
        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.tagName === 'SELECT') {
                    const options = field.querySelectorAll('option');
                    options.forEach(option => {
                        console.log('Option Value:', option.value, 'Expected Value:', data[key]);
                        if (option.value == data[key]) {
                            option.selected = true;
                        }
                    });
                } else {
                    field.value = data[key];
                }
                if ($(field).hasClass("datepicker")) {
                    console.log("Updating datepicker:", field.name, "with value:", data[key]);
                    $(field).datepicker("update", data[key]);
                }

            }
        });
    }
}


$(document).ready(function () {
    $("#priestEditForm").on("submit", function (event) {
        event.preventDefault();
        
        let isValid = true; 
        let missingFields = []; 
    
        // Check if all required fields are filled
        $(this).find("[required]").each(function () {
            let value = $(this).val();
            
            if (!value || value.trim() === "") { 
                isValid = false;
                missingFields.push($(this).attr("name"));
                $(this).addClass("error-highlight");
            } else {
                $(this).removeClass("error-highlight");
            }
        });
        
        // If validation fails, show a warning
        if (!isValid) {
            event.preventDefault(); 
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }
    
        // Serialize the form data for submission
        let formData = $(this).serialize();
        console.log("Data being sent:", formData); 

        const priestId = $("#id").val();
    
        // Send the data via AJAX to edit the priest record
        $.ajax({
            type: "PUT",
            url: `/edit-priest/${priestId}`, 
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
    
                if (response.message && response.type) {
                    toastr[response.type](response.message); 
    
                    if (response.type === "success") {
                        
                        $("#editPriestModal").modal("hide");
    
                        $('#priestTable').DataTable().ajax.reload(null, false);
                    } 
                } else {
                    toastr.error("Unexpected response format!");
                }
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "An error occurred while editing the priest record.";
                toastr.error(errorMessage);
            }
        });
    });

    $("#recordEditForm").on("submit", function (event) {
        event.preventDefault();
        
        let isValid = true; 
        let missingFields = []; 
    
        $(this).find("[required]").each(function () {
            let value = $(this).val();
            
            if (!value || value.trim() === "") { 
                isValid = false;
                missingFields.push($(this).attr("name"));
                $(this).addClass("error-highlight");
            } else {
                $(this).removeClass("error-highlight");
            }
        });
        
        // If validation fails, show a warning
        if (!isValid) {
            event.preventDefault(); 
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }
    
        // Serialize the form data for submission
        let formData = $(this).serialize();
        console.log("Data being sent:", formData); 

        const recordId = $("#rec_id").val();
    
        // Send the data via AJAX to edit the priest record
        $.ajax({
            type: "PUT",
            url: `/edit-record/${recordId}`, 
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
    
                if (response.message && response.type) {
                    toastr[response.type](response.message); 
    
                    if (response.type === "success") {
                        
                        $("#editRecordModal").modal("hide");
    
                        $('#recordTable').DataTable().ajax.reload(null, false);
                    } 
                } else {
                    toastr.error("Unexpected response format!");
                }
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "An error occurred while editing the baptism record.";
                toastr.error(errorMessage);
            }
        });
    });

    $("#baptismEditForm").on("submit", function (event) {
        event.preventDefault();
        
        let isValid = true; 
        let missingFields = []; 
    
        // Check if all required fields are filled
        $(this).find("[required]").each(function () {
            let value = $(this).val();
            
            if (!value || value.trim() === "") { 
                isValid = false;
                missingFields.push($(this).attr("name"));
                $(this).addClass("error-highlight");
            } else {
                $(this).removeClass("error-highlight");
            }
        });
        
        // If validation fails, show a warning
        if (!isValid) {
            event.preventDefault(); 
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }
    
        // Serialize the form data for submission
        let formData = $(this).serialize();
        console.log("Data being sent:", formData); 

        const baptismId = $("#id").val();
    
        // Send the data via AJAX to edit the priest record
        $.ajax({
            type: "PUT",
            url: `/edit-baptism/${baptismId}`, 
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
    
                if (response.message && response.type) {
                    toastr[response.type](response.message); 
    
                    if (response.type === "success") {
                        
                        $("#editBaptismModal").modal("hide");
    
                        $('#baptismTable').DataTable().ajax.reload(null, false);
                    } 
                } else {
                    toastr.error("Unexpected response format!");
                }
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "An error occurred while editing the baptism record.";
                toastr.error(errorMessage);
            }
        });
    });

    $("#confirmationEditForm").on("submit", function (event) {
        event.preventDefault();
        
        let isValid = true; 
        let missingFields = []; 
    
        // Check if all required fields are filled
        $(this).find("[required]").each(function () {
            let value = $(this).val();
            
            if (!value || value.trim() === "") { 
                isValid = false;
                missingFields.push($(this).attr("name"));
                $(this).addClass("error-highlight");
            } else {
                $(this).removeClass("error-highlight");
            }
        });
        
        // If validation fails, show a warning
        if (!isValid) {
            event.preventDefault(); 
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }
    
        // Serialize the form data for submission
        let formData = $(this).serialize();
        console.log("Data being sent:", formData); 

        const confirmationId = $("#id").val();
    
        // Send the data via AJAX to edit the priest record
        $.ajax({
            type: "PUT",
            url: `/edit-confirmation/${confirmationId}`, 
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
    
                if (response.message && response.type) {
                    toastr[response.type](response.message); 
    
                    if (response.type === "success") {
                        
                        $("#editConfirmationModal").modal("hide");
    
                        $('#confirmationTable').DataTable().ajax.reload(null, false);
                    } 
                } else {
                    toastr.error("Unexpected response format!");
                }
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "An error occurred while editing the confirmation record.";
                toastr.error(errorMessage);
            }
        });
    });

    $("#weddingEditForm").on("submit", function (event) {
        event.preventDefault();
        
        let isValid = true; 
        let missingFields = []; 
    
        // Check if all required fields are filled
        $(this).find("[required]").each(function () {
            let value = $(this).val();
            
            if (!value || value.trim() === "") { 
                isValid = false;
                missingFields.push($(this).attr("name"));
                $(this).addClass("error-highlight");
            } else {
                $(this).removeClass("error-highlight");
            }
        });
        
        // If validation fails, show a warning
        if (!isValid) {
            event.preventDefault(); 
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }
    
        // Serialize the form data for submission
        let formData = $(this).serialize();
        console.log("Data being sent:", formData); 

        const weddingId = $("#id").val();
    
        // Send the data via AJAX to edit the priest record
        $.ajax({
            type: "PUT",
            url: `/edit-wedding/${weddingId}`, 
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
    
                if (response.message && response.type) {
                    toastr[response.type](response.message); 
    
                    if (response.type === "success") {
                        
                        $("#editWeddingModal").modal("hide");
    
                        $('#weddingTable').DataTable().ajax.reload(null, false);
                    } 
                } else {
                    toastr.error("Unexpected response format!");
                }
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "An error occurred while editing the wedding record.";
                toastr.error(errorMessage);
            }
        });
    });
    
    $("#deathEditForm").on("submit", function (event) {
        event.preventDefault();
        
        let isValid = true; 
        let missingFields = []; 
    
        // Check if all required fields are filled
        $(this).find("[required]").each(function () {
            let value = $(this).val();
            
            if (!value || value.trim() === "") { 
                isValid = false;
                missingFields.push($(this).attr("name"));
                $(this).addClass("error-highlight");
            } else {
                $(this).removeClass("error-highlight");
            }
        });
        
        // If validation fails, show a warning
        if (!isValid) {
            event.preventDefault(); 
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }
    
        // Serialize the form data for submission
        let formData = $(this).serialize();
        console.log("Data being sent:", formData); 

        const deathId = $("#id").val();
    
        // Send the data via AJAX to edit the priest record
        $.ajax({
            type: "PUT",
            url: `/edit-death/${deathId}`, 
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
    
                if (response.message && response.type) {
                    toastr[response.type](response.message); 
    
                    if (response.type === "success") {
                        
                        $("#editDeathModal").modal("hide");
    
                        $('#deathTable').DataTable().ajax.reload(null, false);
                    } 
                } else {
                    toastr.error("Unexpected response format!");
                }
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "An error occurred while editing the death record.";
                toastr.error(errorMessage);
            }
        });
    });

});