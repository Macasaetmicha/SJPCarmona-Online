
document.addEventListener('DOMContentLoaded', function () {

    const modal = document.getElementById('smsRecoveryModal');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    const sendSMSBtn = document.getElementById('sendSMSBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const updatePhoneBtn = document.getElementById('updatePhoneBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const otpTimer = document.getElementById('otpTimer');

    const sendSMSLoading = document.getElementById('sendSMSLoading');
    const recovemailBtn = document.getElementById('recovemailBtn');
    const emailLoading = document.getElementById('emailLoading');

    let countdownInterval;
    let usingEmail = false;

    function showStep(stepElement) {
        [step1, step2].forEach(s => s.classList.add('d-none'));
        stepElement.classList.remove('d-none');
    }

    function startOtpCountdown(seconds = 60) {
        let timeLeft = seconds;
        resendOtpBtn.disabled = true;

        otpTimer.textContent = `01:00`;
        countdownInterval = setInterval(() => {
            timeLeft--;
            const min = String(Math.floor(timeLeft / 60)).padStart(2, '0');
            const sec = String(timeLeft % 60).padStart(2, '0');
            otpTimer.textContent = `${min}:${sec}`;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                resendOtpBtn.disabled = false;
                otpTimer.textContent = `00:00`;
            }
        }, 1000);
    }

    modal.addEventListener('shown.bs.modal', function () {
        showStep(step1);
        sendSMSBtn.disabled = false;
    });

    document.getElementById('sendSMSBtn').addEventListener('click', () => {
        sendSMSBtn.disabled = true;
        sendSMSLoading.classList.remove('d-none');

        console.log("Button Pressed")
        const userId = document.getElementById('sendSMSBtn').dataset.userId;
        const phone = document.getElementById('fullPhoneInput').value.trim();

        if (!phone) {
            toastr.warning('Please enter your phone number.');
            return;
        }

        fetch('/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, phone: phone }),
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                toastr.success('OTP sent! Check your phone.');
                showStep(step2);
            } else {
                toastr.error('Error: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(() =>toastr.error('Network error. Please try again.'))
        .finally(() => {
            sendSMSBtn.disabled = false;
            sendSMSLoading.classList.add('d-none');
        });
        
    });

    document.getElementById('recovemailBtn').addEventListener('click', () => {
        recovemailBtn.style.pointerEvents = 'none';
        emailLoading.classList.remove('d-none');
        const userId = document.getElementById('sendSMSBtn').dataset.userId;

        fetch('/send-otp-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                toastr.success('OTP sent to your email.');
                showStep(step2);
                const instruction = document.getElementById('verifyInstruction');
                if (instruction) instruction.textContent = 'We sent an OTP to your email. Please enter it below.';
            } else {
                toastr.error('Error: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(() => toastr.error('Network error. Please try again.'))
        .finally(() => {
            recovemailBtn.style.pointerEvents = 'auto';
            emailLoading.classList.add('d-none');
        });
    });

    
    verifyOtpBtn.addEventListener('click', function () {
        const otpInputs = document.querySelectorAll('.otp-box');
        const userId = document.getElementById('sendSMSBtn').dataset.userId;
        const otp = Array.from(otpInputs).map(input => input.value).join('');

        if (otp.length !== 6) {
            toastr.error('Please enter a valid 6-digit OTP.');
            return;
        }

        fetch('/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp: otp , user_id:userId}) 
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                toastr.success('Successful Authentication!');
                window.location.href = '/recover_fido';
            } else {
                toastr.error('Error: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(() => {
            toastr.error('Network error. Please try again.');
        });
    });

    const otpInputs = document.querySelectorAll('.otp-box');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
    });

    showStep(step1);
});
