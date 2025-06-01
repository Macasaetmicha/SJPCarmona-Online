$(document).ready(function () {
    $.ajax({
        url: '/check-avail-dates',
        type: 'GET',
        success: function (response) {
            const unavailableDates = response.map(date => new Date(date).toISOString().split('T')[0]);
            const today = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(today.getDate() + 3);
            console.log(unavailableDates)

            $('#pickupDateClient').datepicker({
                format: 'yyyy-mm-dd',
                autoclose: true,
                startDate: new Date(),
                beforeShowDay: function (date) {
                    const formattedDate = date.toISOString().split('T')[0];
                    const day = date.getDay();

                    if (date < threeDaysFromNow) {
                        return { enabled: false, tooltip: "Unavailable - Too Soon" };
                    }

                    if (unavailableDates.includes(formattedDate)) {
                        return { enabled: false, tooltip: "Unavailable - Booked" };
                    }

                    if (day === 3 || day === 4 || day === 5) {
                        return { enabled: true };
                    }

                    return { enabled: false };
                }
            });
        },
        error: function (xhr, status, error) {
            console.error('Error fetching unavailable dates:', error);
        }
    });
});
