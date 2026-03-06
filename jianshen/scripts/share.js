/**
 * Share Module - Social Sharing Functionality
 * Handles generating share cards and sharing via Web Share API or download
 */

// Current workout being shared
let currentShareWorkout = null;

/**
 * Open share modal with workout data
 * @param {Object} workout - Workout object to share
 */
function openShareModal(workout) {
    currentShareWorkout = workout;

    // Populate share card
    const typeInfo = App?.WorkoutTypes?.[workout.type] || App?.WorkoutTypes?.other || {};
    const container = document.getElementById('shareWorkoutInfo');

    const stats = [];
    if (workout.duration) {
        stats.push(`<div class="share-stat">
            <div class="share-stat-label">时长</div>
            <div class="share-stat-value">${workout.duration} 分钟</div>
        </div>`);
    }
    if (workout.calories) {
        stats.push(`<div class="share-stat">
            <div class="share-stat-label">消耗</div>
            <div class="share-stat-value">${workout.calories} 卡</div>
        </div>`);
    }
    if (workout.distance) {
        stats.push(`<div class="share-stat">
            <div class="share-stat-label">距离</div>
            <div class="share-stat-value">${workout.distance} km</div>
        </div>`);
    }
    if (workout.weight) {
        stats.push(`<div class="share-stat">
            <div class="share-stat-label">重量</div>
            <div class="share-stat-value">${workout.weight} kg</div>
        </div>`);
    }

    container.innerHTML = `
        <div class="share-workout-title">${typeInfo.name || '锻炼'}</div>
        <div class="share-workout-stats">
            ${stats.join('')}
        </div>
        ${workout.notes ? `<div class="share-notes">"${workout.notes}"</div>` : ''}
    `;

    // Set date
    const dateEl = document.getElementById('shareDateString');
    dateEl.textContent = new Date(workout.date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    // Open modal
    App?.openModal('shareModal');
}

/**
 * Generate image from share card
 * @returns {Promise<string>} Blob URL of the generated image
 */
async function generateShareImage() {
    const shareCard = document.getElementById('shareCard');

    if (!shareCard) {
        throw new Error('Share card element not found');
    }

    try {
        // Check if html2canvas is loaded
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library not loaded');
        }

        // Show loading state
        const canvas = await html2canvas(shareCard, {
            backgroundColor: null,
            scale: 2, // Higher quality
            logging: false,
            useCORS: true,
            allowTaint: true
        });

        // Convert to blob
        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png');
        });

        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error generating share image:', error);
        throw error;
    }
}

/**
 * Download share image
 */
async function downloadShareImage() {
    try {
        App?.showToast('正在生成图片...', 'info');

        const imageUrl = await generateShareImage();

        // Create download link
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `fitness-workout-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);

        App?.showToast('图片已下载', 'success');
    } catch (error) {
        console.error('Error downloading share image:', error);
        App?.showToast('下载失败，请重试', 'error');
    }
}

/**
 * Share using Web Share API
 */
async function shareWorkout() {
    if (!currentShareWorkout) return;

    // Check if Web Share API is supported
    if (!navigator.share) {
        // Fallback to download
        downloadShareImage();
        return;
    }

    try {
        const typeInfo = App?.WorkoutTypes?.[currentShareWorkout.type] || {};
        let shareText = `我完成了 ${typeInfo.name || '锻炼'}！`;

        const stats = [];
        if (currentShareWorkout.duration) stats.push(`${currentShareWorkout.duration}分钟`);
        if (currentShareWorkout.calories) stats.push(`${currentShareWorkout.calories}卡`);
        if (currentShareWorkout.distance) stats.push(`${currentShareWorkout.distance}公里`);

        if (stats.length > 0) {
            shareText += `\n${stats.join(' · ')}`;
        }

        // Try to generate image for sharing
        let files = [];
        try {
            const imageUrl = await generateShareImage();
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'fitness-workout.png', { type: 'image/png' });
            files = [file];
            URL.revokeObjectURL(imageUrl);
        } catch (e) {
            console.warn('Could not generate image for sharing:', e);
        }

        const shareData = {
            title: '健身追踪 - 锻炼记录',
            text: shareText
        };

        // Add file if successfully generated
        if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
            shareData.files = files;
        }

        await navigator.share(shareData);
        App?.showToast('分享成功！', 'success');
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error sharing:', error);
            // Fallback to image download or text-based sharing
            try {
                const typeInfo = App?.WorkoutTypes?.[currentShareWorkout.type] || {};
                let shareText = `我完成了 ${typeInfo.name || '锻炼'}！\n`;

                const stats = [];
                if (currentShareWorkout.duration) stats.push(`${currentShareWorkout.duration}分钟`);
                if (currentShareWorkout.calories) stats.push(`${currentShareWorkout.calories}卡`);
                if (currentShareWorkout.distance) stats.push(`${currentShareWorkout.distance}公里`);

                if (stats.length > 0) {
                    shareText += stats.join(' · ');
                }

                await navigator.share({
                    title: '健身追踪 - 锻炼记录',
                    text: shareText
                });
                App?.showToast('分享成功！', 'success');
            } catch (e) {
                console.error('Fallback share also failed:', e);
                downloadShareImage();
            }
        }
    }
}

/**
 * Share workout progress summary
 * @param {Object} stats - Statistics object
 */
async function shareProgressSummary(stats) {
    const shareText = `我的健身进度 🏋️
总锻炼：${stats.totalWorkouts}次
总时长：${stats.totalDuration}分钟
消耗：${stats.totalCalories}卡路里

坚持就是胜利！`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: '健身追踪 - 我的进度',
                text: shareText
            });
            App?.showToast('分享成功！', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing progress:', error);
            }
        }
    } else {
        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareText);
            App?.showToast('进度已复制到剪贴板', 'success');
        } catch (e) {
            App?.showToast('复制失败', 'error');
        }
    }
}

/**
 * Share goal achievement
 * @param {Object} goal - Goal object
 * @param {Object} progress - Progress data
 */
async function shareGoalAchievement(goal, progress) {
    const typeInfo = Goals?.GoalTypes?.[goal.type] || { name: '目标', unit: '' };
    const shareText = `🎉 目标完成！
${typeInfo.name}: ${progress.current} / ${progress.target} ${typeInfo.unit}
完成度：${progress.percentage.toFixed(0)}%

感谢"健身追踪"应用的帮助！`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: '健身追踪 - 目标达成',
                text: shareText
            });
            App?.showToast('分享成功！', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing goal:', error);
            }
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            App?.showToast('成就已复制到剪贴板', 'success');
        } catch (e) {
            App?.showToast('复制失败', 'error');
        }
    }
}

/**
 * Initialize share functionality
 */
function initShare() {
    // Download button
    const downloadBtn = document.getElementById('shareDownload');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadShareImage);
    }

    // Native share button
    const shareBtn = document.getElementById('shareNative');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareWorkout);
    }

    // Add Share button to dashboard
    addDashboardShareButton();
}

/**
 * Add share button to dashboard
 */
function addDashboardShareButton() {
    const dashboardSection = document.getElementById('dashboard');
    if (!dashboardSection) return;

    // Check if button already exists
    if (dashboardSection.querySelector('.dashboard-share-btn')) return;

    const shareBtn = document.createElement('button');
    shareBtn.className = 'dashboard-share-btn secondary-btn';
    shareBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        分享我的进度
    `;

    shareBtn.addEventListener('click', async () => {
        const workouts = await Storage.getAllWorkouts();
        if (workouts.length === 0) {
            App?.showToast('还没有锻炼记录可分享', 'warning');
            return;
        }

        const stats = {
            totalWorkouts: workouts.length,
            totalDuration: workouts.reduce((sum, w) => sum + (w.duration || 0), 0),
            totalCalories: workouts.reduce((sum, w) => sum + (w.calories || 0), 0)
        };

        await shareProgressSummary(stats);
    });

    // Insert after stats row
    const statsRow = dashboardSection.querySelector('.stats-row');
    if (statsRow) {
        statsRow.after(shareBtn);
    }
}

/**
 * Create a customizable share template
 * @param {Object} data - Data to populate template
 * @returns {string} HTML template
 */
function createShareTemplate(data) {
    const {
        title = '健身追踪',
        workoutType = '锻炼',
        stats = [],
        date = new Date().toLocaleDateString('zh-CN'),
        motto = '坚持就是胜利',
        icon = null
    } = data;

    return `
        <div class="share-template" style="
            width: 400px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-sizing: border-box;
        ">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                ${icon || '<div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">🏋️</div>'}
                <div style="font-size: 18px; font-weight: 600;">${title}</div>
            </div>

            <div style="font-size: 28px; font-weight: 700; margin-bottom: 20px;">${workoutType}</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                ${stats.map(stat => `
                    <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 12px;">
                        <div style="font-size: 12px; opacity: 0.9;">${stat.label}</div>
                        <div style="font-size: 18px; font-weight: 600;">${stat.value}</div>
                    </div>
                `).join('')}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 12px; opacity: 0.9;">
                <span>${date}</span>
                <span>${motto}</span>
            </div>
        </div>
    `;
}

/**
 * Generate share card from template
 * @param {Object} data - Template data
 * @returns {Promise<string>} Blob URL of generated image
 */
async function generateShareCardFromTemplate(data) {
    // Create a container element
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    container.innerHTML = createShareTemplate(data);

    try {
        const canvas = await html2canvas(container.firstElementChild, {
            backgroundColor: null,
            scale: 2,
            logging: false,
            useCORS: true
        });

        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png');
        });

        return URL.createObjectURL(blob);
    } finally {
        document.body.removeChild(container);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShare);
} else {
    initShare();
}

// Export for use in other modules
const Share = {
    openShareModal,
    generateShareImage,
    downloadShareImage,
    shareWorkout,
    shareProgressSummary,
    shareGoalAchievement,
    createShareTemplate,
    generateShareCardFromTemplate,
    initShare
};
