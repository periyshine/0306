/**
 * Pedometer Module - Web Pedometer API Integration
 * Handles step counting using the experimental Web Pedometer API
 * Gracefully degrades on unsupported devices
 */

// Pedometer state
const PedometerState = {
    isSupported: false,
    isAvailable: false,
    isReading: false,
    permission: 'unknown', // unknown, granted, denied, prompt
    today: {
        steps: 0,
        distance: 0,
        calories: 0
    },
    pedometer: null
};

// Constants for calculations
const STEPS_PER_METER = 1.3; // Approximate
const CALORIES_PER_STEP = 0.04; // Approximate for average person

/**
 * Initialize pedometer functionality
 */
async function initPedometer() {
    const toggleBtn = document.getElementById('pedometerToggle');
    if (!toggleBtn) {
        console.warn('Pedometer toggle button not found');
        return;
    }

    // Check for Pedometer API support
    if ('Pedometer' in window) {
        PedometerState.isSupported = true;
    } else if ('Sensor' in window && 'PedometerSensor' in window) {
        // Alternative sensor name
        PedometerState.isSupported = true;
    } else {
        console.log('Web Pedometer API not supported on this device');
        PedometerState.isSupported = false;
        updatePedometerStatus('not_supported');
        return;
    }

    // Set up event listeners
    toggleBtn.addEventListener('click', togglePedometerPanel);

    const closeBtn = document.getElementById('closePedometer');
    if (closeBtn) {
        closeBtn.addEventListener('click', closePedometerPanel);
    }

    const syncBtn = document.getElementById('syncStepsToWorkout');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncStepsToWorkout);
    }

    // Check availability and permission
    await checkPedometerAvailability();

    // If available, try to read today's steps
    if (PedometerState.isAvailable) {
        await readTodaySteps();
    }
}

/**
 * Check if pedometer is available and has permission
 */
async function checkPedometerAvailability() {
    if (!PedometerState.isSupported) {
        return;
    }

    try {
        // Try to check permissions
        if ('permissions' in navigator) {
            const result = await navigator.permissions.query({ name: 'pedometer' });
            PedometerState.permission = result.state;

            result.addEventListener('change', () => {
                PedometerState.permission = result.state;
                updatePedometerStatus();
            });
        }

        // Try to check if sensor is available
        const pedometer = new Pedometer();
        await pedometer.start();
        PedometerState.isAvailable = true;
        PedometerState.pedometer = pedometer;
        updatePedometerStatus('ready');
    } catch (error) {
        console.error('Pedometer not available:', error);
        PedometerState.isAvailable = false;
        updatePedometerStatus('unavailable');
    }
}

/**
 * Request pedometer permission
 */
async function requestPedometerPermission() {
    if (!PedometerState.isSupported) {
        App?.showToast('您的设备不支持计步器功能', 'error');
        return false;
    }

    try {
        // Try to start pedometer to trigger permission prompt
        const pedometer = new Pedometer();
        await pedometer.start();
        PedometerState.pedometer = pedometer;
        PedometerState.isAvailable = true;
        PedometerState.permission = 'granted';

        updatePedometerStatus('ready');
        App?.showToast('计步器权限已授予', 'success');
        return true;
    } catch (error) {
        console.error('Error requesting pedometer permission:', error);
        PedometerState.permission = 'denied';
        updatePedometerStatus('denied');
        return false;
    }
}

/**
 * Read today's step count
 */
async function readTodaySteps() {
    if (!PedometerState.isAvailable || PedometerState.isReading) {
        return;
    }

    PedometerState.isReading = true;
    updatePedometerStatus('reading');

    try {
        // Get today's date range
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        // Read step count
        const pedometerReadings = await PedometerState.pedometer.read({
            startTime: startOfDay,
            endTime: endOfDay
        });

        // Update state
        PedometerState.today.steps = 0;
        for (const reading of pedometerReadings) {
            PedometerState.today.steps += reading.steps || 0;
        }

        // Calculate distance and calories
        PedometerState.today.distance = PedometerState.today.steps / STEPS_PER_METER;
        PedometerState.today.calories = PedometerState.today.steps * CALORIES_PER_STEP;

        // Update UI
        updatePedometerUI();
        updateStepCountBadge();
        updatePedometerStatus('updated');

        // Set up continuous reading if supported
        startContinuousReading();
    } catch (error) {
        console.error('Error reading steps:', error);
        updatePedometerStatus('error');
    } finally {
        PedometerState.isReading = false;
    }
}

/**
 * Start continuous step reading
 */
async function startContinuousReading() {
    if (!PedometerState.pedometer) return;

    try {
        const pedometerSession = await PedometerState.pedometer.startSession({
            startTime: new Date()
        });

        // Listen for step updates
        pedometerSession.addEventListener('reading', (event) => {
            PedometerState.today.steps = event.reading.steps || 0;
            PedometerState.today.distance = PedometerState.today.steps / STEPS_PER_METER;
            PedometerState.today.calories = PedometerState.today.steps * CALORIES_PER_STEP;

            updatePedometerUI();
            updateStepCountBadge();
        });

        pedometerSession.addEventListener('error', (event) => {
            console.error('Pedometer reading error:', event.error);
        });
    } catch (error) {
        console.error('Error starting pedometer session:', error);
    }
}

/**
 * Update pedometer UI elements
 */
function updatePedometerUI() {
    const stepsEl = document.getElementById('pedoSteps');
    const distanceEl = document.getElementById('pedoDistance');
    const caloriesEl = document.getElementById('pedoCalories');

    if (stepsEl) {
        stepsEl.textContent = PedometerState.today.steps.toLocaleString();
    }
    if (distanceEl) {
        distanceEl.textContent = PedometerState.today.distance.toFixed(0);
    }
    if (caloriesEl) {
        caloriesEl.textContent = PedometerState.today.calories.toFixed(0);
    }
}

/**
 * Update step count badge in header
 */
function updateStepCountBadge() {
    const badge = document.getElementById('stepCount');
    if (badge) {
        badge.textContent = PedometerState.today.steps > 0
            ? PedometerState.today.steps.toLocaleString()
            : '';
        badge.style.display = PedometerState.today.steps > 0 ? 'block' : 'none';
    }
}

/**
 * Update pedometer status display
 * @param {string} status - Status identifier
 */
function updatePedometerStatus(status) {
    const statusEl = document.getElementById('pedometerStatus');
    if (!statusEl) return;

    const statusMessages = {
        not_supported: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin-bottom: 12px;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p class="status-text">您的设备暂不支持计步器功能</p>
            <p class="hint" style="font-size: 0.75rem; color: var(--color-text-tertiary); margin-top: 8px;">
                该功能需要支持 Web Pedometer API 的设备
            </p>
        `,
        unavailable: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin-bottom: 12px;">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <p class="status-text">计步器不可用</p>
            <button class="submit-btn full-width" onclick="Pedometer.requestPermission()" style="margin-top: 12px;">
                授予权限
            </button>
        `,
        denied: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin-bottom: 12px;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p class="status-text">权限被拒绝</p>
            <p class="hint" style="font-size: 0.75rem; color: var(--color-text-tertiary); margin-top: 8px;">
                请在浏览器设置中允许计步器权限
            </p>
        `,
        ready: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin-bottom: 12px; color: var(--color-success);">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p class="status-text">计步器已就绪</p>
        `,
        reading: `
            <svg class="spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin-bottom: 12px;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <p class="status-text">正在读取步数...</p>
        `,
        updated: '',
        error: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin-bottom: 12px; color: var(--color-danger);">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p class="status-text">读取步数失败</p>
            <button class="submit-btn full-width" onclick="Pedometer.readTodaySteps()" style="margin-top: 12px;">
                重试
            </button>
        `
    };

    const message = statusMessages[status] || statusMessages.ready;
    statusEl.innerHTML = message;

    // Add spinning animation
    if (status === 'reading') {
        if (!document.getElementById('pedometer-spinning-style')) {
            const style = document.createElement('style');
            style.id = 'pedometer-spinning-style';
            style.textContent = `
                .spinning {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

/**
 * Toggle pedometer panel visibility
 */
function togglePedometerPanel() {
    const panel = document.getElementById('pedometerPanel');
    if (panel) {
        panel.classList.toggle('active');

        // If opening and not yet available, try to check again
        if (panel.classList.contains('active') && !PedometerState.isAvailable) {
            checkPedometerAvailability();
        }
    }
}

/**
 * Close pedometer panel
 */
function closePedometerPanel() {
    const panel = document.getElementById('pedometerPanel');
    if (panel) {
        panel.classList.remove('active');
    }
}

/**
 * Sync steps to workout record
 */
async function syncStepsToWorkout() {
    if (PedometerState.today.steps === 0) {
        App?.showToast('今日步数为0，无法同步', 'warning');
        return;
    }

    // Switch to add workout tab
    const addTabBtn = document.querySelector('[data-tab="add"]');
    if (addTabBtn) {
        addTabBtn.click();
    }

    // Pre-fill the workout form with step data
    const typeSelect = document.getElementById('workoutType');
    if (typeSelect) {
        typeSelect.value = 'running'; // Map steps to walking/running
        updateDynamicFields();
    }

    // Estimate duration based on steps (assuming 100 steps per minute)
    const estimatedDuration = Math.ceil(PedometerState.today.steps / 100);
    const durationInput = document.getElementById('workoutDuration');
    if (durationInput) {
        durationInput.value = estimatedDuration;
    }

    // Estimate distance
    const distance = PedometerState.today.distance / 1000; // Convert to km
    const distanceInput = document.getElementById('distance');
    if (distanceInput) {
        distanceInput.value = distance.toFixed(2);
    }

    // Add calories
    const caloriesInput = document.getElementById('workoutCalories');
    if (caloriesInput) {
        caloriesInput.value = Math.round(PedometerState.today.calories);
    }

    // Add notes
    const notesTextarea = document.getElementById('workoutNotes');
    if (notesTextarea) {
        notesTextarea.value = `来自计步器数据：${PedometerState.today.steps.toLocaleString()}步`;
    }

    closePedometerPanel();
    App?.showToast('步数已同步到锻炼表单，请确认后保存', 'info');
}

/**
 * Get formatted step count for display
 * @returns {string} Formatted step count
 */
function getFormattedStepCount() {
    return PedometerState.today.steps.toLocaleString();
}

/**
 * Get pedometer statistics
 * @returns {Object} Today's statistics
 */
function getPedometerStats() {
    return { ...PedometerState.today };
}

/**
 * Check if pedometer is available
 * @returns {boolean} True if pedometer is available
 */
function isPedometerAvailable() {
    return PedometerState.isAvailable;
}

/**
 * Reset today's step count (for testing purposes)
 */
function resetStepCount() {
    PedometerState.today = {
        steps: 0,
        distance: 0,
        calories: 0
    };
    updatePedometerUI();
    updateStepCountBadge();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPedometer);
} else {
    initPedometer();
}

// Export for use in other modules
const Pedometer = {
    initPedometer,
    checkPedometerAvailability,
    requestPedometerPermission,
    readTodaySteps,
    updatePedometerUI,
    updateStepCountBadge,
    togglePedometerPanel,
    closePedometerPanel,
    syncStepsToWorkout,
    getFormattedStepCount,
    getPedometerStats,
    isPedometerAvailable,
    resetStepCount,
    PedometerState
};
