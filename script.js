// ===== 页面导航 =====
function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.page));
});

// ===== 时钟更新 =====
function updateTime() {
  const now = new Date();
  document.getElementById('headerTime').textContent =
    now.toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric' }) +
    ' ' + now.toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' });
}
updateTime();
setInterval(updateTime, 1000);

// ===== 传感器数据渲染 =====
function renderSensors() {
  document.getElementById('temperature').textContent = deviceStore.sensorData.temperature;

  // 温度舒适度指示
  const tempVal = parseFloat(deviceStore.sensorData.temperature);
  const tempCard = document.getElementById('temperature').closest('.sensor-card');
  const indicator = tempCard.querySelector('.comfort-indicator');
  if (indicator) {
    if (tempVal >= 22 && tempVal <= 28) {
      indicator.className = 'comfort-indicator good';
      indicator.textContent = '✓ 舒适';
    } else if (tempVal > 28) {
      indicator.className = 'comfort-indicator hot';
      indicator.textContent = '⚠ 偏热';
    } else {
      indicator.className = 'comfort-indicator cold';
      indicator.textContent = '⚠ 偏冷';
    }
  }

  document.getElementById('humidity').textContent = deviceStore.sensorData.humidity;
  document.getElementById('power').textContent = deviceStore.sensorData.power;
}
renderSensors();

// ===== 仪表盘统计卡片 =====
function renderStats() {
  const stats = deviceStore.getStats();
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card">
      <span class="stat-value">${stats.total}</span>
      <span class="stat-label">设备总数</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">${stats.active}</span>
      <span class="stat-label">运行中</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">${stats.rooms}</span>
      <span class="stat-label">房间数</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">${stats.activeScene ? stats.activeScene.icon + ' ' + stats.activeScene.name : '—'}</span>
      <span class="stat-label">当前情景</span>
    </div>
  `;
}

// ===== 房间筛选标签 =====
let activeRoomFilter = 'all';

function renderRoomFilters() {
  const rooms = deviceStore.getRooms();
  const row = document.getElementById('roomFilterRow');
  const allActive = activeRoomFilter === 'all' ? 'active' : '';
  row.innerHTML = `
    <button class="room-filter-btn ${allActive}" data-room="all">全部</button>
    ${rooms.map(r => {
      const cls = activeRoomFilter === r ? 'active' : '';
      const count = deviceStore.devices.filter(d => d.room === r).length;
      return `<button class="room-filter-btn ${cls}" data-room="${r}">${r} (${count})</button>`;
    }).join('')}
  `;

  row.querySelectorAll('.room-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeRoomFilter = btn.dataset.room;
      renderRoomFilters();
      renderDeviceCards();
    });
  });
}

// 模拟传感器数据波动 (后续可接入ESP32 MQTT)
setInterval(() => {
  const temp = (26 + Math.random() * 3).toFixed(1);
  const hum  = Math.floor(55 + Math.random() * 10);
  const pwr  = (3.2 + Math.random() * 0.5).toFixed(1);
  deviceStore.sensorData.temperature = temp + '°C';
  deviceStore.sensorData.humidity = hum + '%';
  deviceStore.sensorData.power = pwr + ' kWh';
  renderSensors();
}, 5000);

// ===== 设备卡片渲染 (仪表盘) =====
function renderDeviceCards() {
  const grid = document.getElementById('deviceGrid');
  let devices = deviceStore.devices;
  if (activeRoomFilter !== 'all') {
    devices = devices.filter(d => d.room === activeRoomFilter);
  }
  grid.innerHTML = devices.map(d => `
    <div class="device-card">
      <div class="device-card-top">
        <span class="device-icon">${d.icon}</span>
        <div class="device-info">
          <span class="device-name">${d.name}</span>
          <span class="device-room">${d.room}</span>
        </div>
      </div>
      <div class="toggle-wrap">
        <span class="toggle-label">${d.on ? '已开启' : '已关闭'}</span>
        <label class="toggle">
          <input type="checkbox" ${d.on ? 'checked' : ''} onchange="handleToggle(${d.id})">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  `).join('');
}

function handleToggle(id) {
  deviceStore.toggleDevice(id);
  const d = deviceStore.devices.find(dd => dd.id === id);
  if (d) deviceStore.addLog(d.on ? '开启' : '关闭', `${d.icon} ${d.name}`);
  renderDeviceCards();
  renderDeviceTable();
  renderStats();
  renderActivityLog();
}

// ===== 设备表格渲染 =====
let deviceSearchTerm = '';
let deviceTableRoomFilter = 'all';

function getFilteredDevices() {
  let list = deviceStore.devices;
  if (deviceSearchTerm) {
    const q = deviceSearchTerm.toLowerCase();
    list = list.filter(d => d.name.toLowerCase().includes(q));
  }
  if (deviceTableRoomFilter !== 'all') {
    list = list.filter(d => d.room === deviceTableRoomFilter);
  }
  return list;
}

function renderDeviceTable() {
  const tbody = document.getElementById('deviceTableBody');
  const list = getFilteredDevices();
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-cell">暂无匹配设备</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(d => `
    <tr>
      <td><span style="margin-right:8px">${d.icon}</span>${d.name}</td>
      <td>${d.room}</td>
      <td><span class="status-badge ${d.on ? 'on' : 'off'}">${d.on ? '运行中' : '已关闭'}</span></td>
      <td>
        <button class="btn-action" onclick="handleToggle(${d.id})">${d.on ? '关闭' : '开启'}</button>
        <button class="btn-action danger" onclick="handleDelete(${d.id})">删除</button>
      </td>
    </tr>
  `).join('');
}

function renderDeviceRoomFilterOptions() {
  const sel = document.getElementById('deviceRoomFilter');
  const rooms = deviceStore.getRooms();
  sel.innerHTML = '<option value="all">全部房间</option>' +
    rooms.map(r => `<option value="${r}">${r}</option>`).join('');
  if (!rooms.includes(deviceTableRoomFilter)) {
    deviceTableRoomFilter = 'all';
  }
  sel.value = deviceTableRoomFilter;
}

document.getElementById('deviceSearch').addEventListener('input', function() {
  deviceSearchTerm = this.value.trim();
  renderDeviceTable();
});

document.getElementById('deviceRoomFilter').addEventListener('change', function() {
  deviceTableRoomFilter = this.value;
  renderDeviceTable();
});

// ===== 批量控制 =====
document.getElementById('btnBulkOn').addEventListener('click', () => {
  deviceStore.setAllDevices(true);
  deviceStore.addLog('批量操作', '全部设备已开启');
  renderDeviceCards();
  renderDeviceTable();
  renderStats();
  renderActivityLog();
});

document.getElementById('btnBulkOff').addEventListener('click', () => {
  deviceStore.setAllDevices(false);
  deviceStore.addLog('批量操作', '全部设备已关闭');
  renderDeviceCards();
  renderDeviceTable();
  renderStats();
  renderActivityLog();
});

function handleDelete(id) {
  const d = deviceStore.devices.find(dd => dd.id === id);
  if (d) deviceStore.addLog('删除', `${d.icon} ${d.name}`);
  deviceStore.deleteDevice(id);
  renderDeviceCards();
  renderDeviceTable();
  renderRoomFilters();
  renderRoomFilterOptions();
  renderStats();
  renderActivityLog();
}
renderDeviceCards();
renderDeviceTable();

// ===== 添加设备 =====
document.getElementById('btnAddDevice').addEventListener('click', () => {
  document.getElementById('modalAddDevice').classList.add('show');
});

document.getElementById('btnCancelAdd').addEventListener('click', () => {
  document.getElementById('modalAddDevice').classList.remove('show');
});

document.getElementById('btnConfirmAdd').addEventListener('click', () => {
  const name = document.getElementById('newDeviceName').value.trim();
  const room = document.getElementById('newDeviceRoom').value;
  const type = document.getElementById('newDeviceType').value;

  if (!name) { alert('请输入设备名称'); return; }

  deviceStore.addDevice(name, room, type);
  deviceStore.addLog('添加设备', `${name} (${room})`);
  renderDeviceCards();
  renderDeviceTable();
  renderRoomFilters();
  renderRoomFilterOptions();
  renderStats();
  renderActivityLog();
  document.getElementById('modalAddDevice').classList.remove('show');
  document.getElementById('newDeviceName').value = '';
});

document.getElementById('modalAddDevice').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('show');
});

// ===== 情景模式渲染 =====
function renderScenes() {
  document.getElementById('sceneGrid').innerHTML = deviceStore.scenes.map(s => `
    <div class="scene-card ${s.active ? 'active-scene' : ''}" onclick="activateScene(${s.id})">
      <span class="scene-icon">${s.icon}</span>
      <span class="scene-name">${s.name}</span>
      <span class="scene-desc">${s.desc}</span>
      <span class="scene-active-tag">✓ 当前激活</span>
    </div>
  `).join('');
}

function activateScene(id) {
  deviceStore.activateScene(id);
  renderScenes();

  const scene = deviceStore.scenes.find(s => s.id === id);
  if (scene) deviceStore.addLog('激活情景', `${scene.icon} ${scene.name}`);

  // 根据情景自动调整设备状态
  const actions = {
    1: { on: [1,7], off: [] },        // 回家: 开客厅灯+窗帘
    2: { on: [], off: [1,2,3,4,5,7,8] }, // 离家: 全关
    3: { on: [], off: [1,2,3,4,5,7,8] }, // 睡眠: 全关(保留夜灯)
    4: { on: [3], off: [1,2,7,8] },   // 观影: 开氛围灯带
    5: { on: [2,7], off: [4] },       // 起床: 开卧室灯+窗帘
  };

  const act = actions[id];
  if (act) {
    act.on.forEach(i => { const d = deviceStore.devices.find(dd => dd.id === i); if (d) d.on = true; });
    act.off.forEach(i => { const d = deviceStore.devices.find(dd => dd.id === i); if (d) d.on = false; });
    renderDeviceCards();
    renderDeviceTable();
    renderStats();
  }
  renderActivityLog();
}
renderScenes();

// ===== 操作日志渲染 =====
function renderActivityLog() {
  const list = document.getElementById('activityList');
  if (deviceStore.activityLog.length === 0) {
    list.innerHTML = '<div class="activity-empty">暂无操作记录</div>';
    return;
  }
  list.innerHTML = deviceStore.activityLog.slice(0, 8).map(entry => `
    <div class="activity-entry">
      <span class="activity-time">${entry.time}</span>
      <span class="activity-action">${entry.action}</span>
      <span class="activity-detail">${entry.detail}</span>
    </div>
  `).join('');
}
renderActivityLog();

// ===== 初始渲染 =====
renderStats();
renderRoomFilters();
renderRoomFilterOptions();

// ===== 设置保存 =====
document.getElementById('btnSaveSettings').addEventListener('click', () => {
  const host = document.getElementById('mqttHost').value;
  const port = document.getElementById('mqttPort').value;
  const interval = document.getElementById('refreshInterval').value;
  console.log('设置已保存:', { host, port, interval });
  alert('✅ 设置已保存！（后续将对接 ESP32 MQTT）');
});

// ===== 模拟ESP32连接状态 =====
setInterval(() => {
  const statusEl = document.getElementById('connectionStatus');
  if (Math.random() > 0.1) {
    statusEl.classList.add('online');
    statusEl.innerHTML = '<span class="dot"></span> ESP32 已连接';
  } else {
    statusEl.classList.remove('online');
    statusEl.innerHTML = '<span class="dot"></span> ESP32 连接中断';
  }
}, 10000);
