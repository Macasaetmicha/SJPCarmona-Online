document.addEventListener("DOMContentLoaded", function () {
    const regionSelect = document.getElementById("region");
    const provinceSelect = document.getElementById("province");
    const citySelect = document.getElementById("city");
    const barangaySelect = document.getElementById("barangay");

    // Fetch Regions
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

    const priestSelect = document.getElementById("priest");

    // Fetch Priest
    fetch("/api_db/get-priests")
        .then(response => response.json())
        .then(data => {
            data.forEach(priest => {
                console.log(data)
                const option = document.createElement("option");
                option.value = priest.id;
                option.textContent = priest.priest_name;
                priestSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading priests:", error));
});