document.addEventListener('DOMContentLoaded', function() {
    // FORM CODE (SHARED WITH THE STAFF REQUEST POP UP)
    // Populate year dropdown (e.g. 1900 to current year)
    const yearSelect = document.getElementById('cer_year');
    const currentYear = new Date().getFullYear();
    console.log("Current Year: ", currentYear)
    for (let y = currentYear; y >= 1900; y--) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }

    // Populate day dropdown (1 to 31)
    const daySelect = document.getElementById('cer_day');
    for (let d = 1; d <= 31; d++) {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = d;
        daySelect.appendChild(option);
    }

    $("#requestAddFormStaff").on("submit", function (event) {
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
            url: "/submit-request",
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
 
                if (response.message && response.type) {
                  
                    toastr[response.type](response.message); 

                    if (response.type === "success") {
            
                        $("#requestAddFormStaff")[0].reset();

                        $("#addReqModal").modal("hide");

                        $('#requestTableStaff').DataTable().ajax.reload(null, false);

                        calendar.refetchEvents();
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

    $("#requestAddFormClient").on("submit", function (event) {
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
            url: "/submit-request",
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);
 
                if (response.message && response.type) {
                  
                    toastr[response.type](response.message); 

                    if (response.type === "success") {
            
                        $("#requestAddFormClient")[0].reset();
                        window.location = "/request";
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