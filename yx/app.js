/**
 * 应用主逻辑
 * 处理 UI 交互和用户操作
 */

class AudioEditor {
    constructor() {
        this.engine = window.audioEngine;
        this.waveformCanvases = new Map();
        this.isSelecting = false;
        this.selectionStart = 0;
        this.dragStartX = 0;
        this.pixelsPerSecond = 100;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeUI();
    }

    initializeUI() {
        // 上传区域
        const uploadArea = document.getElementById('uploadArea');
        const audioInput = document.getElementById('audioInput');

        uploadArea.addEventListener('click', () => audioInput.click());
        audioInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // 播放控制
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());

        // 编辑工具
        document.getElementById('cutBtn').addEventListener('click', () => this.cut());
        document.getElementById('copyBtn').addEventListener('click', () => this.copy());
        document.getElementById('pasteBtn').addEventListener('click', () => this.paste());
        document.getElementById('deleteBtn').addEventListener('click', () => this.delete());
        document.getElementById('splitBtn').addEventListener('click', () => this.split());

        // 滑块控制
        this.initSliders();

        // 音效按钮
        document.getElementById('applyFadeBtn').addEventListener('click', () => this.applyFade());
        document.getElementById('normalizeBtn').addEventListener('click', () => this.normalize());
        document.getElementById('reverseBtn').addEventListener('click', () => this.reverse());
        document.getElementById('silenceBtn').addEventListener('click', () => this.insertSilence());

        // 导出
        document.getElementById('exportBtn').addEventListener('click', () => this.export());

        // 开始时间更新
        this.startTimeUpdateLoop();
    }

    initSliders() {
        const sliders = [
            { id: 'gainSlider', display: 'gainValue', suffix: '%' },
            { id: 'fadeInSlider', display: 'fadeInValue', suffix: '秒' },
            { id: 'fadeOutSlider', display: 'fadeOutValue', suffix: '秒' }
        ];

        sliders.forEach(({ id, display, suffix }) => {
            const slider = document.getElementById(id);
            const displayEl = document.getElementById(display);

            slider.addEventListener('input', () => {
                displayEl.textContent = slider.value + suffix;
            });
        });
    }

    bindEvents() {
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.isPlaying() ? this.pause() : this.play();
                    break;
                case 'KeyX':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.cut();
                    }
                    break;
                case 'KeyC':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.copy();
                    }
                    break;
                case 'KeyV':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.paste();
                    }
                    break;
                case 'Delete':
                case 'Backspace':
                    this.delete();
                    break;
                case 'Escape':
                    this.clearSelection();
                    break;
            }
        });
    }

    async handleFileSelect(files) {
        const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));

        if (audioFiles.length === 0) {
            this.setStatus('请选择有效的音频文件', 'error');
            return;
        }

        this.setStatus('正在加载音频文件...');

        for (const file of audioFiles) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const audioBuffer = await this.engine.decodeAudioData(arrayBuffer);
                const track = this.engine.createTrack(file.name, audioBuffer);
                this.addTrackToUI(track);
                this.setStatus(`已加载: ${file.name}`);
            } catch (error) {
                this.setStatus(`加载失败: ${file.name}`, 'error');
                console.error(error);
            }
        }

        this.updateFileList();
    }

    addTrackToUI(track) {
        const trackContainer = document.getElementById('trackContainer');

        const trackEl = document.createElement('div');
        trackEl.className = 'track';
        trackEl.dataset.trackId = track.id;
        trackEl.innerHTML = `
            <div class="track-header">
                <span class="track-name">${track.name}</span>
                <div class="track-controls">
                    <label>音量:
                        <input type="range" class="track-volume" min="0" max="200" value="100">
                    </label>
                    <label>静音: <input type="checkbox" class="track-mute"></label>
                    <label>独奏: <input type="checkbox" class="track-solo"></label>
                </div>
            </div>
            <canvas class="waveform-canvas" width="2000" height="120"></canvas>
            <div class="selection-region" style="display: none;"></div>
            <div class="playhead" style="display: none;"></div>
        `;

        trackContainer.appendChild(trackEl);

        // 获取画布并绘制波形
        const canvas = trackEl.querySelector('.waveform-canvas');
        this.waveformCanvases.set(track.id, canvas);
        this.drawWaveform(track, canvas);

        // 绑定画布事件
        this.bindCanvasEvents(canvas, track);

        // 绑定轨道控制事件
        const volumeSlider = trackEl.querySelector('.track-volume');
        const muteCheckbox = trackEl.querySelector('.track-mute');
        const soloCheckbox = trackEl.querySelector('.track-solo');

        volumeSlider.addEventListener('input', (e) => {
            const region = track.regions[0];
            if (region) {
                region.gain = e.target.value / 100;
            }
        });

        muteCheckbox.addEventListener('change', (e) => {
            track.muted = e.target.checked;
        });

        soloCheckbox.addEventListener('change', (e) => {
            track.solo = e.target.checked;
            // 如果独奏一个轨道，静音其他轨道
            this.engine.tracks.forEach(t => {
                if (t !== track) {
                    t.muted = track.solo;
                }
            });
        });

        // 点击轨道设为活动轨道
        trackEl.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'CANVAS') return;
            this.engine.activeTrack = track;
            this.updateActiveTrackUI();
        });

        this.updateActiveTrackUI();
    }

    bindCanvasEvents(canvas, track) {
        canvas.addEventListener('mousedown', (e) => {
            this.isSelecting = true;
            const rect = canvas.getBoundingClientRect();
            this.dragStartX = e.clientX - rect.left;
            const time = this.pixelToTime(this.dragStartX, canvas);
            this.selectionStart = time;
            this.engine.seek(time);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!this.isSelecting) return;

            const rect = canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentTime = this.pixelToTime(currentX, canvas);

            // 更新选区
            const start = Math.min(this.selectionStart, currentTime);
            const end = Math.max(this.selectionStart, currentTime);
            this.engine.setSelection(start, end);

            // 更新视觉选区
            this.updateSelectionOverlay(canvas, start, end, this.selectionStart, currentTime);
            this.updateSelectionInfo();
        });

        canvas.addEventListener('mouseup', (e) => {
            if (this.isSelecting) {
                this.isSelecting = false;
                const rect = canvas.getBoundingClientRect();
                const endX = e.clientX - rect.left;
                const endTime = this.pixelToTime(endX, canvas);
                this.engine.setSelection(
                    Math.min(this.selectionStart, endTime),
                    Math.max(this.selectionStart, endTime)
                );
                this.updateSelectionInfo();
            }
        });

        canvas.addEventListener('mouseleave', () => {
            if (this.isSelecting) {
                this.isSelecting = false;
            }
        });
    }

    updateSelectionOverlay(canvas, selectionStart, selectionEnd, dragStart, dragEnd) {
        const selectionEl = canvas.parentElement.querySelector('.selection-region');
        const startX = Math.min(dragStart, dragEnd);
        const width = Math.abs(dragEnd - dragStart);

        selectionEl.style.display = 'block';
        selectionEl.style.left = `${startX}px`;
        selectionEl.style.width = `${width}px`;
        selectionEl.style.top = `${canvas.offsetTop}px`;
        selectionEl.style.height = `${canvas.height}px`;
    }

    updateSelectionInfo() {
        const infoEl = document.getElementById('selectionInfo');
        if (this.engine.hasSelection) {
            const start = this.engine.formatTime(this.engine.selectionStart);
            const end = this.engine.formatTime(this.engine.selectionEnd);
            const duration = this.engine.formatTime(this.engine.selectionEnd - this.engine.selectionStart);
            infoEl.textContent = `${start} - ${end} (${duration})`;
        } else {
            infoEl.textContent = '未选择';
        }
    }

    clearSelection() {
        this.engine.clearSelection();
        this.updateSelectionInfo();
        document.querySelectorAll('.selection-region').forEach(el => {
            el.style.display = 'none';
        });
    }

    pixelToTime(pixel, canvas) {
        const duration = this.engine.duration || 10;
        const timeRatio = pixel / canvas.width;
        return timeRatio * duration;
    }

    timeToPixel(time, canvas) {
        const duration = this.engine.duration || 10;
        return (time / duration) * canvas.width;
    }

    drawWaveform(track, canvas) {
        const ctx = canvas.getContext('2d');
        const buffer = track.buffer;
        const width = canvas.width;
        const height = canvas.height;
        const duration = buffer.duration;

        // 设置画布实际宽度以适应音频长度
        const minCanvasWidth = 2000;
        const requiredWidth = Math.max(minCanvasWidth, duration * this.pixelsPerSecond);
        canvas.width = requiredWidth;

        ctx.clearRect(0, 0, width, height);

        // 绘制背景
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // 绘制网格
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 100) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }

        // 绘制中轴线
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // 绘制波形
        const data = buffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;

            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }

            const y1 = (1 + min) * amp;
            const y2 = (1 + max) * amp;

            ctx.fillRect(i, y1, 1, y2 - y1 || 1);
        }
    }

    updateActiveTrackUI() {
        document.querySelectorAll('.track').forEach(trackEl => {
            if (this.engine.activeTrack &&
                trackEl.dataset.trackId == this.engine.activeTrack.id) {
                trackEl.classList.add('active');
            } else {
                trackEl.classList.remove('active');
            }
        });
    }

    updateFileList() {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        this.engine.tracks.forEach(track => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            if (this.engine.activeTrack && track.id === this.engine.activeTrack.id) {
                fileItem.classList.add('active');
            }

            fileItem.innerHTML = `
                <span>🎵 ${track.name}</span>
                <span class="file-remove" data-track-id="${track.id}">✕</span>
            `;

            fileItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('file-remove')) {
                    this.engine.activeTrack = track;
                    this.updateActiveTrackUI();
                    this.updateFileList();
                }
            });

            fileList.appendChild(fileItem);
        });

        // 绑定删除按钮
        document.querySelectorAll('.file-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const trackId = parseFloat(e.target.dataset.trackId);
                this.removeTrack(trackId);
            });
        });
    }

    removeTrack(trackId) {
        this.engine.tracks = this.engine.tracks.filter(t => t.id !== trackId);
        const trackEl = document.querySelector(`[data-track-id="${trackId}"]`);
        if (trackEl) {
            trackEl.remove();
        }
        if (this.engine.activeTrack && this.engine.activeTrack.id === trackId) {
            this.engine.activeTrack = this.engine.tracks[0] || null;
        }
        this.engine.updateDuration();
        this.updateActiveTrackUI();
        this.updateFileList();
    }

    play() {
        if (this.engine.hasSelection) {
            this.engine.play(this.engine.selectionStart, this.engine.selectionEnd);
        } else {
            this.engine.play();
        }
    }

    pause() {
        this.engine.pause();
    }

    stop() {
        this.engine.stop();
    }

    isPlaying() {
        return this.engine.isPlaying;
    }

    cut() {
        if (this.engine.cut()) {
            this.setStatus('已剪切选区');
            // 重新绘制波形
            this.redrawActiveTrack();
        }
    }

    copy() {
        if (this.engine.copy()) {
            this.setStatus('已复制选区');
        }
    }

    paste() {
        if (this.engine.paste()) {
            this.setStatus('已粘贴');
            this.redrawActiveTrack();
        }
    }

    delete() {
        if (this.engine.delete()) {
            this.setStatus('已删除选区');
            this.redrawActiveTrack();
            this.clearSelection();
        }
    }

    split() {
        if (this.engine.split()) {
            this.setStatus('已分割音频');
            this.redrawActiveTrack();
        }
    }

    applyFade() {
        const fadeIn = parseFloat(document.getElementById('fadeInSlider').value);
        const fadeOut = parseFloat(document.getElementById('fadeOutSlider').value);

        if (this.engine.applyFade(fadeIn, fadeOut)) {
            this.setStatus('已应用淡入淡出效果');
            this.redrawActiveTrack();
        }
    }

    normalize() {
        if (this.engine.normalize()) {
            this.setStatus('已标准化音频');
            this.redrawActiveTrack();
        }
    }

    reverse() {
        if (this.engine.reverse()) {
            this.setStatus('已反转音频');
            this.redrawActiveTrack();
        }
    }

    insertSilence() {
        const duration = 1; // 1秒静音
        if (this.engine.insertSilence(duration)) {
            this.setStatus(`已插入 ${duration} 秒静音`);
            this.redrawActiveTrack();
        }
    }

    async export() {
        const format = document.getElementById('exportFormat').value;
        this.setStatus('正在导出音频...');

        try {
            const blob = await this.engine.exportAudio(format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audio_export_${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.setStatus('导出成功');
        } catch (error) {
            this.setStatus('导出失败', 'error');
            console.error(error);
        }
    }

    redrawActiveTrack() {
        if (this.engine.activeTrack) {
            const canvas = this.waveformCanvases.get(this.engine.activeTrack.id);
            if (canvas) {
                this.drawWaveform(this.engine.activeTrack, canvas);
            }
        }
    }

    startTimeUpdateLoop() {
        setInterval(() => {
            // 更新时间显示
            document.getElementById('currentTime').textContent =
                this.engine.formatTime(this.engine.currentTime);
            document.getElementById('totalTime').textContent =
                this.engine.formatTime(this.engine.duration || 0);

            // 更新播放头位置
            this.updatePlayhead();

            // 更新时间线标记
            const timeMarker = document.getElementById('timeMarker');
            timeMarker.textContent = this.engine.formatTime(this.engine.currentTime);
            if (timeMarker) {
                const duration = this.engine.duration || 10;
                const position = (this.engine.currentTime / duration) * 100;
                timeMarker.style.left = `${Math.min(position, 100)}%`;
            }
        }, 50);
    }

    updatePlayhead() {
        document.querySelectorAll('.playhead').forEach(playhead => {
            const canvas = playhead.parentElement.querySelector('.waveform-canvas');
            if (canvas && this.engine.duration > 0) {
                const position = (this.engine.currentTime / this.engine.duration) * canvas.width;
                playhead.style.display = 'block';
                playhead.style.left = `${position}px`;
            }
        });
    }

    setStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusText');
        statusEl.textContent = message;
        statusEl.className = '';

        if (type === 'error') {
            statusEl.style.color = 'var(--danger-color)';
        } else {
            statusEl.style.color = 'var(--success-color)';
        }

        // 3秒后恢复
        setTimeout(() => {
            statusEl.textContent = '就绪';
            statusEl.style.color = '';
        }, 3000);
    }
}

// 初始化应用
let editor;
document.addEventListener('DOMContentLoaded', () => {
    editor = new AudioEditor();
});
