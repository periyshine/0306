# 🔔 现代交互式通知系统

一个功能完整、视觉吸引的 JavaScript 通知系统，支持动画、堆叠、优先级和多种通知类型。

## ✨ 特性

- **流畅动画** - 从屏幕右侧滑入/滑出，无缝动画效果
- **智能堆叠** - 多个通知自动堆叠，不会重叠
- **多种类型** - 成功（绿色）、错误（红色）、警告（橙色）、信息（蓝色）
- **优先级系统** - 高优先级通知（如严重错误）停留更长时间
- **交互友好** - 点击通知可手动关闭，鼠标悬停时暂停自动关闭
- **可视化进度条** - 显示通知剩余停留时间
- **响应式设计** - 自适应移动端和桌面端
- **深色模式** - 自动适配系统深色模式
- **无障碍支持** - 支持键盘导航和屏幕阅读器

## 📦 文件结构

```
通知系统/
├── notification-system.js    # 核心通知系统
├── notification-system.css   # 样式和动画
├── index.html                # 演示页面
└── README.md                 # 使用说明
```

## 🚀 快速开始

### 1. 引入文件

```html
<link rel="stylesheet" href="notification-system.css">
<script type="module">
    import { notifications } from './notification-system.js';
</script>
```

### 2. 基础用法

```javascript
// 使用快捷方法
notifications.success('操作成功！');
notifications.error('发生错误');
notifications.warning('请注意');
notifications.info('普通信息');

// 使用完整配置
notifications.show({
    title: '标题',
    message: '消息内容',
    type: 'success',      // success, error, warning, info
    priority: 'normal',   // low, normal, high, urgent
    duration: 3000        // 自定义停留时间（毫秒）
});
```

## 📖 API 参考

### 快捷方法

```javascript
// 成功通知（绿色）
notifications.success(message, options?)

// 错误通知（红色，默认高优先级）
notifications.error(message, options?)

// 警告通知（橙色）
notifications.warning(message, options?)

// 信息通知（蓝色，默认低优先级）
notifications.info(message, options?)
```

### 完整配置

```javascript
notifications.show({
    // 基础内容
    title: '标题（可选）',
    message: '消息内容',

    // 通知类型
    type: 'success',  // success | error | warning | info

    // 优先级（影响停留时间）
    priority: 'high', // low (2s) | normal (3s) | high (4.5s) | urgent (6s)

    // 自定义停留时间（覆盖优先级设置）
    duration: 5000,

    // 自定义图标
    icon: '🎉',

    // 点击事件
    onClick: (id) => {
        console.log('通知被点击:', id);
    },

    // 关闭事件
    onClose: (id) => {
        console.log('通知已关闭:', id);
    }
});
```

### 管理方法

```javascript
// 关闭特定通知
notifications.dismiss(notificationId);

// 清除所有通知
notifications.clear();

// 销毁整个系统
notifications.destroy();
```

### 自定义实例

```javascript
import NotificationSystem from './notification-system.js';

// 创建自定义配置的实例
const customNotifications = new NotificationSystem({
    position: 'top-right',
    defaultDuration: 5000,
    maxNotifications: 3,
    animationDuration: 400
});

customNotifications.success('自定义实例！');
```

## 🎨 优先级系统

| 优先级 | 停留时间 | 适用场景 |
|--------|----------|----------|
| `low` | 2 秒 | 次要信息、提示 |
| `normal` | 3 秒 | 一般通知 |
| `high` | 4.5 秒 | 重要警告 |
| `urgent` | 6 秒 | 严重错误、紧急消息（带脉冲动画） |

## 💡 使用示例

### 示例 1: 表单提交反馈

```javascript
async function submitForm(formData) {
    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            notifications.success('表单提交成功！');
        } else {
            notifications.error('提交失败，请重试');
        }
    } catch (error) {
        notifications.error({
            title: '网络错误',
            message: '无法连接到服务器',
            priority: 'high'
        });
    }
}
```

### 示例 2: 购物车操作

```javascript
function addToCart(product) {
    cart.addItem(product);

    notifications.show({
        title: '已添加到购物车',
        message: `${product.name} x ${product.quantity}`,
        type: 'success',
        priority: 'low',
        duration: 2000,
        onClick: () => {
            // 点击通知打开购物车
            openCart();
        }
    });
}
```

### 示例 3: 实时系统状态

```javascript
// 系统错误 - 高优先级
function handleSystemError(error) {
    notifications.show({
        title: '🚨 系统错误',
        message: error.message,
        type: 'error',
        priority: 'urgent',
        duration: 6000
    });
}

// 新消息 - 低优先级
function onNewMessage(message) {
    notifications.show({
        message: `新消息: ${message.text}`,
        type: 'info',
        priority: 'low'
    });
}
```

### 示例 4: 文件上传进度

```javascript
function uploadFile(file) {
    notifications.info({
        title: '上传中',
        message: `正在上传 ${file.name}...`,
        priority: 'normal'
    });

    // 模拟上传完成
    setTimeout(() => {
        notifications.success(`${file.name} 上传完成！`);
    }, 3000);
}
```

## 🎯 交互行为

- **鼠标悬停**: 暂停自动关闭计时器
- **点击通知**: 立即关闭（如设置了 onClick 会先触发回调）
- **点击 × 按钮**: 立即关闭
- **自动堆叠**: 新通知从顶部进入，旧通知向下推

## 📱 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 支持所有现代移动浏览器

## 🎨 自定义样式

您可以通过修改 CSS 变量来自定义外观：

```css
.notification {
    --your-custom-property: value;
}
```

## 📄 许可证

MIT License - 自由使用和修改

---

**演示**: 在浏览器中打开 `index.html` 查看完整演示和所有功能。
