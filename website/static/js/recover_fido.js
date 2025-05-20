import * as fidoLayout from "./fido-layout.js";
import {
    create,
    parseCreationOptionsFromJSON,
} from './webauthn-json.browser-ponyfill.js';

const buttonDiv = document.getElementById("button-div");
const authenticateButton = document.getElementById("authenticate-button-recover");

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

async function onAuthenticateButtonClicked() {
    displayInProgress();
    const userId = document.getElementById('authenticate-button-recover').dataset.userId;

    let request;  // declare here for catch scope

    try {
        request = await fetch('/api/recover/begin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });

        let json = await request.json();
        let options = parseCreationOptionsFromJSON(json);

        let response = null;
        try {
            response = await create(options);
        } catch (e) {
            displayFailure();
            throw Error("The browser could not process the cryptographic challenge. The most likely cause is that the " +
                "user didn't allow the request. Raw Error: " + e);
        }

        let result = await fetch('/api/recover/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                response,   // spread the FIDO client response fields
                user_id: userId  // include the user ID
            }),
        });

        if (!result.ok) {
            displayFailure();
            let errorMessage = "The server rejected the signed challenge. URL: " + request.url +
                " Status: " + request.status + " Response Body: " + await request.text();
            throw new Error(errorMessage);
        }

        const data = await result.json();
        if (data.status === "OK") {
            window.location = "/login";
        } else {
            displayFailure();
        }

    } catch (err) {
        displayFailure();

        let errorMessage = "An error occurred.";
        if (request) {
            errorMessage = "Failed to retrieve registration data from the server. URL: " + request.url +
                " Status: " + request.status;
        }
        console.error(errorMessage, err);

        // optionally throw or just log
        // throw new Error(errorMessage);
    }
}
