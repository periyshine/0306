/**
 * 交互式通知系统
 * 功能：支持多种通知类型、优先级系统、自动堆叠、平滑动画、手动关闭
 */

const NotificationSystem = (function() {
    'use strict';

    // 配置
    const CONFIG = {
        // 优先级对应的停留时间（毫秒）
        priorityDuration: {
            critical: 8000,  // 严重错误：8秒
            high: 6000,      // 高优先级：6秒
            medium: 4000,    // 中优先级：4秒
            low: 2500        // 低优先级：2.5秒
        },
        // 动画时长（毫秒）
        animationDuration: 400,
        // 最大同时显示的通知数量
        maxNotifications: 5
    };

    // 存储当前活动的通知
    let notifications = [];
    let notificationId = 0;

    /**
     * 获取或创建通知容器
     */
    function getContainer() {
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * 获取优先级对应的停留时间
     */
    function getDuration(priority) {
        return CONFIG.priorityDuration[priority] || CONFIG.priorityDuration.medium;
    }

    /**
     * 检查优先级值是否有效
     */
    function isValidPriority(priority) {
        return ['critical', 'high', 'medium', 'low'].includes(priority);
    }

    /**
     * 创建通知元素
     */
    function createNotificationElement(type, title, message, priority) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        if (isValidPriority(priority)) {
            notification.classList.add('has-priority');
        }

        // 优先级指示器
        if (isValidPriority(priority)) {
            const priorityIndicator = document.createElement('div');
            priorityIndicator.className = `notification-priority ${priority}`;
            notification.appendChild(priorityIndicator);
        }

        // 标题
        if (title) {
            const titleElement = document.createElement('div');
            titleElement.className = 'notification-title';
            titleElement.textContent = title;
            notification.appendChild(titleElement);
        }

        // 消息
        if (message) {
            const messageElement = document.createElement('div');
            messageElement.className = 'notification-message';
            messageElement.textContent = message;
            notification.appendChild(messageElement);
        }

        // 进度条
        const progress = document.createElement('div');
        progress.className = 'notification-progress';
        const progressBar = document.createElement('div');
        progressBar.className = 'notification-progress-bar';
        progress.appendChild(progressBar);
        notification.appendChild(progress);

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', '关闭通知');
        notification.appendChild(closeBtn);

        return notification;
    }

    /**
     * 设置进度条动画时长
     */
    function setProgressAnimation(notificationElement, duration) {
        const progressBar = notificationElement.querySelector('.notification-progress-bar');
        if (progressBar) {
            progressBar.style.animationDuration = `${duration}ms`;
        }
    }

    /**
     * 添加滑出动画类并移除通知
     */
    function removeNotification(notificationId) {
        const notificationData = notifications.find(n => n.id === notificationId);
        if (!notificationData) return;

        const { element, timeoutId } = notificationData;

        // 清除自动关闭定时器
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // 添加滑出动画
        element.classList.add('removing');

        // 动画结束后移除元素
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            notifications = notifications.filter(n => n.id !== notificationId);
        }, CONFIG.animationDuration);
    }

    /**
     * 显示通知的核心函数
     */
    function show(type, title, message, priority = 'medium') {
        // 如果超过最大数量，移除最旧的通知
        if (notifications.length >= CONFIG.maxNotifications) {
            const oldestNotification = notifications[0];
            removeNotification(oldestNotification.id);
        }

        const container = getContainer();
        const duration = getDuration(priority);

        // 创建通知元素
        const notificationElement = createNotificationElement(type, title, message, priority);

        // 设置进度条动画
        setProgressAnimation(notificationElement, duration);

        // 添加到容器
        container.appendChild(notificationElement);

        // 创建通知数据
        const id = ++notificationId;
        const notificationData = {
            id,
            element: notificationElement,
            priority
        };

        // 设置自动关闭定时器
        const timeoutId = setTimeout(() => {
            removeNotification(id);
        }, duration);

        notificationData.timeoutId = timeoutId;
        notifications.push(notificationData);

        // 添加点击关闭事件
        notificationElement.addEventListener('click', (e) => {
            // 如果点击的是关闭按钮或通知本身，都关闭
            removeNotification(id);
        });

        return id;
    }

    /**
     * 公开的API方法
     */
    return {
        /**
         * 显示成功通知（绿色）
         */
        success: function(title, message, priority) {
            return show('success', title, message, priority);
        },

        /**
         * 显示错误通知（红色）
         */
        error: function(title, message, priority) {
            return show('error', title, message, priority);
        },

        /**
         * 显示信息通知（蓝色）
         */
        info: function(title, message, priority) {
            return show('info', title, message, priority);
        },

        /**
         * 手动关闭指定ID的通知
         */
        close: function(id) {
            removeNotification(id);
        },

        /**
         * 关闭所有通知
         */
        closeAll: function() {
            // 复制数组以避免在迭代时修改
            const ids = notifications.map(n => n.id);
            ids.forEach(id => removeNotification(id));
        },

        /**
         * 获取当前活动通知数量
         */
        getActiveCount: function() {
            return notifications.length;
        },

        /**
         * 配置选项
         */
        configure: function(options) {
            if (options.maxNotifications) {
                CONFIG.maxNotifications = options.maxNotifications;
            }
            if (options.priorityDuration) {
                Object.assign(CONFIG.priorityDuration, options.priorityDuration);
            }
        }
    };
})();

// 导出到全局（如果在浏览器环境中）
if (typeof window !== 'undefined') {
    window.NotificationSystem = NotificationSystem;
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}
