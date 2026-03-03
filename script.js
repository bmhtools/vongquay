// ==================== STATE ====================
let state = {
    wheels: [], // Danh sách vòng quay đã lưu
    currentWheel: null, // Vòng quay hiện tại
    history: [], // Lịch sử quay
    soundEnabled: true,
    darkMode: localStorage.getItem('darkMode') === 'true'
};

let canvas = document.getElementById('wheelCanvas');
let ctx = canvas.getContext('2d');
let isSpinning = false;
let currentRotation = 0;

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupEventListeners();
    applyTheme();
    createDefaultWheel();
});

function createDefaultWheel() {
    if (!state.currentWheel) {
        state.currentWheel = {
            id: Date.now(),
            name: 'Vòng Quay Mẫu',
            items: ['Lựa chọn 1', 'Lựa chọn 2', 'Lựa chọn 3', 'Lựa chọn 4', 'Lựa chọn 5'],
            colors: [],
            createdAt: new Date().toISOString()
        };
        generateColors();
        updateUI();
    }
}

// ==================== SỰ KIỆN ====================
function setupEventListeners() {
    // Nút chính
    document.getElementById('newWheelBtn').addEventListener('click', openNewWheelModal);
    document.getElementById('editWheelBtn').addEventListener('click', openEditWheelModal);
    document.getElementById('shareBtn').addEventListener('click', openShareModal);
    document.getElementById('spinBtn').addEventListener('click', spin);

    // Modal Edit
    document.getElementById('saveWheelBtn').addEventListener('click', saveWheel);
    document.getElementById('closeEditBtn').addEventListener('click', closeEditModal);
    document.getElementById('itemsInput').addEventListener('input', updateItemCount);

    // Modal Saved Wheels
    document.getElementById('closeSavedBtn').addEventListener('click', closeSavedWheelsModal);

    // Modal Share
    document.getElementById('shareJson').addEventListener('click', shareJson);
    document.getElementById('downloadJson').addEventListener('click', downloadJson);
    document.getElementById('exportCsv').addEventListener('click', exportCsv);
    document.getElementById('closeShareBtn').addEventListener('click', closeShareModal);

    // Copy Result
    document.getElementById('copyResultBtn').addEventListener('click', copyResult);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

    // Theme & Sound
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    document.getElementById('soundBtn').addEventListener('click', toggleSound);

    // Close modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('show');
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
    });

    // Resize
    window.addEventListener('resize', resizeCanvas);
}

// ==================== VẼ VÒNG QUAY ====================
function drawWheel() {
    if (!state.currentWheel || !state.currentWheel.items || state.currentWheel.items.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Không có dữ liệu', canvas.width / 2, canvas.height / 2);
        return;
    }

    const items = state.currentWheel.items;
    const colors = state.currentWheel.colors || [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const sliceAngle = (2 * Math.PI) / items.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    items.forEach((item, index) => {
        const startAngle = index * sliceAngle + currentRotation;
        const endAngle = startAngle + sliceAngle;

        // Vẽ nền
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length] || '#' + Math.floor(Math.random() * 16777215).toString(16);
        ctx.fill();

        // Vẽ viền
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Vẽ chữ
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(item, radius - 40, 5);
        ctx.restore();
    });

    // Vẽ đường tròn ngoài
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Vẽ tâm điểm
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#20C997';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawPointer();
}

function drawPointer() {
    const centerX = canvas.width / 2;
    const topY = 15;
    const size = 20;

    ctx.beginPath();
    ctx.moveTo(centerX, topY);
    ctx.lineTo(centerX - size, topY + size);
    ctx.lineTo(centerX + size, topY + size);
    ctx.closePath();
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function generateColors() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A8E6CF'
    ];
    const items = state.currentWheel.items.length;
    state.currentWheel.colors = [];
    for (let i = 0; i < items; i++) {
        state.currentWheel.colors.push(colors[i % colors.length]);
    }
}

// ==================== QUAY VÒNG ====================
function spin() {
    if (isSpinning || !state.currentWheel || state.currentWheel.items.length === 0) return;

    isSpinning = true;
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.classList.add('disabled');

    playSound();

    const totalRotation = (Math.random() * 10 + 5) * 2 * Math.PI;
    const targetRotation = currentRotation + totalRotation;
    const spinDuration = 2000;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        currentRotation = currentRotation + (totalRotation * (easeProgress - (isSpinning ? 0 : 1)));
        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            currentRotation = targetRotation;
            drawWheel();
            showResult();
            spinBtn.classList.remove('disabled');
        }
    }

    currentRotation = targetRotation - totalRotation;
    animate();
}

function showResult() {
    if (!state.currentWheel || !state.currentWheel.items) return;

    const items = state.currentWheel.items;
    const sliceAngle = (2 * Math.PI) / items.length;
    const normalizedRotation = ((-(currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
    const resultIndex = Math.floor(normalizedRotation / sliceAngle) % items.length;
    const selectedItem = items[resultIndex];

    const resultEl = document.getElementById('resultText');
    resultEl.classList.remove('result-animation');
    resultEl.innerHTML = `🎉 ${selectedItem}! 🎉`;
    // Trigger animation
    void resultEl.offsetWidth;
    resultEl.classList.add('result-animation');
    
    document.getElementById('copyResultBtn').style.display = 'block';

    state.history.unshift({
        item: selectedItem,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        date: new Date().toLocaleDateString('vi-VN')
    });

    if (state.history.length > 50) state.history.pop();

    playWinSound();
    saveState();
    updateUI();
}

// ==================== MODAL EDIT ====================
function openNewWheelModal() {
    document.getElementById('modalTitle').textContent = 'Tạo Vòng Quay Mới';
    document.getElementById('itemsInput').value = '';
    document.getElementById('itemCount').textContent = '0';
    document.getElementById('editModal').classList.add('show');
}

function openEditWheelModal() {
    document.getElementById('modalTitle').textContent = 'Chỉnh Sửa Vòng Quay';
    document.getElementById('itemsInput').value = state.currentWheel?.items.join('\n') || '';
    updateItemCount();
    document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

function updateItemCount() {
    const items = document.getElementById('itemsInput').value.trim().split('\n').filter(i => i.trim());
    document.getElementById('itemCount').textContent = items.length;
}

function saveWheel() {
    const itemsText = document.getElementById('itemsInput').value.trim();
    const items = itemsText.split('\n').map(i => i.trim()).filter(i => i);

    if (items.length < 2) {
        alert('Cần ít nhất 2 lựa chọn!');
        return;
    }

    const wheel = {
        id: state.currentWheel?.id || Date.now(),
        name: 'Vòng Quay VNLMS',
        items: items,
        createdAt: state.currentWheel?.createdAt || new Date().toISOString()
    };

    state.currentWheel = wheel;
    generateColors();

    // Lưu vào danh sách
    const existingIndex = state.wheels.findIndex(w => w.id === wheel.id);
    if (existingIndex >= 0) {
        state.wheels[existingIndex] = wheel;
    } else {
        state.wheels.push(wheel);
    }

    state.history = [];
    saveState();
    updateUI();
    setTimeout(() => closeEditModal(), 100);
}

// ==================== MODAL SAVED WHEELS ====================
function openSavedWheelsModal() {
    displaySavedWheels();
    document.getElementById('savedWheelsModal').classList.add('show');
}

function closeSavedWheelsModal() {
    document.getElementById('savedWheelsModal').classList.remove('show');
}

function displaySavedWheels() {
    const list = document.getElementById('savedWheelsList');
    list.innerHTML = '';

    if (state.wheels.length === 0) {
        list.innerHTML = '<p class="empty-message">Chưa có vòng quay nào được lưu</p>';
        return;
    }

    state.wheels.forEach(wheel => {
        const item = document.createElement('div');
        item.className = 'saved-wheel-item';
        item.innerHTML = `
            <div class="saved-wheel-info">
                <div class="saved-wheel-name">${wheel.name}</div>
                <div class="saved-wheel-count">${wheel.items.length} lựa chọn</div>
            </div>
            <div class="saved-wheel-actions">
                <button class="btn-secondary" onclick="loadWheel(${wheel.id})">Mở</button>
                <button class="btn-danger" onclick="deleteWheel(${wheel.id})">Xóa</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function loadWheel(wheelId) {
    const wheel = state.wheels.find(w => w.id === wheelId);
    if (wheel) {
        state.currentWheel = wheel;
        state.history = [];
        saveState();
        updateUI();
        closeSavedWheelsModal();
    }
}

function deleteWheel(wheelId) {
    if (confirm('Xóa vòng quay này?')) {
        state.wheels = state.wheels.filter(w => w.id !== wheelId);
        saveState();
        displaySavedWheels();
    }
}

// ==================== MODAL SHARE ====================
function openShareModal() {
    document.getElementById('shareMessage').textContent = '';
    document.getElementById('shareModal').classList.add('show');
}

function closeShareModal() {
    document.getElementById('shareModal').classList.remove('show');
}

function shareJson() {
    const json = JSON.stringify(state.currentWheel, null, 2);
    navigator.clipboard.writeText(json).then(() => {
        showMessage('JSON đã sao chép!');
    });
}

function downloadJson() {
    const json = JSON.stringify(state.currentWheel, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentWheel.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('Tải xuống thành công!');
}

function exportCsv() {
    let csv = 'Lựa chọn\n';
    state.currentWheel.items.forEach(item => {
        csv += `"${item}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentWheel.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('Xuất CSV thành công!');
}

function showMessage(msg) {
    const msgEl = document.getElementById('shareMessage');
    msgEl.textContent = msg;
    setTimeout(() => {
        msgEl.textContent = '';
    }, 2000);
}

// ==================== LỊCH SỬ VÀ THỐNG KÊ ====================
function copyResult() {
    const text = document.getElementById('resultText').textContent;
    navigator.clipboard.writeText(text.replace('🎉 ', '').replace('! 🎉', ''));
    alert('Đã sao chép!');
}

function clearHistory() {
    if (confirm('Xóa lịch sử quay?')) {
        state.history = [];
        saveState();
        updateUI();
    }
}

function updateUI() {
    updateWheelInfo();
    updateItems();
    updateHistory();
    updateStats();
}

function updateItems() {
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = '';

    if (!state.currentWheel || state.currentWheel.items.length === 0) {
        itemsList.innerHTML = '<p class="empty-message">Tạo vòng quay mới để xem danh sách</p>';
        return;
    }

    state.currentWheel.items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'items-list-item';
        div.innerHTML = `${index + 1}. ${item}`;
        itemsList.appendChild(div);
    });
}

function updateWheelInfo() {
    if (!state.currentWheel) return;
    document.getElementById('currentWheelName').textContent = state.currentWheel.name;
    document.getElementById('itemCountDisplay').textContent = `${state.currentWheel.items.length} lựa chọn`;
    drawWheel();
}

function updateHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    if (state.history.length === 0) {
        historyList.innerHTML = '<p class="empty-message">Chưa có kết quả</p>';
        return;
    }

    state.history.slice(0, 15).forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-item-text">✓ ${item.item}</div>
            <div class="history-item-time">${item.date} ${item.timestamp}</div>
        `;
        historyList.appendChild(div);
    });
}

function updateStats() {
    const statsList = document.getElementById('statsList');
    statsList.innerHTML = '';

    if (!state.currentWheel || state.history.length === 0) {
        statsList.innerHTML = '<p class="empty-message">Quay vòng để xem thống kê</p>';
        return;
    }

    const counts = {};
    state.history.forEach(h => {
        counts[h.item] = (counts[h.item] || 0) + 1;
    });

    Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([item, count]) => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `
                <div class="stat-item-name">${item}</div>
                <div class="stat-item-count">${count}</div>
            `;
            statsList.appendChild(div);
        });
}

// ==================== CHỦ ĐỀ ====================
function toggleTheme() {
    state.darkMode = !state.darkMode;
    applyTheme();
    saveState();
}

function applyTheme() {
    if (state.darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeBtn').textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('themeBtn').textContent = '🌙';
    }
}

// ==================== ÂM THANH ====================
function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    document.getElementById('soundBtn').textContent = state.soundEnabled ? '🔊' : '🔇';
    saveState();
}

function playSound() {
    if (!state.soundEnabled) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 400;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playWinSound() {
    if (!state.soundEnabled) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Tạo âm thanh thắng đôi
    const notes = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
    
    notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + (index * 0.15);
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
    });
}

// ==================== LƯU TRỮ ====================
function saveState() {
    localStorage.setItem('wheelGameState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('wheelGameState');
    if (saved) {
        state = JSON.parse(saved);
    }
}

// ==================== RESPONSIVE ====================
function resizeCanvas() {
    const container = document.querySelector('.wheel-container');
    const size = Math.min(container.offsetWidth, 400);
    canvas.width = size;
    canvas.height = size;
    drawWheel();
}
