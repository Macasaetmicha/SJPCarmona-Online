document.addEventListener("DOMContentLoaded", () => {
    const recoveryEmailInput = document.getElementById('recoveryEmail');
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    const forgotPassBtn = document.getElementById('forgotPassBtn');


    forgotPassBtn.addEventListener('click', () => {
        recoveryEmailInput.value = ''; 
    });

    sendEmailBtn.addEventListener('click', async () => {
        const email = recoveryEmailInput.value.trim();

        if (!email) {
            toastr.error('Please enter your email address.');
            return;
        }

        sendEmailBtn.disabled = true;
        sendEmailBtn.textContent = 'Sending...'; 

        try {
            const res = await fetch('/api_db/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                toastr.error(data.message || 'Failed to send reset email.');
                return;
            }

            toastr.success('A password reset link has been sent to your email.');
            $("#forgotPassModal").modal("hide");
        } catch (err) {
            console.error(err);
            toastr.error('Unexpected error. Please try again later.');
        } finally {
            sendEmailBtn.disabled = false;
            sendEmailBtn.textContent = 'Send Email';
        }
    });
});
