// Share functionality - Generate exercise summary cards

class ShareGenerator {
    constructor() {
        this.shareModal = document.getElementById('shareModal');
        this.sharePreview = document.getElementById('sharePreview');
    }

    // Generate a share card for a single workout
    async generateWorkoutCard(workout) {
        const iconMap = {
            running: { icon: 'fa-running', label: '跑步' },
            cycling: { icon: 'fa-bicycle', label: '骑行' },
            weightlifting: { icon: 'fa-dumbbell', label: '举重' },
            swimming: { icon: 'fa-swimmer', label: '游泳' },
            yoga: { icon: 'fa-spa', label: '瑜伽' },
            other: { icon: 'fa-heartbeat', label: '其他' }
        };

        const typeInfo = iconMap[workout.type] || iconMap.other;

        const details = [];
        if (workout.duration) {
            details.push(`<div class="share-stat"><div class="share-stat-value">${workout.duration}分钟</div><div class="share-stat-label">时长</div></div>`);
        }
        if (workout.distance) {
            details.push(`<div class="share-stat"><div class="share-stat-value">${workout.distance}km</div><div class="share-stat-label">距离</div></div>`);
        }
        if (workout.weight) {
            details.push(`<div class="share-stat"><div class="share-stat-value">${workout.weight}kg</div><div class="share-stat-label">重量</div></div>`);
        }

        const cardHTML = `
            <div class="share-card">
                <div style="font-size: 3rem; margin-bottom: 1rem;">
                    <i class="fas ${typeInfo.icon}"></i>
                </div>
                <h3>今日${typeInfo.label}</h3>
                <div class="share-stats">
                    ${details.join('')}
                </div>
                <div class="share-date">${window.fitnessDB.formatDate(workout.date)}</div>
                ${workout.notes ? `<div style="margin-top: 1rem; font-style: italic;">"${workout.notes}"</div>` : ''}
                <div style="margin-top: 1.5rem; font-size: 0.8rem; opacity: 0.9;">
                    健身追踪仪表盘 - keep moving!
                </div>
            </div>
        `;

        return cardHTML;
    }

    // Generate a share card for weekly stats
    async generateWeeklyCard(stats) {
        const cardHTML = `
            <div class="share-card">
                <div style="font-size: 3rem; margin-bottom: 1rem;">
                    <i class="fas fa-trophy"></i>
                </div>
                <h3>本周健身成就</h3>
                <div class="share-stats">
                    <div class="share-stat">
                        <div class="share-stat-value">${stats.workoutCount}</div>
                        <div class="share-stat-label">锻炼次数</div>
                    </div>
                    <div class="share-stat">
                        <div class="share-stat-value">${stats.totalDuration}</div>
                        <div class="share-stat-label">总时长(分钟)</div>
                    </div>
                    <div class="share-stat">
                        <div class="share-stat-value">${stats.totalDistance.toFixed(1)}</div>
                        <div class="share-stat-label">总距离(km)</div>
                    </div>
                </div>
                <div class="share-date">${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}</div>
                <div style="margin-top: 1.5rem; font-size: 0.8rem; opacity: 0.9;">
                    健身追踪仪表盘 - 一周小结
                </div>
            </div>
        `;

        return cardHTML;
    }

    // Generate a share card for completed goal
    async generateGoalCard(goal) {
        const percentage = Math.min(100, (goal.currentProgress / goal.target) * 100);
        const iconMap = {
            workouts: 'fa-dumbbell',
            duration: 'fa-clock',
            distance: 'fa-route',
            weight: 'fa-weight-scale',
            steps: 'fa-shoe-prints'
        };

        const periodMap = {
            daily: '每日',
            weekly: '每周',
            monthly: '每月'
        };

        const cardHTML = `
            <div class="share-card">
                <div style="font-size: 3rem; margin-bottom: 1rem;">
                    <i class="fas ${iconMap[goal.type] || 'fa-flag'}"></i>
                </div>
                <h3>${goal.completed ? '目标达成！' : '正在努力'}</h3>
                <div class="share-stats">
                    <div class="share-stat">
                        <div class="share-stat-value">${percentage.toFixed(0)}%</div>
                        <div class="share-stat-label">完成进度</div>
                    </div>
                    <div class="share-stat">
                        <div class="share-stat-value">${goal.currentProgress}</div>
                        <div class="share-stat-label">当前 / 目标</div>
                    </div>
                    <div class="share-stat">
                        <div class="share-stat-value">${goal.target}</div>
                        <div class="share-stat-label">${periodMap[goal.period]}</div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; font-size: 0.9rem; opacity: 0.9;">
                    健身追踪仪表盘 - 所有的坚持都值得！
                </div>
            </div>
        `;

        return cardHTML;
    }

    // Convert HTML to canvas and then to image
    async generateImageFromHTML(html) {
        // First show the HTML in a container to render it
        this.sharePreview.innerHTML = html;

        // Wait for the content to render
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            // Use html2canvas if available, otherwise fallback to simple canvas drawing
            const canvas = await this.renderToCanvas(this.sharePreview);
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }

    // Fallback method: Simple canvas rendering
    async renderToCanvas(element) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 500;
        const height = 600;

        canvas.width = width;
        canvas.height = height;

        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(1, '#8BC34A');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw text content
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';

        const text = element.textContent;
        const lines = text.split('\n').filter(line => line.trim());

        let yPosition = 100;
        lines.forEach(line => {
            ctx.fillText(line.trim(), width / 2, yPosition);
            yPosition += 50;
        });

        // Add footer
        ctx.font = '16px Arial';
        ctx.fillText('健身追踪仪表盘', width / 2, height - 50);

        return canvas;
    }

    // Show share modal with preview
    async showShareModal(contentHTML) {
        this.sharePreview.innerHTML = contentHTML;
        this.shareModal.classList.add('active');
    }

    // Hide share modal
    hideShareModal() {
        this.shareModal.classList.remove('active');
    }

    // Share using Web Share API
    async shareContent(title, text, imageBlob = null) {
        if (navigator.share && imageBlob) {
            const file = new File([imageBlob], 'fitness-share.png', { type: 'image/png' });
            const shareData = {
                title: title,
                text: text,
                files: [file]
            };

            try {
                await navigator.share(shareData);
                return true;
            } catch (err) {
                console.log('Share cancelled or failed:', err);
                return false;
            }
        } else if (navigator.share) {
            // Fallback for browsers that don't support file sharing
            const shareData = {
                title: title,
                text: text
            };

            try {
                await navigator.share(shareData);
                return true;
            } catch (err) {
                console.log('Share cancelled or failed:', err);
                return false;
            }
        } else {
            // Web Share API not supported, download image instead
            console.log('Web Share API not supported');
            return false;
        }
    }

    // Download canvas as image
    downloadImage(dataURL, filename = 'fitness-share.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        link.click();
    }
}

// Initialize share generator when DOM is ready
let shareGenerator;

document.addEventListener('DOMContentLoaded', () => {
    shareGenerator = new ShareGenerator();

    // Close modal on click
    document.querySelector('.close').addEventListener('click', () => {
        shareGenerator.hideShareModal();
    });

    // Close modal on backdrop click
    document.getElementById('shareModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('shareModal')) {
            shareGenerator.hideShareModal();
        }
    });

    // Download image button handler
    document.getElementById('downloadImageBtn').addEventListener('click', async () => {
        try {
            const canvas = await shareGenerator.renderToCanvas(shareGenerator.sharePreview);
            const dataURL = canvas.toDataURL('image/png');
            shareGenerator.downloadImage(dataURL);
            showToast('图片已下载', 'success');
        } catch (error) {
            console.error('Error downloading image:', error);
            showToast('下载失败', 'error');
        }
    });

    // Native share button handler
    document.getElementById('shareNativeBtn').addEventListener('click', async () => {
        const text = shareGenerator.sharePreview.textContent;
        const success = await shareGenerator.shareContent(
            '我的健身成就',
            text
        );

        if (!success) {
            // If share fails, try downloading
            try {
                const canvas = await shareGenerator.renderToCanvas(shareGenerator.sharePreview);
                const dataURL = canvas.toDataURL('image/png');
                shareGenerator.downloadImage(dataURL);
                showToast('已保存为图片', 'success');
            } catch (error) {
                showToast('分享失败', 'error');
            }
        } else {
            showToast('分享成功！', 'success');
            shareGenerator.hideShareModal();
        }
    });

    // Floating share button - share weekly stats
    document.getElementById('shareBtn').addEventListener('click', async () => {
        try {
            const stats = await window.fitnessDB.getWeeklyStats();
            const cardHTML = await shareGenerator.generateWeeklyCard(stats);
            await shareGenerator.showShareModal(cardHTML);
        } catch (error) {
            console.error('Error generating share card:', error);
            showToast('生成分享卡片失败', 'error');
        }
    });
});

// Helper function to show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
