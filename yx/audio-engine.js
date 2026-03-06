/**
 * 音频处理引擎
 * 负责音频的核心处理功能
 */

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.tracks = [];
        this.activeTrack = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.clipboard = null;
        this.selectionStart = 0;
        this.selectionEnd = 0;
        this.hasSelection = false;
    }

    /**
     * 初始化音频上下文
     */
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 44100
            });
        }
        return this.audioContext;
    }

    /**
     * 解码音频数据
     */
    async decodeAudioData(arrayBuffer) {
        const ctx = this.init();
        try {
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            console.error('音频解码失败:', error);
            throw new Error('无法解码音频文件');
        }
    }

    /**
     * 创建新轨道
     */
    createTrack(name, audioBuffer) {
        const track = {
            id: Date.now() + Math.random(),
            name: name,
            buffer: audioBuffer,
            regions: [{
                id: Date.now(),
                start: 0,        // 在轨道上的起始位置
                sourceStart: 0,  // 在源音频中的起始位置
                duration: audioBuffer.duration,
                gain: 1,
                muted: false
            }],
            solo: false,
            muted: false
        };
        this.tracks.push(track);
        this.activeTrack = track;
        this.updateDuration();
        return track;
    }

    /**
     * 更新总时长
     */
    updateDuration() {
        let maxDuration = 0;
        this.tracks.forEach(track => {
            track.regions.forEach(region => {
                const regionEnd = region.start + region.duration;
                if (regionEnd > maxDuration) {
                    maxDuration = regionEnd;
                }
            });
        });
        this.duration = maxDuration;
    }

    /**
     * 播放音频
     */
    async play(startTime = null, endTime = null) {
        if (this.isPlaying) {
            this.stop();
        }

        const ctx = this.init();
        this.isPlaying = true;
        const playStart = startTime !== null ? startTime : this.currentTime;
        const playEnd = endTime !== null ? endTime : this.duration;

        // 创建所有音源的节点
        const sourceNodes = [];
        const gainNodes = [];

        this.tracks.forEach(track => {
            if (track.muted) return;

            track.regions.forEach(region => {
                const regionStart = region.start;
                const regionEnd = region.start + region.duration;

                // 检查区域是否在播放范围内
                if (regionEnd <= playStart || regionStart >= playEnd) return;

                const source = ctx.createBufferSource();
                source.buffer = track.buffer;
                source.loop = false;

                const gainNode = ctx.createGain();
                gainNode.gain.setValueAtTime(region.gain, ctx.currentTime);

                // 计算实际的播放位置
                const offsetInRegion = Math.max(0, playStart - regionStart + region.sourceStart);
                const delay = Math.max(0, regionStart - playStart);

                source.connect(gainNode);
                gainNode.connect(ctx.destination);

                source.start(ctx.currentTime + delay, offsetInRegion);
                sourceNodes.push(source);
                gainNodes.push(gainNode);
            });
        });

        // 创建播放结束定时器
        const playDuration = playEnd - playStart;
        this.playTimeout = setTimeout(() => {
            this.stop();
        }, playDuration * 1000 + 100);

        this.playStartTime = ctx.currentTime - playStart;
        this.playStartPos = playStart;
        this.sourceNodes = sourceNodes;

        // 开始更新进度
        this.startTimeUpdate();
    }

    /**
     * 暂停播放
     */
    pause() {
        if (!this.isPlaying) return;
        this.stop(true);
    }

    /**
     * 停止播放
     */
    stop(pause = false) {
        if (!this.isPlaying) return;

        if (this.sourceNodes) {
            this.sourceNodes.forEach(source => {
                try {
                    source.stop();
                } catch (e) {}
            });
            this.sourceNodes = null;
        }

        if (this.playTimeout) {
            clearTimeout(this.playTimeout);
            this.playTimeout = null;
        }

        if (!pause) {
            this.currentTime = 0;
        } else {
            this.currentTime = this.audioContext.currentTime - this.playStartTime;
        }

        this.isPlaying = false;
        this.stopTimeUpdate();
    }

    /**
     * 跳转到指定位置
     */
    seek(time) {
        this.currentTime = Math.max(0, Math.min(time, this.duration));
        if (this.isPlaying) {
            this.play(this.currentTime);
        }
    }

    /**
     * 开始更新时间显示
     */
    startTimeUpdate() {
        const updateInterval = 50; // 更新频率（毫秒）
        this.timeUpdateInterval = setInterval(() => {
            if (this.isPlaying && this.audioContext) {
                const elapsed = this.audioContext.currentTime - this.playStartTime;
                const newPos = this.playStartPos + elapsed;
                this.currentTime = Math.min(newPos, this.duration);

                if (this.currentTime >= this.duration) {
                    this.stop();
                }
            }
        }, updateInterval);
    }

    /**
     * 停止时间更新
     */
    stopTimeUpdate() {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
    }

    /**
     * 设置选区
     */
    setSelection(start, end) {
        this.selectionStart = Math.min(start, end);
        this.selectionEnd = Math.max(start, end);
        this.hasSelection = true;
    }

    /**
     * 清除选区
     */
    clearSelection() {
        this.hasSelection = false;
        this.selectionStart = 0;
        this.selectionEnd = 0;
    }

    /**
     * 剪切选区
     */
    cut() {
        if (!this.hasSelection || !this.activeTrack) return null;
        const copied = this.copy();
        this.delete();
        return copied;
    }

    /**
     * 复制选区
     */
    copy() {
        if (!this.hasSelection || !this.activeTrack) return null;

        // 找到选区对应的音频数据
        const buffer = this.activeTrack.buffer;
        const sampleRate = buffer.sampleRate;
        const startSample = Math.floor(this.selectionStart * sampleRate);
        const endSample = Math.floor(this.selectionEnd * sampleRate);
        const length = endSample - startSample;

        // 创建新的 AudioBuffer
        const newBuffer = this.audioContext.createBuffer(
            buffer.numberOfChannels,
            length,
            sampleRate
        );

        // 复制每个声道的数据
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const sourceData = buffer.getChannelData(channel);
            const newData = newBuffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                newData[i] = sourceData[startSample + i];
            }
        }

        this.clipboard = {
            buffer: newBuffer,
            regions: this.activeTrack.regions
                .filter(r => r.start < this.selectionEnd && r.start + r.duration > this.selectionStart)
                .map(r => ({...r}))
        };

        return this.clipboard;
    }

    /**
     * 粘贴
     */
    paste() {
        if (!this.clipboard || !this.activeTrack) return false;

        // 在当前位置插入
        const insertPos = this.hasSelection ? this.selectionStart : this.currentTime;

        // 创建新区域
        const newRegion = {
            id: Date.now(),
            start: insertPos,
            sourceStart: 0,
            duration: this.clipboard.buffer.duration,
            gain: 1,
            muted: false
        };

        this.activeTrack.regions.push(newRegion);
        this.activeTrack.buffer = this.clipboard.buffer;

        // 更新其他区域的位置
        this.shiftRegions(this.activeTrack, insertPos, newRegion.duration);

        this.updateDuration();
        return true;
    }

    /**
     * 删除选区
     */
    delete() {
        if (!this.hasSelection || !this.activeTrack) return false;

        const { selectionStart, selectionEnd } = this;
        const deleteDuration = selectionEnd - selectionStart;

        // 删除选区内的区域
        this.activeTrack.regions = this.activeTrack.regions.filter(region => {
            // 完全在选区内的区域删除
            if (region.start >= selectionStart && region.start + region.duration <= selectionEnd) {
                return false;
            }
            // 与选区重叠的区域裁剪
            if (region.start < selectionEnd && region.start + region.duration > selectionStart) {
                if (region.start < selectionStart) {
                    region.duration = selectionStart - region.start;
                } else if (region.start + region.duration > selectionEnd) {
                    const offset = region.sourceStart;
                    region.start = selectionStart;
                    region.sourceStart = offset + (selectionEnd - region.start);
                    region.duration = region.start + region.duration - selectionEnd;
                }
            }
            return true;
        });

        // 移动后面的区域
        this.shiftRegions(this.activeTrack, selectionEnd, -deleteDuration);

        this.clearSelection();
        this.updateDuration();
        return true;
    }

    /**
     * 移动区域
     */
    shiftRegions(track, position, offset) {
        track.regions.forEach(region => {
            if (region.start >= position) {
                region.start += offset;
            }
        });
    }

    /**
     * 分割音频
     */
    split() {
        if (!this.hasSelection || !this.activeTrack) return false;

        const splitTime = (this.selectionStart + this.selectionEnd) / 2;

        this.activeTrack.regions.forEach(region => {
            if (region.start < splitTime && region.start + region.duration > splitTime) {
                const splitPoint = splitTime - region.start;
                const originalDuration = region.duration;

                // 修改原区域
                region.duration = splitPoint;

                // 创建新区域
                const newRegion = {
                    id: Date.now() + Math.random(),
                    start: splitTime,
                    sourceStart: region.sourceStart + splitPoint,
                    duration: originalDuration - splitPoint,
                    gain: region.gain,
                    muted: region.muted
                };

                this.activeTrack.regions.push(newRegion);
            }
        });

        this.clearSelection();
        return true;
    }

    /**
     * 应用淡入淡出
     */
    applyFade(fadeInDuration, fadeOutDuration) {
        if (!this.activeTrack || !this.hasSelection) return false;

        const { selectionStart, selectionEnd } = this;
        const buffer = this.activeTrack.buffer;
        const sampleRate = buffer.sampleRate;
        const startSample = Math.floor(selectionStart * sampleRate);
        const endSample = Math.floor(selectionEnd * sampleRate);

        const fadeInSamples = Math.floor(fadeInDuration * sampleRate);
        const fadeOutSamples = Math.floor(fadeOutDuration * sampleRate);

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);

            // 淡入
            for (let i = 0; i < fadeInSamples && i < (endSample - startSample); i++) {
                const sampleIndex = startSample + i;
                if (sampleIndex >= 0 && sampleIndex < data.length) {
                    const gain = i / fadeInSamples;
                    data[sampleIndex] *= gain;
                }
            }

            // 淡出
            for (let i = 0; i < fadeOutSamples && i < (endSample - startSample); i++) {
                const sampleIndex = endSample - fadeOutSamples + i;
                if (sampleIndex >= 0 && sampleIndex < data.length) {
                    const gain = 1 - (i / fadeOutSamples);
                    data[sampleIndex] *= gain;
                }
            }
        }

        return true;
    }

    /**
     * 调整增益
     */
    applyGain(gainValue) {
        if (!this.activeTrack || !this.hasSelection) return false;

        const buffer = this.activeTrack.buffer;
        const sampleRate = buffer.sampleRate;
        const startSample = Math.floor(this.selectionStart * sampleRate);
        const endSample = Math.floor(this.selectionEnd * sampleRate);

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = startSample; i < endSample && i < data.length; i++) {
                data[i] *= gainValue;
            }
        }

        return true;
    }

    /**
     * 标准化音频
     */
    normalize() {
        if (!this.activeTrack) return false;

        const buffer = this.activeTrack.buffer;
        let peakValue = 0;
        const selectionStart = this.hasSelection ? this.selectionStart : 0;
        const selectionEnd = this.hasSelection ? this.selectionEnd : buffer.duration;
        const startSample = Math.floor(selectionStart * buffer.sampleRate);
        const endSample = Math.floor(selectionEnd * buffer.sampleRate);

        // 找到峰值
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = startSample; i < endSample && i < data.length; i++) {
                const absValue = Math.abs(data[i]);
                if (absValue > peakValue) {
                    peakValue = absValue;
                }
            }
        }

        if (peakValue > 0) {
            const normalizationFactor = 1 / peakValue;
            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                const data = buffer.getChannelData(channel);
                for (let i = startSample; i < endSample && i < data.length; i++) {
                    data[i] *= normalizationFactor;
                }
            }
        }

        return true;
    }

    /**
     * 反转音频
     */
    reverse() {
        if (!this.activeTrack) return false;

        const buffer = this.activeTrack.buffer;
        const selectionStart = this.hasSelection ? this.selectionStart : 0;
        const selectionEnd = this.hasSelection ? this.selectionEnd : buffer.duration;
        const startSample = Math.floor(selectionStart * buffer.sampleRate);
        const endSample = Math.floor(selectionEnd * buffer.sampleRate);

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            const section = data.slice(startSample, endSample);
            section.reverse();
            for (let i = 0; i < section.length; i++) {
                data[startSample + i] = section[i];
            }
        }

        return true;
    }

    /**
     * 插入静音
     */
    insertSilence(duration) {
        if (!this.activeTrack) return false;

        const silenceSamples = Math.floor(duration * this.activeTrack.buffer.sampleRate);
        const newBuffer = this.audioContext.createBuffer(
            this.activeTrack.buffer.numberOfChannels,
            this.activeTrack.buffer.length + silenceSamples,
            this.activeTrack.buffer.sampleRate
        );

        for (let channel = 0; channel < this.activeTrack.buffer.numberOfChannels; channel++) {
            const oldData = this.activeTrack.buffer.getChannelData(channel);
            const newData = newBuffer.getChannelData(channel);
            const insertPos = Math.floor((this.hasSelection ? this.selectionStart : this.currentTime) * this.activeTrack.buffer.sampleRate);

            // 复制前半部分
            for (let i = 0; i < insertPos; i++) {
                newData[i] = oldData[i];
            }

            // 静音
            for (let i = 0; i < silenceSamples; i++) {
                newData[insertPos + i] = 0;
            }

            // 复制后半部分
            for (let i = insertPos; i < oldData.length; i++) {
                newData[i + silenceSamples] = oldData[i];
            }
        }

        this.activeTrack.buffer = newBuffer;
        this.shiftRegions(this.activeTrack, this.hasSelection ? this.selectionStart : this.currentTime, duration);
        this.updateDuration();

        return true;
    }

    /**
     * 导出音频
     */
    async exportAudio(format = 'wav') {
        const ctx = this.init();
        const offlineCtx = new OfflineAudioContext(
            2,
            this.duration * ctx.sampleRate,
            ctx.sampleRate
        );

        // 渲染所有轨道
        this.tracks.forEach(track => {
            if (track.muted) return;

            track.regions.forEach(region => {
                const source = offlineCtx.createBufferSource();
                source.buffer = track.buffer;

                const gainNode = offlineCtx.createGain();
                gainNode.gain.setValueAtTime(region.gain, 0);

                source.connect(gainNode);
                gainNode.connect(offlineCtx.destination);

                source.start(region.start, region.sourceStart, region.duration);
            });
        });

        const renderedBuffer = await offlineCtx.startRendering();
        return this.bufferToWav(renderedBuffer);
    }

    /**
     * 将 AudioBuffer 转换为 WAV 格式
     */
    bufferToWav(buffer) {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels = [];
        let offset = 0;
        let pos = 0;

        // 写入 WAV 头
        const writeString = (str) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(pos, str.charCodeAt(i));
                pos++;
            }
        };

        // RIFF 标识符
        writeString('RIFF');
        view.setUint32(pos, length - 8, true);
        pos += 4;
        writeString('WAVE');

        // fmt 子块
        writeString('fmt ');
        view.setUint32(pos, 16, true);
        pos += 4;
        view.setUint16(pos, 1, true);
        pos += 2;
        view.setUint16(pos, buffer.numberOfChannels, true);
        pos += 2;
        view.setUint32(pos, buffer.sampleRate, true);
        pos += 4;
        const byteRate = buffer.sampleRate * 2 * buffer.numberOfChannels;
        view.setUint32(pos, byteRate, true);
        pos += 4;
        const blockAlign = buffer.numberOfChannels * 2;
        view.setUint16(pos, blockAlign, true);
        pos += 2;
        view.setUint16(pos, 16, true);
        pos += 2;

        // data 子块
        writeString('data');
        view.setUint32(pos, length - pos - 4, true);
        pos += 4;

        // 写入音频数据
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                pos += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    /**
     * 格式化时间显示
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
}

// 初始化全局音频引擎实例
window.audioEngine = new AudioEngine();
