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

    const existingPhoneInput = document.getElementById('existingPhoneInput');
    const sendOtpBtn = document.getElementById('sendOtpBtn');

    const otpInput = document.getElementById('otpInput');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const otpTimerEl = document.getElementById('otpTimer');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const changePhoneBtn = document.getElementById('changePhoneBtn');
    const closeModal = document.getElementById('close-modal');

    const newPhoneInput = document.getElementById('newPhoneInput');
    const updatePhoneBtn = document.getElementById('updatePhoneBtn');

    let otpCountdown;
    let otpTimeLeft = 60; 
    let currentPhone = ''; 

    let otpAttempts = 0;
    const maxOtpAttempts = 5;
    let otpResetTimeout;

    changePhoneBtn.addEventListener('click', () => {
        document.getElementById('modalHeader').textContent = 'Verify Current Phone Number';
        step1.classList.remove('d-none');
        step2.classList.add('d-none');
        step3.classList.add('d-none');

        // Clear input fields
        existingPhoneInput.value = '';
        otpInput.value = '';
        newPhoneInput.value = '';

        // Reset OTP timer if running
        clearInterval(otpCountdown);
        otpTimerEl.textContent = '';
        resendOtpBtn.disabled = true;
    })

    let userId = null; 
    sendOtpBtn.addEventListener('click', () => {
        const enteredPhone = existingPhoneInput.value.trim();
        const now = Date.now();
        const lockoutExpiry = localStorage.getItem('otpLockoutExpiry'); 
        console.log("LockoutExpiry", lockoutExpiry)

        if (!isValidPhone(enteredPhone)) {
            toastr.error('Invalid phone number format. Use 09xxxxxxxxx.');
            return;
        }

        if (lockoutExpiry && now < parseInt(lockoutExpiry, 10)) {
            console.log("Still not allowed")
            const waitSeconds = Math.ceil((parseInt(lockoutExpiry, 10) - now) / 1000);
            toastr.error(`Maximum OTP attempts reached. Please try again after ${waitSeconds} seconds.`);
            return; // Prevent going to Step 2
        }

        $.ajax({
            url: '/api_db/get-current-user',
            method: 'GET',
            success: function(user) {
                console.log(user)
                userId = user.id;
                currentPhone = user.contact_number;
                fetch('/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, phone: enteredPhone }),
                })
                .then(res => res.json())
                .then(data => {
                    if (data.message) {
                        // Show OTP step and start timer
                        step1.classList.add('d-none');
                        document.getElementById('modalHeader').textContent = 'Enter OTP';
                        step2.classList.remove('d-none');
                        
                        toastr.success('OTP sent to your current phone number.');
                        
                    } else {
                        toastr.error('Error: ' + (data.error || 'Unknown error'));
                    }
                })
                .catch(() =>toastr.error('Network error. Please try again.'));

                // console.log("Fetched Current Phone:", currentPhone);
                // console.log("Entered Number:", enteredPhone);

                // if (enteredPhone !== currentPhone) {
                //     toastr.error('Entered number does not match your current phone number.');
                //     return;
                // }

                
            },
            error: function(err) {
                console.error("Failed to fetch user info:", err);
                toastr.error('Error fetching user phone number.');
            }
        });
    });

    // resendOtpBtn.addEventListener('click', () => {
    //     otpInput.value = '';
    //     startOtpTimer();
    //     toastr.success('OTP resent.');
    //     resendOtpBtn.disabled = true;
    // });

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

        if (enteredOtp !== '123456') {
            otpAttempts++;


            if (otpAttempts >= maxOtpAttempts) {
                const lockoutDurationMs = 5 * 60 * 1000; // 5 minutes
                const expiry = Date.now() + lockoutDurationMs;
                localStorage.setItem('otpLockoutExpiry', expiry.toString());

                toastr.error('Maximum OTP attempts reached. Please try again after 5 minutes.');

                // // Calculate unlock timestamp
                // const unlockTime = Date.now() + lockoutDurationMs;
                // localStorage.setItem('otpUnlockTime', unlockTime);

                otpInputs.forEach(input => {
                    input.value = '';
                    input.disabled = true;
                });
                document.getElementById('verifyOtpBtn').disabled = true;

                // startLockoutTimer(unlockTime);
                return;
            }


            const remaining = maxOtpAttempts - otpAttempts;
            toastr.error(`Incorrect OTP. You have ${remaining} attempt${remaining === 1 ? '' : 's'} left.`);
            return;
        }

        if (enteredOtp.length !== 6) {
            toastr.error('Please enter a valid 6-digit OTP.');
            return;
        }

        // Send OTP to backend (endpoint: /verify-otp) — implement separately
        fetch('/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp: enteredOtp , user_id:userId})  // optionally add user_id
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                // OTP is correct
                step2.classList.add('d-none');
                step3.classList.remove('d-none');
                // clearInterval(otpCountdown);
            } else {
                toastr.error('Error: ' + (data.error || 'Unknown error'));
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

    const unlockTime = localStorage.getItem('otpUnlockTime');

    if (unlockTime && Date.now() < unlockTime) {
        // still locked out, disable inputs and start countdown
        otpInputs.forEach(input => input.disabled = true);
        document.getElementById('verifyOtpBtn').disabled = true;
        startLockoutTimer(Number(unlockTime));
    } else {
        // not locked or time passed, clear lockout
        localStorage.removeItem('otpUnlockTime');
        otpInputs.forEach(input => input.disabled = false);
        document.getElementById('verifyOtpBtn').disabled = false;
        otpAttempts = 0; // reset attempts here if needed
    }

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

function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function startOtpTimer() {
    otpTimeLeft = 60; 
    resendOtpBtn.disabled = true;
    otpTimerEl.textContent = formatTime(otpTimeLeft);

    clearInterval(otpCountdown);
    clearTimeout(otpResetTimeout);

    otpCountdown = setInterval(() => {
        otpTimeLeft--;
        otpTimerEl.textContent = formatTime(otpTimeLeft);

        if (otpTimeLeft <= 0) {
        clearInterval(otpCountdown);
        resendOtpBtn.disabled = false;
        }
    }, 1000);

    otpResetTimeout = setTimeout(() => {
        otpAttempts = 0;
        verifyOtpBtn.disabled = false;
        otpInputs.forEach(input => input.disabled = false);
        toastr.info('You can try verifying the OTP again.');
    }, 300000);
}

function startLockoutTimer(unlockTime) {
    const otpTimerEl = document.getElementById('otpTimer');
    
    function updateTimer() {
        const timeLeft = Math.floor((unlockTime - Date.now()) / 1000);
        if (timeLeft <= 0) {
        otpTimerEl.textContent = '';
        otpInputs.forEach(input => input.disabled = false);
        document.getElementById('verifyOtpBtn').disabled = false;
        otpAttempts = 0; // reset attempts here too
        localStorage.removeItem('otpUnlockTime');
        clearInterval(timerInterval);
        } else {
        const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const seconds = String(timeLeft % 60).padStart(2, '0');
        otpTimerEl.textContent = `Try again in ${minutes}:${seconds}`;
        }
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
}
