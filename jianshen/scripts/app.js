/**
 * Main Application Module
 * Handles UI interactions, form submissions, and workout management
 */

// ============================================
// Global State
// ============================================
const AppState = {
    currentTab: 'dashboard',
    workouts: [],
    goals: [],
    weightLogs: [],
    editingWorkoutId: null,
    filters: {
        type: '',
        date: ''
    },
    theme: localStorage.getItem('theme') || 'light'
};

// Workout type configurations
const WorkoutTypes = {
    running: {
        name: '跑步',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
        fields: ['distance']
    },
    cycling: {
        name: '骑行',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg>`,
        fields: ['distance']
    },
    weightlifting: {
        name: '举重',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 5h12l-2 14H8L6 5z"/><path d="M6 9h12"/><path d="M4 5h16"/><path d="m6 14 12-3"/></svg>`,
        fields: ['weight', 'sets', 'reps']
    },
    swimming: {
        name: '游泳',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20"/><path d="M2 12s5-3 10 0 10 0 10 0"/><path d="M9 6.5a3 3 0 1 1-6 0M15 17.5a3 3 0 1 1-6 0"/></svg>`,
        fields: ['distance', 'laps']
    },
    yoga: {
        name: '瑜伽',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="2"/><path d="M7 21v-8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8"/></svg>`,
        fields: ['poses']
    },
    other: {
        name: '其他',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
        fields: []
    }
};

// ============================================
// Utility Functions
// ============================================

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `${icons[type]}<span class="toast-message">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Format date for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return '昨天';
    } else {
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
    }
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// Theme Management
// ============================================

/**
 * Initialize theme from localStorage or system preference
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

/**
 * Set application theme
 * @param {string} theme - Theme name (light or dark)
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    AppState.theme = theme;
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// ============================================
// Navigation
// ============================================

/**
 * Initialize navigation tabs
 */
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Update active state
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabName) {
                    content.classList.add('active');
                }
            });

            AppState.currentTab = tabName;

            // Load data for the tab
            handleTabChange(tabName);
        });
    });

    // Check URL hash for initial tab
    const hash = window.location.hash.slice(1);
    if (hash && document.querySelector(`[data-tab="${hash}"]`)) {
        const btn = document.querySelector(`[data-tab="${hash}"]`);
        btn.click();
    }
}

/**
 * Handle tab change and load appropriate data
 * @param {string} tabName - The tab name
 */
async function handleTabChange(tabName) {
    switch (tabName) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'workouts':
            await loadWorkoutsList();
            break;
        case 'goals':
            await loadGoals();
            break;
        case 'weight':
            await loadWeightTracking();
            break;
    }
}

// ============================================
// Dashboard
// ============================================

/**
 * Load dashboard data
 */
async function loadDashboard() {
    try {
        // Load recent workouts
        const workouts = await Storage.getAllWorkouts();
        AppState.workouts = workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Update stats
        updateDashboardStats();

        // Render recent workouts
        renderRecentWorkouts();

        // Update charts
        if (typeof updateCharts === 'function') {
            await updateCharts();
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('加载仪表盘失败', 'error');
    }
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
    const stats = {
        totalWorkouts: AppState.workouts.length,
        totalDuration: 0,
        totalCalories: 0
    };

    AppState.workouts.forEach(workout => {
        stats.totalDuration += workout.duration || 0;
        stats.totalCalories += workout.calories || 0;
    });

    document.getElementById('totalWorkouts').textContent = stats.totalWorkouts;
    document.getElementById('totalDuration').textContent = stats.totalDuration;
    document.getElementById('totalCalories').textContent = stats.totalCalories;
}

/**
 * Render recent workouts on dashboard
 */
function renderRecentWorkouts() {
    const container = document.getElementById('recentWorkouts');
    const recentWorkouts = AppState.workouts.slice(0, 5);

    if (recentWorkouts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>还没有锻炼记录</p>
                <p class="hint">点击下方"添加"按钮开始记录</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recentWorkouts.map(workout => createWorkoutCard(workout)).join('');
}

// ============================================
// Workout Form
// ============================================

/**
 * Initialize workout form
 */
function initWorkoutForm() {
    const form = document.getElementById('workoutForm');
    const typeSelect = document.getElementById('workoutType');
    const dateInput = document.getElementById('workoutDate');

    // Set default date to today
    dateInput.value = new Date().toISOString().split('T')[0];

    // Handle workout type change
    typeSelect.addEventListener('change', updateDynamicFields);

    // Handle form submission
    form.addEventListener('submit', handleWorkoutSubmit);
}

/**
 * Update dynamic form fields based on workout type
 */
function updateDynamicFields() {
    const type = document.getElementById('workoutType').value;
    const container = document.getElementById('dynamicFields');

    if (!type || !WorkoutTypes[type]) {
        container.innerHTML = '';
        return;
    }

    const fields = WorkoutTypes[type].fields;
    let html = '';

    const fieldConfigs = {
        distance: {
            label: '距离（公里）',
            type: 'number',
            step: '0.01',
            min: '0'
        },
        weight: {
            label: '重量（公斤）',
            type: 'number',
            step: '0.5',
            min: '0'
        },
        sets: {
            label: '组数',
            type: 'number',
            min: '1'
        },
        reps: {
            label: '每组次数',
            type: 'number',
            min: '1'
        },
        laps: {
            label: '圈数',
            type: 'number',
            min: '1'
        },
        poses: {
            label: '体式数量',
            type: 'number',
            min: '1'
        }
    };

    fields.forEach(field => {
        const config = fieldConfigs[field];
        html += `
            <div class="form-group">
                <label for="${field}">${config.label}</label>
                <input type="${config.type}" id="${field}" name="${field}"
                       ${config.step ? `step="${config.step}"` : ''}
                       ${config.min ? `min="${config.min}"` : ''}
                       placeholder="可选">
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Handle workout form submission
 * @param {Event} event - Form submit event
 */
async function handleWorkoutSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const workout = {
        type: formData.get('type'),
        date: formData.get('date'),
        duration: parseInt(formData.get('duration')) || 0,
        calories: parseInt(formData.get('calories')) || 0,
        notes: formData.get('notes') || ''
    };

    // Add dynamic fields
    WorkoutTypes[workout.type]?.fields.forEach(field => {
        workout[field] = parseFloat(formData.get(field)) || 0;
    });

    try {
        if (AppState.editingWorkoutId) {
            workout.id = AppState.editingWorkoutId;
            await Storage.updateWorkout(workout);
            showToast('锻炼记录已更新', 'success');
        } else {
            await Storage.addWorkout(workout);
            showToast('锻炼记录已保存', 'success');
        }

        form.reset();
        document.getElementById('workoutDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('dynamicFields').innerHTML = '';
        AppState.editingWorkoutId = null;

        // Reload data
        await loadDashboard();
        await loadWorkoutsList();

        // Switch to dashboard if on add tab
        const addTabBtn = document.querySelector('[data-tab="add"]');
        if (addTabBtn.classList.contains('active')) {
            document.querySelector('[data-tab="dashboard"]').click();
        }
    } catch (error) {
        console.error('Error saving workout:', error);
        showToast('保存失败，请重试', 'error');
    }
}

// ============================================
// Workout List
// ============================================

/**
 * Load workouts list with filters
 */
async function loadWorkoutsList() {
    try {
        let workouts = await Storage.getAllWorkouts();

        // Apply filters
        if (AppState.filters.type) {
            workouts = workouts.filter(w => w.type === AppState.filters.type);
        }
        if (AppState.filters.date) {
            workouts = workouts.filter(w => w.date === AppState.filters.date);
        }

        // Sort by date (newest first)
        workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

        AppState.workouts = workouts;
        renderWorkoutsList();
    } catch (error) {
        console.error('Error loading workouts:', error);
        showToast('加载锻炼记录失败', 'error');
    }
}

/**
 * Render workouts list
 */
function renderWorkoutsList() {
    const container = document.getElementById('allWorkouts');

    if (AppState.workouts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>还没有锻炼记录</p>
                <p class="hint">点击下方"添加"按钮开始记录</p>
            </div>
        `;
        return;
    }

    container.innerHTML = AppState.workouts.map(workout => createWorkoutCard(workout, true)).join('');
}

/**
 * Create workout card HTML
 * @param {Object} workout - Workout object
 * @param {boolean} showActions - Whether to show action buttons
 * @returns {string} HTML string
 */
function createWorkoutCard(workout, showActions = false) {
    const typeInfo = WorkoutTypes[workout.type] || WorkoutTypes.other;
    const stats = [];

    if (workout.duration) {
        stats.push(`<span class="workout-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${workout.duration} 分钟
        </span>`);
    }

    if (workout.calories) {
        stats.push(`<span class="workout-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
            ${workout.calories} 卡
        </span>`);
    }

    if (workout.distance) {
        stats.push(`<span class="workout-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 1 0 10 10"/>
            </svg>
            ${workout.distance} km
        </span>`);
    }

    if (workout.weight) {
        stats.push(`<span class="workout-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 5h12l-2 14H8L6 5z"/>
            </svg>
            ${workout.weight} kg
        </span>`);
    }

    const actionsHtml = showActions ? `
        <div class="workout-actions">
            <button class="action-btn" data-action="share" data-id="${workout.id}" title="分享">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
            </button>
            <button class="action-btn" data-action="edit" data-id="${workout.id}" title="编辑">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            </button>
            <button class="action-btn" data-action="delete" data-id="${workout.id}" title="删除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        </div>
    ` : '';

    return `
        <div class="workout-card" data-id="${workout.id}">
            <div class="workout-icon ${workout.type}">
                ${typeInfo.icon}
            </div>
            <div class="workout-details">
                <div class="workout-title">${typeInfo.name}</div>
                <div class="workout-date">${formatDate(workout.date)}</div>
                ${stats.length ? `<div class="workout-stats">${stats.join('')}</div>` : ''}
                ${workout.notes ? `<div class="workout-notes">${workout.notes}</div>` : ''}
            </div>
            ${actionsHtml}
        </div>
    `;
}

/**
 * Initialize workout action buttons
 */
function initWorkoutActions() {
    document.addEventListener('click', async (event) => {
        const btn = event.target.closest('.action-btn');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);

        switch (action) {
            case 'edit':
                await editWorkout(id);
                break;
            case 'delete':
                await deleteWorkout(id);
                break;
            case 'share':
                await shareWorkout(id);
                break;
        }
    });
}

/**
 * Edit workout
 * @param {number} id - Workout ID
 */
async function editWorkout(id) {
    try {
        const workout = await Storage.getWorkout(id);
        if (!workout) {
            showToast('锻炼记录不存在', 'error');
            return;
        }

        AppState.editingWorkoutId = id;

        // Switch to add tab
        document.querySelector('[data-tab="add"]').click();

        // Populate form
        const form = document.getElementById('workoutForm');
        form.querySelector('[name="type"]').value = workout.type;
        form.querySelector('[name="date"]').value = workout.date;
        form.querySelector('[name="duration"]').value = workout.duration;
        form.querySelector('[name="calories"]').value = workout.calories || '';
        form.querySelector('[name="notes"]').value = workout.notes || '';

        // Update dynamic fields
        updateDynamicFields();

        // Populate dynamic fields
        WorkoutTypes[workout.type]?.fields.forEach(field => {
            const input = document.getElementById(field);
            if (input && workout[field]) {
                input.value = workout[field];
            }
        });

        showToast('正在编辑锻炼记录', 'info');
    } catch (error) {
        console.error('Error loading workout for edit:', error);
        showToast('加载锻炼记录失败', 'error');
    }
}

/**
 * Delete workout
 * @param {number} id - Workout ID
 */
async function deleteWorkout(id) {
    if (!confirm('确定要删除这条锻炼记录吗？')) {
        return;
    }

    try {
        await Storage.deleteWorkout(id);
        showToast('锻炼记录已删除', 'success');

        // Reload data
        await loadDashboard();
        await loadWorkoutsList();
    } catch (error) {
        console.error('Error deleting workout:', error);
        showToast('删除失败', 'error');
    }
}

/**
 * Share workout
 * @param {number} id - Workout ID
 */
async function shareWorkout(id) {
    try {
        const workout = await Storage.getWorkout(id);
        if (!workout) {
            showToast('锻炼记录不存在', 'error');
            return;
        }

        // Open share modal
        if (typeof openShareModal === 'function') {
            openShareModal(workout);
        }
    } catch (error) {
        console.error('Error opening share modal:', error);
        showToast('打开分享失败', 'error');
    }
}

// ============================================
// Filters
// ============================================

/**
 * Initialize filter controls
 */
function initFilters() {
    const typeFilter = document.getElementById('filterType');
    const dateFilter = document.getElementById('filterDate');

    typeFilter.addEventListener('change', async () => {
        AppState.filters.type = typeFilter.value;
        await loadWorkoutsList();
    });

    dateFilter.addEventListener('change', async () => {
        AppState.filters.date = dateFilter.value;
        await loadWorkoutsList();
    });
}

// ============================================
// Modals
// ============================================

/**
 * Initialize modal functionality
 */
function initModals() {
    // Close modals on close button click
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.close;
            closeModal(modalId);
        });
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

/**
 * Open a modal
 * @param {string} modalId - The modal ID
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close a modal
 * @param {string} modalId - The modal ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// Goal Loading (Placeholder)
// ============================================

/**
 * Load goals data
 */
async function loadGoals() {
    try {
        const goals = await Storage.getAllGoals();
        AppState.goals = goals;

        const container = document.getElementById('goalsList');

        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                    <p>还没有设定目标</p>
                    <p class="hint">点击"添加目标"开始设定你的健身目标</p>
                </div>
            `;
            return;
        }

        // Render goals
        if (typeof renderGoals === 'function') {
            renderGoals(goals);
        }
    } catch (error) {
        console.error('Error loading goals:', error);
        showToast('加载目标失败', 'error');
    }
}

// ============================================
// Weight Tracking Loading (Placeholder)
// ============================================

/**
 * Load weight tracking data
 */
async function loadWeightTracking() {
    try {
        const weightLogs = await Storage.getAllWeightLogs();
        AppState.weightLogs = weightLogs.sort((a, b) => new Date(a.date) - new Date(b.date));

        const container = document.querySelector('.weight-list');

        if (weightLogs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>还没有体重记录</p>
                    <p class="hint">点击"记录体重"开始追踪</p>
                </div>
            `;
            return;
        }

        // Render weight history
        let html = '';
        weightLogs.slice().reverse().forEach((log, index) => {
            const previousLog = weightLogs.length > index + 1 ? weightLogs[weightLogs.length - index - 2] : null;
            let changeHtml = '';

            if (previousLog) {
                const change = log.weight - previousLog.weight;
                const changeClass = change < 0 ? 'positive' : 'negative';
                const changeText = change < 0 ? `-${Math.abs(change).toFixed(1)}` : `+${change.toFixed(1)}`;
                changeHtml = `<span class="weight-change ${changeClass}">${changeText} kg</span>`;
            }

            html += `
                <div class="weight-entry" data-id="${log.id}">
                    <div>
                        <div class="weight-value">${log.weight.toFixed(1)} kg</div>
                        <div class="weight-date">${formatDate(log.date)}</div>
                    </div>
                    ${changeHtml ? `
                        <div class="weight-right">
                            ${changeHtml}
                            <button class="action-btn" data-action="delete-weight" data-id="${log.id}" title="删除">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                            </button>
                        </div>
                    ` : `
                        <button class="action-btn" data-action="delete-weight" data-id="${log.id}" title="删除">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    `}
                </div>
            `;
        });

        container.innerHTML = html;

        // Update weight chart
        if (typeof updateWeightChart === 'function') {
            await updateWeightChart();
        }
    } catch (error) {
        console.error('Error loading weight tracking:', error);
        showToast('加载体重数据失败', 'error');
    }
}

// ============================================
// Application Initialization
// ============================================

/**
 * Initialize the application
 */
async function initApp() {
    try {
        // Initialize theme
        initTheme();

        // Initialize navigation
        initNavigation();

        // Initialize workout form
        initWorkoutForm();

        // Initialize modals
        initModals();

        // Initialize filters
        initFilters();

        // Initialize workout actions
        initWorkoutActions();

        // Initialize theme toggle
        document.getElementById('themeToggle').addEventListener('click', toggleTheme);

        // Initialize PWA install prompt
        initPWAInstall();

        // Load initial data
        await loadDashboard();

        console.log('Fitness Tracker PWA initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('应用初始化失败', 'error');
    }
}

// ============================================
// PWA Installation
// ============================================

let deferredPrompt = null;
let installPromptShown = false;

/**
 * Initialize PWA install prompt
 */
function initPWAInstall() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;

        // Check if we've already shown the prompt recently
        const lastShown = localStorage.getItem('installPromptLastShown');
        const daysSinceShown = lastShown ? (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24) : 30;

        // Show install prompt if not shown in the last 7 days
        if (daysSinceShown > 7) {
            setTimeout(() => {
                showInstallPrompt();
            }, 3000); // Show after 3 seconds
        }
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
        // Hide the install prompt
        hideInstallPrompt();
        // Clear the deferred prompt
        deferredPrompt = null;
        // Show success message
        showToast('应用已安装成功！', 'success');
        // Save installation date
        localStorage.setItem('appInstalledDate', Date.now().toString());
    });

    // Initialize install prompt UI
    const dismissBtn = document.getElementById('installDismiss');
    const confirmBtn = document.getElementById('installConfirm');

    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            hideInstallPrompt();
            // Remember that user dismissed
            localStorage.setItem('installPromptLastShown', Date.now().toString());
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                showToast('安装提示不可用', 'warning');
                return;
            }

            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);

            // Clear the deferred prompt
            deferredPrompt = null;
            hideInstallPrompt();

            if (outcome === 'accepted') {
                localStorage.setItem('appInstalledDate', Date.now().toString());
            }
        });
    }

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is running in standalone mode');
        localStorage.setItem('appInstalledDate', Date.now().toString());
    }
}

/**
 * Show install prompt UI
 */
function showInstallPrompt() {
    const prompt = document.getElementById('installPrompt');
    if (prompt && !installPromptShown) {
        prompt.style.display = 'block';
        // Animate in
        prompt.style.animation = 'slideUp 0.3s ease';
        installPromptShown = true;
    }
}

/**
 * Hide install prompt UI
 */
function hideInstallPrompt() {
    const prompt = document.getElementById('installPrompt');
    if (prompt) {
        prompt.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            prompt.style.display = 'none';
        }, 300);
    }
    installPromptShown = false;
}

// ============================================
// Service Worker Registration
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker is available, show update notification
                            showToast('新版本可用，刷新页面获取更新', 'info');
                        }
                    });
                });
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;

        switch (type) {
            case 'CACHE_SIZE':
                const sizeMB = (payload.size / (1024 * 1024)).toFixed(2);
                console.log(`Cache size: ${sizeMB} MB`);
                break;
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for use in other modules
const App = {
    showToast,
    formatDate,
    openModal,
    closeModal,
    updateDynamicFields,
    loadDashboard,
    loadWorkoutsList,
    loadGoals,
    loadWeightTracking,
    WorkoutTypes
};
