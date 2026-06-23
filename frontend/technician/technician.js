let allTickets = [];
let currentTicketId = null;
let detailModal = null;

async function setupTechnicianView() {
    detailModal = new bootstrap.Modal(document.getElementById('ticketDetailModal'));

    // Status dropdown toggle: show resolution note only when Resolved is selected
    document.getElementById('modal-status-select').addEventListener('change', function () {
        const noteSection = document.getElementById('resolution-note-section');
        noteSection.style.display = this.value === 'Resolved' ? 'block' : 'none';
    });

    document.getElementById('btn-update-ticket').addEventListener('click', saveTicketChanges);
    document.getElementById('btn-add-comment').addEventListener('click', postComment);

    await loadQueue();
}

async function loadQueue() {
    const tbody = document.getElementById('ticket-queue-body');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Loading...</td></tr>';

    try {
        allTickets = await window.apiFetch('/tickets/all');
        renderQueue(allTickets);
        updateStats(allTickets);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Failed to load tickets: ${error.message}</td></tr>`;
    }
}

function updateStats(tickets) {
    const today = new Date().toDateString();
    document.getElementById('stat-assigned').textContent = tickets.filter(t => t.status === 'Assigned').length;
    document.getElementById('stat-inprogress').textContent = tickets.filter(t => t.status === 'In Progress').length;
    document.getElementById('stat-breached').textContent = tickets.filter(t => t.slaResolutionBreached).length;
    document.getElementById('stat-resolved').textContent = tickets.filter(t =>
        t.status === 'Resolved' && new Date(t.resolvedAt).toDateString() === today
    ).length;
    document.getElementById('tech-queue-count').textContent = `${tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length} active tickets`;
}

function renderQueue(tickets) {
    const tbody = document.getElementById('ticket-queue-body');
    tbody.innerHTML = '';

    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No tickets in queue.</td></tr>';
        return;
    }

    tickets.forEach(ticket => {
        const priorityClass = {
            'Critical': 'text-danger fw-bold',
            'High': 'text-warning fw-bold',
            'Medium': 'text-info',
            'Low': 'text-light'
        }[ticket.priority] || 'text-light';

        const statusBadge = {
            'Open': 'bg-secondary',
            'Assigned': 'bg-primary',
            'In Progress': 'bg-warning text-dark',
            'Resolved': 'bg-success',
            'Closed': 'bg-dark border border-secondary'
        }[ticket.status] || 'bg-secondary';

        const slaDate = ticket.slaResolutionDue
            ? new Date(ticket.slaResolutionDue).toLocaleString()
            : 'N/A';

        const slaBadge = ticket.slaResolutionBreached
            ? '<span class="badge bg-danger">Breached</span>'
            : '<span class="badge bg-success">OK</span>';

        const row = `
            <tr>
                <td class="ps-4 text-muted small">${ticket.ticketNumber || 'TKT-PENDING'}</td>
                <td class="fw-semibold">${ticket.title}</td>
                <td class="${priorityClass}">${ticket.priority || '—'}</td>
                <td><span class="badge ${statusBadge}">${ticket.status || 'Open'}</span></td>
                <td class="small text-muted">${slaDate}</td>
                <td>${slaBadge}</td>
                <td class="pe-4">
                    <button class="btn btn-sm btn-outline-light" onclick="openTicketDetail('${ticket._id}')">View</button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

async function openTicketDetail(ticketId) {
    currentTicketId = ticketId;

    try {
        const ticket = await window.apiFetch(`/tickets/${ticketId}`);

        document.getElementById('modal-ticket-number').textContent = ticket.ticketNumber;
        document.getElementById('modal-title').textContent = ticket.title;
        document.getElementById('modal-description').textContent = ticket.description;
        document.getElementById('modal-priority').innerHTML = `<span class="badge ${getPriorityBadge(ticket.priority)}">${ticket.priority}</span>`;
        document.getElementById('modal-category').textContent = ticket.category;
        document.getElementById('modal-sla-due').textContent = ticket.slaResolutionDue
            ? new Date(ticket.slaResolutionDue).toLocaleString() : 'N/A';

        const statusSelect = document.getElementById('modal-status-select');
        statusSelect.value = ticket.status;
        document.getElementById('resolution-note-section').style.display =
            ticket.status === 'Resolved' ? 'block' : 'none';
        document.getElementById('modal-resolution-note').value = ticket.resolutionNote || '';

        await loadComments(ticketId);
        detailModal.show();
    } catch (error) {
        alert('Failed to load ticket: ' + error.message);
    }
}

async function loadComments(ticketId) {
    const container = document.getElementById('modal-comments');
    container.innerHTML = '<p class="text-muted small">Loading comments...</p>';

    try {
        const comments = await window.apiFetch(`/tickets/${ticketId}/comments`);
        if (!comments || comments.length === 0) {
            container.innerHTML = '<p class="text-muted small">No comments yet.</p>';
            return;
        }
        container.innerHTML = comments.map(c => `
            <div class="p-2 mb-1 rounded" style="background: rgba(255,255,255,0.05);">
                <p class="mb-0 small">${c.content}</p>
                <small class="text-muted">${new Date(c.createdAt).toLocaleString()}</small>
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    } catch (e) {
        container.innerHTML = '<p class="text-muted small">Could not load comments.</p>';
    }
}

async function postComment() {
    const input = document.getElementById('modal-comment-input');
    const content = input.value.trim();
    if (!content) return;

    try {
        await window.apiFetch(`/tickets/${currentTicketId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        input.value = '';
        await loadComments(currentTicketId);
    } catch (error) {
        alert('Failed to post comment: ' + error.message);
    }
}

async function saveTicketChanges() {
    const status = document.getElementById('modal-status-select').value;
    const resolutionNote = document.getElementById('modal-resolution-note').value;
    const btn = document.getElementById('btn-update-ticket');

    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        if (status === 'Resolved') {
            await window.apiFetch(`/tickets/${currentTicketId}/resolve`, {
                method: 'PUT',
                body: JSON.stringify({ resolutionNote })
            });
        } else {
            await window.apiFetch(`/tickets/${currentTicketId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
        }

        detailModal.hide();
        await loadQueue();
    } catch (error) {
        alert('Failed to update ticket: ' + error.message);
    } finally {
        btn.textContent = 'Save Changes';
        btn.disabled = false;
    }
}

function getPriorityBadge(priority) {
    return {
        'Critical': 'bg-danger',
        'High': 'bg-warning text-dark',
        'Medium': 'bg-info text-dark',
        'Low': 'bg-secondary'
    }[priority] || 'bg-secondary';
}

setupTechnicianView();
