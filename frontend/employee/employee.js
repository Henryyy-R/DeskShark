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
    const title = document.getElementById('ticket-title').value;
    const description = document.getElementById('ticket-desc').value;
    const urgency = document.getElementById('ticket-urgency').value;
    const category = document.getElementById('ticket-category').value;

    if (!title || !description) {
        alert("Please fill out the Title and Description.");
        return;
    }

    const submitBtn = document.getElementById('submit-ticket-btn');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Submitting...";
    submitBtn.disabled = true;

    try {
        const response = await window.apiFetch('/tickets', {
            method: 'POST',
            body: JSON.stringify({ title, description, urgency, category })
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
    console.log("Ready to fetch tickets from backend...");
}

setupEmployeeView();