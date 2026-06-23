let newTicketModal; 

async function setupEmployeeView() {
    await loadModalComponent();
    newTicketModal = new bootstrap.Modal(document.getElementById('newTicketModal'));

    document.getElementById('btn-new-ticket').addEventListener('click', () => {
        newTicketModal.show();
    });
    document.getElementById('submit-ticket-btn').addEventListener('click', submitNewTicket);

    loadMyTickets();
}

async function loadModalComponent() {
    try {
        const response = await fetch('/frontend/employee/new-ticket-modal.html');
        const modalHtml = await response.text();
        document.getElementById('modal-container').innerHTML = modalHtml;
    } catch (err) {
        console.error("Failed to inject modal component:", err);
    }
}

async function submitNewTicket() {
    // 1. Grab raw values
    const title = document.getElementById('ticket-title').value;
    const description = document.getElementById('ticket-desc').value;
    const category = document.getElementById('ticket-category').value;
    
    // 2. Parse algorithmic metrics as strict integers for the backend
    const impact = parseInt(document.getElementById('ticket-impact').value, 10);
    const urgency = parseInt(document.getElementById('ticket-urgency').value, 10);
    const affectedUsers = parseInt(document.getElementById('ticket-affected-users').value, 10);

    // 3. Validation
    if (!title || !description || isNaN(affectedUsers) || affectedUsers < 1) {
        alert("Please fill out the Title, Description, and ensure Affected Users is at least 1.");
        return;
    }

    const submitBtn = document.getElementById('submit-ticket-btn');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Submitting...";
    submitBtn.disabled = true;

    try {
        // 4. Send the perfectly formatted payload
        const response = await window.apiFetch('/tickets', {
            method: 'POST',
            body: JSON.stringify({ 
                title, 
                description, 
                category, 
                impact, 
                urgency, 
                affectedUsers 
            })
        });

        document.getElementById('new-ticket-form').reset();
        newTicketModal.hide();
        loadMyTickets();

    } catch (error) {
        console.error("Failed to submit ticket:", error);
        alert("Error submitting ticket: " + error.message);
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

async function loadMyTickets() {
    const container = document.getElementById('employee-tickets-container'); 
    
    if (!container) {
        console.warn("Could not find tickets-container in the HTML.");
        return;
    }

    container.innerHTML = '<p class="text-secondary mt-3">Loading your tickets...</p>';

    try {
        // Use your brand new API utility to GET the tickets
        const tickets = await window.apiFetch('/tickets');

        if (tickets.length === 0) {
            container.innerHTML = '<p class="text-light opacity-50 mt-3">You have no active tickets. Everything is running smoothly!</p>';
            return;
        }

        // Build a simple list of tickets
        let html = '<div class="list-group w-100 mt-3">';
        tickets.forEach(ticket => {
            // DeskShark SLA logic: Highlight breached tickets
            const borderClass = ticket.slaResolutionBreached ? 'border-danger' : 'border-secondary';
            
            html += `
                <div class="list-group-item bg-dark text-light mb-2 rounded ${borderClass}">
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1 text-brand">${ticket.ticketNumber || 'PENDING'}: ${ticket.title}</h5>
                        <small class="badge bg-secondary">${ticket.status || 'Open'}</small>
                    </div>
                    <p class="mb-1 opacity-75">${ticket.description}</p>
                    <small>Priority: <strong>${ticket.priority || 'Calculating...'}</strong> | Category: ${ticket.category}</small>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = `<p class="text-danger mt-3">Failed to load tickets: ${error.message}</p>`;
    }
}

// Boot up the view!
setupEmployeeView();