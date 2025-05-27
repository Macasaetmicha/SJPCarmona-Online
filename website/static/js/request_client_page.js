document.addEventListener('DOMContentLoaded', function () {
 $(document).on('click', '.update-status-btn', function () {
        const id = $(this).data('id');
        const status = $(this).data('status');
        const page = $(this).data('page'); 

        console.log("UPDATING THE STATUS")
    
        if (confirm('Are you sure you want to change the status?')) {
            $.ajax({
                url: `/edit-clientReq`, 
                type: 'POST',
                data: { id, status },
                success: function (response) {
                    alert('Status updated successfully!');
                    // Optionally refresh table or UI here
                },
                error: function () {
                    alert('Failed to update status.');
                }
            });
        }
    });
});
