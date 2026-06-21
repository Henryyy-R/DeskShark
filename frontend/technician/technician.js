async function setupTechnicianView() {
    try {
        const tickets = await window.apiFetch('/tickets');
        renderTickets(tickets);
    } catch (error) {
        console.error("Dashboard Load Failed:", error);
    }
}

function renderTickets(tickets) {
    const tableBody = document.getElementById('ticket-queue-body');
    if (!tableBody) return;
    tableBody.innerHTML = ''; 

    if(!tickets || tickets.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No active tickets in queue.</td></tr>';
        return;
    }

    tickets.forEach(ticket => {
        const priorityClass = ticket.priority === 'Critical' ? 'text-danger fw-bold' : 'text-light';
        const row = `
            <tr>
                <td class="ps-4">${ticket.ticketNumber || 'TKT-PENDING'}</td>
                <td>${ticket.title}</td>
                <td class="${priorityClass}">${ticket.priority || ticket.urgency}</td>
                <td><span class="badge bg-secondary">${ticket.status || 'Open'}</span></td>
                <td>Pending</td>
                <td class="pe-4"><button class="btn btn-sm btn-outline-light">View</button></td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

setupTechnicianView();