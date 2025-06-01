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

    let fullData = [];
    let config = null;
    
    $(document).ready(function () {
        // const initialType = $('#dataFilterDropdown').val();
        loadReport(record);
    
        $('#dataFilterDropdown').on('change', function () {
            const selectedType = $(this).val();
    
            if ($.fn.DataTable.isDataTable('#dynamicTable')) {
                $('#dynamicTable').DataTable().destroy();
            }
            $('#tableContainer').empty();
            console.log("Selected Type:", selectedType)
            loadReport(selectedType);
        });
    });

    function loadReport(type) {
        config = reportsConfig[type]; 
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
                fullData = data;
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
                // $('#dynamicTable').DataTable();
                $('#dynamicTable').DataTable({
                    order: [[config.headers.length - 2, 'asc']]
                });
            },
            error: function () {
                $('#dynamicTable tbody').html('<tr><td colspan="' + config.headers.length + '">Error loading data.</td></tr>');
            }
        });
    }

    $('#exportExcel').click(function () {
        if (!fullData.length) {
            toastr.error('No data to export.');
            return;
        }

        const worksheetData = [
            config.headers, 
            ...fullData.map(row =>
                config.headers.map(header => {
                    const key = header.replace(/\s+/g, '').toLowerCase();
                    return row[key] || '';
                })
            )
        ];

        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");

        XLSX.writeFile(wb, 'report.xlsx');
    });

    function exportDynamicDataToPDF(fullData, config, base64Image) {
        if (!fullData.length) {
            toastr.warning('No data to export.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: 'A4'
        });

        const selectedDataType = $('#dataFilterDropdown').val();

        function toTitleCase(str) {
            return str.replace(/\b(\w)/g, char => char.toUpperCase());
        }

        const titleCaseDataType = toTitleCase(selectedDataType);
        const headerText = `St. Joseph Parish\n${titleCaseDataType} Report`;

        const imageX = 40;
        const imageY = 30;
        const imageWidth = 50;
        const imageHeight = 50;

        doc.addImage(base64Image, 'PNG', imageX, imageY, imageWidth, imageHeight);

        const textX = imageX + imageWidth + 10;
        const textY = imageY + 20;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('St. Joseph Parish', textX, textY);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text(`${titleCaseDataType} Report`, textX, textY + 16);

        const headers = config.headers;
        const body = fullData.map((row, index) => {
            const rowData = headers.map(header => {
                const key = header.replace(/\s+/g, '').toLowerCase();
                return row[key] || '';
            });
            return [index + 1, ...rowData];
        });

        const fullHeaders = ['#', ...headers];

        doc.autoTable({
            head: [fullHeaders],
            body: body,
            startY: imageY + imageHeight + 20,
            theme: 'grid',
            headStyles: {
                fillColor: [188, 213, 197],
                textColor: [0, 0, 0],
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
                halign: 'center',
                valign: 'middle'
            },
            styles: {
                textColor: [0, 0, 0],
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
                halign: 'left',
                valign: 'middle'
            },
            showHead: 'everyPage',
            margin: { top: 80 }
        });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height;
            const pageWidth = pageSize.width;

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 60, pageHeight - 10);
        }

        const fileName = `${titleCaseDataType} Report.pdf`;
        doc.save(fileName);
    }


    $('#exportPDF').click(function () {
        exportDynamicDataToPDF(fullData, config, logoBase64);
    });



    function getDateRangeInputID(type) {
        if (type === 'record') return 'recordDateRange';
        if (['baptism', 'confirmation', 'wedding', 'death'].includes(type)) return 'ceremonyDateRange';
        if (type === 'request') return 'requestDateRange';
        return null;
    }

    function gatherFilters(type) {
        const filters = {};
        const dateRangeID = getDateRangeInputID(type);
        console.log('FILTERS:', filters)

        if (type === 'record') {
            filters.civilStatus = $('#civilStatusFilter').val();
            filters.ligitivity = $('#ligitivityFilter').val();
        } else if (['baptism', 'confirmation', 'wedding', 'death'].includes(type)) {
            filters.priest = $('#priestDropdown').val();
            filters.index = $('#recordIndex').val();
            filters.book = $('#recordBook').val();
            filters.page = $('#recordPage').val();
            filters.line = $('#recordLine').val();
            console.log("Filters form the ceremony page", filters)
            console.log("Ceremony Selected:", filters.priest, filters.index)

        } else if (type === 'priest') {
            console.log("Prist Selected:", filterButton.position, filterButton.status)
            filters.position = $('#positionFilter').val();
            filters.status = $('#statusFilter').val();

        } else if (type === 'request') {
            filters.ceremony = $('#ceremony').val();
            filters.reqStatus = $('#reqStatus').val();
        }

        if (dateRangeID && $(`#${dateRangeID}`).val()) {
            console.log("Date from the range: ", $(`#${dateRangeID}`).val())
            const [startDate, endDate] = $(`#${dateRangeID}`).val().split(' - ').map(dateStr =>
                moment(dateStr, 'MM/DD/YYYY').format('YYYY-MM-DD')
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

        if (filterPriest) {
            filterPriest.selectedIndex = 0;  
        }
        if (civilStatusFilter) {
            civilStatusFilter.selectedIndex = 0;  
        }
        if (ligitivityFilter) {
            ligitivityFilter.selectedIndex = 0;  
        }
        if (ligitivityFilter) {
            ligitivityFilter.selectedIndex = 0;  
        }
    
        ceremonyFilters.classList.add('d-none');
        recordFilter.classList.add('d-none');
        priestFilter.classList.add('d-none');
        requestFilter.classList.add('d-none');

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
    const positionFilter = document.getElementById("positionFilter");
    const statusFilter = document.getElementById("statusFilter");

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

    if (positionFilter) {
        positionFilter.addEventListener('change', () => {
            triggerRecordTableFilter();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            triggerRecordTableFilter();
        });
    }

    if (filterPriest){
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

    let filterStart = moment('01-01-1900');
    let filterEnd = moment();

    function handleNewDateRange(start, end, targetID) {
        filterStart = start;
        filterEnd = end;

        const dateRangeStr = start.format('MM/DD/YYYY') + ' - ' + end.format('MM/DD/YYYY');
        console.log("Date Range String: ", dateRangeStr); 
        $(`#${targetID}`).val(dateRangeStr);
        const selectedType = $('#dataFilterDropdown').val();
        
        loadReport(selectedType);
    }

    function initDateRangePicker(targetID) {
        $(`#${targetID}`).daterangepicker({
            startDate: filterStart,
            endDate: filterEnd,
            format: 'MM/DD/YYYY',
            ranges: {
                'All Time': [moment('01-01-1900'), moment()],
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            }
        }, function(start, end) {
            console.log("Start: ", start, "End: ", end)
            handleNewDateRange(start, end, targetID);
        });
    }


    $('#dataFilterDropdown').trigger('change');

    document.querySelectorAll('.clearFilters').forEach(button => {
        button.addEventListener('click', function () {
            const selectedType = $('#dataFilterDropdown').val();
            console.log("Clear Button Pressed:", selectedType);

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
                $('#priestDropdown').trigger('change');
            }

            if (selectedType === 'priest') {
                $('#positionFilter').val('');
                $('#statusFilter').val('');
                $('#positionFilter').trigger('change');
                $('#statusFilter').trigger('change');
            }

            if (selectedType === 'request') {
                $('#requestDateRange').val('');
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

});
