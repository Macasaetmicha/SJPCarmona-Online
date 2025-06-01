document.addEventListener('DOMContentLoaded', function () {
    $(document).on('click', '.update-status-btn', function () {
        const id = $(this).data('id');
        const status = $(this).data('status');
        const page = $(this).data('page'); 

        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you really want to cancel the request?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, cancel it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/edit-clientReq',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ id, status }),
                    success: function (response) {
                        Swal.fire(
                            'Deleted!',
                            'Request deleted successfully.',
                            'success'
                        );
                        $('#requestTable').DataTable().ajax.reload(null, false);
                    },
                    error: function (xhr, status, error) {
                        console.error('Error:', error);
                        Swal.fire(
                            'Error!',
                            'Failed to delete request.',
                            'error'
                        );
                    }
                });
            }
        });
    });
});
