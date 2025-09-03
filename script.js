// Pagination settings
const ITEMS_PER_PAGE = 3;
let currentPage = 1;
let projectsData = null;

// Function to load data from localStorage or fetch from JSON
async function loadProjectsData() {
    // Try to get data from localStorage first
    const localData = localStorage.getItem('projectsData');
    
    if (localData) {
        projectsData = JSON.parse(localData);
        return projectsData;
    }
    
    // If no data in localStorage, fetch from JSON file
    try {
        const response = await fetch('projects.json');
        if (!response.ok) {
            throw new Error('Failed to fetch projects data');
        }
        projectsData = await response.json();
        // Save to localStorage for future use
        localStorage.setItem('projectsData', JSON.stringify(projectsData));
        return projectsData;
    } catch (error) {
        console.error('Error loading projects data:', error);
        // Return empty projects object as fallback
        return { projects: [] };
    }
}

// Save data to localStorage
function saveDataToLocalStorage() {
    if (projectsData) {
        localStorage.setItem('projectsData', JSON.stringify(projectsData));
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    
    const icon = type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="bi bi-${icon}"></i>
        </div>
        <div>${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.4s ease-out reverse';
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 3000);
}

// Calculate days between two dates
function getDaysDiff(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

// Get status badge class
function getStatusBadgeClass(status) {
    switch(status) {
        case 'Completed':
            return 'bg-success';
        case 'In Progress':
            return 'bg-warning';
        case 'On Hold':
            return 'bg-info';
        case 'Cancelled':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// Render project cards
function renderProjects() {
    if (!projectsData) return;
    
    const container = document.getElementById("project-list");
    const emptyState = document.getElementById("emptyState");
    
    container.innerHTML = '';
    
    if (projectsData.projects.length === 0) {
        container.classList.add('d-none');
        emptyState.classList.remove('d-none');
    } else {
        container.classList.remove('d-none');
        emptyState.classList.add('d-none');
        
        projectsData.projects.forEach((project, index) => {
            let tasksHtml = "";
            project.tasks.forEach(task => {
                tasksHtml += `
                    <div class="task-item">
                        <strong>${task.task}</strong> - <small>${task.date}</small>
                    </div>
                `;
            });
            
            const card = `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span>${project.name}</span>
                            <button class="btn btn-sm menu-btn" data-index="${index}">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <div class="project-actions" data-index="${index}">
                                <button class="btn btn-sm btn-light edit-btn" data-index="${index}">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-danger delete-btn" data-index="${index}">
                                    <i class="bi bi-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <span class="badge ${getStatusBadgeClass(project.status)}">${project.status}</span>
                            </div>
                            <p class="card-text">
                                <small><i class="bi bi-calendar-range me-1"></i> ${project.start} to ${project.end}</small>
                            </p>
                            <h6 class="mt-3">Tasks:</h6>
                            <div class="tasks-container">
                                ${tasksHtml}
                            </div>
                        </div>
                        <div class="card-footer bg-white">
                            <small class="text-muted">Duration: ${getDaysDiff(project.start, project.end)} days</small>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
        
        // Add event listeners to menu buttons
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', toggleProjectActions);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteProject(index);
            });
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editProject(index);
            });
        });
    }
    
    updateStats();
    renderChart();
}

// Toggle project actions
function toggleProjectActions(e) {
    e.stopPropagation();
    const index = this.getAttribute('data-index');
    const actionsElement = document.querySelector(`.project-actions[data-index="${index}"]`);
    
    // Close all other action menus
    document.querySelectorAll('.project-actions').forEach(actions => {
        if (actions !== actionsElement) {
            actions.classList.remove('show');
        }
    });
    
    // Toggle current action menu
    actionsElement.classList.toggle('show');
}

// Edit project (placeholder function)
function editProject(index) {
    showToast(`Edit project: ${projectsData.projects[index].name}`, 'success');
    // Close the action menu
    document.querySelector(`.project-actions[data-index="${index}"]`).classList.remove('show');
}

// Update statistics
function updateStats() {
    if (!projectsData) return;
    
    const totalProjects = projectsData.projects.length;
    const inProgressProjects = projectsData.projects.filter(p => p.status === 'In Progress').length;
    const completedProjects = projectsData.projects.filter(p => p.status === 'Completed').length;
    
    let totalDuration = 0;
    projectsData.projects.forEach(project => {
        totalDuration += getDaysDiff(project.start, project.end);
    });
    const avgDuration = totalProjects > 0 ? Math.round(totalDuration / totalProjects) : 0;
    
    document.getElementById('totalProjects').textContent = totalProjects;
    document.getElementById('inProgressProjects').textContent = inProgressProjects;
    document.getElementById('completedProjects').textContent = completedProjects;
    document.getElementById('avgDuration').textContent = avgDuration;
}

// Render pagination
function renderPagination() {
    if (!projectsData) return;
    
    const paginationContainer = document.getElementById('timelinePagination');
    paginationContainer.innerHTML = '';
    
    const totalPages = Math.ceil(projectsData.projects.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        paginationContainer.parentElement.style.display = 'none';
        return;
    }
    
    paginationContainer.parentElement.style.display = 'block';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>`;
    paginationContainer.appendChild(prevLi);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        paginationContainer.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>`;
    paginationContainer.appendChild(nextLi);
}

// Change page
function changePage(page) {
    if (!projectsData) return;
    
    const totalPages = Math.ceil(projectsData.projects.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderChart();
    renderPagination();
}

// Render chart
let timelineChart;
function renderChart() {
    if (!projectsData) return;
    
    const ctx = document.getElementById("timelineChart").getContext("2d");
    
    // Destroy existing chart if it exists
    if (timelineChart) {
        timelineChart.destroy();
    }
    
    // Calculate start and end index for current page
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, projectsData.projects.length);
    
    // Get paginated projects
    const paginatedProjects = projectsData.projects.slice(startIndex, endIndex);
    
    // Get labels and data
    const labels = paginatedProjects.map(p => p.name);
    const durations = paginatedProjects.map(p => getDaysDiff(p.start, p.end));
    
    // Generate colors based on status
    const backgroundColors = paginatedProjects.map(p => {
        switch(p.status) {
            case 'Completed': return '#4cc9f0';
            case 'In Progress': return '#f72585';
            case 'On Hold': return '#4361ee';
            case 'Cancelled': return '#6c757d';
            default: return '#4361ee';
        }
    });
    
    timelineChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Duration (days)",
                data: durations,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                borderRadius: 8,
                barThickness: 30,
                hoverBorderWidth: 2,
                hoverBorderColor: '#333'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            return `Duration: ${context.raw} days`;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    title: { display: true, text: "Days", font: { size: 14, weight: 'bold' } },
                    grid: { display: false }
                },
                y: { 
                    title: { display: true, text: "Projects", font: { size: 14, weight: 'bold' } },
                    grid: { display: false },
                    // Mengurangi padding antar bar
                    afterFit: function(scale) {
                        scale.height = 50; // Mengatur tinggi setiap bar
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            },
            // Perubahan utama untuk memperbaiki tooltip interaction
            interaction: {
                mode: 'nearest',
                intersect: true
            },
            // Mengatur hover behavior
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            },
            // Mengatur hit area agar lebih presisi
            elements: {
                bar: {
                    // Mengurangi hitbox area
                    hitRadius: 5,
                    hoverRadius: 7
                }
            }
        }
    });
    
    renderPagination();
}

// Add task input field
function addTaskInput() {
    const tasksContainer = document.getElementById('tasksContainer');
    const taskInput = document.createElement('div');
    taskInput.className = 'task-input-group';
    taskInput.innerHTML = `
        <input type="text" class="form-control task-name" placeholder="Task name" required>
        <input type="date" class="form-control task-date" required>
        <button type="button" class="btn-remove-task" onclick="removeTask(this)">
            <i class="bi bi-trash"></i>
        </button>
    `;
    tasksContainer.appendChild(taskInput);
}

// Remove task input field
function removeTask(button) {
    const tasksContainer = document.getElementById('tasksContainer');
    if (tasksContainer.children.length > 1) {
        button.parentElement.remove();
    } else {
        showToast('At least one task is required', 'error');
    }
}

// Delete project
function deleteProject(index) {
    if (!projectsData) return;
    
    if (confirm('Are you sure you want to delete this project?')) {
        projectsData.projects.splice(index, 1);
        saveDataToLocalStorage();
        
        // Adjust current page if necessary
        const totalPages = Math.ceil(projectsData.projects.length / ITEMS_PER_PAGE);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        
        renderProjects();
        showToast('Project deleted successfully');
    }
}

// Save project
document.getElementById('saveProjectBtn').addEventListener('click', function() {
    if (!projectsData) return;
    
    const form = document.getElementById('projectForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const projectName = document.getElementById('projectName').value;
    const projectStatus = document.getElementById('projectStatus').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
        showToast('End date must be after start date', 'error');
        return;
    }
    
    // Collect tasks
    const tasks = [];
    const taskInputs = document.querySelectorAll('#tasksContainer .task-input-group');
    
    taskInputs.forEach(input => {
        const taskName = input.querySelector('.task-name').value;
        const taskDate = input.querySelector('.task-date').value;
        
        // Validate task date is within project range
        if (new Date(taskDate) < new Date(startDate) || new Date(taskDate) > new Date(endDate)) {
            showToast(`Task date must be between ${startDate} and ${endDate}`, 'error');
            return;
        }
        
        tasks.push({ task: taskName, date: taskDate });
    });
    
    // Add project to data
    projectsData.projects.push({
        name: projectName,
        status: projectStatus,
        start: startDate,
        end: endDate,
        tasks: tasks
    });
    
    // Save to localStorage
    saveDataToLocalStorage();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addProjectModal'));
    modal.hide();
    
    // Reset form
    form.reset();
    
    // Go to last page to show the new project
    const totalPages = Math.ceil(projectsData.projects.length / ITEMS_PER_PAGE);
    currentPage = totalPages;
    
    // Re-render projects
    renderProjects();
    
    // Show success message
    showToast('Project added successfully');
});

// Close project actions when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.card-header')) {
        document.querySelectorAll('.project-actions').forEach(actions => {
            actions.classList.remove('show');
        });
    }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    // Load projects data first
    await loadProjectsData();
    
    // Then render the UI
    renderProjects();
});