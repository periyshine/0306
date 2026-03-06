// ===============================================
// 旅行规划地图应用
// 使用 Leaflet + OpenStreetMap + OpenWeatherMap API
// ===============================================

// 应用状态
const AppState = {
    map: null,
    markers: [],
    routeLines: [],
    waypoints: [],
    weatherLayer: null,
    currentLocation: null,
    isOnline: navigator.onLine,
    draggedItem: null,
    searchTimeout: null
};

// 常量配置
const CONFIG = {
    DEFAULT_CENTER: [39.9042, 116.4074], // 北京
    DEFAULT_ZOOM: 13,
    MIN_ZOOM: 3,
    MAX_ZOOM: 19,
    API_BASE: 'https://nominatim.openstreetmap.org',
    WEATHER_API_KEY: 'demo', // 用户需要替换为实际的 OpenWeatherMap API key
    WEATHER_API_BASE: 'https://api.openweathermap.org/data/2.5'
};

// 地图图层配置
const MAP_LAYERS = {
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        name: '街道地图'
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
        name: '卫星地图'
    },
    terrain: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        name: '地形地图'
    }
};

// ===============================================
// 初始化应用
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    console.log('初始化应用...');

    // 初始化地图
    initializeMap();

    // 设置事件监听
    setupEventListeners();

    // 检查在线状态
    updateOnlineStatus();

    // 隐藏加载动画
    setTimeout(() => {
        document.getElementById('loading-overlay').classList.add('hidden');
        showToast('欢迎使用旅行规划地图！', 'success');
    }, 1000);
}

function initializeMap() {
    // 创建地图实例
    AppState.map = L.map('map', {
        center: CONFIG.DEFAULT_CENTER,
        zoom: CONFIG.DEFAULT_ZOOM,
        minZoom: CONFIG.MIN_ZOOM,
        maxZoom: CONFIG.MAX_ZOOM,
        zoomControl: false
    });

    // 添加默认图层
    const defaultLayer = L.tileLayer(MAP_LAYERS.osm.url, {
        attribution: MAP_LAYERS.osm.attribution,
        maxZoom: CONFIG.MAX_ZOOM
    }).addTo(AppState.map);

    // 存储当前图层
    AppState.currentLayer = defaultLayer;

    // 添加缩放控件到右下角
    L.control.zoom({
        position: 'bottomright'
    }).addTo(AppState.map);

    // 地图点击事件
    AppState.map.on('click', onMapClick);

    // 地图右键点击事件 (移除标记)
    AppState.map.on('contextmenu', () => false);

    // 尝试获取用户位置
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                AppState.currentLocation = [latitude, longitude];
                AppState.map.setView([latitude, longitude], CONFIG.DEFAULT_ZOOM);
                addCurrentLocationMarker([latitude, longitude]);
            },
            error => {
                console.log('无法获取用户位置:', error.message);
            }
        );
    }
}

function addCurrentLocationMarker(coords) {
    const icon = L.divIcon({
        className: 'current-location-marker',
        html: '<div style="background: #4A90E2; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const marker = L.marker(coords, { icon: icon })
        .addTo(AppState.map)
        .bindPopup('您的位置');

    marker.currentLocation = true;
}

// ===============================================
// 事件监听器设置
// ===============================================

function setupEventListeners() {
    // 搜索功能
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    searchInput.addEventListener('input', debounce(onSearchInput, 300));
    searchBtn.addEventListener('click', onSearch);

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    });

    // 行程操作按钮
    document.getElementById('btn-calculate').addEventListener('click', calculateDistance);
    document.getElementById('btn-clear').addEventListener('click', clearTrip);
    document.getElementById('btn-export').addEventListener('click', exportTrip);

    // 地图控制按钮
    document.getElementById('btn-current-location').addEventListener('click', goToCurrentLocation);
    document.getElementById('btn-toggle-layer').addEventListener('click', toggleMapLayer);
    document.getElementById('btn-weather').addEventListener('click', toggleWeatherLayer);

    // 在线/离线状态
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // 拖拽上传区域
    setupDragAndDrop();
}

// ===============================================
// 地图点击处理
// ===============================================

function onMapClick(e) {
    const { lat, lng } = e.latlng;

    // 反向地理编码获取地址
    reverseGeocode(lat, lng)
        .then(locationName => {
            addMarker([lat, lng], locationName);
            showToast(`已添加标记: ${locationName}`, 'success');
        })
        .catch(error => {
            console.error('反向地理编码失败:', error);
            addMarker([lat, lng], `位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        });
}

function addMarker(coords, name) {
    // 创建自定义图标
    const icon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background: #E74C3C; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });

    const marker = L.marker(coords, { icon: icon, draggable: true })
        .addTo(AppState.map);

    // 创建弹窗内容
    const popupContent = `
        <div class="popup-content">
            <div class="popup-title">${name}</div>
            <div class="popup-coords">${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}</div>
            <div class="popup-actions">
                <button class="popup-btn popup-btn-primary" onclick="addWaypointFromMarker(${coords[0]}, ${coords[1]}, '${name.replace(/'/g, "\\'")}')">
                    添加到行程
                </button>
                <button class="popup-btn popup-btn-secondary" onclick="removeMarker(${coords[0]}, ${coords[1]})">
                    移除标记
                </button>
            </div>
        </div>
    `;

    marker.bindPopup(popupContent);
    marker.markerName = name;
    marker.markerCoords = coords;

    AppState.markers.push(marker);

    return marker;
}

// ===============================================
// 搜索功能
// ===============================================

function onSearchInput() {
    const query = document.getElementById('search-input').value.trim();

    if (query.length < 2) {
        document.getElementById('search-results').innerHTML = '';
        return;
    }

    searchLocation(query);
}

function onSearch() {
    const query = document.getElementById('search-input').value.trim();

    if (!query) {
        showToast('请输入搜索关键词', 'warning');
        return;
    }

    searchLocation(query);
}

async function searchLocation(query) {
    try {
        const response = await fetch(
            `${CONFIG.API_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'zh-CN'
                }
            }
        );

        if (!response.ok) {
            throw new Error('搜索失败');
        }

        const results = await response.json();
        displaySearchResults(results);

    } catch (error) {
        console.error('搜索错误:', error);
        showToast('搜索失败，请稍后重试', 'error');
    }
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: #7F8C8D; padding: 1rem;">未找到结果</p>';
        return;
    }

    resultsContainer.innerHTML = results.map(result => {
        const displayName = result.display_name.split(',').slice(0, 3).join(',');
        return `
            <div class="search-result-item" onclick="selectSearchResult(${result.lat}, ${result.lon}, '${displayName.replace(/'/g, "\\'")}')">
                <div class="location-name">${result.display_name.split(',')[0]}</div>
                <div class="location-details">${displayName}</div>
            </div>
        `;
    }).join('');
}

function selectSearchResult(lat, lon, name) {
    const coords = [parseFloat(lat), parseFloat(lon)];

    // 移动地图到该位置
    AppState.map.setView(coords, 15);

    // 添加标记
    addMarker(coords, name);

    // 清空搜索结果
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';

    showToast(`已添加: ${name}`, 'success');
}

async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `${CONFIG.API_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh-CN`
        );

        if (!response.ok) {
            throw new Error('反向地理编码失败');
        }

        const result = await response.json();
        return result.display_name || `位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    } catch (error) {
        console.error('反向地理编码错误:', error);
        throw error;
    }
}

// ===============================================
// 行程规划器
// ===============================================

function addWaypointFromMarker(lat, lng, name) {
    addWaypoint([lat, lng], name);
    AppState.map.closePopup();
}

function addWaypoint(coords, name) {
    const waypoint = {
        id: Date.now(),
        coords: coords,
        name: name
    };

    AppState.waypoints.push(waypoint);
    updateWaypointsList();
    updateCalculateButton();
}

function updateWaypointsList() {
    const listContainer = document.getElementById('waypoints-list');

    if (AppState.waypoints.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-pin"></i>
                <p>在地图上点击添加地点<br>或搜索地点添加到行程</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = AppState.waypoints.map((waypoint, index) => `
        <div class="waypoint-item" draggable="true" data-id="${waypoint.id}">
            <div class="waypoint-number">${index + 1}</div>
            <div class="waypoint-info">
                <div class="waypoint-name">${waypoint.name}</div>
                <div class="waypoint-coords">${waypoint.coords[0].toFixed(4)}, ${waypoint.coords[1].toFixed(4)}</div>
            </div>
            <button class="waypoint-remove" onclick="removeWaypoint(${waypoint.id})" title="移除">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    // 添加拖拽事件
    setupDragAndDrop();
}

function setupDragAndDrop() {
    const items = document.querySelectorAll('.waypoint-item');
    const list = document.getElementById('waypoints-list');

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            AppState.draggedItem = item;
            item.classList.add('dragging');
            list.classList.add('dragging');
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            list.classList.remove('dragging');
            AppState.draggedItem = null;
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = document.querySelector('.waypoint-item.dragging');
            if (draggingItem !== item) {
                const rect = item.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;

                if (e.clientY < midY) {
                    item.parentNode.insertBefore(draggingItem, item);
                } else {
                    item.parentNode.insertBefore(draggingItem, item.nextSibling);
                }
            }
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            // 更新 waypoints 数组顺序
            updateWaypointsOrder();
        });
    });
}

function updateWaypointsOrder() {
    const items = document.querySelectorAll('.waypoint-item');
    const newOrder = [];

    items.forEach(item => {
        const id = parseInt(item.dataset.id);
        const waypoint = AppState.waypoints.find(w => w.id === id);
        if (waypoint) {
            newOrder.push(waypoint);
        }
    });

    AppState.waypoints = newOrder;
    updateWaypointsList();

    // 如果已经计算过距离，重新计算
    if (document.getElementById('distance-info').style.display !== 'none') {
        calculateDistance();
    }
}

function removeWaypoint(id) {
    AppState.waypoints = AppState.waypoints.filter(w => w.id !== id);
    updateWaypointsList();
    updateCalculateButton();
    drawRoute(); // 重新绘制路线
}

function updateCalculateButton() {
    const btn = document.getElementById('btn-calculate');
    btn.disabled = AppState.waypoints.length < 2;
}

// ===============================================
// 路线绘制
// ===============================================

function drawRoute() {
    // 清除现有路线
    AppState.routeLines.forEach(line => AppState.map.removeLayer(line));
    AppState.routeLines = [];

    if (AppState.waypoints.length < 2) return;

    // 绘制路线
    const coords = AppState.waypoints.map(w => w.coords);

    const polyline = L.polyline(coords, {
        color: '#4A90E2',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1
    }).addTo(AppState.map);

    AppState.routeLines.push(polyline);

    // 添加方向箭头
    for (let i = 0; i < coords.length - 1; i++) {
        const midPoint = calculateMidPoint(coords[i], coords[i + 1]);
        const angle = calculateAngle(coords[i], coords[i + 1]);

        const arrowIcon = L.divIcon({
            className: 'route-arrow',
            html: `<div style="transform: rotate(${angle}deg); font-size: 20px; color: #4A90E2;">▼</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const arrow = L.marker(midPoint, { icon: arrowIcon, interactive: false }).addTo(AppState.map);
        AppState.routeLines.push(arrow);
    }

    // 调整地图视图以显示整个路线
    AppState.map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
}

function calculateMidPoint(coord1, coord2) {
    return [
        (coord1[0] + coord2[0]) / 2,
        (coord1[1] + coord2[1]) / 2
    ];
}

function calculateAngle(coord1, coord2) {
    const dy = coord2[0] - coord1[0];
    const dx = coord2[1] - coord1[1];
    let theta = Math.atan2(dy, dx);
    theta *= 180 / Math.PI;
    return theta + 90; // 调整箭头方向
}

// ===============================================
// 距离计算
// ===============================================

function calculateDistance() {
    if (AppState.waypoints.length < 2) {
        showToast('请至少添加两个目的地', 'warning');
        return;
    }

    let totalDistance = 0;

    // 计算相邻两点间的距离 (Haversine 公式)
    for (let i = 0; i < AppState.waypoints.length - 1; i++) {
        const from = AppState.waypoints[i].coords;
        const to = AppState.waypoints[i + 1].coords;
        totalDistance += haversineDistance(from, to);
    }

    // 估算时间 (假设平均速度 60 km/h)
    const estimatedTime = totalDistance / 60;

    // 显示结果
    displayDistanceResults(totalDistance, estimatedTime);

    // 绘制路线
    drawRoute();

    showToast('距离计算完成！', 'success');
}

function haversineDistance(coord1, coord2) {
    const R = 6371; // 地球半径 (km)
    const dLat = toRad(coord2[0] - coord1[0]);
    const dLon = toRad(coord2[1] - coord1[1]);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(coord1[0])) * Math.cos(toRad(coord2[0])) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

function displayDistanceResults(distance, time) {
    document.getElementById('total-distance').textContent = distance.toFixed(1) + ' km';

    if (time < 1) {
        const minutes = Math.round(time * 60);
        document.getElementById('estimated-time').textContent = minutes + ' 分钟';
    } else {
        document.getElementById('estimated-time').textContent = Math.round(time) + ' 小时';
    }

    document.getElementById('stop-count').textContent = AppState.waypoints.length;

    const distanceInfo = document.getElementById('distance-info');
    distanceInfo.style.display = 'block';
}

// ===============================================
// 天气功能
// ===============================================

async function toggleWeatherLayer() {
    const btn = document.getElementById('btn-weather');

    if (AppState.weatherLayer) {
        // 移除天气图层
        document.getElementById('weather-widget').style.display = 'none';
        btn.classList.remove('active');
        AppState.weatherLayer = null;
    } else {
        // 显示天气信息
        if (AppState.waypoints.length === 0) {
            showToast('请先添加目的地', 'warning');
            return;
        }

        btn.classList.add('active');
        await showWeatherInfo();
    }
}

async function showWeatherInfo() {
    const weatherWidget = document.getElementById('weather-widget');
    const weatherInfo = document.getElementById('weather-info');

    weatherWidget.style.display = 'block';
    weatherInfo.innerHTML = '<p style="text-align: center;">加载天气数据中...</p>';

    // 检查 API key
    if (CONFIG.WEATHER_API_KEY === 'demo') {
        weatherInfo.innerHTML = `
            <p style="text-align: center; padding: 1rem;">
                <i class="fas fa-exclamation-triangle"></i><br><br>
                请在 app.js 中配置 OpenWeatherMap API Key<br>
                以获取天气数据
            </p>
        `;
        return;
    }

    // 获取前3个目的地的天气
    const locationsToShow = AppState.waypoints.slice(0, 3);

    try {
        const weatherData = await Promise.all(
            locationsToShow.map(waypoint => fetchWeather(waypoint.coords))
        );

        weatherInfo.innerHTML = weatherData.map((weather, index) => {
            if (!weather) return '';

            return `
                <div class="weather-location">
                    <div class="weather-icon">
                        <i class="fas ${getWeatherIcon(weather.weather[0].icon)}"></i>
                    </div>
                    <div class="weather-details">
                        <div class="weather-temp">${Math.round(weather.main.temp)}°C</div>
                        <div class="weather-desc">${weather.weather[0].description}</div>
                        <div class="weather-meta">
                            <span><i class="fas fa-tint"></i> ${weather.main.humidity}%</span>
                            <span><i class="fas fa-wind"></i> ${Math.round(weather.wind.speed * 3.6)} km/h</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('获取天气失败:', error);
        weatherInfo.innerHTML = '<p style="text-align: center;">无法获取天气数据</p>';
    }
}

async function fetchWeather(coords) {
    const [lat, lon] = coords;

    try {
        const response = await fetch(
            `${CONFIG.WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.WEATHER_API_KEY}&units=metric&lang=zh_cn`
        );

        if (!response.ok) {
            throw new Error('天气 API 请求失败');
        }

        return await response.json();

    } catch (error) {
        console.error('天气 API 错误:', error);
        return null;
    }
}

function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'fa-sun',
        '01n': 'fa-moon',
        '02d': 'fa-cloud-sun',
        '02n': 'fa-cloud-moon',
        '03d': 'fa-cloud',
        '03n': 'fa-cloud',
        '04d': 'fa-cloud',
        '04n': 'fa-cloud',
        '09d': 'fa-cloud-rain',
        '09n': 'fa-cloud-rain',
        '10d': 'fa-cloud-sun-rain',
        '10n': 'fa-cloud-moon-rain',
        '11d': 'fa-bolt',
        '11n': 'fa-bolt',
        '13d': 'fa-snowflake',
        '13n': 'fa-snowflake',
        '50d': 'fa-smog',
        '50n': 'fa-smog'
    };

    return iconMap[iconCode] || 'fa-cloud';
}

// ===============================================
// 地图控制
// ===============================================

function goToCurrentLocation() {
    if (AppState.currentLocation) {
        AppState.map.setView(AppState.currentLocation, 15);
        showToast('已定位到您的位置', 'info');
    } else {
        showToast('无法获取您的位置', 'error');
    }
}

function toggleMapLayer() {
    const layers = Object.values(MAP_LAYERS);
    const currentIndex = layers.findIndex(l => l.name === '街道地图');
    const nextIndex = (currentIndex + 1) % layers.length;
    const nextLayer = layers[nextIndex];

    // 移除当前图层
    AppState.map.removeLayer(AppState.currentLayer);

    // 添加新图层
    AppState.currentLayer = L.tileLayer(nextLayer.url, {
        attribution: nextLayer.attribution,
        maxZoom: CONFIG.MAX_ZOOM
    }).addTo(AppState.map);

    showToast(`已切换到: ${nextLayer.name}`, 'info');
}

// ===============================================
// 行程操作
// ===============================================

function clearTrip() {
    if (AppState.waypoints.length === 0) {
        showToast('行程已经是空的', 'info');
        return;
    }

    if (confirm('确定要清空所有行程吗?')) {
        AppState.waypoints = [];
        updateWaypointsList();
        updateCalculateButton();

        // 清除路线
        AppState.routeLines.forEach(line => AppState.map.removeLayer(line));
        AppState.routeLines = [];

        // 隐藏距离信息
        document.getElementById('distance-info').style.display = 'none';

        showToast('行程已清空', 'success');
    }
}

function exportTrip() {
    if (AppState.waypoints.length === 0) {
        showToast('没有行程可导出', 'warning');
        return;
    }

    const tripData = {
        name: '我的旅行计划',
        createdAt: new Date().toISOString(),
        waypoints: AppState.waypoints.map((w, index) => ({
            order: index + 1,
            name: w.name,
            coordinates: {
                latitude: w.coords[0],
                longitude: w.coords[1]
            }
        }))
    };

    // 转换为 JSON 字符串
    const jsonStr = JSON.stringify(tripData, null, 2);

    // 创建下载链接
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel_plan_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('行程已导出', 'success');
}

// ===============================================
// 在线状态管理
// ===============================================

function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    const btnOffline = document.getElementById('btn-offline');

    if (isOnline) {
        btnOffline.classList.remove('offline');
        btnOffline.innerHTML = '<i class="fas fa-wifi"></i>';
        showToast('网络已连接', 'success');
    } else {
        btnOffline.classList.add('offline');
        btnOffline.innerHTML = '<i class="fas fa-wifi-slash"></i>';
        showToast('网络已断开，使用离线模式', 'warning');
    }

    AppState.isOnline = isOnline;
}

// ===============================================
// 工具函数
// ===============================================

function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(AppState.searchTimeout);
            func(...args);
        };
        clearTimeout(AppState.searchTimeout);
        AppState.searchTimeout = setTimeout(later, wait);
    };
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="toast-icon fas ${icons[type]}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // 自动移除
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 移除标记函数（供 HTML onclick 使用）
function removeMarker(lat, lng) {
    const markerIndex = AppState.markers.findIndex(m => {
        const coords = m.getLatLng();
        return Math.abs(coords.lat - lat) < 0.0001 && Math.abs(coords.lng - lng) < 0.0001;
    });

    if (markerIndex !== -1) {
        AppState.map.removeLayer(AppState.markers[markerIndex]);
        AppState.markers.splice(markerIndex, 1);
        showToast('标记已移除', 'info');
    }

    AppState.map.closePopup();
}

// 暴露给全局的函数
window.addWaypointFromMarker = addWaypointFromMarker;
window.removeMarker = removeMarker;
window.selectSearchResult = selectSearchResult;