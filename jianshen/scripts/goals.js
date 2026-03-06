/**
 * Goals Module - Goal and Milestone Management
 * Handles goal creation, progress tracking, and milestone visualization
 */

// Goal type configurations
const GoalTypes = {
    workout_count: {
        name: '锻炼次数',
        unit: '次',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
    },
    duration: {
        name: '总时长',
        unit: '分钟',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
    },
    calories: {
        name: '消耗卡路里',
        unit: '卡',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>'
    },
    distance: {
        name: '总距离',
        unit: '公里',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 1 0 10 10"/></svg>'
    },
    weight_loss: {
        name: '减重',
        unit: '公斤',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="m8 17 4 4 4-4"/><circle cx="12" cy="5" r="1"/></svg>'
    }
};

const GoalPeriods = {
    weekly: '每周',
    monthly: '每月',
    custom: '自定义'
};

// Current editing goal ID
let editingGoalId = null;

/**
 * Initialize goals functionality
 */
function initGoals() {
    // Add goal button
    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => {
            editingGoalId = null;
            document.getElementById('goalModalTitle').textContent = '添加目标';
            document.getElementById('goalForm').reset();
            document.getElementById('customDatesGroup').style.display = 'none';
            App?.openModal('goalModal');
        });
    }

    // Goal form submission
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', handleGoalSubmit);
    }

    // Period change handler
    const periodSelect = document.getElementById('goalPeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
            const customGroup = document.getElementById('customDatesGroup');
            customGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
    }

    // Add weight button
    const addWeightBtn = document.getElementById('addWeightBtn');
    if (addWeightBtn) {
        addWeightBtn.addEventListener('click', () => {
            document.getElementById('weightDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('weightForm').reset();
            document.getElementById('weightDate').value = new Date().toISOString().split('T')[0];
            App?.openModal('weightModal');
        });
    }

    // Weight form submission
    const weightForm = document.getElementById('weightForm');
    if (weightForm) {
        weightForm.addEventListener('submit', handleWeightSubmit);
    }

    // Delete weight buttons
    document.addEventListener('click', async (event) => {
        const btn = event.target.closest('[data-action="delete-weight"]');
        if (btn) {
            const id = parseInt(btn.dataset.id);
            if (confirm('确定要删除这条体重记录吗？')) {
                try {
                    await Storage.deleteWeightLog(id);
                    App?.showToast('体重记录已删除', 'success');
                    await App?.loadWeightTracking();
                } catch (error) {
                    console.error('Error deleting weight log:', error);
                    App?.showToast('删除失败', 'error');
                }
            }
        }
    });
}

/**
 * Render goals list
 * @param {Array} goals - Array of goal objects
 */
async function renderGoals(goals) {
    const container = document.getElementById('goalsList');

    if (!goals || goals.length === 0) {
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

    const goalPromises = goals.map(async (goal) => {
        const progress = await Storage.calculateGoalProgress(goal);
        const typeInfo = GoalTypes[goal.type] || { name: goal.type, unit: '', icon: '' };

        // Determine goal status
        let status = 'active';
        let statusText = '进行中';

        if (progress.isCompleted) {
            status = 'completed';
            statusText = '已完成';
        } else if (goal.endDate && new Date(goal.endDate) < new Date()) {
            status = 'expired';
            statusText = '已过期';
        }

        // Update goal status in storage if completed
        if (progress.isCompleted && goal.status !== 'completed') {
            goal.status = 'completed';
            await Storage.updateGoal(goal);
        }

        return `
            <div class="goal-card" data-id="${goal.id}">
                <div class="goal-header">
                    <div>
                        <div class="goal-title">
                            ${typeInfo.icon}
                            <span>${typeInfo.name}</span>
                        </div>
                        <div class="goal-period">${getGoalPeriodText(goal)}</div>
                    </div>
                    <span class="goal-status ${status}">${statusText}</span>
                </div>

                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill ${progress.isCompleted ? 'completed' : ''}"
                             style="width: ${progress.percentage}%"
                             data-percentage="${progress.percentage}">
                        </div>
                    </div>
                    <div class="progress-text">
                        <span>${progress.current.toFixed(1)} / ${progress.target} ${typeInfo.unit}</span>
                        <span>${progress.percentage.toFixed(0)}%</span>
                    </div>
                </div>

                <div class="goal-actions">
                    <button class="text-btn" data-action="edit-goal" data-id="${goal.id}">编辑</button>
                    <button class="text-btn" data-action="delete-goal" data-id="${goal.id}">删除</button>
                </div>
            </div>
        `;
    });

    const goalCards = await Promise.all(goalPromises);
    container.innerHTML = goalCards.join('');

    // Add animation to progress bars
    setTimeout(() => {
        container.querySelectorAll('.progress-fill').forEach(fill => {
            fill.style.transform = 'scaleX(1)';
        });
    }, 100);

    // Attach event listeners
    attachGoalActionListeners();
}

/**
 * Get formatted goal period text
 * @param {Object} goal - Goal object
 * @returns {string} Formatted period text
 */
function getGoalPeriodText(goal) {
    if (goal.period === 'custom' && goal.startDate && goal.endDate) {
        const start = new Date(goal.startDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        const end = new Date(goal.endDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        return `${start} - ${end}`;
    } else if (goal.period === 'weekly') {
        return '本周';
    } else if (goal.period === 'monthly') {
        return '本月';
    }
    return GoalPeriods[goal.period] || '';
}

/**
 * Attach event listeners to goal action buttons
 */
function attachGoalActionListeners() {
    document.querySelectorAll('[data-action="edit-goal"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.id);
            await editGoal(id);
        });
    });

    document.querySelectorAll('[data-action="delete-goal"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.id);
            await deleteGoal(id);
        });
    });
}

/**
 * Handle goal form submission
 * @param {Event} event - Form submit event
 */
async function handleGoalSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const goal = {
        type: formData.get('type'),
        target: parseFloat(formData.get('target')),
        period: formData.get('period')
    };

    if (goal.period === 'custom') {
        goal.startDate = formData.get('startDate');
        goal.endDate = formData.get('endDate');
        if (!goal.startDate || !goal.endDate) {
            App?.showToast('请设置开始和结束日期', 'warning');
            return;
        }
    } else {
        // Calculate date range based on period
        const today = new Date();
        const endDate = new Date(today);

        if (goal.period === 'weekly') {
            // Start of week (Monday)
            const dayOfWeek = today.getDay();
            const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const startDate = new Date(today.setDate(diff));
            goal.startDate = startDate.toISOString().split('T')[0];
            goal.endDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        } else if (goal.period === 'monthly') {
            // Start of month
            const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            goal.startDate = startDate.toISOString().split('T')[0];
            goal.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        }
    }

    try {
        if (editingGoalId) {
            goal.id = editingGoalId;
            await Storage.updateGoal(goal);
            App?.showToast('目标已更新', 'success');
        } else {
            await Storage.addGoal(goal);
            App?.showToast('目标已添加', 'success');
        }

        App?.closeModal('goalModal');
        form.reset();
        editingGoalId = null;

        await App?.loadGoals();
    } catch (error) {
        console.error('Error saving goal:', error);
        App?.showToast('保存目标失败', 'error');
    }
}

/**
 * Edit a goal
 * @param {number} id - Goal ID
 */
async function editGoal(id) {
    try {
        const goal = await Storage.getGoal(id);
        if (!goal) {
            App?.showToast('目标不存在', 'error');
            return;
        }

        editingGoalId = id;
        document.getElementById('goalModalTitle').textContent = '编辑目标';

        const form = document.getElementById('goalForm');
        form.querySelector('[name="type"]').value = goal.type;
        form.querySelector('[name="target"]').value = goal.target;
        form.querySelector('[name="period"]').value = goal.period;

        if (goal.period === 'custom') {
            document.getElementById('customDatesGroup').style.display = 'block';
            form.querySelector('[name="startDate"]').value = goal.startDate;
            form.querySelector('[name="endDate"]').value = goal.endDate;
        } else {
            document.getElementById('customDatesGroup').style.display = 'none';
        }

        App?.openModal('goalModal');
    } catch (error) {
        console.error('Error loading goal for edit:', error);
        App?.showToast('加载目标失败', 'error');
    }
}

/**
 * Delete a goal
 * @param {number} id - Goal ID
 */
async function deleteGoal(id) {
    if (!confirm('确定要删除这个目标吗？')) {
        return;
    }

    try {
        await Storage.deleteGoal(id);
        App?.showToast('目标已删除', 'success');
        await App?.loadGoals();
    } catch (error) {
        console.error('Error deleting goal:', error);
        App?.showToast('删除失败', 'error');
    }
}

/**
 * Handle weight form submission
 * @param {Event} event - Form submit event
 */
async function handleWeightSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const weightLog = {
        weight: parseFloat(formData.get('weight')),
        date: formData.get('date'),
        notes: formData.get('notes') || ''
    };

    try {
        await Storage.addWeightLog(weightLog);
        App?.showToast('体重记录已保存', 'success');

        form.reset();
        App?.closeModal('weightModal');

        await App?.loadWeightTracking();
    } catch (error) {
        console.error('Error saving weight log:', error);
        App?.showToast('保存失败', 'error');
    }
}

/**
 * Check for completed goals and show notifications
 */
async function checkGoalCompletions() {
    try {
        const goals = await Storage.getActiveGoals();
        const notifications = [];

        for (const goal of goals) {
            const progress = await Storage.calculateGoalProgress(goal);
            if (progress.isCompleted && goal.status !== 'completed') {
                const typeInfo = GoalTypes[goal.type];
                notifications.push({
                    title: '目标完成！',
                    message: `恭喜！你已完成${typeInfo.name}目标：${progress.current} / ${progress.target} ${typeInfo.unit}`,
                    goalId: goal.id
                });

                // Update goal status
                goal.status = 'completed';
                await Storage.updateGoal(goal);
            } else if (goal.endDate && new Date(goal.endDate) < new Date() && goal.status === 'active') {
                const typeInfo = GoalTypes[goal.type];
                const progressData = await Storage.calculateGoalProgress(goal);
                notifications.push({
                    title: '目标已过期',
                    message: `${typeInfo.name}目标已过期：${progressData.current.toFixed(1)} / ${progressData.target} ${typeInfo.unit}`,
                    goalId: goal.id
                });

                goal.status = 'expired';
                await Storage.updateGoal(goal);
            }
        }

        return notifications;
    } catch (error) {
        console.error('Error checking goal completions:', error);
        return [];
    }
}

/**
 * Show goal achievement animation
 * @param {HTMLElement} element - The goal card element
 */
function showGoalAchievement(element) {
    element.style.animation = 'goalAchievement 1s ease';

    const style = document.createElement('style');
    style.textContent = `
        @keyframes goalAchievement {
            0% { transform: scale(1); }
            25% { transform: scale(1.05); }
            50% { transform: scale(1.1); }
            75% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        element.style.animation = '';
        style.remove();
    }, 1000);
}

/**
 * Get milestone suggestions based on progress
 * @param {Object} goal - Goal object
 * @param {Object} progress - Progress data
 * @returns {Array} Array of milestone messages
 */
function getMilestoneMessages(goal, progress) {
    const milestones = [];
    const typeInfo = GoalTypes[goal.type];
    const percentage = progress.percentage;

    if (percentage >= 100) {
        milestones.push({
            icon: '🎉',
            title: '太棒了！',
            message: `你已经完成了${typeInfo.name}目标！`
        });
    } else if (percentage >= 75) {
        milestones.push({
            icon: '💪',
            title: '即将达成！',
            message: `还差最后 ${(100 - percentage).toFixed(0)}% 就能完成目标了！`
        });
    } else if (percentage >= 50) {
        milestones.push({
            icon: '👍',
            title: '过半了！',
            message: `你已经完成了目标的 ${percentage.toFixed(0)}%，继续保持！`
        });
    } else if (percentage >= 25) {
       里程碑.push({
            icon: '🌟',
            title: '良好的开始！',
            message: `你已经完成 ${percentage.toFixed(0)}% 了，坚持下去！`
        });
    }

    return milestones;
}

/**
 * Initialize goals module
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoals);
} else {
    initGoals();
}

// Export for use in other modules
const Goals = {
    initGoals,
    renderGoals,
    handleGoalSubmit,
    editGoal,
    deleteGoal,
    handleWeightSubmit,
    checkGoalCompletions,
    showGoalAchievement,
    getMilestoneMessages,
    GoalTypes
};
