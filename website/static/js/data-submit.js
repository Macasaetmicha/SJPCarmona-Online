$(document).ready(function () {
    // Check if Client Record exists
    $("#checkRecBtn").on("click", function () {
        let formData = {
            fname: $("#fname").val(),
            mname: $("#mname").val(),
            lname: $("#lname").val(),
            birthdate: $("#birthdate").val()
        };

        if (!formData.fname && !formData.mname && !formData.lname && !formData.birthdate) {
            toastr.warning("Please enter information before checking the record.");
            return; 
        }    

        $.ajax({
            type: "POST",
            url: "/check_record",
            data: formData,
            success: function (response) {
                if (response.exists) {
                    toastr.success("Record found! Auto-filling form...");

                    console.log(response)
                    // Auto-fill client details
                    $("#rec_id").val(response.client.id);
                    $("#rec_moID").val(response.parents.mother.id);
                    $("#rec_faID").val(response.parents.father.id);
                    $(`input[name='ligitivity'][value='${response.client.ligitivity}']`).prop("checked", true);
                    $("input[name='ligitivity']").prop("disabled", true);
                    $("#birthplace").val(response.client.birthplace).prop("disabled", true);
                    $(".birthplace").addClass("readOnly");
                    $("#civilStatus").val(response.client.status).prop("disabled", true);
                    $("#region").val(response.client.region).trigger("change").prop("disabled", true);

                    fetch(`/api_db/get-provinces/${response.client.region}`)
                        .then(response => response.json())
                        .then(data => {
                            // Populate dropdown
                            data.forEach(province => {
                                const option = document.createElement("option");
                                option.value = province.id;
                                option.textContent = province.province_name;
                                $("#province").append(option);
                            });

                            // Autofill province after data is loaded
                            $("#province").val(response.client.province).trigger("change").prop("disabled", true);
                        });

                    fetch(`/api_db/get-cities/${response.client.province}`)
                        .then(response => response.json())
                        .then(data => {
                            data.forEach(city => {
                                const option = document.createElement("option");
                                option.value = city.id;
                                option.textContent = city.city_name;
                                $("#city").append(option);
                            });

                            $("#city").val(response.client.citymun).trigger("change").prop("disabled", true);
                        });

                    fetch(`/api_db/get-barangays/${response.client.citymun}`)
                        .then(response => response.json())
                        .then(data => {
                            data.forEach(barangay => {
                                const option = document.createElement("option");
                                option.value = barangay.id;
                                option.textContent = barangay.barangay_name;
                                $("#barangay").append(option);
                            });

                            $("#barangay").val(response.client.brgy).prop("disabled", true);
                        });
                    $("#addressLine").val(response.client.address).prop("disabled", true);
                    $(".addressLine").addClass("readOnly");

                    // Auto-fill mother details if available
                    if (response.parents.mother) {
                        $("#mofname").val(response.parents.mother.first_name).prop("disabled", true);                        ;
                        $(".mofname").addClass("readOnly");
                        $("#momname").val(response.parents.mother.middle_name).prop("disabled", true);
                        $(".momname").addClass("readOnly");
                        $("#molname").val(response.parents.mother.last_name).prop("disabled", true);
                        $(".molname").addClass("readOnly");
                        $("#mobirthdate").val(formatDate(response.parents.mother.birthday)).prop("disabled", true);
                        $(".mobirthdate").addClass("readOnly");
                        $("#mobirthplace").val(response.parents.mother.birthplace).prop("disabled", true);
                        $(".mobirthplace").addClass("readOnly");
                        $("#moaddress").val(response.parents.mother.address).prop("disabled", true);
                        $(".moaddress").addClass("readOnly");
                    }

                    // Auto-fill father details if available
                    if (response.parents.father) {
                        $("#fafname").val(response.parents.father.first_name).prop("disabled", true);
                        $(".fafname").addClass("readOnly");
                        $("#famname").val(response.parents.father.middle_name).prop("disabled", true);
                        $(".famname").addClass("readOnly");
                        $("#falname").val(response.parents.father.last_name).prop("disabled", true);
                        $(".falname").addClass("readOnly");
                        $("#fabirthdate").val(formatDate(response.parents.father.birthday)).prop("disabled", true);
                        $(".fabirthdate").addClass("readOnly");
                        $("#fabirthplace").val(response.parents.father.birthplace).prop("disabled", true);
                        $(".fabirthplace").addClass("readOnly");
                        $("#faaddress").val(response.parents.father.address).prop("disabled", true);
                        $(".faaddress").addClass("readOnly");
                    }

                } else {
                    toastr[response.type](response.message); 

                    $("input[name='ligitivity']").prop("disabled", false).prop("checked", false);
                    $("#birthplace").prop("disabled", false).removeClass("readOnly").val("");
                    $("#civilStatus").prop("disabled", false).val("");
                    $("#region").prop("disabled", false).val("");
                    $("#province").prop("disabled", false).val("");
                    $("#city").prop("disabled", false).val("");
                    $("#barangay").prop("disabled", false).val("");
                    $("#addressLine").prop("disabled", false).removeClass("readOnly").val("");

                    $("#mofname, #momname, #molname, #mobirthdate, #mobirthplace, #moaddress").prop("disabled", false).removeClass("readOnly").val("");
                    $("#fafname, #famname, #falname, #fabirthdate, #fabirthplace, #faaddress").prop("disabled", false).removeClass("readOnly").val("");
                }
            },
            error: function (error) {
                toastr.warning("Something went wrong, please try again.");
                console.error("Error checking record:", error);
            }
        });
    });

    $("#checkRecBtnWeddGroom").on("click", function () {
        let formData = {
            fname: $("#weddGroomFname").val(),
            mname: $("#weddGroomMname").val(),
            lname: $("#weddGroomLname").val(),
            birthdate: $("#weddGroomBirthdate").val()
        };

        if (!formData.fname && !formData.mname && !formData.lname && !formData.birthdate) {
            toastr.warning("Please enter information before checking the record.");
            return; 
        }    

        $.ajax({
            type: "POST",
            url: "/check_record",
            data: formData,
            success: function (response) {
                if (response.exists) {
                    toastr.success("Record found! Auto-filling form...");

                    console.log(response)
                    // Auto-fill client details
                    $("#rec_GroomID").val(response.client.id);
                    $("#rec_GroomMoID").val(response.parents.mother.id);
                    $("#rec_GroomFaID").val(response.parents.father.id);
                    $(`input[name='GroomLigitivity'][value='${response.client.ligitivity}']`).prop("checked", true);
                    $("input[name='GroomLigitivity']").prop("disabled", true);
                    $("#weddGroomBirthplace").val(response.client.birthplace).prop("disabled", true);
                    $(".weddGroomBirthplace").addClass("readOnly");
                    $("#GroomCivilStatus").val(response.client.status).prop("disabled", true);
                    $("#GroomRegion").val(response.client.region).trigger("change").prop("disabled", true);

                    fetch(`/api_db/get-provinces/${response.client.region}`)
                        .then(response => response.json())
                        .then(data => {
                            // Populate dropdown
                            data.forEach(province => {
                                const option = document.createElement("option");
                                option.value = province.id;
                                option.textContent = province.province_name;
                                $("#GroomProvince").append(option);
                            });

                            // Autofill province after data is loaded
                            $("#GroomProvince").val(response.client.province).trigger("change").prop("disabled", true);
                        });

                    fetch(`/api_db/get-cities/${response.client.province}`)
                        .then(response => response.json())
                        .then(data => {
                            data.forEach(city => {
                                const option = document.createElement("option");
                                option.value = city.id;
                                option.textContent = city.city_name;
                                $("#GroomCity").append(option);
                            });

                            $("#GroomCity").val(response.client.citymun).trigger("change").prop("disabled", true);
                        });

                    fetch(`/api_db/get-barangays/${response.client.citymun}`)
                        .then(response => response.json())
                        .then(data => {
                            data.forEach(barangay => {
                                const option = document.createElement("option");
                                option.value = barangay.id;
                                option.textContent = barangay.barangay_name;
                                $("#GroomBarangay").append(option);
                            });

                            $("#GroomBarangay").val(response.client.brgy).prop("disabled", true);
                        });
                    $("#GroomAddressLine").val(response.client.address).prop("disabled", true);
                    $(".addressLinGroomAddressLinee").addClass("readOnly");

                    // Auto-fill mother details if available
                    if (response.parents.mother) {
                        $("#GroomMoFname").val(response.parents.mother.first_name).prop("disabled", true);                        ;
                        $(".GroomMoFname").addClass("readOnly");
                        $("#GroomMoMname").val(response.parents.mother.middle_name).prop("disabled", true);
                        $(".GroomMoMname").addClass("readOnly");
                        $("#GroomMoLname").val(response.parents.mother.last_name).prop("disabled", true);
                        $(".GroomMoLname").addClass("readOnly");
                        $("#GroomMoBirthdate").val(formatDate(response.parents.mother.birthday)).prop("disabled", true);
                        $(".GroomMoBirthdate").addClass("readOnly");
                        $("#GroomMoBirthplace").val(response.parents.mother.birthplace).prop("disabled", true);
                        $(".GroomMoBirthplace").addClass("readOnly");
                        $("#GroomMoAddress").val(response.parents.mother.address).prop("disabled", true);
                        $(".GroomMoAddress").addClass("readOnly");
                    }

                    // Auto-fill father details if available
                    if (response.parents.father) {
                        $("#GroomFaFname").val(response.parents.father.first_name).prop("disabled", true);
                        $(".GroomFaFname").addClass("readOnly");
                        $("#GroomFaMname").val(response.parents.father.middle_name).prop("disabled", true);
                        $(".GroomFaMname").addClass("readOnly");
                        $("#GroomFaLname").val(response.parents.father.last_name).prop("disabled", true);
                        $(".GroomFaLname").addClass("readOnly");
                        $("#GroomFaBirthdate").val(formatDate(response.parents.father.birthday)).prop("disabled", true);
                        $(".GroomFaBirthdate").addClass("readOnly");
                        $("#GroomFaBirthplace").val(response.parents.father.birthplace).prop("disabled", true);
                        $(".GroomFaBirthplace").addClass("readOnly");
                        $("#GroomFaAddress").val(response.parents.father.address).prop("disabled", true);
                        $(".GroomFaAddress").addClass("readOnly");
                    }

                } else {
                    toastr[response.type](response.message); 

                    $("input[name='GroomLigitivity']").prop("disabled", false).prop("checked", false);
                    $("#weddGroomBirthplace").prop("disabled", false).removeClass("readOnly").val("");
                    $("#GroomCivilStatus").prop("disabled", false).val("");
                    $("#GroomRegion").prop("disabled", false).val("");
                    $("#GroomProvince").prop("disabled", false).val("");
                    $("#GroomCity").prop("disabled", false).val("");
                    $("#GroomBarangay").prop("disabled", false).val("");
                    $("#GroomAddressLine").prop("disabled", false).removeClass("readOnly").val("");

                    $("#GroomMoFname, #GroomMoMname, #GroomMoLname, #GroomMoBirthdate, #GroomMoBirthplace, #GroomMoAddress").prop("disabled", false).removeClass("readOnly").val("");
                    $("#GroomFaFname, #GroomFaMname, #GroomFaLname, #GroomFaBirthdate, #GroomFaBirthplace, #GroomFaAddress").prop("disabled", false).removeClass("readOnly").val("");
                }
            },
            error: function (error) {
                toastr.warning("Something went wrong, please try again.");
                console.error("Error checking record:", error);
            }
        });
    });

    $("#checkRecBtnWeddBride").on("click", function () {
        let formData = {
            fname: $("#weddBrideFname").val(),
            mname: $("#weddBrideMname").val(),
            lname: $("#weddBrideLname").val(),
            birthdate: $("#weddBrideBirthdate").val()
        };

        if (!formData.fname && !formData.mname && !formData.lname && !formData.birthdate) {
            toastr.warning("Please enter information before checking the record.");
            return; 
        }    

        $.ajax({
            type: "POST",
            url: "/check_record",
            data: formData,
            success: function (response) {
                if (response.exists) {
                    toastr.success("Record found! Auto-filling form...");

                    console.log(response)
                    // Auto-fill client details
                    $("#rec_BrideID").val(response.client.id);
                    $("#rec_BrideMoID").val(response.parents.mother.id);
                    $("#rec_BrideFaID").val(response.parents.father.id);
                    $(`input[name='BrideLigitivity'][value='${response.client.ligitivity}']`).prop("checked", true);
                    $("input[name='BrideLigitivity']").prop("disabled", true);
                    $("#weddBrideBirthplace").val(response.client.birthplace).prop("disabled", true);
                    $(".weddBrideBirthplace").addClass("readOnly");
                    $("#BrideCivilStatus").val(response.client.status).prop("disabled", true);
                    $("#BrideRegion").val(response.client.region).trigger("change").prop("disabled", true);

                    fetch(`/api_db/get-provinces/${response.client.region}`)
                        .then(response => response.json())
                        .then(data => {
                            // Populate dropdown
                            data.forEach(province => {
                                const option = document.createElement("option");
                                option.value = province.id;
                                option.textContent = province.province_name;
                                $("#BrideProvince").append(option);
                            });

                            // Autofill province after data is loaded
                            $("#BrideProvince").val(response.client.province).trigger("change").prop("disabled", true);
                        });

                    fetch(`/api_db/get-cities/${response.client.province}`)
                        .then(response => response.json())
                        .then(data => {
                            data.forEach(city => {
                                const option = document.createElement("option");
                                option.value = city.id;
                                option.textContent = city.city_name;
                                $("#BrideCity").append(option);
                            });

                            $("#BrideCity").val(response.client.citymun).trigger("change").prop("disabled", true);
                        });

                    fetch(`/api_db/get-barangays/${response.client.citymun}`)
                        .then(response => response.json())
                        .then(data => {
                            data.forEach(barangay => {
                                const option = document.createElement("option");
                                option.value = barangay.id;
                                option.textContent = barangay.barangay_name;
                                $("#BrideBarangay").append(option);
                            });

                            $("#BrideBarangay").val(response.client.brgy).prop("disabled", true);
                        });
                    $("#BrideAddressLine").val(response.client.address).prop("disabled", true);
                    $(".addressLinBrideAddressLinee").addClass("readOnly");

                    // Auto-fill mother details if available
                    if (response.parents.mother) {
                        $("#BrideMoFname").val(response.parents.mother.first_name).prop("disabled", true);                        ;
                        $(".BrideMoFname").addClass("readOnly");
                        $("#BrideMoMname").val(response.parents.mother.middle_name).prop("disabled", true);                        ;
                        $(".BrideMoMname").addClass("readOnly");
                        $("#BrideMoLname").val(response.parents.mother.last_name).prop("disabled", true);
                        $(".BrideMoLname").addClass("readOnly");
                        $("#BrideMoBirthdate").val(formatDate(response.parents.mother.birthday)).prop("disabled", true);
                        $(".BrideMoBirthdate").addClass("readOnly");
                        $("#BrideMoBirthplace").val(response.parents.mother.birthplace).prop("disabled", true);
                        $(".BrideMoBirthplace").addClass("readOnly");
                        $("#BrideMoAddress").val(response.parents.mother.address).prop("disabled", true);
                        $(".BrideMoAddress").addClass("readOnly");
                    }

                    // Auto-fill father details if available
                    if (response.parents.father) {
                        $("#BrideFaFname").val(response.parents.father.first_name).prop("disabled", true);
                        $(".BrideFaFname").addClass("readOnly");
                        $("#BrideFaMname").val(response.parents.father.middle_name).prop("disabled", true);
                        $(".BrideFaMname").addClass("readOnly");
                        $("#BrideFaLname").val(response.parents.father.last_name).prop("disabled", true);
                        $(".BrideFaLname").addClass("readOnly");
                        $("#BrideFaBirthdate").val(formatDate(response.parents.father.birthday)).prop("disabled", true);
                        $(".BrideFaBirthdate").addClass("readOnly");
                        $("#BrideFaBirthplace").val(response.parents.father.birthplace).prop("disabled", true);
                        $(".BrideFaBirthplace").addClass("readOnly");
                        $("#BrideFaAddress").val(response.parents.father.address).prop("disabled", true);
                        $(".BrideFaAddress").addClass("readOnly");
                    }

                } else {
                    toastr[response.type](response.message); 

                    $("input[name='BrideLigitivity']").prop("disabled", false).prop("checked", false);
                    $("#weddBrideBirthplace").prop("disabled", false).removeClass("readOnly").val("");
                    $("#BrideCivilStatus").prop("disabled", false).val("");
                    $("#BrideRegion").prop("disabled", false).val("");
                    $("#BrideProvince").prop("disabled", false).val("");
                    $("#BrideCity").prop("disabled", false).val("");
                    $("#BrideBarangay").prop("disabled", false).val("");
                    $("#BrideAddressLine").prop("disabled", false).removeClass("readOnly").val("");

                    $("#BrideMoFname, #BrideMoMname, #BrideMoLname, #BrideMoBirthdate, #BrideMoBirthplace, #BrideMoAddress").prop("disabled", false).removeClass("readOnly").val("");
                    $("#BrideFaFname, #BrideFaMname, #BrideFaLname, #BrideFaBirthdate, #BrideFaBirthplace, #BrideFaAddress").prop("disabled", false).removeClass("readOnly").val("");
                }
            },
            error: function (error) {
                toastr.warning("Something went wrong, please try again.");
                console.error("Error checking record:", error);
            }
        });
    });

    $("#baptismAddForm").on("submit", function (event) {
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
        
    
        if (!isValid) {
            event.preventDefault(); 
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }

        let formData = $(this).serialize();
        console.log("Data being sent:", formData); 
    
        $.ajax({
            type: "POST",
            url: "/submit-baptism",
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
 
                if (response.message && response.type) {
                  
                    toastr[response.type](response.message); 

                    if (response.type === "success") {
            
                        $("#baptismAddForm")[0].reset();

                        $("#addBaptismModal").modal("hide");

                        $('#baptismTable').DataTable().ajax.reload(null, false);
                    } 
                } else {
                    toastr.error("Unexpected response format!");
                }
            
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "An error occurred while submitting the baptism record.";
                toastr.error(errorMessage);
            }
        });
    });

    $("#confirmationAddForm").on("submit", function (event) {
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
        
    
        if (!isValid) {
            event.preventDefault(); 
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }

        let formData = $(this).serialize();
        console.log("Data being sent:", formData); 
    
        $.ajax({
            type: "POST",
            url: "/submit-confirmation",
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
 
                if (response.message && response.type) {
                  
                    toastr[response.type](response.message); 

                    if (response.type === "success") {
            
                        $("#confirmationAddForm")[0].reset();

                        $("#addConfirmationModal").modal("hide");

                        $('#confirmationTable').DataTable().ajax.reload(null, false);
                    } 
                } else {
                    toastr.error("Unexpected response format!");
                }
            
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "An error occurred while submitting the baptism record.";
                toastr.error(errorMessage);
            }
        });
    });

    $("#weddingAddForm").on("submit", function (event) {
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
        
    
        if (!isValid) {
            event.preventDefault(); 
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }

        let formData = $(this).serialize();
        console.log("Data being sent:", formData); 
    
        $.ajax({
            type: "POST",
            url: "/submit-wedding",
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
 
                if (response.message && response.type) {
                  
                    toastr[response.type](response.message); 

                    if (response.type === "success") {
            
                        $("#weddingAddForm")[0].reset();

                        $("#addWeddingModal").modal("hide");

                        $('#weddingTable').DataTable().ajax.reload(null, false);
                    } 
                } else {
                    toastr.error("Unexpected response format!");
                }
            
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "An error occurred while submitting the baptism record.";
                toastr.error(errorMessage);
            }
        });
    });

    $("#deathAddForm").on("submit", function (event) {
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
        
    
        if (!isValid) {
            event.preventDefault(); 
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }

        let formData = $(this).serialize();
        console.log("Data being sent:", formData); 
    
        $.ajax({
            type: "POST",
            url: "/submit-death",
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
 
                if (response.message && response.type) {
                  
                    toastr[response.type](response.message); 

                    if (response.type === "success") {
            
                        $("#deathAddForm")[0].reset();

                        $("#addDeathModal").modal("hide");

                        $('#deathTable').DataTable().ajax.reload(null, false);
                    } 
                } else {
                    toastr.error("Unexpected response format!");
                }
            
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "An error occurred while submitting the baptism record.";
                toastr.error(errorMessage);
            }
        });
    });

    $("#priestAddForm").on("submit", function (event) {
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
        
    
        if (!isValid) {
            event.preventDefault(); 
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }

        let formData = $(this).serialize();
        console.log("Data being sent:", formData); 
    
        $.ajax({
            type: "POST",
            url: "/submit-priest",
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
 
                if (response.message && response.type) {
                  
                    toastr[response.type](response.message); 

                    if (response.type === "success") {
            
                        $("#priestAddForm")[0].reset();

                        $("#addPriestModal").modal("hide");

                        $('#priestTable').DataTable().ajax.reload(null, false);
                    } 
                } else {
                    toastr.error("Unexpected response format!");
                }
            
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "An error occurred while submitting the baptism record.";
                toastr.error(errorMessage);
            }
        });
    });

});