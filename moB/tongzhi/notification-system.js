/**
 * 交互式通知系统
 * 支持动画、堆叠、优先级和不同类型的通知
 */

class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.notificationId = 0;
    this.container = null;
    this.maxNotifications = 5;

    // 默认配置
    this.config = {
      position: 'top-right', // top-right, top-left, bottom-right, bottom-left
      duration: 4000, // 默认显示时长
      animationDuration: 300, // 动画时长（毫秒）
      gap: 10 // 通知之间的间距（像素）
    };

    this.init();
  }

  /**
   * 初始化通知容器
   */
  init() {
    // 创建通知容器
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    this.container.id = 'notification-container';

    // 设置容器位置
    this.updateContainerPosition();

    // 添加到页面
    document.body.appendChild(this.container);
  }

  /**
   * 更新容器位置
   */
  updateContainerPosition() {
    const positionClasses = {
      'top-right': 'notification-container--top-right',
      'top-left': 'notification-container--top-left',
      'bottom-right': 'notification-container--bottom-right',
      'bottom-left': 'notification-container--bottom-left'
    };

    // 移除所有位置类
    Object.values(positionClasses).forEach(cls => {
      this.container.classList.remove(cls);
    });

    // 添加当前位置类
    this.container.classList.add(positionClasses[this.config.position]);
  }

  /**
   * 配置通知系统
   */
  configure(options) {
    this.config = { ...this.config, ...options };
    this.updateContainerPosition();
  }

  /**
   * 获取优先级的显示时长
   */
  getDurationByPriority(priority) {
    const durations = {
      low: 2000,
      normal: 4000,
      high: 6000,
      critical: 8000
    };
    return durations[priority] || durations.normal;
  }

  /**
   * 获取优先级对应的类名
   */
  getPriorityClass(priority) {
    return `notification--priority-${priority}`;
  }

  /**
   * 获取类型对应的图标
   */
  getIconByType(type) {
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    return icons[type] || '';
  }

  /**
   * 创建通知元素
   */
  createNotificationElement(options) {
    const notification = document.createElement('div');
    notification.className = `notification notification--${options.type} ${this.getPriorityClass(options.priority)}`;
    notification.dataset.id = options.id;

    const icon = this.getIconByType(options.type);

    notification.innerHTML = `
      <div class="notification__icon">${icon}</div>
      <div class="notification__content">
        ${options.title ? `<h4 class="notification__title">${this.escapeHtml(options.title)}</h4>` : ''}
        <p class="notification__message">${this.escapeHtml(options.message)}</p>
      </div>
      <button class="notification__close" aria-label="关闭通知">×</button>
      <div class="notification__progress"></div>
    `;

    return notification;
  }

  /**
   * 转义 HTML 特殊字符
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 显示通知
   */
  show(options = {}) {
    // 合并默认选项
    const notificationOptions = {
      id: ++this.notificationId,
      type: 'info', // success, error, info, warning
      priority: 'normal', // low, normal, high, critical
      title: '',
      message: '',
      duration: null, // 自定义时长
      ...options
    };

    // 如果消息为空，不显示
    if (!notificationOptions.message) {
      console.warn('通知消息不能为空');
      return null;
    }

    // 检查是否超过最大通知数量
    if (this.notifications.length >= this.maxNotifications) {
      this.removeNotification(this.notifications[0].id);
    }

    // 创建通知元素
    const element = this.createNotificationElement(notificationOptions);

    // 添加到容器（在最前面）
    this.container.insertBefore(element, this.container.firstChild);

    // 触发进入动画
    requestAnimationFrame(() => {
      element.classList.add('notification--entering');
    });

    // 进入动画结束后移除进入状态
    setTimeout(() => {
      element.classList.remove('notification--entering');
      element.classList.add('notification--visible');
    }, this.config.animationDuration);

    // 计算显示时长
    const duration = notificationOptions.duration ||
                    this.getDurationByPriority(notificationOptions.priority);

    // 创建通知对象
    const notification = {
      id: notificationOptions.id,
      element: element,
      timeoutId: null,
      options: notificationOptions
    };

    // 设置自动关闭
    notification.timeoutId = setTimeout(() => {
      this.removeNotification(notification.id);
    }, duration);

    // 添加点击关闭事件
    this.attachCloseEvents(notification);

    // 添加到通知列表
    this.notifications.push(notification);

    // 启动进度条动画
    this.startProgressAnimation(notification, duration);

    return notification.id;
  }

  /**
   * 启动进度条动画
   */
  startProgressAnimation(notification, duration) {
    const progressBar = notification.element.querySelector('.notification__progress');
    if (progressBar) {
      // 使用 CSS transition
      progressBar.style.transition = `width ${duration}ms linear`;
      requestAnimationFrame(() => {
        progressBar.style.width = '100%';
      });
    }
  }

  /**
   * 附加关闭事件
   */
  attachCloseEvents(notification) {
    const element = notification.element;

    // 点击关闭按钮
    const closeBtn = element.querySelector('.notification__close');
    closeBtn.addEventListener('click', () => {
      this.removeNotification(notification.id);
    });

    // 点击通知本身也可以关闭
    element.addEventListener('click', (e) => {
      if (!e.target.closest('.notification__close')) {
        this.removeNotification(notification.id);
      }
    });

    // 鼠标悬停时暂停自动关闭
    element.addEventListener('mouseenter', () => {
      if (notification.timeoutId) {
        clearTimeout(notification.timeoutId);
        const progressBar = element.querySelector('.notification__progress');
        if (progressBar) {
          progressBar.style.width = progressBar.style.width || '0%';
          progressBar.style.transition = 'none';
        }
      }
    });

    // 鼠标离开时恢复自动关闭
    element.addEventListener('mouseleave', () => {
      const remainingDuration = 1000; // 剩余1秒
      notification.timeoutId = setTimeout(() => {
        this.removeNotification(notification.id);
      }, remainingDuration);

      const progressBar = element.querySelector('.notification__progress');
      if (progressBar) {
        const currentWidth = parseFloat(progressBar.style.width) || 0;
        progressBar.style.transition = `width ${remainingDuration}ms linear`;
        requestAnimationFrame(() => {
          progressBar.style.width = '100%';
        });
      }
    });
  }

  /**
   * 移除通知
   */
  removeNotification(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return;

    const notification = this.notifications[index];

    // 清除定时器
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
    }

    // 添加退出动画类
    notification.element.classList.remove('notification--visible');
    notification.element.classList.add('notification--leaving');

    // 动画结束后移除元素
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }

      // 从列表中移除
      this.notifications.splice(index, 1);
    }, this.config.animationDuration);
  }

  /**
   * 清除所有通知
   */
  clearAll() {
    // 复制数组以避免在迭代时修改
    [...this.notifications].forEach(notification => {
      this.removeNotification(notification.id);
    });
  }

  /**
   * 快捷方法：成功通知
   */
  success(message, options = {}) {
    return this.show({ ...options, type: 'success', message });
  }

  /**
   * 快捷方法：错误通知
   */
  error(message, options = {}) {
    return this.show({ ...options, type: 'error', message, priority: 'high' });
  }

  /**
   * 快捷方法：信息通知
   */
  info(message, options = {}) {
    return this.show({ ...options, type: 'info', message });
  }

  /**
   * 快捷方法：警告通知
   */
  warning(message, options = {}) {
    return this.show({ ...options, type: 'warning', message, priority: 'normal' });
  }

  /**
   * 快捷方法：严重错误通知
   */
  critical(message, options = {}) {
    return this.show({ ...options, type: 'error', message, priority: 'critical', title: '严重错误' });
  }
}

// 创建全局实例
const notify = new NotificationSystem();

// 导出到全局
window.notify = notify;
window.NotificationSystem = NotificationSystem;