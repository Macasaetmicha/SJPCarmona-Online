document.addEventListener("DOMContentLoaded", function () {
    // STEPPER JS 
    document.querySelectorAll(".modal").forEach(modal => {
        let currentStep = 0; 

        const steps = modal.querySelectorAll(".step");
        const progressLines = modal.querySelectorAll(".progress-line");
        const stepContents = modal.querySelectorAll(".step-content");

        function showStep(step) {
            stepContents.forEach((content, index) => {
                content.classList.toggle("active", index === step);
            });

            steps.forEach((s, index) => {
                s.classList.toggle("active", index <= step);
            });

            progressLines.forEach((line, index) => {
                line.classList.toggle("active", index < step);
            });
        }

        modal.querySelectorAll(".next-btn").forEach(nextBtn => {
            nextBtn.addEventListener("click", function () {
                if (currentStep < stepContents.length - 1) {
                    currentStep++;
                    showStep(currentStep);
                }
            });
        });

        modal.querySelectorAll(".prev-btn").forEach(prevBtn => {
            prevBtn.addEventListener("click", function () {
                if (currentStep > 0) {
                    currentStep--;
                    showStep(currentStep);
                }
            });
        });

        showStep(currentStep);

        modal.addEventListener("shown.bs.modal", function () {
            currentStep = 0; 
            showStep(currentStep);
        });
    });

    // MODAL JS
    $("#addBaptismBtn").on("click", function () {

        $("#addBaptismModal input:not([type='radio']), #addBaptismModal select, #addBaptismModal textarea")
            .val("") 
            .prop("disabled", false)
            .removeClass("readOnly");

        $("#addBaptismModal input[type='radio']").prop("checked", false).prop("disabled", false).removeClass("readOnly");

        $("#province").each(function () {
            $(this).html('<option value="" selected disabled>Select Province</option>');
        });
        
        $("#city").each(function () {
            $(this).html('<option value="" selected disabled>Select City/Municipality</option>');
        });
        
        $("#barangay").each(function () {
            $(this).html('<option value="" selected disabled>Select Barangay</option>');
        });
    });

    $("#addConfirmationBtn").on("click", function () {

        $("#addConfirmationModal input:not([type='radio']), #addConfirmationModal select, #addConfirmationModal textarea")
            .val("") 
            .prop("disabled", false)
            .removeClass("readOnly");

        $("#addConfirmationModal input[type='radio']").prop("checked", false).prop("disabled", false).removeClass("readOnly");

        $("#province").each(function () {
            $(this).html('<option value="" selected disabled>Select Province</option>');
        });
        
        $("#city").each(function () {
            $(this).html('<option value="" selected disabled>Select City/Municipality</option>');
        });
        
        $("#barangay").each(function () {
            $(this).html('<option value="" selected disabled>Select Barangay</option>');
        });
    });

    $("#addWeddingBtn").on("click", function () {

        $("#addWeddingModal input:not([type='radio']), #addWeddingModal select, #addWeddingModal textarea")
            .val("") 
            .prop("disabled", false)
            .removeClass("readOnly");

        $("#addWeddingModal input[type='radio']").prop("checked", false).prop("disabled", false).removeClass("readOnly");
        
        $("#GroomProvince, #BrideProvince").each(function () {
            $(this).html('<option value="" selected disabled>Select Province</option>');
        });
        
        $("#GroomCity, #BrideCity").each(function () {
            $(this).html('<option value="" selected disabled>Select City/Municipality</option>');
        });
        
        $("#GroomBarangay, #BrideBarangay").each(function () {
            $(this).html('<option value="" selected disabled>Select Barangay</option>');
        });
    
    });

    $("#addDeathBtn").on("click", function () {

        $("#addDeathModal input:not([type='radio']), #addDeathModal select, #addDeathModal textarea")
            .val("") 
            .prop("disabled", false)
            .removeClass("readOnly");

        $("#addDeathModal input[type='radio']").prop("checked", false).prop("disabled", false).removeClass("readOnly");

        $("#province").each(function () {
            $(this).html('<option value="" selected disabled>Select Province</option>');
        });
        
        $("#city").each(function () {
            $(this).html('<option value="" selected disabled>Select City/Municipality</option>');
        });
        
        $("#barangay").each(function () {
            $(this).html('<option value="" selected disabled>Select Barangay</option>');
        });
    });

    $("#addPriestBtn").on("click", function () {

        $("#addPriestModal input:not([type='radio']), #addPriestModal select, #addPriestModal textarea")
            .val("") 
            .prop("disabled", false)
            .removeClass("readOnly");

        $("#addPriestModal input[type='radio']").prop("checked", false).prop("disabled", false).removeClass("readOnly");

    });
    

    $("#addScheduleBtn").on("click", function () {

        $("#addEventModal input:not([type='radio']), #addEventModal select, #addEventModal textarea")
            .val("") 
            .prop("disabled", false)
            .removeClass("readOnly");

        $("#addEventModal input[type='radio']").prop("checked", false).prop("disabled", false).removeClass("readOnly");

    });
    
    // DROPDOWN JS
    const regionSelect = document.getElementById("region");
    const provinceSelect = document.getElementById("province");
    const citySelect = document.getElementById("city");
    const barangaySelect = document.getElementById("barangay");

    // Fetch Regions
    if (regionSelect) {
        fetch("/api_db/get-regions")
        .then(response => response.json())
        .then(data => {
            data.forEach(region => {
                const option = document.createElement("option");
                option.value = region.id;
                option.textContent = region.region_name;
                regionSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading regions:", error));
    

        // Fetch Provinces based on Selected Region
        regionSelect.addEventListener("change", function () {
            provinceSelect.innerHTML = '<option value="" selected disabled>Select Province</option>';
            citySelect.innerHTML = '<option value="" selected disabled>Select City/Municipality</option>';
            barangaySelect.innerHTML = '<option value="" selected disabled>Select Barangay</option>';

            fetch(`/api_db/get-provinces/${this.value}`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(province => {
                        const option = document.createElement("option");
                        option.value = province.id;
                        option.textContent = province.province_name;
                        provinceSelect.appendChild(option);
                    });
                })
                .catch(error => console.error("Error loading provinces:", error));
        });

        // Fetch Cities based on Selected Province
        provinceSelect.addEventListener("change", function () {
            citySelect.innerHTML = '<option value="" selected disabled>Select City/Municipality</option>';
            barangaySelect.innerHTML = '<option value="" selected disabled>Select Barangay</option>';

            fetch(`/api_db/get-cities/${this.value}`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(city => {
                        const option = document.createElement("option");
                        option.value = city.id;
                        option.textContent = city.city_name;
                        citySelect.appendChild(option);
                    });
                })
                .catch(error => console.error("Error loading cities:", error));
        });

        // Fetch Barangays based on Selected City/Municipality
        citySelect.addEventListener("change", function () {
            barangaySelect.innerHTML = '<option value="" selected disabled>Select Barangay</option>';

            fetch(`/api_db/get-barangays/${this.value}`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(barangay => {
                        const option = document.createElement("option");
                        option.value = barangay.id;
                        option.textContent = barangay.barangay_name;
                        barangaySelect.appendChild(option);
                    });
                })
                .catch(error => console.error("Error loading barangays:", error));
        });
    }

    const GroomRegionSelect = document.getElementById("GroomRegion");
    const GroomProvinceSelect = document.getElementById("GroomProvince");
    const GroomCitySelect = document.getElementById("GroomCity");
    const GroomBarangaySelect = document.getElementById("GroomBarangay");

    // Fetch Regions
    if (GroomRegionSelect) {
        fetch("/api_db/get-regions")
        .then(response => response.json())
        .then(data => {
            data.forEach(region => {
                const option = document.createElement("option");
                option.value = region.id;
                option.textContent = region.region_name;
                GroomRegionSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading regions:", error));
    

        // Fetch Provinces based on Selected Region
        GroomRegionSelect.addEventListener("change", function () {
            GroomProvinceSelect.innerHTML = '<option value="" selected disabled>Select Province</option>';
            GroomCitySelect.innerHTML = '<option value="" selected disabled>Select City/Municipality</option>';
            GroomBarangaySelect.innerHTML = '<option value="" selected disabled>Select Barangay</option>';

            fetch(`/api_db/get-provinces/${this.value}`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(province => {
                        const option = document.createElement("option");
                        option.value = province.id;
                        option.textContent = province.province_name;
                        GroomProvinceSelect.appendChild(option);
                    });
                })
                .catch(error => console.error("Error loading provinces:", error));
        });

        // Fetch Cities based on Selected Province
        GroomProvinceSelect.addEventListener("change", function () {
            GroomCitySelect.innerHTML = '<option value="" selected disabled>Select City/Municipality</option>';
            GroomBarangaySelect.innerHTML = '<option value="" selected disabled>Select Barangay</option>';

            fetch(`/api_db/get-cities/${this.value}`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(city => {
                        const option = document.createElement("option");
                        option.value = city.id;
                        option.textContent = city.city_name;
                        GroomCitySelect.appendChild(option);
                    });
                })
                .catch(error => console.error("Error loading cities:", error));
        });

        // Fetch Barangays based on Selected City/Municipality
        GroomCitySelect.addEventListener("change", function () {
            GroomBarangaySelect.innerHTML = '<option value="" selected disabled>Select Barangay</option>';

            fetch(`/api_db/get-barangays/${this.value}`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(barangay => {
                        const option = document.createElement("option");
                        option.value = barangay.id;
                        option.textContent = barangay.barangay_name;
                        GroomBarangaySelect.appendChild(option);
                    });
                })
                .catch(error => console.error("Error loading barangays:", error));
        });
    }

    const BrideRegionSelect = document.getElementById("BrideRegion");
    const BrideProvinceSelect = document.getElementById("BrideProvince");
    const BrideCitySelect = document.getElementById("BrideCity");
    const BrideBarangaySelect = document.getElementById("BrideBarangay");

    // Fetch Regions
    if (BrideRegionSelect) {
        fetch("/api_db/get-regions")
        .then(response => response.json())
        .then(data => {
            data.forEach(region => {
                const option = document.createElement("option");
                option.value = region.id;
                option.textContent = region.region_name;
                BrideRegionSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading regions:", error));
    

        // Fetch Provinces based on Selected Region
        BrideRegionSelect.addEventListener("change", function () {
            BrideProvinceSelect.innerHTML = '<option value="" selected disabled>Select Province</option>';
            BrideCitySelect.innerHTML = '<option value="" selected disabled>Select City/Municipality</option>';
            BrideBarangaySelect.innerHTML = '<option value="" selected disabled>Select Barangay</option>';

            fetch(`/api_db/get-provinces/${this.value}`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(province => {
                        const option = document.createElement("option");
                        option.value = province.id;
                        option.textContent = province.province_name;
                        BrideProvinceSelect.appendChild(option);
                    });
                })
                .catch(error => console.error("Error loading provinces:", error));
        });

        // Fetch Cities based on Selected Province
        BrideProvinceSelect.addEventListener("change", function () {
            BrideCitySelect.innerHTML = '<option value="" selected disabled>Select City/Municipality</option>';
            BrideBarangaySelect.innerHTML = '<option value="" selected disabled>Select Barangay</option>';

            fetch(`/api_db/get-cities/${this.value}`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(city => {
                        const option = document.createElement("option");
                        option.value = city.id;
                        option.textContent = city.city_name;
                        BrideCitySelect.appendChild(option);
                    });
                })
                .catch(error => console.error("Error loading cities:", error));
        });

        // Fetch Barangays based on Selected City/Municipality
        BrideCitySelect.addEventListener("change", function () {
            BrideBarangaySelect.innerHTML = '<option value="" selected disabled>Select Barangay</option>';

            fetch(`/api_db/get-barangays/${this.value}`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(barangay => {
                        const option = document.createElement("option");
                        option.value = barangay.id;
                        option.textContent = barangay.barangay_name;
                        BrideBarangaySelect.appendChild(option);
                    });
                })
                .catch(error => console.error("Error loading barangays:", error));
        });
    }

    const priestSelect = document.getElementById("priest");
    const priestSelectEdit = document.getElementById("priestEdit");

    if (priestSelect){
        // Fetch Priest
        fetch("/api_db/get-priests")
        .then(response => response.json())
        .then(data => {
            data.forEach(priest => {
                console.log(data);
                const option = document.createElement("option");
                option.value = priest.id;
                option.textContent = priest.priest_name;
                priestSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading priests:", error));
    }

    if (priestSelectEdit){
        // Fetch Priest
        fetch("/api_db/get-priests")
        .then(response => response.json())
        .then(data => {
            data.forEach(priest => {
                console.log("Found the dropdown");
                console.log(data);
                const option = document.createElement("option");
                option.value = priest.id;
                option.textContent = priest.priest_name;
                priestSelectEdit.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading priests:", error));
    }
    
    // DATE PICKER JS
    if ($('.datepicker-custom').length > 0) {
        $('.datepicker-custom').datepicker({
            format: 'yyyy-mm-dd', 
            autoclose: true,
            endDate: new Date()
        });
    }

    if ($('#baptDatePicker').length > 0) {
        $('#baptDatePicker').datepicker({
            format: 'yyyy-mm-dd', 
            autoclose: true,
            todayHighlight: true,
            endDate: new Date() 
        });
    }

    if ($('.DatePickerEdit').length > 0) {
        $('.DatePickerEdit').datepicker({
            format: 'yyyy-mm-dd', 
            autoclose: true,
            todayHighlight: true,
            endDate: new Date() 
        });
    }

    if ($('#confDatePicker').length > 0) {
        $('#confDatePicker').datepicker({
            format: 'yyyy-mm-dd', 
            autoclose: true,
            todayHighlight: true,
            endDate: new Date() 
        });
    }

    if ($('#weddDatePicker').length > 0) {
        $('#weddDatePicker').datepicker({
            format: 'yyyy-mm-dd', 
            autoclose: true,
            todayHighlight: true,
            endDate: new Date() 
        });
    }

    if ($('#civilDatePicker').length > 0) {
        $('#civilDatePicker').datepicker({
            format: 'yyyy-mm-dd', 
            autoclose: true,
            todayHighlight: true,
            endDate: new Date() 
        });
    }

    if ($('#deathDatePicker').length > 0) {
        $('#deathDatePicker').datepicker({
            format: 'yyyy-mm-dd', 
            autoclose: true,
            todayHighlight: true,
            endDate: new Date() 
        });
    }

    if ($('#burialDatePicker').length > 0) {
        $('#burialDatePicker').datepicker({
            format: 'yyyy-mm-dd', 
            autoclose: true,
            todayHighlight: true,
            endDate: new Date() 
        });
    }

    // SELECT2
    $(document).ready(function() {
        $('.select2').select2({
            placeholder: "Select options",
            allowClear: true
        });
    });
});