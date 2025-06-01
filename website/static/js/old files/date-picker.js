$(document).ready(function () {
    $('.datepicker-custom').datepicker({
        format: 'mm/dd/yyyy',
        autoclose: true,
        endDate: new Date()
    });

    $('#baptDatePicker').datepicker({
        format: 'mm/dd/yyyy',
        autoclose: true,
        todayHighlight: true,
        endDate: new Date() 
    });
});