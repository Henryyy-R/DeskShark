let newTicketModal;
let ticketDetailModal;
let currentTicketId = null;

async function setupEmployeeView() {
    await loadModalComponent();
    newTicketModal = new bootstrap.Modal(document.getElementById('newTicketModal'));
    ticketDetailModal = new bootstrap.Modal(document.getElementById('ticketDetailModal'));

    document.getElementById('btn-new-ticket').addEventListener('click', () => newTicketModal.show());
    document.getElementById('submit-ticket-btn').addEventListener('click', submitNewTicket);
    document.getElementById('emp-btn-add-comment').addEventListener('click', postComment);

    document.getElementById('emp-comment-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') postComment();
    });

    loadMyTickets();
}

async function loadModalComponent() {
    try {
        const response = await fetch('/frontend/employee/new-ticket-modal.html');
        const modalHtml = await response.text();
        document.getElementById('modal-container').innerHTML = modalHtml;
    } catch (err) {
        console.error('Failed to inject modal component:', err);
    }
}

async function submitNewTicket() {
    const title = document.getElementById('ticket-title').value;
    const description = document.getElementById('ticket-desc').value;
    const category = document.getElementById('ticket-category').value;
    const impact = parseInt(document.getElementById('ticket-impact').value, 10);
    const urgency = parseInt(document.getElementById('ticket-urgency').value, 10);
    const affectedUsers = parseInt(document.getElementById('ticket-affected-users').value, 10);

    if (!title || !description || isNaN(affectedUsers) || affectedUsers < 1) {
        alert('Please fill out the Title, Description, and ensure Affected Users is at least 1.');
        return;
    }

    const submitBtn = document.getElementById('submit-ticket-btn');
    submitBtn.innerText = 'Submitting...';
    submitBtn.disabled = true;

    try {
        await window.apiFetch('/tickets', {
            method: 'POST',
            body: JSON.stringify({ title, description, category, impact, urgency, affectedUsers })
        });
        document.getElementById('new-ticket-form').reset();
        newTicketModal.hide();
        loadMyTickets();
    } catch (error) {
        alert('Error submitting ticket: ' + error.message);
    } finally {
        submitBtn.innerText = 'Submit Ticket';
        submitBtn.disabled = false;
    }
}

async function loadMyTickets() {
    const container = document.getElementById('employee-tickets-container');
    container.innerHTML = '<p class="text-secondary mt-3">Loading your tickets...</p>';

    try {
        const tickets = await window.apiFetch('/tickets');

        if (!tickets || tickets.length === 0) {
            container.innerHTML = '<p class="text-light opacity-50 mt-3">You have no active tickets. Everything is running smoothly!</p>';
            return;
        }

        let html = '<div class="list-group w-100 mt-3">';
        tickets.forEach(ticket => {
            const borderClass = ticket.slaResolutionBreached ? 'border-danger' : 'border-secondary';
            const statusBadge = {
                'Open': 'bg-secondary',
                'Assigned': 'bg-primary',
                'In Progress': 'bg-warning text-dark',
                'Resolved': 'bg-success',
                'Closed': 'bg-dark border border-light'
            }[ticket.status] || 'bg-secondary';

            // The inner View button has no handler of its own: its click bubbles to the card.
            html += `
                <div class="list-group-item bg-dark text-light mb-2 rounded border ${borderClass}" style="cursor:pointer;" data-action="open-ticket" data-ticket-id="${escapeHtml(ticket._id)}">
                    <div class="d-flex w-100 justify-content-between align-items-center">
                        <h5 class="mb-1 text-brand">${escapeHtml(ticket.ticketNumber || 'PENDING')}: ${escapeHtml(ticket.title)}</h5>
                        <div class="d-flex gap-2 align-items-center">
                            <span class="badge ${statusBadge}">${escapeHtml(ticket.status || 'Open')}</span>
                            <button class="btn btn-sm btn-outline-light">View</button>
                        </div>
                    </div>
                    <p class="mb-1 opacity-75">${escapeHtml(ticket.description)}</p>
                    <small>Priority: <strong>${escapeHtml(ticket.priority || 'Calculating...')}</strong> | Category: ${escapeHtml(ticket.category)}</small>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;

        // The id goes in a data attribute and is read back here, never put into inline JavaScript.
        container.querySelectorAll('[data-action="open-ticket"]').forEach(card => {
            card.addEventListener('click', () => openTicketDetail(card.dataset.ticketId));
        });

    } catch (error) {
        container.innerHTML = `<p class="text-danger mt-3">Failed to load tickets: ${escapeHtml(error.message)}</p>`;
    }
}

async function openTicketDetail(ticketId) {
    currentTicketId = ticketId;

    try {
        const ticket = await window.apiFetch(`/tickets/${ticketId}`);

        document.getElementById('emp-modal-ticket-number').textContent = ticket.ticketNumber;
        document.getElementById('emp-modal-title').textContent = ticket.title;
        document.getElementById('emp-modal-description').textContent = ticket.description;
        document.getElementById('emp-modal-category').textContent = ticket.category;
        document.getElementById('emp-modal-sla').textContent = ticket.slaResolutionDue
            ? new Date(ticket.slaResolutionDue).toLocaleString() : 'N/A';

        const priorityColors = { Critical: 'text-danger', High: 'text-warning', Medium: 'text-info', Low: 'text-muted' };
        document.getElementById('emp-modal-priority').innerHTML =
            `<span class="fw-bold ${priorityColors[ticket.priority] || ''}">${escapeHtml(ticket.priority || '—')}</span>`;

        const statusBadge = {
            Open: 'bg-secondary',
            Assigned: 'bg-primary',
            'In Progress': 'bg-warning text-dark',
            Resolved: 'bg-success',
            Closed: 'bg-dark border border-light'
        }[ticket.status] || 'bg-secondary';
        document.getElementById('emp-modal-status').innerHTML = `<span class="badge ${statusBadge}">${escapeHtml(ticket.status)}</span>`;

        // Show resolution note if resolved
        const resolutionSection = document.getElementById('emp-resolution-note');
        if (ticket.resolutionNote && ticket.status === 'Resolved') {
            resolutionSection.style.display = 'block';
            document.getElementById('emp-resolution-note-text').textContent = ticket.resolutionNote;
        } else {
            resolutionSection.style.display = 'none';
        }

        // Disable comment input if resolved or closed
        const isClosed = ['Resolved', 'Closed'].includes(ticket.status);
        document.getElementById('emp-comment-input').disabled = isClosed;
        document.getElementById('emp-btn-add-comment').disabled = isClosed;
        document.getElementById('emp-comment-input').placeholder = isClosed
            ? 'This ticket is resolved. Comments are closed.'
            : 'Add a comment...';

        await loadComments(ticketId);
        ticketDetailModal.show();
    } catch (error) {
        alert('Failed to load ticket: ' + error.message);
    }
}

async function loadComments(ticketId) {
    const container = document.getElementById('emp-modal-comments');
    container.innerHTML = '<p class="text-muted small">Loading comments...</p>';

    try {
        const comments = await window.apiFetch(`/tickets/${ticketId}/comments`);

        if (!comments || comments.length === 0) {
            container.innerHTML = '<p class="text-muted small">No comments yet.</p>';
            return;
        }

        container.innerHTML = comments.map(c => {
            const roleColor = { admin: 'text-danger', technician: 'text-info', employee: 'text-muted' }[c.authorRole] || 'text-muted';
            return `
                <div class="p-2 mb-2 rounded" style="background: rgba(255,255,255,0.05);">
                    <div class="d-flex justify-content-between mb-1">
                        <small class="fw-bold ${roleColor}">${escapeHtml(c.authorName || 'Unknown')} <span class="text-muted fw-normal">(${escapeHtml(c.authorRole)})</span></small>
                        <small class="text-muted">${new Date(c.createdAt).toLocaleString()}</small>
                    </div>
                    <p class="mb-0 small">${escapeHtml(c.content)}</p>
                </div>
            `;
        }).join('');

        container.scrollTop = container.scrollHeight;
    } catch (e) {
        container.innerHTML = '<p class="text-muted small">Could not load comments.</p>';
    }
}

async function postComment() {
    const input = document.getElementById('emp-comment-input');
    const content = input.value.trim();
    if (!content) return;

    try {
        await window.apiFetch(`/tickets/${currentTicketId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content, visibility: 'Public' })
        });
        input.value = '';
        await loadComments(currentTicketId);
    } catch (error) {
        alert('Failed to post comment: ' + error.message);
    }
}

setupEmployeeView();