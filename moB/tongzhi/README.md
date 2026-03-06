# 🔔 交互式通知系统

一个功能强大、视觉吸引力强的 JavaScript 通知系统，具有流畅的动画效果、多通知堆叠、优先级系统和多种通知类型。

## ✨ 特性

- **流畅动画** - 通知从右侧滑入，显示后平滑滑出
- **智能堆叠** - 多个通知自动堆叠，不会重叠
- **多种类型** - 成功（绿色）、错误（红色）、信息（蓝色）、警告（橙色）
- **优先级系统** - 根据优先级自动调整显示时长
- **交互友好** - 点击通知即可关闭，鼠标悬停暂停计时
- **进度指示** - 底部进度条显示剩余时间
- **位置自定义** - 支持四个角落位置
- **响应式设计** - 完美支持移动设备
- **深色模式** - 自动适配系统主题

## 📦 安装

将以下文件添加到你的项目中：

```html
<link rel="stylesheet" href="notification-system.css">
<script src="notification-system.js"></script>
```

## 🚀 快速开始

### 基础用法

```javascript
// 成功通知
notify.success('操作成功！');

// 错误通知
notify.error('发生错误！');

// 信息通知
notify.info('这是一条信息');

// 警告通知
notify.warning('请注意！');

// 严重错误通知
notify.critical('系统崩溃！');
```

### 完整配置

```javascript
notify.show({
  type: 'success',           // 类型: success, error, info, warning
  title: '完成',             // 标题（可选）
  message: '任务已完成',     // 消息内容
  priority: 'high',          // 优先级: low, normal, high, critical
  duration: 5000            // 自定义显示时长（毫秒）
});
```

## 🎨 通知类型

| 类型 | 颜色 | 用途 | 快捷方法 |
|------|------|------|----------|
| 成功 | 绿色 | 操作成功、任务完成 | `notify.success()` |
| 错误 | 红色 | 错误、失败 | `notify.error()` |
| 信息 | 蓝色 | 一般信息 | `notify.info()` |
| 警告 | 橙色 | 警告、注意 | `notify.warning()` |

## 🎯 优先级系统

优先级决定了通知在屏幕上停留的时间：

| 优先级 | 显示时长 | 适用场景 |
|--------|----------|----------|
| `low` | 2秒 | 次要信息 |
| `normal` | 4秒 | 一般通知（默认） |
| `high` | 6秒 | 重要信息 |
| `critical` | 8秒 | 严重错误 |

```javascript
// 低优先级
notify.show({ type: 'info', message: '次要信息', priority: 'low' });

// 严重错误
notify.show({ type: 'error', message: '严重错误！', priority: 'critical' });
```

## 📍 位置设置

```javascript
// 更改通知位置
notify.configure({ position: 'top-right' }); // 右上角（默认）
notify.configure({ position: 'top-left' });  // 左上角
notify.configure({ position: 'bottom-right' }); // 右下角
notify.configure({ position: 'bottom-left' });  // 左下角
```

## 🎮 高级功能

### 自定义时长

```javascript
notify.show({
  type: 'info',
  message: '显示10秒',
  duration: 10000  // 10秒
});
```

### 手动关闭通知

```javascript
const id = notify.success('可以手动关闭');
// 稍后关闭
setTimeout(() => {
  notify.removeNotification(id);
}, 1000);
```

### 清除所有通知

```javascript
notify.clearAll();
```

### 系统配置

```javascript
notify.configure({
  position: 'top-right',
  duration: 4000,
  animationDuration: 300,
  gap: 10,
  maxNotifications: 5
});
```

## 🎭 交互特性

- **点击关闭** - 点击通知区域即可关闭
- **悬停暂停** - 鼠标悬停时暂停倒计时
- **进度条** - 底部显示剩余时间进度
- **堆叠动画** - 多通知自动向上推动
- **退出动画** - 平滑滑出到右侧

## 📱 响应式支持

通知系统完全响应式，在各种设备上都能完美显示：

- 桌面设备：最大宽度 400px
- 移动设备：自适应屏幕宽度
- 支持触摸交互

## 🌙 深色模式

自动适配系统深色模式：

```css
/* 系统会自动检测并应用深色样式 */
@media (prefers-color-scheme: dark) {
  /* 深色模式样式自动生效 */
}
```

## 🌐 浏览器支持

- Chrome/Edge (最新版)
- Firefox (最新版)
- Safari (最新版)
- Opera (最新版)
- 移动浏览器

## 📄 API 参考

### 类：NotificationSystem

#### 方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `show(options)` | Object | Number | 显示通知，返回通知ID |
| `success(message, options)` | String, Object | Number | 显示成功通知 |
| `error(message, options)` | String, Object | Number | 显示错误通知 |
| `info(message, options)` | String, Object | Number | 显示信息通知 |
| `warning(message, options)` | String, Object | Number | 显示警告通知 |
| `critical(message, options)` | String, Object | Number | 显示严重错误 |
| `removeNotification(id)` | Number | void | 移除指定通知 |
| `clearAll()` | - | void | 清除所有通知 |
| `configure(options)` | Object | void | 配置系统 |

### 配置选项 (options)

```javascript
{
  type: 'success',      // 通知类型
  title: '标题',        // 可选标题
  message: '消息内容',  // 消息文本（必需）
  priority: 'normal',  // 优先级
  duration: 4000       // 显示时长（毫秒）
}
```

## 🎨 自定义样式

可以通过修改 CSS 变量来自定义外观：

```css
.notification {
  /* 修改卡片样式 */
  border-radius: 12px;
  /* ... */
}

.notification--success .notification__icon {
  /* 修改成功图标样式 */
  background: #your-color;
}
```

## 📝 示例

查看 `demo.html` 文件获取完整的使用示例和演示页面。

## 🔧 技术细节

- **纯 JavaScript** - 无需依赖
- **CSS 动画** - 流畅的 60fps 动画
- **事件委托** - 高效的事件处理
- **内存安全** - 自动清理 DOM 元素和定时器

## 📄 许可

MIT License - 自由使用、修改和分发。

## 🤝 贡献

欢迎提交问题报告和改进建议！

---

**享受你的通知系统！** 🎉