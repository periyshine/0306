// 获取DOM元素
const textInput = document.getElementById('textInput');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const totalCountEl = document.getElementById('totalCount');
const chineseCountEl = document.getElementById('chineseCount');
const englishCountEl = document.getElementById('englishCount');
const paragraphCountEl = document.getElementById('paragraphCount');
const lineCountEl = document.getElementById('lineCount');
const charWithSpaceCountEl = document.getElementById('charWithSpaceCount');
const charWithoutSpaceCountEl = document.getElementById('charWithoutSpaceCount');

// 统计文本的函数
function countText() {
    const text = textInput.value;

    // 1. 总字数（中文字符 + 英文单词）
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const chineseCount = chineseChars.length;

    // 匹配英文单词（连续的字母）
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    const englishCount = englishWords.length;

    const totalCount = chineseCount + englishCount;

    // 2. 段落数（按空行分割）
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    // 3. 行数
    const lines = text.split('\n');
    const lineCount = text.trim() === '' ? 0 : lines.length;

    // 4. 字符数（含空格）
    const charWithSpaceCount = text.length;

    // 5. 字符数（不含空格）
    const charWithoutSpaceCount = text.replace(/\s/g, '').length;

    // 更新显示
    updateDisplay({
        totalCount,
        chineseCount,
        englishCount,
        paragraphCount,
        lineCount,
        charWithSpaceCount,
        charWithoutSpaceCount
    });
}

// 更新显示的函数
function updateDisplay(stats) {
    // 高亮效果
    highlightChange(totalCountEl, stats.totalCount);
    highlightChange(chineseCountEl, stats.chineseCount);
    highlightChange(englishCountEl, stats.englishCount);
    highlightChange(paragraphCountEl, stats.paragraphCount);
    highlightChange(lineCountEl, stats.lineCount);
    highlightChange(charWithSpaceCountEl, stats.charWithSpaceCount);
    highlightChange(charWithoutSpaceCountEl, stats.charWithoutSpaceCount);
}

// 高亮变化的数字
function highlightChange(element, newValue) {
    // 如果值发生变化，添加高亮效果
    if (element.textContent !== String(newValue)) {
        element.textContent = newValue;
        element.classList.add('highlight');
        setTimeout(() => {
            element.classList.remove('highlight');
        }, 300);
    } else {
        element.textContent = newValue;
    }
}

// 清空按钮
clearBtn.addEventListener('click', () => {
    textInput.value = '';
    countText();
    textInput.focus();
});

// 复制按钮
copyBtn.addEventListener('click', async () => {
    if (textInput.value.trim() === '') {
        showMessage('没有内容可以复制', 'warning');
        return;
    }

    try {
        await navigator.clipboard.writeText(textInput.value);
        showMessage('已复制到剪贴板！', 'success');
    } catch (err) {
        showMessage('复制失败，请手动复制', 'error');
    }
});

// 显示提示信息
function showMessage(message, type) {
    // 移除已存在的消息
    const existingMessage = document.querySelector('.toast-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // 创建新消息
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;

    // 添加样式
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease',
        backgroundColor: type === 'success' ? '#4caf50' :
                        type === 'warning' ? '#ff9800' : '#f44336'
    });

    // 添加动画样式
    if (!document.querySelector('#toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // 3秒后自动消失
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 监听输入变化
textInput.addEventListener('input', countText);

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', () => {
    countText();
    textInput.focus();
});

// 支持拖拽文件上传
textInput.addEventListener('dragover', (e) => {
    e.preventDefault();
    textInput.style.borderColor = '#667eea';
    textInput.style.backgroundColor = '#f5f7fa';
});

textInput.addEventListener('dragleave', (e) => {
    e.preventDefault();
    textInput.style.borderColor = '#e0e0e0';
    textInput.style.backgroundColor = 'white';
});

textInput.addEventListener('drop', async (e) => {
    e.preventDefault();
    textInput.style.borderColor = '#e0e0e0';
    textInput.style.backgroundColor = 'white';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('text/')) {
            const text = await file.text();
            textInput.value = text;
            countText();
            showMessage(`已读取文件：${file.name}`, 'success');
        } else {
            showMessage('请拖拽文本文件', 'warning');
        }
    }
});
