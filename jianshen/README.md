# 健身追踪 PWA (Fitness Tracker PWA)

一个功能完整的健身追踪渐进式网络应用（PWA），支持离线使用，可安装到移动设备。

## 功能特性

### 核心功能
- 📊 **仪表盘** - 查看锻炼统计、趋势图表和最近活动
- 🏃 **锻炼记录** - 记录跑步、骑行、举重、游泳、瑜伽等多种运动
- 📈 **数据可视化** - 使用 Chart.js 展示体重趋势、锻炼统计和类型分布
- 🎯 **目标设定** - 设定健身目标，追踪进度，庆祝里程碑成就
- ⚖️ **体重追踪** - 记录体重变化，可视化趋势
- 👟 **计步器集成** - 支持 Web Pedometer API（实验性功能）
- 📤 **社交分享** - 生成精美的锻炼卡片分享到社交媒体
- 🌙 **主题切换** - 支持亮色/暗色主题

### PWA 特性
- 📱 可安装到主屏幕
- 📴 离线支持（Service Worker）
- 🔄 后台同步
- 📨 推送通知（可选）
- 🔔 安装提示

## 技术栈

| 技术 | 用途 |
|------|------|
| 原生 HTML5 | 页面结构 |
| 原生 CSS3 | 样式和动画 |
| 原生 JavaScript | 应用逻辑 |
| IndexedDB | 本地数据存储 |
| Chart.js | 数据可视化 |
| html2canvas | 图片生成 |
| Web Pedometer API | 计步器集成 |
| Service Worker | 离线支持 |

## 项目结构

```
fitness-tracker-pwa/
├── index.html              # 主页面
├── styles/
│   └── main.css           # 主样式文件
├── scripts/
│   ├── app.js             # 主应用逻辑
│   ├── storage.js         # 数据存储（IndexedDB）
│   ├── charts.js          # 图表管理
│   ├── goals.js           # 目标与里程碑
│   ├── share.js           # 分享功能
│   └── pedometer.js       # 计步器 API
├── manifest.json          # PWA 清单文件
├── service-worker.js      # Service Worker（离线支持）
├── icons/                 # PWA 图标目录
└── README.md              # 项目说明
```

## 安装和运行

### 本地开发

1. 克隆或下载项目

2. 启动本地服务器（需要 HTTPS 或 localhost）
   ```bash
   # 使用 Python
   python -m http.server 8000

   # 使用 Node.js (http-server)
   npx http-server -p 8000

   # 或使用 VS Code Live Server 扩展
   ```

3. 在浏览器中打开 `http://localhost:8000`

### 部署

应用需要部署在 HTTPS 环境下才能完全使用 PWA 功能。

推荐部署平台：
- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting

## 使用指南

### 1. 记录锻炼

1. 点击底部导航栏的"添加"按钮
2. 选择锻炼类型
3. 填写运动时长、距离、消耗卡路里等信息
4. 点击"保存记录"

### 2. 查看统计

- 在"仪表盘"标签查看总锻炼次数、时长和消耗卡路里
- 查看本周锻炼统计图表
- 查看锻炼类型分布

### 3. 设定目标

1. 进入"目标"标签
2. 点击"添加目标"
3. 选择目标类型（锻炼次数、时长、卡路里、距离、减重）
4. 设定目标值和时间周期
5. 保存后可在仪表盘查看进度

### 4. 追踪体重

1. 进入"体重"标签
2. 点击"记录体重"
3. 输入体重和日期
4. 查看体重变化趋势图

### 5. 分享锻炼

1. 在锻炼记录列表中点击"分享"图标
2. 查看预览图片
3. 选择"下载图片"或直接"分享"

### 6. 计步器（实验性）

> 注意：计步器功能仅支持支持 Web Pedometer API 的设备

1. 点击顶部导航栏的计步器图标
2. 允许计步器权限
3. 查看今日步数、距离和消耗卡路里
4. 点击"同步到锻炼记录"将步数转换为锻炼记录

## 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|----------|
| Chrome/Edge 90+ | ✅ 完全支持 |
| Safari 15+ | ✅ 完全支持（部分功能受限） |
| Firefox 90+ | ✅ 完全支持 |
| Samsung Internet | ✅ 完全支持 |
| Opera | ✅ 完全支持 |

### 注意事项
- Pedometer API 仅在部分 Chromium 浏览器中可用
- Web Share API 需要 HTTPS 或 localhost
- 推送通知需要 HTTPS

## 数据存储

应用使用 IndexedDB 存储所有数据，数据完全保留在本地：

- `workouts` - 锻炼记录
- `goals` - 目标数据
- `weightLogs` - 体重记录

### 数据导出/导入

在开发者控制台中执行：

```javascript
// 导出数据
const data = await Storage.exportData();
console.log(data);

// 导入数据
await Storage.importData(jsonData);
```

## 离线支持

应用首次加载时会缓存所有必要的资源，之后可以在离线环境下使用。

缓存策略：
- 静态资源（HTML、CSS、JS）：Cache First
- 外部库（Chart.js等）：Cache First
- 页面导航：Network First

## 开发

### 添加新的锻炼类型

在 `scripts/app.js` 中修改 `WorkoutTypes` 对象：

```javascript
const WorkoutTypes = {
    // ... 现有类型
    newtype: {
        name: '新类型',
        icon: '<svg>...</svg>',
        fields: ['field1', 'field2']
    }
};
```

### 自定义主题

修改 `styles/main.css` 中的 CSS 变量：

```css
:root {
    --color-primary: #4F46E5; /* 主题色 */
    /* ... 其他颜色变量 */
}
```

### 图标

应用需要以下尺寸的图标（PNG 格式）：
- `favicon-16x16.png` - 16x16
- `favicon-32x32.png` - 32x32
- `icon-192x192.png` - 192x192
- `icon-512x512.png` - 512x512
- `apple-touch-icon.png` - 180x180

可以使用以下工具生成图标：
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## PWA 审计

使用 Lighthouse 进行 PWA 审计，目标得分 90+：

```bash
# 在 Chrome DevTools 中
1. 打开 Lighthouse 标签
2. 选择 "Progressive Web App"
3. 点击 "Generate report"
```

改进建议的点：
- [ manifest.json 配置正确
- [ Service Worker 正确注册
- [ 图标尺寸完整
- [ 支持离线访问
- [ 支持 HTTPS 部署

## 常见问题

### Q: 为什么不能安装？
A: 确保使用 HTTPS 或 localhost，并且浏览器支持 PWA。

### Q: 数据会丢失吗？
A: 数据存储在本地 IndexedDB 中，卸载应用会清除数据。请定期导出重要数据。

### Q: 计步器不工作？
A: Web Pedometer API 是实验性功能，仅支持部分设备。请检查浏览器兼容性。

### Q: 如何清除缓存？
A: 在开发者控制台执行：
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
    reg.unregister();
    caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))));
    location.reload();
});
```

## 路线图

- [ ] 云端数据同步
- [ ] 用户账号系统
- [ ] 社交功能（好友、排行榜）
- [ ] 更多图表类型
- [ ] 运动路线追踪（使用 Geolocation API）
- [ ] 更多语音提醒
- [ ] Apple Health / Google Fit 集成

## 许可证

MIT License - 自由使用和修改

## 贡献

欢迎提交 Bug 报告和功能请求！

---

**Enjoy your fitness journey! 🏋️‍♂️💪**
