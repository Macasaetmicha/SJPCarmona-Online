document.addEventListener('DOMContentLoaded', function () {
    // POPOVER JS
    const filterButton = document.getElementById('filterPopover');
    const filterContent = document.getElementById('filterContent').innerHTML;

    const popover = new bootstrap.Popover(filterButton, {
        content: filterContent,
        html: true,
        sanitize: false,
        trigger: 'manual'
    });

    let selectedStart = moment().subtract(29, 'days');
    let selectedEnd = moment();

    function cb(start, end) {
        selectedStart = start;
        selectedEnd = end;
        $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        fetchRecordCount(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));
    }

    // Add manual toggle on button click
    filterButton.addEventListener('click', function () {
        const popoverId = filterButton.getAttribute('aria-describedby');
        if (popoverId) {
            popover.hide();
        } else {
            popover.show();
        }
    });

    filterButton.addEventListener('shown.bs.popover', function () {
        const $popoverBody = $('.popover-body');

        $popoverBody.find('#reportrange').daterangepicker({
            startDate: selectedStart,
            endDate: selectedEnd,
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            }
        }, cb);

        cb(selectedStart, selectedEnd);
    });

    document.addEventListener('click', function (event) {
        const popoverId = filterButton.getAttribute('aria-describedby');
        const popoverElement = popoverId ? document.getElementById(popoverId) : null;
        const isInPopover = popoverElement && popoverElement.contains(event.target);
        const isInButton = filterButton.contains(event.target);
        const isInDatepicker = $(event.target).closest('.daterangepicker').length > 0;

        if (!isInPopover && !isInButton && !isInDatepicker) {
            popover.hide();
        }
    });

    function fetchRecordCount(startDate, endDate) {
        $.ajax({
            url: `/api_db/get-records-count?start=${startDate}&end=${endDate}`,
            type: "GET",
            success: function (data) {
                $(".recordCount").text(data.record || 0);
                $(".requestCount").text(data.request || 0);
                $(".baptismCount").text(data.baptism || 0);
                $(".confirmationCount").text(data.confirmation || 0);
                $(".weddingCount").text(data.wedding || 0);
                $(".deathCount").text(data.death || 0);
            },
            error: function () {
                console.error("Error fetching record count.");
            }
        });
    }

    fetchRecordCount(selectedStart.format('YYYY-MM-DD'), selectedEnd.format('YYYY-MM-DD'));

    
    // DATATABLE JS
    const reportsConfig = {
        record: {
            headers: ['Name', 'Birthday', 'Ligitivity', 'Birthplace', 'Status', 'Address', 'Mother', 'Father', 'Updated on', 'Staff']
        },
        baptism: {
            headers: ['Name', 'Birthday', 'Baptism Date', 'Sponsor 1', 'Sponsor 2', 'Priest', 'Location', 'Updated on', 'Staff']
        },
        confirmation: {
            headers: ['Name', 'Birthday', 'Confirmation Date', 'Sponsor', 'Church Baptized', 'Priest', 'Location', 'Updated on', 'Staff']
        },
        wedding: {
            headers: ['Groom', 'Bride', 'Wedding Date', 'Sponsor', 'License Number', 'Civil Date', 'Civil Location', 'Priest', 'Location', 'Updated on', 'Staff']
        },
        death: {
            headers: ['Name', 'Birthday', 'Death Date', 'Burial Date', 'Burial Location', 'Cause of Death', 'Contact Person', 'Address', 'Priest', 'Location', 'Updated on', 'Staff']
        },
        priest: {
            headers: ['Name', 'Church', 'Position', 'Status']
        },
        request: {
            headers: ['Requestor', 'Name on Document', 'Ceremony Type', 'Ceremony Date', 'Status', 'Request Date', 'Completion Date', 'Completed by']
        }
    };
    
    $(document).ready(function () {
        const initialType = $('#dataFilterDropdown').val();
        loadReport(initialType);
    
        $('#dataFilterDropdown').on('change', function () {
            const selectedType = $(this).val();
    
            // Destroy old DataTable if exists
            if ($.fn.DataTable.isDataTable('#dynamicTable')) {
                $('#dynamicTable').DataTable().destroy();
            }
            $('#tableContainer').empty();
            console.log("Selected Type:", selectedType)
            loadReport(selectedType);
        });
    });
    
    function loadReport(type) {
        const config = reportsConfig[type];
        if (!config) return;

        let tableHtml = '<table id="dynamicTable" class="table table-striped">';
        tableHtml += '<thead><tr>';
        config.headers.forEach(header => {
            tableHtml += `<th>${header}</th>`;
        });
        tableHtml += '</tr></thead><tbody></tbody></table>';

        $('#tableContainer').html(tableHtml);

        const filters = gatherFilters(type);
        console.log("Filters: ", filters)

        $.ajax({
            url: '/api_db/get_report_data',
            method: 'GET',
            data: {
                type: type,
                filters: JSON.stringify(filters)
            },
            success: function (data) {
                let tableRows = '';
                data.forEach(row => {
                    tableRows += '<tr>';
                    config.headers.forEach(header => {
                        const key = header.replace(/\s+/g, '').toLowerCase();
                        tableRows += `<td>${row[key] || ''}</td>`;
                    });
                    tableRows += '</tr>';
                });
                $('#dynamicTable tbody').html(tableRows);
                $('#dynamicTable').DataTable();
            },
            error: function () {
                $('#dynamicTable tbody').html('<tr><td colspan="' + config.headers.length + '">Error loading data.</td></tr>');
            }
        });
    }

    function getDateRangeInputID(type) {
        if (type === 'record') return 'recordDateRange';
        if (['baptism', 'confirmation', 'wedding', 'death'].includes(type)) return 'ceremonyDateRange';
        if (type === 'request') return 'requestDateRange';
        return null;
    }

    function gatherFilters(type) {
        const filters = {};
        const dateRangeID = getDateRangeInputID(type);

        if (type === 'record') {
            filters.civilStatus = $('#civilStatusFilter').val();
            filters.ligitivity = $('#ligitivityFilter').val();
        } else if (['baptism', 'confirmation', 'wedding', 'death'].includes(type)) {
            filters.priest = $('#priestDropdown').val();
            filters.index = $('#recordIndex').val();
            filters.book = $('#recordBook').val();
            filters.page = $('#recordPage').val();
            filters.line = $('#recordLine').val();
            
        } else if (type === 'priest') {
            filters.position = $('#position').val();
            filters.status = $('#status').val();
        } else if (type === 'request') {
            filters.ceremony = $('#ceremony').val();
            filters.reqStatus = $('#reqStatus').val();
        }

        // Add date range if applicable
        if (dateRangeID && $(`#${dateRangeID}`).val()) {
            const [startDate, endDate] = $(`#${dateRangeID}`).val().split(' - ').map(dateStr =>
                moment(dateStr, 'MMMM D, YYYY').format('YYYY-MM-DD')
            );
            filters.date_start = startDate;
            filters.date_end = endDate;
            console.log("Processed Start: ", filters.date_start, "End Date: ", filters.date_end)
        }
        console.log("Filters from gatherFilter:", filters)
        return filters;
    }
    
    $(document).on('change', '.form-select, .form-control', function () {
        const selectedType = $('#dataFilterDropdown').val();
        if ($.fn.DataTable.isDataTable('#dynamicTable')) {
            $('#dynamicTable').DataTable().destroy();
        }
        $('#tableContainer').empty();
        loadReport(selectedType);
    });

    // REPORT GENERATION CUSTOM FILTER JS
    document.getElementById('dataFilterDropdown').addEventListener('change', function () {
        const value = this.value;
        const ceremonyFilters = document.getElementById('ceremonyFilters');
        const recordFilter = document.getElementById('recordFilter');
        const priestFilter = document.getElementById('priestFilter');
        const requestFilter = document.getElementById('requestFilter');

        // Reset the selected priest
        if (filterPriest) {
            filterPriest.selectedIndex = 0;  
        }
        if (civilStatusFilter) {
            civilStatusFilter.selectedIndex = 0;  
        }
        if (ligitivityFilter) {
            ligitivityFilter.selectedIndex = 0;  
        }

        // Hide all filter groups initially
        ceremonyFilters.classList.add('d-none');
        recordFilter.classList.add('d-none');
        priestFilter.classList.add('d-none');
        requestFilter.classList.add('d-none');

        // Show the correct filter group based on the selected value
        if (value === 'baptism' || value === 'confirmation' || value === 'wedding' || value === 'death') {
            ceremonyFilters.classList.remove('d-none');
            initDateRangePicker('ceremonyDateRange');
        } else if (value === 'record') {
            recordFilter.classList.remove('d-none');
            initDateRangePicker('recordDateRange');
        } else if (value === 'priest') {
            priestFilter.classList.remove('d-none');
        } else if (value === 'request') {
            requestFilter.classList.remove('d-none');
            initDateRangePicker('requestDateRange');
        } 
    });

    // FILTER START
    const filterPriest = document.getElementById("priestDropdown");
    const civilStatusFilter = document.getElementById("civilStatusFilter");
    const ligitivityFilter = document.getElementById("ligitivityFilter");

    if (civilStatusFilter) {
        civilStatusFilter.addEventListener('change', () => {
            triggerRecordTableFilter();
        });
    }

    if (ligitivityFilter) {
        ligitivityFilter.addEventListener('change', () => {
            triggerRecordTableFilter();
        });
    }

    if (filterPriest){
        // Fetch Priest
        fetch("/api_db/get-all-priests")
        .then(response => response.json())
        .then(data => {
            data.forEach(priest => {
                console.log("Found the dropdown");
                console.log(data);
                const option = document.createElement("option");
                option.value = priest.id;
                option.textContent = priest.priest_name;
                filterPriest.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading priests:", error));
    }

    let filterStart = moment().subtract(7, 'days');
    let filterEnd = moment();

    function handleNewDateRange(start, end, targetID) {
        filterStart = start;
        filterEnd = end;

        const dateRangeStr = start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY');
        console.log("Date Range String: ", dateRangeStr); // Debugging step
        $(`#${targetID}`).val(dateRangeStr);
        // Trigger table update based on the selected filter
        const selectedType = $('#dataFilterDropdown').val();
        
        // Load the report with the updated date range
        loadReport(selectedType);
    }

    function initDateRangePicker(targetID) {
        $(`#${targetID}`).daterangepicker({
            startDate: filterStart,
            endDate: filterEnd,
            format: 'MMMM D, YYYY',
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            }
        }, function(start, end) {
            // Handle the date range selection
            console.log("Start: ", start, "End: ", end)
            handleNewDateRange(start, end, targetID);
        });
    }


    // Initial setup when the page loads
    $('#dataFilterDropdown').trigger('change');

    document.getElementById('clearFilters').addEventListener('click', function () {
        const selectedType = $('#dataFilterDropdown').val();

        if (selectedType === 'record') {
            $('#civilStatusFilter').val('');
            $('#ligitivityFilter').val('');
            $('#civilStatusFilter').trigger('change');
            $('#ligitivityFilter').trigger('change');
        }

        if (['baptism', 'confirmation', 'wedding', 'death'].includes(selectedType)) {
            $('#ceremonyDateRange').val('');
            $('#priestDropdown').val('');
            $('#recordIndex').val('');
            $('#recordBook').val('');
            $('#recordPage').val('');
            $('#recordLine').val('');
            // Trigger a refresh
            $('#priestDropdown').trigger('change');
        }

        if (selectedType === 'request') {
            $('#ceremony').val('');
            $('#reqStatus').val('');
            $('#ceremony').trigger('change');
            $('#reqStatus').trigger('change');
        }

        $(`#${getDateRangeInputID(selectedType)}`).val('');

        if ($.fn.DataTable.isDataTable('#dynamicTable')) {
            $('#dynamicTable').DataTable().destroy();
        }
        $('#tableContainer').empty();
        loadReport(selectedType);
    });

});
