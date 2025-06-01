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
    
    const buttons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' from all buttons
            buttons.forEach(btn => btn.classList.remove('active'));

            // Add 'active' to the clicked button
            button.classList.add('active');

            // Hide all content sections
            sections.forEach(section => section.classList.add('d-none'));

            // Show the selected section
            const targetId = button.getAttribute('data-target');
            const target = document.getElementById(targetId);
            if (target) {
                target.classList.remove('d-none');
            }
        });
    });

    document.getElementById("changeDeviceBtn").addEventListener("click", () => {
        Swal.fire({
            title: 'Change Registered Device?',
            text: "Your old device will no longer be usable for login.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, change it!',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {

                    $("#authenticateAccountModal").modal("show");

                   
                    // Swal.fire('Success', data.message || 'Device successfully changed.', 'success')
                    //     .then(() => window.location.href = "/");
                } catch (e) {
                    displayFailure();
                    console.error(e);
                    Swal.fire('Error', 'Something went wrong during device change.', 'error');
                }
            }
        });
    });

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    const maskedCurrentPhoneEl = document.getElementById('maskedCurrentPhone');
    const maskedCurrentEmailEl = document.getElementById('maskedCurrentEmail');

    const sendOtpPhoneBtn = document.getElementById('sendOtpPhoneBtn');
    const sendOtpEmailBtn = document.getElementById('sendOtpEmailBtn');

    const loadingPhone = document.getElementById('loadingPhone');
    const loadingEmail = document.getElementById('loadingEmail');

    let userId = null;
    let currentPhone = '';
    let currentEmail = '';

    let otpAttempts = 0;
    const maxOtpAttempts = 5;

    // On modal open or changePhoneBtn click: fetch user info, mask and display
    changePhoneBtn.addEventListener('click', () => {
        document.getElementById('modalHeader').textContent = 'Verify Current Contact';
        step1.classList.remove('d-none');
        step2.classList.add('d-none');
        step3.classList.add('d-none');

        // Clear OTP inputs & reset states as needed
        otpInputs.forEach(input => input.value = '');


        // Fetch user info
        fetch('/api_db/get-current-user')
            .then(res => res.json())
            .then(user => {
                userId = user.id;
                currentPhone = user.contact_number || '';
                currentEmail = user.email || '';

                console.log("Phone: ", currentPhone)
                console.log("Email: ", currentEmail)
                console.log("ID: ", userId)

                // Mask phone e.g. 09*******1234
                if (currentPhone.length === 11) {
                    maskedCurrentPhoneEl.textContent = currentPhone.slice(0, 2) + '*******' + currentPhone.slice(-2);
                } else {
                    maskedCurrentPhoneEl.textContent = 'Not available';
                }

                // Mask email: show first letter and domain e.g. j****@domain.com
                if (currentEmail) {
                    const [name, domain] = currentEmail.split('@');
                    if (name.length > 1) {
                        maskedCurrentEmailEl.textContent = name[0] + '****@' + domain;
                    } else {
                        maskedCurrentEmailEl.textContent = currentEmail;
                    }
                } else {
                    maskedCurrentEmailEl.textContent = 'Not available';
                }
            })
            .catch(() => {
                toastr.error('Failed to fetch user information.');
                maskedCurrentPhoneEl.textContent = 'Unavailable';
                maskedCurrentEmailEl.textContent = 'Unavailable';
            });
    });

    // Helper: disable buttons and show spinner
    function setLoading(button, spinner, isLoading) {
        button.disabled = isLoading;
        if (isLoading) {
            spinner.classList.remove('d-none');
        } else {
            spinner.classList.add('d-none');
        }
    }

    // Send OTP to phone
    sendOtpPhoneBtn.addEventListener('click', () => {
        if (!currentPhone) {
            toastr.error('No registered phone number found.');
            return;
        }
        setLoading(sendOtpPhoneBtn, loadingPhone, true);
        
        console.log("Phone: ", currentPhone)
        console.log("ID: ", userId)
        
        fetch('/send-otp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: userId, phone: currentPhone }),
        })
        .then(res => res.json())
        .then(data => {
            setLoading(sendOtpPhoneBtn, loadingPhone, false);
            if (data.message) {
                toastr.success('OTP sent to your current phone number.');
                step1.classList.add('d-none');
                document.getElementById('modalHeader').textContent = 'Enter OTP';
                step2.classList.remove('d-none');
            } else {
                toastr.error('Error: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(() => {
            setLoading(sendOtpPhoneBtn, loadingPhone, false);
            toastr.error('Network error. Please try again.');
        });
    });

    // Send OTP to email
    sendOtpEmailBtn.addEventListener('click', () => {
        if (!currentEmail) {
            toastr.error('No registered email found.');
            return;
        }
        setLoading(sendOtpEmailBtn, loadingEmail, true);

        console.log("Email: ", currentEmail)
        console.log("ID: ", userId)

        fetch('/send-otp-email', {  // your email OTP endpoint
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: userId, email: currentEmail }),
        })
        .then(res => res.json())
        .then(data => {
            setLoading(sendOtpEmailBtn, loadingEmail, false);
            if (data.message) {
                toastr.success('OTP sent to your registered email.');
                step1.classList.add('d-none');
                document.getElementById('modalHeader').textContent = 'Enter OTP';
                step2.classList.remove('d-none');
            } else {
                toastr.error('Error: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(() => {
            setLoading(sendOtpEmailBtn, loadingEmail, false);
            toastr.error('Network error. Please try again.');
        });
    });

    const otpInputs = document.querySelectorAll('#otpBoxContainer .otp-box');

    otpInputs.forEach((input, idx) => {
    input.addEventListener('input', () => {
        if (input.value.length === 1 && idx < otpInputs.length - 1) {
        otpInputs[idx + 1].focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
        otpInputs[idx - 1].focus();
        }
    });
    });

    document.getElementById('verifyOtpBtn').addEventListener('click', () => {
        const enteredOtp = Array.from(otpInputs).map(input => input.value).join('');

        if (enteredOtp.length !== 6 || !/^\d{6}$/.test(enteredOtp)) {
            toastr.error('Please enter a valid 6-digit OTP.');
            return;
        }

        // Check for lockout before making request
        const lockoutExpiry = localStorage.getItem('otpLockoutExpiry');
        if (lockoutExpiry && Date.now() < parseInt(lockoutExpiry)) {
            toastr.error('You are temporarily locked out. Please try again later.');
            return;
        }

        // Send OTP to backend
        fetch('/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp: enteredOtp, user_id: userId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // OTP is correct
                step2.classList.add('d-none');
                document.getElementById('modalHeader').textContent = 'Enter New Number';
                step3.classList.remove('d-none');
            } else {
                otpAttempts++;
                if (otpAttempts >= maxOtpAttempts) {
                    const lockoutDurationMs = 5 * 60 * 1000; // 5 minutes
                    localStorage.setItem('otpLockoutExpiry', (Date.now() + lockoutDurationMs).toString());

                    toastr.error('Maximum OTP attempts reached. Please try again after 5 minutes.');

                    otpInputs.forEach(input => {
                        input.value = '';
                        input.disabled = true;
                    });
                    document.getElementById('verifyOtpBtn').disabled = true;
                    return;
                }

                const remaining = maxOtpAttempts - otpAttempts;
                toastr.error(`Incorrect OTP. You have ${remaining} attempt${remaining === 1 ? '' : 's'} left.`);
            }
        })
        .catch(() => {
            toastr.error('Network error. Please try again.');
        });
    });


    updatePhoneBtn.addEventListener('click', async () => {
        const newPhone = newPhoneInput.value.trim();
        if (!isValidPhone(newPhone)) {
            toastr.error('Invalid phone number format. Use 09xxxxxxxxx.');
            return;
        }

        if (newPhone === currentPhone) {
            toastr.error('New phone number must be different from the current one.');
            return;
        }

        try {
            const res = await fetch('/api_db/check-phone', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ phone: newPhone })
            });
            const data = await res.json();

            if (!res.ok) {
                toastr.error(data.message || 'Error checking phone number.');
                return;
            }

            if (data.exists) {
                toastr.error('This phone number is already registered with another account.');
                return;
            }

            const updateRes = await fetch('/api_db/update-phone', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ contact_number: newPhone })
            });

            if (!updateRes.ok) {
                const errData = await updateRes.json();
                toastr.error(errData.message || 'Failed to update phone number.');
                return;
            }

            toastr.success('Recovery phone number updated successfully.');
            const maskedNumber = '*'.repeat(newPhone.length - 4) + newPhone.slice(-4);
            document.getElementById('phoneRecovNumber').textContent = maskedNumber;

            const modal = bootstrap.Modal.getInstance(document.getElementById('changePhoneModal'));
            modal.hide();
        } catch (e) {
            toastr.error('Unexpected error. Please try again later.');
            console.error(e);
        }
    });

});

async function onAuthenticateButtonClicked() {
    displayInProgress();

    try {
        let request = await fetch('/api/update/begin', {
            method: 'POST',
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

        let result = await fetch('/api/update/complete', {
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

        const data = await result.json();
        toastr.success(data.message || "Device updated successfully!");
        $("#authenticateAccountModal").modal("hide");

    } catch {
        displayFailure();
        let errorMessage = "Failed to retrieve registration data from the server. URL: " + request.url +
            " Status: " + request.status + " Response Body: " + await request.text();
        throw new Error(errorMessage);
    }
    
}

function isValidPhone(phone) {
    return /^09\d{9}$/.test(phone);
}
