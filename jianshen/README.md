# 健身追踪仪表盘 PWA

一个功能完整的渐进式网络应用（PWA），用于追踪健身活动、设定目标和可视化进度。

## 功能特点

### 核心功能
- **锻炼记录** - 记录多种类型的锻炼（跑步、骑行、举重、游泳、瑜伽等）
- **数据追踪** - 追踪时长、距离、重量等锻炼详情
- **体重记录** - 使用折线图可视化体重变化趋势
- **统计仪表盘** - 查看每周锻炼统计和数据摘要

### 目标设定
- 设定每日、每周或每月健身目标
- 可视化进度条显示目标完成情况
- 完成目标自动更新并通知

### 里程碑系统
- 解锁健身成就徽章
- 8个预设里程碑（初次锻炼、每周战士、马拉松等）
- 达成条件后自动解锁

### 分享功能
- 生成锻炼摘要卡片
- 下载为图片分享
- 使用Web Share API分享到社交媒体
- 支持分享单次锻炼、周报、目标成就

### 计步器集成
- 集成Pedometer API（支持的设备）
- 自动追踪每日步数
- 显示步数历史图表
- 计算行走距离

### PWA特性
- 离线工作（Service Worker）
- 可安装到移动设备
- 快捷方式支持
- 推送通知支持（可选）
- 后台同步

## 技术栈

- **纯HTML/CSS/JavaScript** - 无框架依赖，轻量级
- **IndexedDB** - 本地数据存储
- **Chart.js** - 数据可视化
- **Pedometer API** - 计步功能
- **Web Share API** - 分享功能
- **Service Worker** - 离线支持
- **Canvas API** - 图片生成

## 安装和使用

### 在线使用
1. 将所有文件上传到支持HTTPS的Web服务器
2. 在浏览器中打开index.html
3. 浏览器地址栏会显示安装图标
4. 点击"安装应用"将PWA添加到主屏幕

### 本地测试
1. 由于Service Worker安全限制，需要通过本地服务器运行
2. 使用以下命令启动本地服务器：

```bash
# 使用 Python 3
python -m http.server 8080

# 或使用 Node.js http-server
npx http-server -p 8080

# 或使用 PHP
php -S localhost:8080
```

3. 在浏览器中打开 `http://localhost:8080`

### 离线使用
- 首次访问后，应用会自动缓存所需资源
- 即使没有网络连接，也能正常使用
- 数据存储在本地，不会丢失

## 文件结构

```
健身追踪仪表盘/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── app.js             # 主应用逻辑
├── db.js              # 数据库操作（IndexedDB）
├── share.js           # 分享功能
├── manifest.json      # PWA清单文件
├── sw.js              # Service Worker
└── README.md          # 说明文档
```

## 数据存储

所有数据存储在本地IndexedDB数据库中：
- **workouts** - 锻炼记录
- **weights** - 体重记录
- **goals** - 目标设定
- **steps** - 步数记录
- **milestones** - 里程碑成就

## 浏览器兼容性

推荐使用现代浏览器：
- Chrome 90+ ✅
- Safari 14+ ✅
- Firefox 88+ ✅
- Edge 90+ ✅

### PWA支持
- 移动端iOS Safari ✅
- 移动端Chrome ✅
- 桌面Chrome/Edge ✅

### 特定功能
- **Pedometer API**: 仅部分移动设备支持（iOS Safari部分支持）
- **Web Share API**: 现代移动浏览器
- **IndexedDB**: 所有现代浏览器

## 隐私说明

- 所有数据存储在您的设备本地
- 不与任何服务器通信
- 不收集任何个人信息
- 完全离线可用

## 开发者说明

### 添加新的锻炼类型
编辑 `index.html` 中的锻炼类型下拉菜单：
```html
<option value="your-type">新类型</option>
```

更新 `app.js` 中的图标映射：
```javascript
const iconMap = {
    your-type: { icon: 'fa-icon', label: '新类型' }
};
```

### 添加新里程碑
在 `db.js` 的 `initMilestones()` 函数中添加：
```javascript
{
    id: 'milestone_id',
    title: '里程碑标题',
    description: '完成条件说明',
    icon: 'fa-icon-name',
    unlocked: false
}
```

### 自定义样式
修改 `styles.css` 中的CSS变量：
```css
:root {
    --primary-color: #4CAF50;
    --secondary-color: #8BC34A;
    --accent-color: #FF9800;
}
```

## 故障排除

### Service Worker 不工作
- 确保通过HTTPS或localhost访问
- 清除浏览器缓存并重新加载
- 浏览器控制台查看错误信息

### 图表不显示
- 确保Chart.js CDN已加载
- 检查浏览器控制台错误

### Pedometer API不可用
- 该API仅部分设备支持
- 可以使用手动输入步数功能

### 数据丢失
- IndexedDB数据存储在浏览器中
- 清除浏览器数据会删除所有记录
- 建议定期导出重要数据

## 未来改进

- [ ] 云端数据同步
- [ ] 导入/导出数据功能
- [ ] 更多图表类型
- [ ] 社交分享优化
- [ ] 语音记录锻炼
- [ ] 健康数据集成（Apple Health、Google Fit）
- [ ] 提醒和通知功能
- [ ] 深色模式

## 许可证

MIT License - 自由使用和修改

## 贡献

欢迎提交问题和改进建议！

---

**开始您的健身之旅吧！** 💪
