/**
 * Storage Module - IndexedDB Management
 * Handles all data persistence for the fitness tracking app
 */

const DB_NAME = 'FitnessTrackerDB';
const DB_VERSION = 1;

// Database stores
const STORES = {
    WORKOUTS: 'workouts',
    GOALS: 'goals',
    WEIGHT_LOGS: 'weightLogs'
};

// Database instance
let db = null;

/**
 * Initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>} The database instance
 */
async function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create workouts store
            if (!database.objectStoreNames.contains(STORES.WORKOUTS)) {
                const workoutStore = database.createObjectStore(STORES.WORKOUTS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                workoutStore.createIndex('date', 'date', { unique: false });
                workoutStore.createIndex('type', 'type', { unique: false });
            }

            // Create goals store
            if (!database.objectStoreNames.contains(STORES.GOALS)) {
                const goalStore = database.createObjectStore(STORES.GOALS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                goalStore.createIndex('status', 'status', { unique: false });
                goalStore.createIndex('endDate', 'endDate', { unique: false });
            }

            // Create weight logs store
            if (!database.objectStoreNames.contains(STORES.WEIGHT_LOGS)) {
                const weightStore = database.createObjectStore(STORES.WEIGHT_LOGS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                weightStore.createIndex('date', 'date', { unique: false });
            }
        };
    });
}

/**
 * Generic add operation
 * @param {string} storeName - The name of the object store
 * @param {Object} data - The data to add
 * @returns {Promise<number>} The ID of the added record
 */
async function add(storeName, data) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`Error adding to ${storeName}:`, error);
        throw error;
    }
}

/**
 * Generic get operation
 * @param {string} storeName - The name of the object store
 * @param {number} id - The ID of the record to retrieve
 * @returns {Promise<Object>} The retrieved record
 */
async function get(storeName, id) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`Error getting from ${storeName}:`, error);
        throw error;
    }
}

/**
 * Generic get all operation
 * @param {string} storeName - The name of the object store
 * @returns {Promise<Array>} Array of all records
 */
async function getAll(storeName) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`Error getting all from ${storeName}:`, error);
        throw error;
    }
}

/**
 * Generic update operation
 * @param {string} storeName - The name of the object store
 * @param {Object} data - The data to update (must include id)
 * @returns {Promise<number>} The ID of the updated record
 */
async function update(storeName, data) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`Error updating ${storeName}:`, error);
        throw error;
    }
}

/**
 * Generic delete operation
 * @param {string} storeName - The name of the object store
 * @param {number} id - The ID of the record to delete
 * @returns {Promise<void>}
 */
async function remove(storeName, id) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`Error deleting from ${storeName}:`, error);
        throw error;
    }
}

/**
 * Clear all records from a store
 * @param {string} storeName - The name of the object store
 * @returns {Promise<void>}
 */
async function clear(storeName) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`Error clearing ${storeName}:`, error);
        throw error;
    }
}

/**
 * Get records by index
 * @param {string} storeName - The name of the object store
 * @param {string} indexName - The name of the index
 * @param {any} value - The value to query
 * @returns {Promise<Array>} Array of matching records
 */
async function getByIndex(storeName, indexName, value) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`Error getting by index from ${storeName}:`, error);
        throw error;
    }
}

/**
 * Get records in a range by index
 * @param {string} storeName - The name of the object store
 * @param {string} indexName - The name of the index
 * @param {any} lowerBound - Lower bound (inclusive)
 * @param {any} upperBound - Upper bound (inclusive)
 * @returns {Promise<Array>} Array of matching records
 */
async function getRangeByIndex(storeName, indexName, lowerBound, upperBound) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const range = IDBKeyRange.bound(lowerBound, upperBound);
            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`Error getting range from ${storeName}:`, error);
        throw error;
    }
}

// ============================================
// Workout-specific operations
// ============================================

/**
 * Add a new workout
 * @param {Object} workout - The workout data
 * @returns {Promise<number>} The workout ID
 */
async function addWorkout(workout) {
    const workoutData = {
        ...workout,
        createdAt: new Date().toISOString()
    };
    return add(STORES.WORKOUTS, workoutData);
}

/**
 * Get a workout by ID
 * @param {number} id - The workout ID
 * @returns {Promise<Object>} The workout data
 */
async function getWorkout(id) {
    return get(STORES.WORKOUTS, id);
}

/**
 * Get all workouts
 * @returns {Promise<Array>} Array of all workouts
 */
async function getAllWorkouts() {
    return getAll(STORES.WORKOUTS);
}

/**
 * Get workouts by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of workouts in the range
 */
async function getWorkoutsByDateRange(startDate, endDate) {
    return getRangeByIndex(STORES.WORKOUTS, 'date', startDate, endDate);
}

/**
 * Get workouts by type
 * @param {string} type - The workout type
 * @returns {Promise<Array>} Array of workouts of the specified type
 */
async function getWorkoutsByType(type) {
    return getByIndex(STORES.WORKOUTS, 'type', type);
}

/**
 * Update a workout
 * @param {Object} workout - The workout data (must include id)
 * @returns {Promise<number>} The workout ID
 */
async function updateWorkout(workout) {
    const workoutData = {
        ...workout,
        updatedAt: new Date().toISOString()
    };
    return update(STORES.WORKOUTS, workoutData);
}

/**
 * Delete a workout
 * @param {number} id - The workout ID
 * @returns {Promise<void>}
 */
async function deleteWorkout(id) {
    return remove(STORES.WORKOUTS, id);
}

// ============================================
// Goal-specific operations
// ============================================

/**
 * Add a new goal
 * @param {Object} goal - The goal data
 * @returns {Promise<number>} The goal ID
 */
async function addGoal(goal) {
    const goalData = {
        ...goal,
        status: 'active', // active, completed, expired
        createdAt: new Date().toISOString()
    };
    return add(STORES.GOALS, goalData);
}

/**
 * Get a goal by ID
 * @param {number} id - The goal ID
 * @returns {Promise<Object>} The goal data
 */
async function getGoal(id) {
    return get(STORES.GOALS, id);
}

/**
 * Get all goals
 * @returns {Promise<Array>} Array of all goals
 */
async function getAllGoals() {
    return getAll(STORES.GOALS);
}

/**
 * Get active goals
 * @returns {Promise<Array>} Array of active goals
 */
async function getActiveGoals() {
    return getByIndex(STORES.GOALS, 'status', 'active');
}

/**
 * Update a goal
 * @param {Object} goal - The goal data (must include id)
 * @returns {Promise<number>} The goal ID
 */
async function updateGoal(goal) {
    return update(STORES.GOALS, goal);
}

/**
 * Delete a goal
 * @param {number} id - The goal ID
 * @returns {Promise<void>}
 */
async function deleteGoal(id) {
    return remove(STORES.GOALS, id);
}

// ============================================
// Weight log-specific operations
// ============================================

/**
 * Add a new weight log entry
 * @param {Object} weightLog - The weight log data
 * @returns {Promise<number>} The weight log ID
 */
async function addWeightLog(weightLog) {
    const weightLogData = {
        ...weightLog,
        createdAt: new Date().toISOString()
    };
    return add(STORES.WEIGHT_LOGS, weightLogData);
}

/**
 * Get a weight log by ID
 * @param {number} id - The weight log ID
 * @returns {Promise<Object>} The weight log data
 */
async function getWeightLog(id) {
    return get(STORES.WEIGHT_LOGS, id);
}

/**
 * Get all weight logs
 * @returns {Promise<Array>} Array of all weight logs
 */
async function getAllWeightLogs() {
    return getAll(STORES.WEIGHT_LOGS);
}

/**
 * Get weight logs by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of weight logs in the range
 */
async function getWeightLogsByDateRange(startDate, endDate) {
    return getRangeByIndex(STORES.WEIGHT_LOGS, 'date', startDate, endDate);
}

/**
 * Update a weight log
 * @param {Object} weightLog - The weight log data (must include id)
 * @returns {Promise<number>} The weight log ID
 */
async function updateWeightLog(weightLog) {
    return update(STORES.WEIGHT_LOGS, weightLog);
}

/**
 * Delete a weight log
 * @param {number} id - The weight log ID
 * @returns {Promise<void>}
 */
async function deleteWeightLog(id) {
    return remove(STORES.WEIGHT_LOGS, id);
}

// ============================================
// Statistics and aggregates
// ============================================

/**
 * Get workout statistics
 * @param {string} startDate - Optional start date filter
 * @param {string} endDate - Optional end date filter
 * @returns {Promise<Object>} Statistics object
 */
async function getWorkoutStats(startDate = null, endDate = null) {
    try {
        let workouts;
        if (startDate && endDate) {
            workouts = await getWorkoutsByDateRange(startDate, endDate);
        } else {
            workouts = await getAllWorkouts();
        }

        const stats = {
            totalWorkouts: workouts.length,
            totalDuration: 0,
            totalCalories: 0,
            totalDistance: 0,
            byType: {},
            byDate: {}
        };

        workouts.forEach(workout => {
            stats.totalDuration += workout.duration || 0;
            stats.totalCalories += workout.calories || 0;
            stats.totalDistance += workout.distance || 0;

            // Group by type
            if (!stats.byType[workout.type]) {
                stats.byType[workout.type] = {
                    count: 0,
                    duration: 0,
                    calories: 0
                };
            }
            stats.byType[workout.type].count++;
            stats.byType[workout.type].duration += workout.duration || 0;
            stats.byType[workout.type].calories += workout.calories || 0;

            // Group by date
            if (!stats.byDate[workout.date]) {
                stats.byDate[workout.date] = {
                    count: 0,
                    duration: 0,
                    calories: 0
                };
            }
            stats.byDate[workout.date].count++;
            stats.byDate[workout.date].duration += workout.duration || 0;
            stats.byDate[workout.date].calories += workout.calories || 0;
        });

        return stats;
    } catch (error) {
        console.error('Error getting workout stats:', error);
        throw error;
    }
}

/**
 * Calculate goal progress
 * @param {Object} goal - The goal to calculate progress for
 * @returns {Promise<Object>} Progress data
 */
async function calculateGoalProgress(goal) {
    try {
        const today = new Date();
        const startDate = goal.startDate || new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = goal.endDate || today.toISOString().split('T')[0];

        let current = 0;
        let target = goal.target;

        switch (goal.type) {
            case 'workout_count':
                const workouts = await getWorkoutsByDateRange(startDate, endDate);
                current = workouts.length;
                break;
            case 'duration':
                const durationStats = await getWorkoutStats(startDate, endDate);
                current = durationStats.totalDuration;
                break;
            case 'calories':
                const caloriesStats = await getWorkoutStats(startDate, endDate);
                current = caloriesStats.totalCalories;
                break;
            case 'distance':
                const distanceStats = await getWorkoutStats(startDate, endDate);
                current = distanceStats.totalDistance;
                break;
            case 'weight_loss':
                const weightLogs = await getWeightLogsByDateRange(startDate, endDate);
                if (weightLogs.length >= 2) {
                    const startWeight = weightLogs[0].weight;
                    const endWeight = weightLogs[weightLogs.length - 1].weight;
                    current = startWeight - endWeight;
                } else {
                    current = 0;
                }
                break;
        }

        const percentage = Math.min((current / target) * 100, 100);
        const isCompleted = percentage >= 100;

        return {
            current,
            target,
            percentage,
            isCompleted
        };
    } catch (error) {
        console.error('Error calculating goal progress:', error);
        throw error;
    }
}

/**
 * Export all data as JSON
 * @returns {Promise<string>} JSON string of all data
 */
async function exportData() {
    try {
        const [workouts, goals, weightLogs] = await Promise.all([
            getAllWorkouts(),
            getAllGoals(),
            getAllWeightLogs()
        ]);

        return JSON.stringify({
            version: DB_VERSION,
            exportDate: new Date().toISOString(),
            workouts,
            goals,
            weightLogs
        }, null, 2);
    } catch (error) {
        console.error('Error exporting data:', error);
        throw error;
    }
}

/**
 * Import data from JSON
 * @param {string} jsonData - JSON string to import
 * @returns {Promise<void>}
 */
async function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);

        // Clear existing data
        await Promise.all([
            clear(STORES.WORKOUTS),
            clear(STORES.GOALS),
            clear(STORES.WEIGHT_LOGS)
        ]);

        // Import new data
        const database = await initDB();
        const transaction = database.transaction([
            STORES.WORKOUTS,
            STORES.GOALS,
            STORES.WEIGHT_LOGS
        ], 'readwrite');

        // Import workouts
        if (data.workouts && data.workouts.length > 0) {
            const workoutStore = transaction.objectStore(STORES.WORKOUTS);
            data.workouts.forEach(workout => {
                workoutStore.put(workout);
            });
        }

        // Import goals
        if (data.goals && data.goals.length > 0) {
            const goalStore = transaction.objectStore(STORES.GOALS);
            data.goals.forEach(goal => {
                goalStore.put(goal);
            });
        }

        // Import weight logs
        if (data.weightLogs && data.weightLogs.length > 0) {
            const weightStore = transaction.objectStore(STORES.WEIGHT_LOGS);
            data.weightLogs.forEach(log => {
                weightStore.put(log);
            });
        }

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('Error importing data:', error);
        throw error;
    }
}

// Export for use in other modules
const Storage = {
    initDB,
    add,
    get,
    getAll,
    update,
    remove,
    clear,
    getByIndex,
    getRangeByIndex,
    addWorkout,
    getWorkout,
    getAllWorkouts,
    getWorkoutsByDateRange,
    getWorkoutsByType,
    updateWorkout,
    deleteWorkout,
    addGoal,
    getGoal,
    getAllGoals,
    getActiveGoals,
    updateGoal,
    deleteGoal,
    addWeightLog,
    getWeightLog,
    getAllWeightLogs,
    getWeightLogsByDateRange,
    updateWeightLog,
    deleteWeightLog,
    getWorkoutStats,
    calculateGoalProgress,
    exportData,
    importData,
    STORES
};
