document.addEventListener("DOMContentLoaded", function () {
    document.body.addEventListener("click", function(event) {
        const button = event.target.closest('button[data-page^="delete"]');
        if (!button) return;

        console.log("Delete Pressed")

        event.preventDefault();
        
        const id = button.dataset.id;
        const ceremony = button.dataset.page.replace('delete', '').toLowerCase(); 
        const deleteUrl = `/delete-${ceremony}/${id}`; 

        if (!id || !ceremony) {
            console.error("Delete action failed: Missing ID or ceremony type.");
            return;
        }

        Swal.fire({
            title: `Delete ${ceremony}?`,
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(result => {
            if (result.isConfirmed) deleteRecord(deleteUrl, ceremony);
        });
    });
});

async function deleteRecord(url, ceremony) {
    try {
        console.log(`Deleting: ${url}`);
        const response = await fetch(url, { method: 'DELETE' });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.message || "Deletion failed.");

        Swal.fire({ title: 'Deleted!', text: 'Record removed.', icon: 'success' })
            .then(() => $(`#${ceremony}Table`).DataTable().ajax.reload(null, false)); 

    } catch (error) {
        console.error('Deletion error:', error);
        Swal.fire({ title: 'Error!', text: error.message || 'Failed to delete.', icon: 'error' });
    }
}