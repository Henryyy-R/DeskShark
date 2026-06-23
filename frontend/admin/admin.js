let allAdminTickets = [];
let currentEditUserId = null;
let createUserModal, editRoleModal, createTechModal, editSLAModal;

async function setupAdminView() {
    createUserModal = new bootstrap.Modal(document.getElementById('createUserModal'));
    editRoleModal = new bootstrap.Modal(document.getElementById('editRoleModal'));
    createTechModal = new bootstrap.Modal(document.getElementById('createTechModal'));
    editSLAModal = new bootstrap.Modal(document.getElementById('editSLAModal'));

    document.getElementById('btn-create-user').addEventListener('click', createUser);
    document.getElementById('btn-save-role').addEventListener('click', saveRole);
    document.getElementById('btn-save-tech').addEventListener('click', saveTechnician);
    document.getElementById('btn-save-sla').addEventListener('click', saveSLARule);

    await refreshAdmin();
}

async function refreshAdmin() {
    await Promise.all([loadKPIs(), loadAllTickets()]);
}

function showTab(tab) {
    const tabs = ['tickets', 'reports', 'users', 'technicians', 'sla'];
    tabs.forEach(t => {
        document.getElementById(`tab-${t}`).style.display = t === tab ? 'block' : 'none';
    });

    document.querySelectorAll('#adminTabs .nav-link').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');

    // Lazy load tab content
    if (tab === 'reports') loadReports();
    if (tab === 'users') loadUsers();
    if (tab === 'technicians') loadTechnicians();
    if (tab === 'sla') loadSLARules();
}

// ==========================================
// KPIs
// ==========================================
async function loadKPIs() {
    try {
        const data = await window.apiFetch('/reports/dashboard');
        document.getElementById('kpi-total').textContent = data.ticketStats.totalTickets;
        document.getElementById('kpi-open').textContent = data.ticketStats.openTickets;
        document.getElementById('kpi-resolved').textContent = data.ticketStats.resolvedTickets;
        document.getElementById('kpi-breaches').textContent =
            data.ticketStats.slaBreaches.response + data.ticketStats.slaBreaches.resolution;
    } catch (e) {
        console.error('Failed to load KPIs:', e);
    }
}

// ==========================================
// REPORTS TAB
// ==========================================
async function loadReports() {
    try {
        const data = await window.apiFetch('/reports/dashboard');
        renderPriorityBreakdown(data.ticketStats.byPriority, data.ticketStats.totalTickets);
        renderLeaderboard(data.technicianLeaderboard);
    } catch (e) {
        console.error('Failed to load reports:', e);
    }
}

function renderPriorityBreakdown(byPriority, total) {
    const container = document.getElementById('priority-breakdown');
    const colors = { Critical: '#ef4444', High: '#f59e0b', Medium: '#38bdf8', Low: '#6b7280' };
    const order = ['Critical', 'High', 'Medium', 'Low'];
    const map = {};
    byPriority.forEach(p => map[p._id] = p.count);

    container.innerHTML = order.map(priority => {
        const count = map[priority] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return `
            <div class="mb-3">
                <div class="d-flex justify-content-between small mb-1">
                    <span class="fw-semibold" style="color:${colors[priority]}">${priority}</span>
                    <span class="text-muted">${count} tickets (${pct}%)</span>
                </div>
                <div class="progress" style="height: 8px; background: rgba(255,255,255,0.08);">
                    <div class="progress-bar" style="width:${pct}%; background-color:${colors[priority]};"></div>
                </div>
            </div>`;
    }).join('');
}

function renderLeaderboard(technicians) {
    const tbody = document.getElementById('tech-leaderboard-body');
    if (!technicians || technicians.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No technicians found.</td></tr>';
        return;
    }
    tbody.innerHTML = technicians.map((tech, i) => {
        const perfRating = (tech.performanceScore / 20).toFixed(2);
        const scoreColor = tech.performanceScore >= 80 ? 'text-success'
            : tech.performanceScore >= 60 ? 'text-warning' : 'text-danger';
        return `
            <tr>
                <td class="text-muted">${i + 1}</td>
                <td class="fw-semibold">${tech.name}</td>
                <td>${tech.activeTickets}</td>
                <td class="${scoreColor} fw-bold">${tech.performanceScore}</td>
                <td class="text-muted">${perfRating} / 5</td>
            </tr>`;
    }).join('');
}

// ==========================================
// ALL TICKETS TAB
// ==========================================
async function loadAllTickets() {
    const tbody = document.getElementById('admin-tickets-body');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Loading...</td></tr>';
    try {
        allAdminTickets = await window.apiFetch('/tickets/all');
        renderAdminTickets(allAdminTickets);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">Failed to load: ${e.message}</td></tr>`;
    }
}

function filterAdminTickets() {
    const filter = document.getElementById('admin-status-filter').value;
    renderAdminTickets(filter === 'all' ? allAdminTickets : allAdminTickets.filter(t => t.status === filter));
}

function renderAdminTickets(tickets) {
    const tbody = document.getElementById('admin-tickets-body');
    tbody.innerHTML = '';
    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No tickets found.</td></tr>';
        return;
    }
    tickets.forEach(ticket => {
        const priorityClass = { Critical: 'text-danger fw-bold', High: 'text-warning fw-bold', Medium: 'text-info', Low: 'text-muted' }[ticket.priority] || '';
        const statusBadge = { Open: 'bg-secondary', Assigned: 'bg-primary', 'In Progress': 'bg-warning text-dark', Resolved: 'bg-success', Closed: 'bg-dark border border-secondary' }[ticket.status] || 'bg-secondary';
        const slaBadge = ticket.slaResolutionBreached ? '<span class="badge bg-danger">Breached</span>' : '<span class="badge bg-success">OK</span>';
        const ageDays = Math.floor((Date.now() - new Date(ticket.createdAt)) / (1000 * 60 * 60 * 24));
        const ageBadge = ageDays >= 8 ? `<span class="badge bg-danger">${ageDays}d</span>` : ageDays >= 4 ? `<span class="badge bg-warning text-dark">${ageDays}d</span>` : `<span class="badge bg-secondary">${ageDays}d</span>`;
        const assignedTo = ticket.assignedTechnicianId?.name || '<span class="text-muted">Unassigned</span>';
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td class="ps-4 text-muted small">${ticket.ticketNumber || '—'}</td>
                <td class="fw-semibold">${ticket.title}</td>
                <td class="${priorityClass}">${ticket.priority || '—'}</td>
                <td><span class="badge ${statusBadge}">${ticket.status}</span></td>
                <td class="small">${assignedTo}</td>
                <td>${slaBadge}</td>
                <td>${ageBadge}</td>
                <td class="pe-4 text-muted small">${new Date(ticket.createdAt).toLocaleDateString()}</td>
            </tr>`);
    });
}

// ==========================================
// USER MANAGEMENT TAB
// ==========================================
async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">Loading...</td></tr>';
    try {
        const users = await window.apiFetch('/admin/users');
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">No users found.</td></tr>';
            return;
        }
        tbody.innerHTML = users.map(u => `
            <tr>
                <td class="fw-semibold">${u.username || '—'}</td>
                <td class="text-muted small">${u.email_addresses?.[0]?.email_address || '—'}</td>
                <td><span class="badge ${roleBadge(u.public_metadata?.role)}">${u.public_metadata?.role || 'employee'}</span></td>
                <td class="text-muted small">${new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary" onclick="openEditRole('${u.id}', '${u.username}', '${u.public_metadata?.role || 'employee'}')">Edit Role</button>
                </td>
            </tr>`).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-danger">${e.message}</td></tr>`;
    }
}

function roleBadge(role) {
    return { admin: 'bg-danger', technician: 'bg-primary', employee: 'bg-secondary' }[role] || 'bg-secondary';
}

function showCreateUserModal() {
    document.getElementById('new-user-username').value = '';
    document.getElementById('new-user-email').value = '';
    document.getElementById('new-user-password').value = '';
    document.getElementById('new-user-role').value = 'employee';
    document.getElementById('create-user-error').style.display = 'none';
    createUserModal.show();
}

async function createUser() {
    const username = document.getElementById('new-user-username').value.trim();
    const email = document.getElementById('new-user-email').value.trim();
    const password = document.getElementById('new-user-password').value.trim();
    const role = document.getElementById('new-user-role').value;
    const errorEl = document.getElementById('create-user-error');

    if (!username || !email || !password) {
        errorEl.textContent = 'All fields are required.';
        errorEl.style.display = 'block';
        return;
    }

    const btn = document.getElementById('btn-create-user');
    btn.textContent = 'Creating...';
    btn.disabled = true;

    try {
        await window.apiFetch('/admin/users', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, role })
        });
        createUserModal.hide();
        loadUsers();
    } catch (e) {
        errorEl.textContent = e.message;
        errorEl.style.display = 'block';
    } finally {
        btn.textContent = 'Create User';
        btn.disabled = false;
    }
}

function openEditRole(userId, username, currentRole) {
    currentEditUserId = userId;
    document.getElementById('edit-role-username').textContent = `User: ${username}`;
    document.getElementById('edit-role-select').value = currentRole;
    editRoleModal.show();
}

async function saveRole() {
    const role = document.getElementById('edit-role-select').value;
    const btn = document.getElementById('btn-save-role');
    btn.textContent = 'Saving...';
    btn.disabled = true;
    try {
        await window.apiFetch(`/admin/users/${currentEditUserId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        });
        editRoleModal.hide();
        loadUsers();
    } catch (e) {
        alert('Failed to update role: ' + e.message);
    } finally {
        btn.textContent = 'Save Role';
        btn.disabled = false;
    }
}

// ==========================================
// TECHNICIAN MANAGEMENT TAB
// ==========================================
async function loadTechnicians() {
    const tbody = document.getElementById('technicians-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3 text-muted">Loading...</td></tr>';
    try {
        const techs = await window.apiFetch('/technicians');
        if (!techs || techs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3 text-muted">No technicians found.</td></tr>';
            return;
        }
        tbody.innerHTML = techs.map(t => {
            const perfRating = (t.performanceScore / 20).toFixed(2);
            const scoreColor = t.performanceScore >= 80 ? 'text-success' : t.performanceScore >= 60 ? 'text-warning' : 'text-danger';
            return `
                <tr>
                    <td class="fw-semibold">${t.name}</td>
                    <td class="text-muted small">${t.email}</td>
                    <td>${t.skills.map(s => `<span class="badge bg-secondary me-1">${s}</span>`).join('')}</td>
                    <td>${t.activeTickets}</td>
                    <td>${t.activeTickets} / ${t.maximumCapacity}</td>
                    <td class="${scoreColor} fw-bold">${t.performanceScore} <small class="text-muted">(${perfRating}/5)</small></td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary me-1" onclick="openEditTech('${t._id}', '${t.name}', '${t.email}', '${t.skills.join(', ')}', ${t.maximumCapacity})">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteTechnician('${t._id}')">Delete</button>
                    </td>
                </tr>`;
        }).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-danger">${e.message}</td></tr>`;
    }
}

function showCreateTechModal() {
    document.getElementById('tech-modal-title').textContent = 'Add Technician';
    document.getElementById('edit-tech-id').value = '';
    document.getElementById('tech-name').value = '';
    document.getElementById('tech-email').value = '';
    document.getElementById('tech-skills').value = '';
    document.getElementById('tech-capacity').value = '10';
    createTechModal.show();
}

function openEditTech(id, name, email, skills, capacity) {
    document.getElementById('tech-modal-title').textContent = 'Edit Technician';
    document.getElementById('edit-tech-id').value = id;
    document.getElementById('tech-name').value = name;
    document.getElementById('tech-email').value = email;
    document.getElementById('tech-skills').value = skills;
    document.getElementById('tech-capacity').value = capacity;
    createTechModal.show();
}

async function saveTechnician() {
    const id = document.getElementById('edit-tech-id').value;
    const name = document.getElementById('tech-name').value.trim();
    const email = document.getElementById('tech-email').value.trim();
    const skills = document.getElementById('tech-skills').value.split(',').map(s => s.trim()).filter(Boolean);
    const maximumCapacity = parseInt(document.getElementById('tech-capacity').value);

    if (!name || !email || skills.length === 0) {
        alert('Name, email, and at least one skill are required.');
        return;
    }

    const btn = document.getElementById('btn-save-tech');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        if (id) {
            await window.apiFetch(`/technicians/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ name, email, skills, maximumCapacity })
            });
        } else {
            await window.apiFetch('/technicians', {
                method: 'POST',
                body: JSON.stringify({ name, email, skills, maximumCapacity })
            });
        }
        createTechModal.hide();
        loadTechnicians();
    } catch (e) {
        alert('Failed to save technician: ' + e.message);
    } finally {
        btn.textContent = 'Save';
        btn.disabled = false;
    }
}

async function deleteTechnician(id) {
    if (!confirm('Delete this technician? This cannot be undone.')) return;
    try {
        await window.apiFetch(`/technicians/${id}`, { method: 'DELETE' });
        loadTechnicians();
    } catch (e) {
        alert('Failed to delete: ' + e.message);
    }
}

// ==========================================
// SLA RULES TAB
// ==========================================
async function loadSLARules() {
    const tbody = document.getElementById('sla-rules-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">Loading...</td></tr>';
    try {
        const rules = await window.apiFetch('/sla');
        if (!rules || rules.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">No SLA rules found. Click Initialize to create defaults.</td></tr>';
            return;
        }
        const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
        rules.sort((a, b) => priorityOrder.indexOf(a.priorityLevel) - priorityOrder.indexOf(b.priorityLevel));
        tbody.innerHTML = rules.map(r => `
            <tr>
                <td class="fw-semibold">${r.priorityLevel}</td>
                <td>${r.responseTargetMinutes} mins</td>
                <td>${r.resolutionTargetMinutes} mins</td>
                <td><span class="badge ${r.isActive ? 'bg-success' : 'bg-secondary'}">${r.isActive ? 'Active' : 'Inactive'}</span></td>
                <td><button class="btn btn-sm btn-outline-secondary" onclick="openEditSLA('${r._id}', '${r.priorityLevel}', ${r.responseTargetMinutes}, ${r.resolutionTargetMinutes})">Edit</button></td>
            </tr>`).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-danger">${e.message}</td></tr>`;
    }
}

function openEditSLA(id, priority, response, resolution) {
    document.getElementById('edit-sla-id').value = id;
    document.getElementById('edit-sla-priority').textContent = priority;
    document.getElementById('edit-sla-response').value = response;
    document.getElementById('edit-sla-resolution').value = resolution;
    editSLAModal.show();
}

async function saveSLARule() {
    const id = document.getElementById('edit-sla-id').value;
    const responseTargetMinutes = parseInt(document.getElementById('edit-sla-response').value);
    const resolutionTargetMinutes = parseInt(document.getElementById('edit-sla-resolution').value);

    const btn = document.getElementById('btn-save-sla');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        await window.apiFetch(`/sla/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ responseTargetMinutes, resolutionTargetMinutes })
        });
        editSLAModal.hide();
        loadSLARules();
    } catch (e) {
        alert('Failed to save SLA rule: ' + e.message);
    } finally {
        btn.textContent = 'Save';
        btn.disabled = false;
    }
}

async function initSLARules() {
    if (!confirm('This will create default SLA rules. Continue?')) return;
    try {
        await window.apiFetch('/sla/init', { method: 'POST' });
        loadSLARules();
    } catch (e) {
        alert('Failed to initialize SLA rules: ' + e.message);
    }
}

setupAdminView();
