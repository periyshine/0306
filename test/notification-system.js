/**
 * 现代交互式通知系统
 * 支持动画、堆叠、优先级和多种通知类型
 */

class NotificationSystem {
    constructor(options = {}) {
        // 配置选项
        this.config = {
            position: options.position || 'top-right',
            defaultDuration: options.defaultDuration || 3000,
            maxNotifications: options.maxNotifications || 5,
            animationDuration: options.animationDuration || 300,
            ...options
        };

        // 通知容器
        this.container = this.createContainer();
        this.notifications = new Map(); // 存储活动通知
        this.notificationId = 0;

        // 优先级配置（停留时间）
        this.priorityConfig = {
            low: { multiplier: 0.5, duration: 2000 },
            normal: { multiplier: 1, duration: 3000 },
            high: { multiplier: 1.5, duration: 4500 },
            urgent: { multiplier: 2, duration: 6000 }
        };
    }

    /**
     * 创建通知容器
     */
    createContainer() {
        let container = document.querySelector('.notification-container');

        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        return container;
    }

    /**
     * 显示通知
     * @param {Object} options - 通知选项
     */
    show(options) {
        const notification = {
            id: ++this.notificationId,
            title: options.title || '',
            message: options.message || '',
            type: options.type || 'info', // success, error, warning, info
            priority: options.priority || 'normal', // low, normal, high, urgent
            duration: options.duration || this.calculateDuration(options.priority),
            icon: options.icon || this.getDefaultIcon(options.type),
            onClick: options.onClick || null,
            onClose: options.onClose || null
        };

        // 创建通知元素
        const element = this.createNotificationElement(notification);

        // 存储通知
        this.notifications.set(notification.id, {
            data: notification,
            element,
            timer: null
        });

        // 添加到容器
        this.container.appendChild(element);

        // 触发进入动画
        requestAnimationFrame(() => {
            element.classList.add('notification-enter');
            setTimeout(() => {
                element.classList.remove('notification-enter');
                element.classList.add('notification-visible');
            }, this.config.animationDuration);
        });

        // 设置自动关闭计时器
        if (notification.duration > 0) {
            const timer = setTimeout(() => {
                this.dismiss(notification.id);
            }, notification.duration);

            this.notifications.get(notification.id).timer = timer;
        }

        // 限制最大通知数量
        this.limitNotifications();

        return notification.id;
    }

    /**
     * 创建通知 DOM 元素
     */
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.dataset.id = notification.id;
        element.dataset.priority = notification.priority;

        // 创建通知内容
        const iconHtml = `<span class="notification-icon">${notification.icon}</span>`;

        const contentHtml = `
            <div class="notification-content">
                ${notification.title ? `<h4 class="notification-title">${notification.title}</h4>` : ''}
                ${notification.message ? `<p class="notification-message">${notification.message}</p>` : ''}
                <div class="notification-progress">
                    <div class="notification-progress-bar"></div>
                </div>
            </div>
        `;

        const closeHtml = `<button class="notification-close" aria-label="关闭通知">&times;</button>`;

        element.innerHTML = iconHtml + contentHtml + closeHtml;

        // 添加事件监听
        this.attachEventListeners(element, notification);

        // 设置进度条动画
        if (notification.duration > 0) {
            const progressBar = element.querySelector('.notification-progress-bar');
            progressBar.style.animation = `notification-progress ${notification.duration}ms linear forwards`;
        }

        return element;
    }

    /**
     * 附加事件监听器
     */
    attachEventListeners(element, notification) {
        // 点击关闭按钮
        const closeBtn = element.querySelector('.notification-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dismiss(notification.id);
        });

        // 点击通知本身
        element.addEventListener('click', () => {
            if (notification.onClick) {
                notification.onClick(notification.id);
            }
            this.dismiss(notification.id);
        });

        // 鼠标悬停时暂停自动关闭
        element.addEventListener('mouseenter', () => {
            const notif = this.notifications.get(notification.id);
            if (notif && notif.timer) {
                clearTimeout(notif.timer);

                // 暂停进度条动画
                const progressBar = element.querySelector('.notification-progress-bar');
                progressBar.style.animationPlayState = 'paused';
            }
        });

        // 鼠标离开时恢复自动关闭
        element.addEventListener('mouseleave', () => {
            const notif = this.notifications.get(notification.id);
            if (notif && notification.duration > 0) {
                notif.timer = setTimeout(() => {
                    this.dismiss(notification.id);
                }, 1000); // 额外给1秒时间

                // 恢复进度条动画
                const progressBar = element.querySelector('.notification-progress-bar');
                progressBar.style.animationPlayState = 'running';
            }
        });
    }

    /**
     * 计算通知持续时间（基于优先级）
     */
    calculateDuration(priority) {
        const config = this.priorityConfig[priority] || this.priorityConfig.normal;
        return config.duration;
    }

    /**
     * 获取默认图标
     */
    getDefaultIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * 关闭通知
     */
    dismiss(id) {
        const notification = this.notifications.get(id);

        if (!notification) return;

        const { element, data } = notification;

        // 清除计时器
        if (notification.timer) {
            clearTimeout(notification.timer);
        }

        // 触发退出动画
        element.classList.remove('notification-visible');
        element.classList.add('notification-exit');

        // 动画完成后移除元素
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);

            // 调用关闭回调
            if (data.onClose) {
                data.onClose(id);
            }
        }, this.config.animationDuration);
    }

    /**
     * 限制最大通知数量
     */
    limitNotifications() {
        while (this.notifications.size > this.config.maxNotifications) {
            const firstId = this.notifications.keys().next().value;
            this.dismiss(firstId);
        }
    }

    /**
     * 快捷方法：成功通知
     */
    success(message, options = {}) {
        return this.show({ ...options, message, type: 'success' });
    }

    /**
     * 快捷方法：错误通知
     */
    error(message, options = {}) {
        return this.show({ ...options, message, type: 'error', priority: 'high' });
    }

    /**
     * 快捷方法：警告通知
     */
    warning(message, options = {}) {
        return this.show({ ...options, message, type: 'warning', priority: 'normal' });
    }

    /**
     * 快捷方法：信息通知
     */
    info(message, options = {}) {
        return this.show({ ...options, message, type: 'info', priority: 'low' });
    }

    /**
     * 清除所有通知
     */
    clear() {
        this.notifications.forEach((_, id) => {
            this.dismiss(id);
        });
    }

    /**
     * 销毁整个系统
     */
    destroy() {
        this.clear();
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// 创建全局实例
const notifications = new NotificationSystem();

// 也导出类以支持自定义实例
export default NotificationSystem;
export { notifications };
