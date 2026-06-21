window.startClerk = async () => {
    const Clerk = window.Clerk;
    try {
        await Clerk.load();
        if (Clerk.user) {
            handleUserRedirect();
            return;
        }

        const loginForm = document.getElementById('custom-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const identifier = document.getElementById('identifier').value;
                const password = document.getElementById('password').value;
                const errorDiv = document.getElementById('login-error');
                errorDiv.classList.add('d-none');
                
                try {
                    const signInAttempt = await Clerk.client.signIn.create({ identifier: identifier, password: password });
                    if (signInAttempt.status === 'complete') {
                        await Clerk.setActive({ session: signInAttempt.createdSessionId });
                        window.location.reload();
                    } else {
                        errorDiv.textContent = "Additional verification required.";
                        errorDiv.classList.remove('d-none');
                    }
                } catch (err) {
                    errorDiv.textContent = err.errors ? err.errors[0].longMessage : "Invalid credentials.";
                    errorDiv.classList.remove('d-none');
                }
            });
        }
    } catch (err) {
        console.error('Error starting Clerk: ', err);
    }
};

function handleUserRedirect() {
    const targetPath = '/frontend/app.html';
    if (!window.location.pathname.includes('app.html')) {
        window.location.href = targetPath;
    }
}
window.addEventListener('load', window.startClerk);