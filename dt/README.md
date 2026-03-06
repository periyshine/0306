# 交互式旅行规划地图应用 🗺️

一个功能完整的旅行规划地图应用，使用 Leaflet + OpenStreetMap 开发，支持 PWA 离线功能。

## 功能特性 ✨

### 核心功能
- ✅ **交互式地图**: 使用 Leaflet + OpenStreetMap 提供免费地图服务
- ✅ **地点标记**: 在地图上点击添加 POI 标记，支持拖拽移动
- ✅ **智能搜索**: 集成 Nominatim 地理编码 API，支持地点搜索
- ✅ **行程规划器**: 拖放式添加、移除和重新排序目的地
- ✅ **距离计算**: 使用 Haversine 公式计算两点间的精确距离
- ✅ **路线绘制**: 自动绘制旅行路线并显示方向箭头
- ✅ **天气集成**: 集成 OpenWeatherMap API 显示目的地天气
- ✅ **PWA 支持**: Service Worker 实现离线地图缓存
- ✅ **地图图层**: 支持街道、卫星、地形多种地图图层

### 用户体验
- 🎨 精美的 UI 设计，响应式布局
- 📱 支持移动端和桌面端
- 🔔 Toast 通知系统
- 🌐 在线/离线状态提示
- 💾 行程数据导出为 JSON

## 安装和运行 🚀

### 方法 1: 直接打开（推荐测试）

1. 克隆或下载此项目
2. 在浏览器中打开 `index.html` 文件

### 方法 2: 使用 HTTP 服务器（推荐）

由于 Service Worker 和某些 API 需要 HTTPS 或 localhost，建议使用 HTTP 服务器：

```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js http-server
npx http-server

# 或使用 PHP
php -S localhost:8000
```

然后在浏览器中访问 `http://localhost:8000`

### 方法 3: 使用 VSCode Live Server

1. 安装 Live Server 扩展
2. 右键 `index.html` 选择 "Open with Live Server"

## 配置 ⚙️

### 天气 API 配置

默认情况下，天气功能使用演示模式。要启用实际天气数据：

1. 在 [OpenWeatherMap](https://openweathermap.org/api) 注册账号
2. 获取免费的 API Key
3. 在 `app.js` 中修改:

```javascript
const CONFIG = {
    // ...
    WEATHER_API_KEY: 'your_api_key_here', // 替换为你的 API Key
    // ...
};
```

### 自定义配置

在 `app.js` 的 `CONFIG` 对象中可以修改：

- `DEFAULT_CENTER`: 默认地图中心位置 [纬度, 经度]
- `DEFAULT_ZOOM`: 默认缩放级别
- `MIN_ZOOM/MAX_ZOOM`: 最小/最大缩放级别

## 使用说明 📖

### 1. 添加目的地

**方法一**: 直接在地图上点击
- 地图上会显示一个标记
- 点击标记的详细信息窗口

**方法二**: 使用搜索功能
- 在左侧搜索框输入地点名称
- 从搜索结果中选择一个地点
- 该地点会自动添加到地图上

### 2. 规划行程

- 点击标记信息窗口中的 "添加到行程" 按钮
- 或在地图上已添加的标记会出现在左侧 "行程规划" 列表中
- 拖动列表项可以重新排序行程

### 3. 计算距离和时间

- 添加至少两个目的地后，点击 "计算距离" 按钮
- 应用会显示:
  - 总距离 (公里)
  - 预计时间 (假设平均速度 60 km/h)
  - 站点数量

### 4. 查看天气

- 点击顶部 "天气" 按钮
- 会显示前三个目的地的当前天气信息

### 5. 导出行程

- 点击 "导出行程" 按钮
- 行程数据将保存为 JSON 文件

### 6. 切换地图图层

- 点击地图右侧的图层按钮
- 可以在街道、卫星、地形地图之间切换

## 技术栈 🛠️

- **前端框架**: 纯 JavaScript (ES6+)
- **地图库**: [Leaflet](https://leafletjs.com/) v1.9.4
- **地图数据**: [OpenStreetMap](https://www.openstreetmap.org/)
- **地理编码**: [Nominatim API](https://nominatim.openstreetmap.org/)
- **天气数据**: [OpenWeatherMap API](https://openweathermap.org/api)
- **图标**: [Font Awesome](https://fontawesome.com/)
- **PWA**: Service Worker + Cache API

## PWA 离线功能 📱

该应用支持离线使用，通过 Service Worker 缓存：

- 静态资源（HTML, CSS, JS）
- 地图瓦片
- API 响应数据
- 图标和字体文件

### 离线缓存策略

1. **地图瓦片**: Cache First，网络失败时返回缓存的类似瓦片
2. **API 请求**: Network First，失败时使用缓存数据
3. **静态资源**: Cache First

## 浏览器兼容性 🌐

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 项目结构 📁

```
旅行规划地图应用/
├── index.html          # 主 HTML 文件
├── styles.css          # 样式文件
├── app.js              # 主 JavaScript 文件
├── service-worker.js   # Service Worker（PWA 离线支持）
├── manifest.json       # PWA 清单文件
├── README.md           # 项目说明
└── package.json        # 项目配置（可选）
```

## 开发说明 🔧

### 添加新功能

主要功能模块在 `app.js` 中：

- `initializeApp()`: 应用初始化
- `onMapClick()`: 地图点击处理
- `searchLocation()`: 地点搜索
- `addWaypoint()`: 添加行程点
- `calculateDistance()`: 距离计算
- `drawRoute()`: 路线绘制
- `showWeatherInfo()`: 天气信息显示

### 自定义样式

修改 `styles.css` 中的 CSS 变量：

```css
:root {
    --primary-color: #4A90E2;
    --secondary-color: #50E3C2;
    --accent-color: #F5A623;
    --danger-color: #E74C3C;
    /* ... */
}
```

## 已知限制 ⚠️

1. **天气 API**: 需要用户自行注册并配置 API Key
2. **地图精度**: 使用 OpenStreetMap，某些地区可能不够详细
3. **实时路况**: 不支持实时交通信息
4. **备用路线**: 不提供多条路线选择

## 许可证 📄

MIT License - 可自由使用和修改

## 贡献 🤝

欢迎提交 Issue 和 Pull Request！

## 更新日志 📝

### v1.0.0 (2024)
- ✨ 初始版本发布
- ✅ 实现所有核心功能
- ✅ PWA 离线支持
- ✅ 响应式设计

## 联系方式 📧

有问题或建议？欢迎通过 GitHub Issues 联系。

---

**享受你的旅行规划！** 🌍✈️