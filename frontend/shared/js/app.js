window.startApp = async () => {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js";
        script.setAttribute('data-clerk-publishable-key', config.clerkPublishableKey);
        script.crossOrigin = "anonymous";
        script.async = true;

        script.onload = async () => {
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
            initNotifications();
        };

        document.body.appendChild(script);

    } catch (error) {
        console.error('Application Failed to Load:', error);
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

// ==========================================
// NOTIFICATION BELL
// ==========================================
function initNotifications() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const bellHtml = `
        <div class="position-relative me-3" id="notification-wrapper">
            <button class="btn btn-link text-light p-0 position-relative" id="notification-bell" onclick="toggleNotificationPanel()">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7a5.002 5.002 0 0 0-4.005-4.901z"/>
                </svg>
                <span class="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle" id="notification-count" style="display:none; font-size:10px;"></span>
            </button>
            <!-- Notification Panel -->
            <div id="notification-panel" class="card bg-dark border border-secondary shadow-lg" style="display:none; position:absolute; right:0; top:35px; width:340px; z-index:9999; max-height:450px; overflow-y:auto;">
                <div class="card-body p-0">
                    <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-secondary">
                        <span class="fw-bold small text-uppercase text-muted">Notifications</span>
                        <div class="d-flex gap-3">
                            <button class="btn btn-link btn-sm text-muted p-0 small" onclick="loadNotificationList(false)">Unread</button>
                            <button class="btn btn-link btn-sm text-muted p-0 small" onclick="loadNotificationList(true)">History</button>
                            <button class="btn btn-link btn-sm text-muted p-0 small" onclick="markAllRead()">Mark all read</button>
                        </div>
                    </div>
                    <div id="notification-list"></div>
                </div>
            </div>
        </div>
    `;

    const userButton = document.getElementById('user-button');
    if (userButton) {
        userButton.insertAdjacentHTML('beforebegin', bellHtml);
    }

    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('notification-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            document.getElementById('notification-panel').style.display = 'none';
        }
    });

    fetchNotifications();
    setInterval(fetchNotifications, 30000);
}

async function fetchNotifications() {
    try {
        const data = await window.apiFetch('/notifications/count');
        const countEl = document.getElementById('notification-count');
        if (data.count > 0) {
            countEl.textContent = data.count > 99 ? '99+' : data.count;
            countEl.style.display = 'block';
        } else {
            countEl.style.display = 'none';
        }
    } catch (e) {
        console.error('Failed to fetch notification count:', e);
    }
}

async function toggleNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    const isVisible = panel.style.display === 'block';

    if (!isVisible) {
        panel.style.display = 'block';
        await loadNotificationList(false);
    } else {
        panel.style.display = 'none';
    }
}

async function loadNotificationList(showAll = false) {
    const list = document.getElementById('notification-list');
    list.innerHTML = '<p class="text-muted small text-center py-3">Loading...</p>';

    try {
        const endpoint = showAll ? '/notifications?all=true' : '/notifications';
        const notifications = await window.apiFetch(endpoint);

        if (!notifications || notifications.length === 0) {
            list.innerHTML = `<p class="text-muted small text-center py-3">${showAll ? 'No notification history.' : 'No new notifications.'}</p>`;
            return;
        }

        const typeIcon = {
            Assignment: '📋',
            StatusUpdate: '🔄',
            SLA_Warning: '⚠️',
            SLA_Breach: '🚨',
            Escalation: '📢',
            Resolution: '✅'
        };

        list.innerHTML = notifications.map(n => `
            <div class="px-3 py-2 border-bottom border-secondary notification-item ${n.isRead ? 'opacity-50' : ''}"
                 style="cursor:${!n.isRead ? 'pointer' : 'default'};"
                 onclick="${!n.isRead ? `readNotification('${n._id}', this)` : ''}">
                <div class="d-flex gap-2 align-items-start">
                    <span style="font-size:16px;">${typeIcon[n.type] || '🔔'}</span>
                    <div>
                        <p class="mb-0 small text-light">${n.message}</p>
                        <small class="text-muted">${new Date(n.createdAt).toLocaleString()}</small>
                        ${n.isRead ? ' <small class="text-muted">• Read</small>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = '<p class="text-danger small text-center py-3">Failed to load.</p>';
    }
}

async function readNotification(id, el) {
    try {
        await window.apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
        el.classList.add('opacity-50');
        el.style.cursor = 'default';
        el.setAttribute('onclick', '');
        fetchNotifications();
    } catch (e) {
        console.error('Failed to mark as read:', e);
    }
}

async function markAllRead() {
    try {
        await window.apiFetch('/notifications/read-all', { method: 'PUT' });
        document.getElementById('notification-panel').style.display = 'none';
        fetchNotifications();
    } catch (e) {
        console.error('Failed to mark all as read:', e);
    }
}

window.addEventListener('load', window.startApp);
