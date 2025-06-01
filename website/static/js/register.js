import * as fidoLayout from "./fido-layout.js";
import {
    create,
    parseCreationOptionsFromJSON,
} from './webauthn-json.browser-ponyfill.js';

const buttonDiv = document.getElementById("button-div");
const authenticateButton = document.getElementById("authenticate-button");


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
    if (authenticateButton) {
        authenticateButton.onclick = onAuthenticateButtonClicked;
    }

    $("#agreeTermsBtn").on("click", function () {
        $("#termsCheckbox").prop("checked", true).trigger("change");
    });

    $("#declineTermsBtn").on("click", function () {
        $("#termsCheckbox").prop("checked", false).trigger("change");
    });

    $("#signupForm").on("submit", function (event) {
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

        if (!$("#termsCheckbox").is(":checked")) {
            isValid = false;
            toastr.warning("You must agree to the Terms and Conditions before signing up.");
        }

        if (!isValid) {
            toastr.warning("Please fill in the required fields: " + missingFields.join(", "));
            return false;
        }

        let formData = $(this).serialize();
        console.log("Data being sent:", formData);

        $.ajax({
            type: "POST",
            url: "/signup-user",
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
                        $("#authenticateModal").modal("show");
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

});


async function onAuthenticateButtonClicked() {
    window.focus(); 
    await new Promise(resolve => setTimeout(resolve, 100));

    displayInProgress();
    const userId = $('#authenticate-button').data('user-id');
    console.log("Register Beginning")
    let request = await fetch('/api/register/begin', {
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

    if (request.ok) {
        console.log("Register Begin Success")
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
    let result = await fetch('/api/register/complete', {
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

    window.location = "/";
}
