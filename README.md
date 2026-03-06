# 交互式通知系统

一个功能完整、视觉吸引人的 JavaScript 通知系统，支持平滑动画、优先级系统和多种通知类型。

## 功能特性

- ✨ **流畅动画**: 通知从右侧滑入，自动滑出
- 🎨 **多种类型**: 成功（绿色）、错误（红色）、信息（蓝色）
- 📦 **智能堆叠**: 多个通知自动堆叠，不会重叠
- 👆 **手动关闭**: 点击通知即可提前关闭
- ⏱️ **优先级系统**: 高优先级通知停留时间更长
- 📊 **进度指示**: 显示通知剩余时间
- 📱 **响应式设计**: 完美适配移动设备

## 快速开始

### 1. 引入文件

在 HTML 文件中引入 CSS 和 JavaScript：

```html
<link rel="stylesheet" href="notifications.css">
<script src="notifications.js"></script>
```

### 2. 基本用法

```javascript
// 成功通知
NotificationSystem.success('操作成功！', '您的更改已保存。');

// 错误通知
NotificationSystem.error('发生错误！', '无法连接到服务器。');

// 信息通知
NotificationSystem.info('系统消息', '您有新的消息。');
```

### 3. 使用优先级

优先级影响通知在屏幕上的停留时间：

```javascript
// 优先级: critical (8秒), high (6秒), medium (4秒), low (2.5秒)

NotificationSystem.success('保存成功！', '数据已保存到云端。', 'high');
NotificationSystem.error('严重错误！', '系统崩溃，请立即联系管理员。', 'critical');
NotificationSystem.info('提示信息', '这是普通提示。', 'low');
```

## API 文档

### NotificationSystem.success(title, message, priority)

显示成功通知（绿色背景）

**参数:**
- `title` (String): 通知标题
- `message` (String): 通知内容
- `priority` (String, 可选): 优先级 - `'critical'` | `'high'` | `'medium'` | `'low'`

**返回值:** 通知 ID（可用于手动关闭）

**示例:**
```javascript
const id = NotificationSystem.success('完成！', '文件上传成功。', 'high');
```

### NotificationSystem.error(title, message, priority)

显示错误通知（红色背景）

**参数:** 同上

**示例:**
```javascript
NotificationSystem.error('连接失败', '无法连接到服务器，请检查网络。', 'critical');
```

### NotificationSystem.info(title, message, priority)

显示信息通知（蓝色背景）

**参数:** 同上

**示例:**
```javascript
NotificationSystem.info('新消息', '您收到了3条新消息。', 'medium');
```

### NotificationSystem.close(id)

手动关闭指定通知

**参数:**
- `id` (Number): 要关闭的通知 ID

**示例:**
```javascript
const id = NotificationSystem.info('测试', '这条消息将在1秒后关闭');
setTimeout(() => NotificationSystem.close(id), 1000);
```

### NotificationSystem.closeAll()

关闭所有活动通知

**示例:**
```javascript
NotificationSystem.closeAll();
```

### NotificationSystem.getActiveCount()

获取当前活动通知数量

**返回值:** 当前活动通知的数量

**示例:**
```javascript
console.log(`当前有 ${NotificationSystem.getActiveCount()} 个通知`);
```

### NotificationSystem.configure(options)

配置系统选项

**参数:**
- `options.maxNotifications` (Number): 最大同时显示的通知数量（默认: 5）
- `options.priorityDuration` (Object): 自定义各优先级的停留时间

**示例:**
```javascript
NotificationSystem.configure({
    maxNotifications: 3,
    priorityDuration: {
        critical: 10000,
        high: 7000,
        medium: 5000,
        low: 3000
    }
});
```

## 优先级系统

| 优先级 | 停留时间 | 视觉指示 | 使用场景 |
|--------|----------|----------|----------|
| `critical` | 8秒 | 红色闪烁指示器 | 系统崩溃、数据丢失等严重错误 |
| `high` | 6秒 | 橙色指示器 | 重要错误、警告信息 |
| `medium` | 4秒 | 黄色指示器 | 一般信息、成功消息 |
| `low` | 2.5秒 | 绿色指示器 | 次要提示、状态更新 |

## 自定义样式

你可以通过修改 CSS 变量来自定义外观：

```css
/* 修改通知宽度 */
.notification-container {
    max-width: 500px;
}

/* 修改圆角 */
.notification {
    border-radius: 20px;
}

/* 修改动画速度 */
@keyframes slideIn {
    /* 你的自定义动画 */
}
```

## 浏览器兼容性

- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- IE11: ⚠️ 需要 polyfills

## 最佳实践

### 1. 选择合适的优先级

```javascript
// ❌ 不好：低优先级使用 critical
NotificationSystem.info('提示', '鼠标悬停查看详情', 'critical');

// ✅ 好：根据重要性选择优先级
NotificationSystem.error('系统错误', '数据库连接失败！', 'critical');
NotificationSystem.info('提示', '鼠标悬停查看详情', 'low');
```

### 2. 提供有用的消息

```javascript
// ❌ 不好：模糊的消息
NotificationSystem.error('错误', '出错了');

// ✅ 好：提供具体信息和解决方案
NotificationSystem.error('上传失败', '文件大小超过10MB限制，请压缩后重试。', 'high');
```

### 3. 控制通知频率

```javascript
// ❌ 不好：循环中显示通知
for (let i = 0; i < 100; i++) {
    NotificationSystem.info('消息', `第 ${i} 条消息`);
}

// ✅ 好：批量汇总
NotificationSystem.info('处理完成', `已成功处理 100 个文件`);
```

## 完整示例

查看 `notifications.html` 获取完整的演示页面。

## 许可证

MIT License - 自由使用和修改

## 贡献

欢迎提交问题和改进建议！
