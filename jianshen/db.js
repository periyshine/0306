// Database JavaScript - IndexedDB implementation for Fitness Tracker

const DB_NAME = 'FitnessTrackerDB';
const DB_VERSION = 1;

let db = null;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database initialized successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create workouts store
            if (!database.objectStoreNames.contains('workouts')) {
                const workoutStore = database.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
                workoutStore.createIndex('date', 'date', { unique: false });
                workoutStore.createIndex('type', 'type', { unique: false });
            }

            // Create weights store
            if (!database.objectStoreNames.contains('weights')) {
                const weightStore = database.createObjectStore('weights', { keyPath: 'id', autoIncrement: true });
                weightStore.createIndex('date', 'date', { unique: false });
            }

            // Create goals store
            if (!database.objectStoreNames.contains('goals')) {
                const goalStore = database.createObjectStore('goals', { keyPath: 'id', autoIncrement: true });
                goalStore.createIndex('period', 'period', { unique: false });
                goalStore.createIndex('type', 'type', { unique: false });
            }

            // Create steps store
            if (!database.objectStoreNames.contains('steps')) {
                const stepStore = database.createObjectStore('steps', { keyPath: 'id', autoIncrement: true });
                stepStore.createIndex('date', 'date', { unique: true });
            }

            // Create milestones store
            if (!database.objectStoreNames.contains('milestones')) {
                database.createObjectStore('milestones', { keyPath: 'id' });
            }
        };
    });
}

// Generic CRUD operations
function addRecord(storeName, record) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(record);

        request.onsuccess = () => resolve({ ...record, id: request.result });
        request.onerror = () => reject(request.error);
    });
}

function getRecord(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllRecords(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function updateRecord(storeName, record) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(record);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function deleteRecord(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Workout specific operations
async function addWorkout(workout) {
    const workoutWithTimestamp = {
        ...workout,
        createdAt: new Date().toISOString()
    };
    return await addRecord('workouts', workoutWithTimestamp);
}

async function getWorkouts() {
    return await getAllRecords('workouts');
}

async function getWorkoutsByType(type) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['workouts'], 'readonly');
        const store = transaction.objectStore('workouts');
        const index = store.index('type');
        const request = index.getAll(type);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getWorkoutsByDateRange(startDate, endDate) {
    const workouts = await getWorkouts();
    return workouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= startDate && workoutDate <= endDate;
    });
}

async function updateWorkout(workout) {
    return await updateRecord('workouts', workout);
}

async function deleteWorkout(id) {
    return await deleteRecord('workouts', id);
}

// Weight specific operations
async function addWeight(weightRecord) {
    const weightWithTimestamp = {
        ...weightRecord,
        timestamp: new Date().toISOString()
    };
    return await addRecord('weights', weightWithTimestamp);
}

async function getWeights() {
    return await getAllRecords('weights');
}

async function getLatestWeight() {
    const weights = await getWeights();
    return weights.length > 0 ? weights[weights.length - 1] : null;
}

async function deleteWeight(id) {
    return await deleteRecord('weights', id);
}

// Goal specific operations
async function addGoal(goal) {
    const goalWithTimestamp = {
        ...goal,
        createdAt: new Date().toISOString(),
        currentProgress: 0,
        completed: false
    };
    return await addRecord('goals', goalWithTimestamp);
}

async function getGoals() {
    return await getAllRecords('goals');
}

async function updateGoalProgress(goalId, progress) {
    const goal = await getRecord('goals', goalId);
    if (goal) {
        goal.currentProgress = progress;
        goal.completed = progress >= goal.target;
        return await updateRecord('goals', goal);
    }
    throw new Error('Goal not found');
}

async function updateGoal(goal) {
    return await updateRecord('goals', goal);
}

async function deleteGoal(id) {
    return await deleteRecord('goals', id);
}

// Steps specific operations
async function addSteps(stepsRecord) {
    return await addRecord('steps', stepsRecord);
}

async function getSteps() {
    return await getAllRecords('steps');
}

async function getStepsByDate(date) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['steps'], 'readonly');
        const store = transaction.objectStore('steps');
        const index = store.index('date');
        const request = index.get(date);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateSteps(stepsRecord) {
    return await updateRecord('steps', stepsRecord);
}

async function getStepsHistory(days = 7) {
    const steps = await getSteps();
    const sorted = steps.sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted.slice(-days);
}

// Milestone operations
async function initMilestones() {
    const milestones = [
        {
            id: 'first_workout',
            title: '初次锻炼',
            description: '完成第一次锻炼',
            icon: 'fa-play',
            unlocked: false
        },
        {
            id: 'week_warrior',
            title: '一周战士',
            description: '一周内完成7次锻炼',
            icon: 'fa-fire',
            unlocked: false
        },
        {
            id: 'marathon',
            title: '马拉松成就',
            description: '累计跑步距离达到42公里',
            icon: 'fa-running',
            unlocked: false
        },
        {
            id: 'iron_lifter',
            title: '钢铁举重者',
            description: '单次举重超过100公斤',
            icon: 'fa-dumbbell',
            unlocked: false
        },
        {
            id: 'consistent',
            title: '坚持不懈',
            description: '连续30天记录锻炼',
            icon: 'fa-calendar-check',
            unlocked: false
        },
        {
            id: 'goal_getter',
            title: '目标达成者',
            description: '完成第一个健身目标',
            icon: 'fa-trophy',
            unlocked: false
        },
        {
            id: 'century',
            title: '百次俱乐部',
            description: '累计完成100次锻炼',
            icon: 'fa-medal',
            unlocked: false
        },
        {
            id: 'weight_loss',
            title: '减重达人',
            description: '体重下降超过5公斤',
            icon: 'fa-weight-scale',
            unlocked: false
        }
    ];

    for (const milestone of milestones) {
        try {
            await addRecord('milestones', milestone);
        } catch (e) {
            // Milestone might already exist
            console.log('Milestone already exists:', milestone.id);
        }
    }
}

async function getMilestones() {
    return await getAllRecords('milestones');
}

async function unlockMilestone(milestoneId) {
    const milestone = await getRecord('milestones', milestoneId);
    if (milestone && !milestone.unlocked) {
        milestone.unlocked = true;
        milestone.unlockedAt = new Date().toISOString();
        await updateRecord('milestones', milestone);
        return milestone;
    }
    return null;
}

async function checkAndUnlockMilestones() {
    const workouts = await getWorkouts();
    const weights = await getWeights();
    const goals = await getGoals();

    const unlockedMilestones = [];

    // Check for first workout
    if (workouts.length > 0) {
        const milestone = await unlockMilestone('first_workout');
        if (milestone) unlockedMilestones.push(milestone);
    }

    // Check for 100 workouts
    if (workouts.length >= 100) {
        const milestone = await unlockMilestone('century');
        if (milestone) unlockedMilestones.push(milestone);
    }

    // Check for week warrior
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentWorkouts = workouts.filter(w => new Date(w.date) >= oneWeekAgo);
    if (recentWorkouts.length >= 7) {
        const milestone = await unlockMilestone('week_warrior');
        if (milestone) unlockedMilestones.push(milestone);
    }

    // Check for marathon (42km running)
    const runningWorkouts = workouts.filter(w => w.type === 'running');
    const totalRunningDistance = runningWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    if (totalRunningDistance >= 42) {
        const milestone = await unlockMilestone('marathon');
        if (milestone) unlockedMilestones.push(milestone);
    }

    // Check for iron lifter (100kg single lift)
    const liftingWorkouts = workouts.filter(w => w.type === 'weightlifting');
    const maxWeight = Math.max(...liftingWorkouts.map(w => w.weight || 0));
    if (maxWeight >= 100) {
        const milestone = await unlockMilestone('iron_lifter');
        if (milestone) unlockedMilestones.push(milestone);
    }

    // Check for 30 day consistency
    if (workouts.length >= 30) {
        const dates = workouts.map(w => new Date(w.date).toDateString());
        const uniqueDates = [...new Set(dates)];
        if (uniqueDates.length >= 30) {
            const milestone = await unlockMilestone('consistent');
            if (milestone) unlockedMilestones.push(milestone);
        }
    }

    // Check for completed goal
    if (goals.some(g => g.completed)) {
        const milestone = await unlockMilestone('goal_getter');
        if (milestone) unlockedMilestones.push(milestone);
    }

    // Check for weight loss
    if (weights.length >= 2) {
        const sortedWeights = weights.sort((a, b) => new Date(a.date) - new Date(b.date));
        const weightLoss = sortedWeights[0].weight - sortedWeights[sortedWeights.length - 1].weight;
        if (weightLoss >= 5) {
            const milestone = await unlockMilestone('weight_loss');
            if (milestone) unlockedMilestones.push(milestone);
        }
    }

    return unlockedMilestones;
}

// Statistics helpers
async function getWeeklyStats() {
    const workouts = await getWorkouts();
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);

    return {
        workoutCount: weeklyWorkouts.length,
        totalDuration: weeklyWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
        totalDistance: weeklyWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0)
    };
}

async function getMonthlyWorkouts() {
    const workouts = await getWorkouts();
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return workouts.filter(w => new Date(w.date) >= monthAgo);
}

// Helper function to format dates
function formatDate(date) {
    return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Export all functions for use in app.js
window.fitnessDB = {
    initDB,
    initMilestones,
    // Workout functions
    addWorkout,
    getWorkouts,
    getWorkoutsByType,
    getWorkoutsByDateRange,
    updateWorkout,
    deleteWorkout,
    // Weight functions
    addWeight,
    getWeights,
    getLatestWeight,
    deleteWeight,
    // Goal functions
    addGoal,
    getGoals,
    updateGoalProgress,
    updateGoal,
    deleteGoal,
    // Steps functions
    addSteps,
    getSteps,
    getStepsByDate,
    updateSteps,
    getStepsHistory,
    // Milestone functions
    getMilestones,
    unlockMilestone,
    checkAndUnlockMilestones,
    // Statistics helpers
    getWeeklyStats,
    getMonthlyWorkouts,
    formatDate
};
