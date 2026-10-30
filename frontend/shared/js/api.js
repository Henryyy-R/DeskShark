const API_BASE_URL = '/api';

// Escapes text before it is placed into an HTML string (innerHTML,
// insertAdjacentHTML). Use it on every value that comes from a user or
// from the database, including names, titles, emails and error messages.
window.escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

window.apiFetch = async (endpoint, options = {}) => {
    try {
        const token = await window.Clerk.session?.getToken();
        if (!token) {
            window.location.href = '/frontend/index.html';
            return null;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API Request Failed:", error);
        throw error;
    }
};