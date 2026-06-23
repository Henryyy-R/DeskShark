window.startClerk = async () => {
    try {
        // 1. Ask the backend for the key
        const response = await fetch('http://localhost:5000/api/config');
        const config = await response.json();

        // 2. Build the script tag in memory
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js";
        script.setAttribute('data-clerk-publishable-key', config.clerkPublishableKey);
        script.crossOrigin = "anonymous";
        script.async = true;

        // 3. Tell the browser what to do once the script finishes loading
        script.onload = async () => {
            const Clerk = window.Clerk;
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
                        const signInAttempt = await Clerk.client.signIn.create({ identifier, password });
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
        };

        // 4. Inject it into the page
        document.body.appendChild(script);

    } catch (err) {
        console.error('Error starting Clerk or fetching config: ', err);
    }
};

function handleUserRedirect() {
    const targetPath = '/frontend/app.html';
    if (!window.location.pathname.includes('app.html')) {
        window.location.href = targetPath;
    }
}

window.addEventListener('load', window.startClerk);