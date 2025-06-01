let startDate = null;
let endDate = null;

// Extend DataTables search to filter by date range
$.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
    // Only apply to the auditLogTable
    if (settings.nTable.id !== 'auditLogTable') return true;

    const dateStr = data[0]; // column 0 = changed_at (formatted)
    const date = moment(dateStr, 'MMM DD, YYYY, hh:mm A'); // adjust format as needed

    if (!startDate || !endDate) return true;
    return date.isBetween(startDate, endDate, 'day', '[]');
});

// Initialize the date range picker
$('#dateRange').daterangepicker({
    autoUpdateInput: false,
    locale: { cancelLabel: 'Clear' }
});

// Apply filter on selection
$('#dateRange').on('apply.daterangepicker', function (ev, picker) {
    startDate = picker.startDate;
    endDate = picker.endDate;
    $(this).val(startDate.format('YYYY-MM-DD') + ' to ' + endDate.format('YYYY-MM-DD'));
    tables.auditLogTable.draw();
});

// Clear filter
$('#dateRange').on('cancel.daterangepicker', function () {
    $(this).val('');
    startDate = endDate = null;
    tables.auditLogTable.draw();
});
