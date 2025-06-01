let startDate = null;
let endDate = null;

$.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
    if (settings.nTable.id !== 'auditLogTable') return true;

    const dateStr = data[0];
    const date = moment(dateStr, 'MMM DD, YYYY, hh:mm A');

    if (!startDate || !endDate) return true;
    return date.isBetween(startDate, endDate, 'day', '[]');
});

$('#dateRange').daterangepicker({
    autoUpdateInput: false,
    locale: { cancelLabel: 'Clear' }
});

$('#dateRange').on('apply.daterangepicker', function (ev, picker) {
    startDate = picker.startDate;
    endDate = picker.endDate;
    $(this).val(startDate.format('YYYY-MM-DD') + ' to ' + endDate.format('YYYY-MM-DD'));
    tables.auditLogTable.draw();
});

$('#dateRange').on('cancel.daterangepicker', function () {
    $(this).val('');
    startDate = endDate = null;
    tables.auditLogTable.draw();
});
