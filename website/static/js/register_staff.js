import * as fidoLayout from "./fido-layout.js";
import {
    create,
    parseCreationOptionsFromJSON,
} from './webauthn-json.browser-ponyfill.js';

const buttonDiv = document.getElementById("button-div");
const authenticateButton = document.getElementById("authenticate-button");

authenticateButton.onclick = onAuthenticateButtonClicked;

function displayFailure() {
    fidoLayout.displayFailure("FIDO setup failed");

    authenticateButton.innerText = "Try Again";
    buttonDiv.style.display = "block";
}

function displayInProgress() {
    fidoLayout.displayInProgress();
    buttonDiv.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
    $('#addAccountModal').on('hidden.bs.modal', function () {
        $('#accountAddForm')[0].reset();
    });

    $('#accountTable tbody').on('click', '.account-edit-btn ', function (e) {
        e.preventDefault();

        let table = tables.accountTable;
        let row = table.row($(this).closest('tr'));
        let data = row.data();

        $('#editAccountModal input[name="fname"]').val(data.first_name);
        $('#editAccountModal input[name="mname"]').val(data.middle_name);
        $('#editAccountModal input[name="lname"]').val(data.last_name);
        $('#editAccountModal input[name="username"]').val(data.username);
        $('#editAccountModal input[name="contact_number"]').val(data.contact_number);
        $('#editAccountModal input[name="email"]').val(data.email);
        $('#editAccountModal select[name="role"]').val(data.role);
        console.log("This is the role ", data.role)

        $('#editAccountModal').data('user-id', data.id);
        console.log("THIS IS THE USER-ID", data.id)

        $('#editAccountModal').modal('show');
    });

    $('#accountTable tbody').on('click', '.delete-btn-account', function (e) {
        e.preventDefault();

        const recordId = $(this).data('id');
        if (!recordId) {
            console.error("Delete action failed: Missing ID.");
            return;
        }

        Swal.fire({
            title: `Delete User?`,
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(result => {
            if (result.isConfirmed) {
                deleteUser(recordId);
            }
        });
    });

    $("#accountAddForm").on("submit", function (event) {
        event.preventDefault();

        let isValid = true;
        let missingFields = [];

        $(this).find("[required]").each(function () {
            let value = $(this).val();
            if (!value || value.trim() === "") {
                isValid = false;
                missingFields.push($(this).attr("name"));
                $(this).addClass("error-highlight");
            } else {
                $(this).removeClass("error-highlight");
            }
        });

        if (!isValid) {
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }

        let formData = $(this).serialize();
        console.log("Data being sent:", formData);

        $.ajax({
            type: "POST",
            url: "/submit-account",
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);

                if (response.message && response.type) {
                    toastr[response.type](response.message);

                    if (response.status === "ok") {
                        const tempId = response.temp_id;
                        console.log("Proceeding to next step");
                        $('#authenticate-button').data('user-id', tempId);

                        $("#addAccountModal").modal("hide");
                        $("#authenticateAccountModal").modal("show");
                    }
                } else {
                    toastr.error("Unexpected response format!");
                }
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error
                    ? xhr.responseJSON.error
                    : "An error occurred while submitting the account.";
                toastr.error(errorMessage);
            }
        });
    });

    $("#accountEditForm").on("submit", function (event) {
        event.preventDefault();

        let isValid = true;
        let missingFields = [];

        $(this).find("[required]").each(function () {
            let value = $(this).val();
            if (!value || value.trim() === "") {
                isValid = false;
                missingFields.push($(this).attr("name"));
                $(this).addClass("error-highlight");
            } else {
                $(this).removeClass("error-highlight");
            }
        });

        if (!isValid) {
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }

        let formData = $(this).serialize();
        console.log("Data being sent:", formData);
        let userId = $('#editAccountModal').data('user-id');
        console.log("THIS IS THE USER ID WHEN PASSED", userId)

        $.ajax({
            type: "PUT",
            url: `/edit-account/${userId}`,
            data: formData,
            success: function (response) {
                console.log("Server Response:", response);

                if (response.message && response.type) {
                    toastr[response.type](response.message);

                    if (response.type === "success") {
                        $("#editAccountModal").modal("hide");
    
                        $('#accountTable').DataTable().ajax.reload(null, false);
                       
                    }
                } else {
                    toastr.error("Unexpected response format!");
                }
            },
            error: function (xhr) {
                console.error("AJAX Error:", xhr);
                let errorMessage = xhr.responseJSON && xhr.responseJSON.error
                    ? xhr.responseJSON.error
                    : "An error occurred while updating the account.";
                toastr.error(errorMessage);
            }
        });
    });
});


async function onAuthenticateButtonClicked() {
    window.focus(); 
    await new Promise(resolve => setTimeout(resolve, 100));

    displayInProgress();
    const userId = $('#authenticate-button').data('user-id');

    let request = await fetch('/api/register-staff/begin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: userId 
        })
    });

    if (!request.ok) {
        displayFailure();
        let errorMessage = "Failed to retrieve registration data from the server. URL: " + request.url +
            " Status: " + request.status + " Response Body: " + await request.text();
        throw new Error(errorMessage);
    }
    console.log('TRYING TO GET JSON');

    let json = await request.json();
    let options = parseCreationOptionsFromJSON(json);

    let response = null;
    console.log('TRYING TO GET RESPONSE');
    try {
        response = await create(options);
        console.log('GOT THE RESPONSE')
        console.log(response)
    } catch (e) {
        displayFailure();
        throw Error("The browser could not process the cryptographic challenge. The most likely cause is that the " +
            "user didn't allow the request. Raw Error: " + e);
    }
    console.log('GOINT TO REGISTER COMPLETE')
    let result = await fetch('/api/register-staff/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            response, 
            user_id: userId 
        }),
    });
    let data = await result.json();
    if (!result.ok) {
        displayFailure();
        let errorMessage = "The server rejected the signed challenge. URL: " + result.url +
            " Status: " + result.status + " Response Body: " + JSON.stringify(data);
        toastr.error(errorMessage);
        throw new Error(errorMessage);
    }

    if (data.message && data.type) {
        toastr[data.type](data.message);
    } else {
        toastr.success("Authentication successful.");
    }

    $("#accountAddForm")[0].reset();
    $("#authenticateAccountModal").modal("hide");
    $('#accountTable').DataTable().ajax.reload(null, false);
}

async function deleteUser(recordId){
    try {
        const response = await fetch(`/api/accounts/${recordId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (response.ok) {
            if (data.message && data.type) {
                toastr[data.type](data.message); 
                $('#accountTable').DataTable().ajax.reload(null, false);
            } else {
                toastr.success(data.message || "User deleted successfully");
                $('#accountTable').DataTable().ajax.reload(null, false);
            }
        } else {
            let errorMessage = data && data.error ? data.error : "An error occurred while deleting the account record.";
            toastr.error(errorMessage);
        }
    } catch (err) {
        toastr.error("An error occurred: " + err.message);
    }
}



