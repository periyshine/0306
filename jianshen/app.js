// Main Application JavaScript for Fitness Tracker PWA

// Global variables for charts
let weightChart = null;
let workoutChart = null;
let stepsChart = null;

// Pedometer tracking
let pedometer = null;
let isTrackingSteps = false;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize database
    try {
        await window.fitnessDB.initDB();
        await window.fitnessDB.initMilestones();
        console.log('Database initialized successfully');

        // Set today's date as default for workout form
        document.getElementById('workoutDate').valueAsDate = new Date();

        // Initialize all components
        initializeTabs();
        initializeCharts();
        initializeForms();
        initializePedometer();
        initializePWA();

        // Load initial data
        await loadDashboardData();
        await loadWorkouts();
        await loadGoals();
        await loadMilestones();

        // Check for unlocked milestones
        const unlockedMilestones = await window.fitnessDB.checkAndUnlockMilestones();
        if (unlockedMilestones.length > 0) {
            unlockedMilestones.forEach(milestone => {
                showToast(`🏆 解锁新里程碑: ${milestone.title}!`, 'success');
            });
        }

    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('应用初始化失败，请刷新页面', 'error');
    }
});

// ============= Tab Navigation =============
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked elements
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// ============= Charts Initialization =============
function initializeCharts() {
    // Initialize Weight Chart
    const weightCtx = document.getElementById('weightChart').getContext('2d');
    weightChart = new Chart(weightCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '体重 (kg)',
                data: [],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });

    // Initialize Workout Chart
    const workoutCtx = document.getElementById('workoutChart').getContext('2d');
    workoutChart = new Chart(workoutCtx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: '锻炼次数',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(76, 175, 80, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Initialize Steps Chart
    const stepsCtx = document.getElementById('stepsChart').getContext('2d');
    stepsChart = new Chart(stepsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '步数',
                data: [],
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// ============= Forms Initialization =============
function initializeForms() {
    // Workout form type change handler
    document.getElementById('workoutType').addEventListener('change', (e) => {
        const type = e.target.value;
        const distanceGroup = document.getElementById('distanceGroup');
        const weightGroup = document.getElementById('weightGroup');

        // Show/hide relevant fields based on workout type
        distanceGroup.style.display = ['running', 'cycling', 'swimming'].includes(type) ? 'block' : 'none';
        weightGroup.style.display = ['weightlifting'].includes(type) ? 'block' : 'none';
    });

    // Workout form submit handler
    document.getElementById('workoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const workout = {
            type: document.getElementById('workoutType').value,
            date: document.getElementById('workoutDate').value,
            duration: parseInt(document.getElementById('duration').value),
            distance: parseFloat(document.getElementById('distance').value) || 0,
            weight: parseFloat(document.getElementById('workoutWeight').value) || 0,
            notes: document.getElementById('notes').value
        };

        try {
            await window.fitnessDB.addWorkout(workout);
            showToast('锻炼记录已保存', 'success');

            // Reset form
            e.target.reset();
            document.getElementById('workoutDate').valueAsDate = new Date();

            // Reload data
            await loadDashboardData();
            await loadWorkouts();

            // Check milestones
            const milestones = await window.fitnessDB.checkAndUnlockMilestones();
            if (milestones.length > 0) {
                await loadMilestones();
            }
        } catch (error) {
            console.error('Error saving workout:', error);
            showToast('保存失败，请重试', 'error');
        }
    });

    // Add weight button handler
    document.getElementById('addWeightBtn').addEventListener('click', async () => {
        const weightInput = document.getElementById('newWeight');
        const weight = parseFloat(weightInput.value);

        if (weight && weight > 0) {
            try {
                await window.fitnessDB.addWeight({
                    weight: weight,
                    date: new Date().toISOString()
                });
                showToast('体重记录已添加', 'success');
                weightInput.value = '';
                await loadDashboardData();

                // Check for weight loss milestone
                const milestones = await window.fitnessDB.checkAndUnlockMilestones();
                if (milestones.length > 0) {
                    await loadMilestones();
                }
            } catch (error) {
                console.error('Error saving weight:', error);
                showToast('保存失败', 'error');
            }
        } else {
            showToast('请输入有效的体重', 'error');
        }
    });

    // Goal form submit handler
    document.getElementById('goalForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const goal = {
            type: document.getElementById('goalType').value,
            target: parseInt(document.getElementById('goalTarget').value),
            period: document.getElementById('goalPeriod').value
        };

        try {
            await window.fitnessDB.addGoal(goal);
            showToast('目标已设置', 'success');
            e.target.reset();
            await loadGoals();
        } catch (error) {
            console.error('Error saving goal:', error);
            showToast('保存失败', 'error');
        }
    });
}

// ============= Pedometer Integration =============
function initializePedometer() {
    const startBtn = document.getElementById('startTrackingBtn');
    const stopBtn = document.getElementById('stopTrackingBtn');
    const statusElement = document.getElementById('pedometerStatus');

    // Check if pedometer API is available
    if ('Pedometer' in window) {
        pedometer = new Pedometer();
        statusElement.textContent = '计步器可用';
        startBtn.style.display = 'inline-flex';
    } else {
        statusElement.textContent = '您的设备不支持计步器API，但您可以手动记录步数。';
        startBtn.style.display = 'none';
    }

    startBtn.addEventListener('click', () => {
        if (pedometer) {
            pedometer.start();
            isTrackingSteps = true;
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            statusElement.textContent = '正在追踪步数...';
            showToast('开始追踪步数', 'success');
        }
    });

    stopBtn.addEventListener('click', () => {
        if (pedometer && isTrackingSteps) {
            pedometer.stop();
            isTrackingSteps = false;
            stopBtn.style.display = 'none';
            startBtn.style.display = 'inline-flex';
            statusElement.textContent = '步数追踪已停止';
        }
    });

    // Load steps history
    loadStepsHistory();
}

// ============= PWA Installation =============
function initializePWA() {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtn = document.getElementById('installBtn');
        installBtn.style.display = 'inline-flex';

        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
                installBtn.style.display = 'none';
            }
        });
    });

    // Register service worker if available
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => console.log('Service Worker registered'))
            .catch(error => console.log('Service Worker registration failed:', error));
    }
}

// ============= Data Loading Functions =============
async function loadDashboardData() {
    try {
        // Load weekly stats
        const weeklyStats = await window.fitnessDB.getWeeklyStats();
        document.getElementById('weeklyWorkouts').textContent = weeklyStats.workoutCount;
        document.getElementById('totalDuration').textContent = `${weeklyStats.totalDuration} 分钟`;
        document.getElementById('totalDistance').textContent = `${weeklyStats.totalDistance.toFixed(1)} 公里`;

        // Load weight data
        const weights = await window.fitnessDB.getWeights();
        const sortedWeights = weights.sort((a, b) => new Date(a.date) - new Date(b.date));

        weightChart.data.labels = sortedWeights.map(w => {
            const date = new Date(w.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        weightChart.data.datasets[0].data = sortedWeights.map(w => w.weight);
        weightChart.update();

        // Load workout data for the week
        const weeklyWorkouts = await window.fitnessDB.getWorkouts();
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

        const workoutCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

        weeklyWorkouts.forEach(workout => {
            const workoutDate = new Date(workout.date);
            if (workoutDate >= startOfWeek && workoutDate <= today) {
                const dayOfWeek = (workoutDate.getDay() + 6) % 7; // 0-6 (Mon-Sun)
                workoutCounts[dayOfWeek]++;
            }
        });

        workoutChart.data.datasets[0].data = workoutCounts;
        workoutChart.update();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadWorkouts() {
    try {
        const workouts = await window.fitnessDB.getWorkouts();
        const workoutsContainer = document.getElementById('workoutList');

        if (workouts.length === 0) {
            workoutsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">还没有锻炼记录，开始添加您的第一次锻炼吧！</p>';
            return;
        }

        // Sort workouts by date (newest first)
        const sortedWorkouts = workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

        const iconMap = {
            running: { icon: 'fa-running', label: '跑步' },
            cycling: { icon: 'fa-bicycle', label: '骑行' },
            weightlifting: { icon: 'fa-dumbbell', label: '举重' },
            swimming: { icon: 'fa-swimmer', label: '游泳' },
            yoga: { icon: 'fa-spa', label: '瑜伽' },
            other: { icon: 'fa-heartbeat', label: '其他' }
        };

        workoutsContainer.innerHTML = sortedWorkouts.map(workout => {
            const typeInfo = iconMap[workout.type] || iconMap.other;
            const details = [];

            if (workout.duration) {
                details.push(`<i class="fas fa-clock"></i> ${workout.duration}分钟`);
            }
            if (workout.distance) {
                details.push(`<i class="fas fa-route"></i> ${workout.distance}km`);
            }
            if (workout.weight) {
                details.push(`<i class="fas fa-dumbbell"></i> ${workout.weight}kg`);
            }

            return `
                <div class="workout-card" data-id="${workout.id}">
                    <div class="workout-card-header">
                        <div class="workout-icon">
                            <i class="fas ${typeInfo.icon}"></i>
                        </div>
                        <div class="workout-info">
                            <h4>${typeInfo.label}</h4>
                            <div class="workout-details">
                                ${details.join(' · ')}
                            </div>
                            <small style="color: var(--text-light); margin-top: 0.2rem; display: block;">
                                <i class="fas fa-calendar"></i> ${window.fitnessDB.formatDate(workout.date)}
                            </small>
                            ${workout.notes ? `<small style="color: var(--text-light); font-style: italic;">${workout.notes}</small>` : ''}
                        </div>
                    </div>
                    <div class="workout-actions">
                        <button class="btn-icon btn-share" onclick="shareWorkout(${workout.id})" title="分享">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteWorkout(${workout.id})" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading workouts:', error);
    }
}

async function loadGoals() {
    try {
        const goals = await window.fitnessDB.getGoals();
        const goalsContainer = document.getElementById('goalsContainer');

        if (goals.length === 0) {
            goalsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">还没有设定目标，开始设定您的第一个健身目标吧！</p>';
            return;
        }

        const typeLabels = {
            workouts: '锻炼次数',
            duration: '总时长（分钟）',
            distance: '总距离（公里）',
            weight: '目标体重（公斤）'
        };

        const periodLabels = {
            daily: '每日',
            weekly: '每周',
            monthly: '每月'
        };

        goalsContainer.innerHTML = goals.map(goal => {
            const percentage = Math.min(100, (goal.currentProgress / goal.target) * 100);

            return `
                <div class="goal-card" data-id="${goal.id}">
                    <div class="goal-header">
                        <span class="goal-title">${typeLabels[goal.type]}</span>
                        <span class="goal-period">${periodLabels[goal.period]}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="goal-stats">
                        <span>${goal.currentProgress} / ${goal.target}</span>
                        <span>${percentage.toFixed(0)}%</span>
                    </div>
                    <div class="goal-actions">
                        <button class="btn-icon btn-delete" onclick="deleteGoal(${goal.id})" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading goals:', error);
    }
}

async function loadMilestones() {
    try {
        const milestones = await window.fitnessDB.getMilestones();
        const milestonesList = document.getElementById('milestonesList');

        const sortedMilestones = milestones.sort((a, b) => {
            if (a.unlocked === b.unlocked) return 0;
            return a.unlocked ? -1 : 1;
        });

        milestonesList.innerHTML = sortedMilestones.map(milestone => `
            <div class="milestone-card ${milestone.unlocked ? 'unlocked' : ''}">
                <div class="milestone-icon">
                    <i class="fas ${milestone.icon || 'fa-trophy'}"></i>
                </div>
                <div class="milestone-info">
                    <h4>${milestone.title}</h4>
                    <p>${milestone.description}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading milestones:', error);
    }
}

async function loadStepsHistory() {
    try {
        const stepsHistory = await window.fitnessDB.getStepsHistory(7);

        stepsChart.data.labels = stepsHistory.map(s => {
            const date = new Date(s.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        stepsChart.data.datasets[0].data = stepsHistory.map(s => s.steps);
        stepsChart.update();

        // Show today's steps if available
        const today = new Date().toISOString().split('T')[0];
        const todaySteps = stepsHistory.find(s => s.date === today);

        if (todaySteps) {
            document.getElementById('stepsCount').textContent = todaySteps.steps.toLocaleString();
            const distance = (todaySteps.steps * 0.000762).toFixed(2); // Average step length ~0.762m
            document.getElementById('stepsDistance').textContent = `${distance} 公里`;
        }

    } catch (error) {
        console.error('Error loading steps history:', error);
    }
}

// ============= Global Functions for Event Handlers =============

// Delete workout
async function deleteWorkout(id) {
    if (confirm('确定要删除这条锻炼记录吗？')) {
        try {
            await window.fitnessDB.deleteWorkout(id);
            showToast('锻炼记录已删除', 'success');
            await loadDashboardData();
            await loadWorkouts();
        } catch (error) {
            console.error('Error deleting workout:', error);
            showToast('删除失败', 'error');
        }
    }
}

// Delete goal
async function deleteGoal(id) {
    if (confirm('确定要删除这个目标吗？')) {
        try {
            await window.fitnessDB.deleteGoal(id);
            showToast('目标已删除', 'success');
            await loadGoals();
        } catch (error) {
            console.error('Error deleting goal:', error);
            showToast('删除失败', 'error');
        }
    }
}

// Share single workout
async function shareWorkout(id) {
    try {
        const workout = await window.fitnessDB.getRecord('workouts', id);
        if (workout && shareGenerator) {
            const cardHTML = await shareGenerator.generateWorkoutCard(workout);
            await shareGenerator.showShareModal(cardHTML);
        }
    } catch (error) {
        console.error('Error sharing workout:', error);
        showToast('分享失败', 'error');
    }
}

// ============= Toast Notification =============
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
