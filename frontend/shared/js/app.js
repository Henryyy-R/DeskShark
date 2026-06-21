window.startApp = async () => {
    try {
        await window.Clerk.load();

        if (!window.Clerk.user) {
            window.location.href = '/frontend/index.html';
            return;
        }

        const userButtonDiv = document.getElementById('user-button');
        if (userButtonDiv) {
            window.Clerk.mountUserButton(userButtonDiv, {
                afterSignOutUrl: '/frontend/index.html' 
            });
        }

        const role = window.Clerk.user.publicMetadata.role || 'employee';

        const titles = {
            'admin': '🦈 DeskShark Administrator',
            'technician': '🦈 DeskShark Technician',
            'employee': '🦈 DeskShark Support'
        };
        document.getElementById('navbar-title').innerText = titles[role] || titles['employee'];

        await loadView(role);

    } catch (error) {
        console.error("Application Failed to Load:", error);
    }
};

async function loadView(role) {
    const container = document.getElementById('view-container');
    try {
        const response = await fetch(`/frontend/${role}/${role}.html`);
        if (!response.ok) throw new Error(`Could not load ${role}.html`);
        
        container.innerHTML = await response.text();

        const script = document.createElement('script');
        script.src = `/frontend/${role}/${role}.js`;
        document.body.appendChild(script);

    } catch (error) {
        container.innerHTML = `<h3 class="text-danger mt-5 ms-4">Error loading module.</h3>`;
        console.error(error);
    }
}
window.addEventListener('load', window.startApp);