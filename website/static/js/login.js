import * as fidoLayout from "./fido-layout.js";
import {
    get,
    parseRequestOptionsFromJSON,
} from './webauthn-json.browser-ponyfill.js';

const authenticateButton = document.getElementById("authenticate-button");
const buttonDiv = document.getElementById("button-div");

authenticateButton.onclick = onAuthenticateButtonClicked;

function displayFailure() {
    fidoLayout.displayFailure("Authentication failed");

    authenticateButton.innerText = "Try Again";
    authenticateButton.classList.remove("d-none");
    buttonDiv.classList.remove("d-none");

}

function displayInProgress() {
    fidoLayout.displayInProgress();
    authenticateButton.classList.add("d-none");
    buttonDiv.classList.add("d-none");
}

async function onAuthenticateButtonClicked() {
    displayInProgress();

    let request = await fetch('/api/authenticate/begin', {
        method: 'POST',
    });
    if (!request.ok) {
        displayFailure();
        let errorMessage = "Failed to retrieve authentication data from the server. URL: " + request.url +
            " Status: " + request.status + " Response Body: " + await request.text();
        throw new Error(errorMessage);
    }
    let json = await request.json();
    let options = parseRequestOptionsFromJSON(json);

    let response = null;
    try {
        response = await get(options);
    } catch (e) {
        displayFailure();
        throw Error("The browser could not process the cryptographic challenge. The most likely cause is that the " +
            "user didn't allow the request. Raw Error: " + e);
    }

    let result = await fetch('/api/authenticate/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
    });

    if (!result.ok) {
        displayFailure();
        let errorMessage = "The server rejected the signed challenge. URL: " + request.url +
            " Status: " + request.status + " Response Body: " + await request.text();
        throw new Error(errorMessage);
    }

    let resultData = await result.json();
    console.log(resultData);

    if (resultData.status === "OK") {
        const role = resultData.role;

        if (role === "admin") {
            window.location = "/admin/dashboard";
        } else if (role === "staff") {
            window.location = "/admin/dashboard";
        } else {
            window.location = "/home"; 
        }
    } else {
        displayFailure();
    }
}
