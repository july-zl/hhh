// ===== 页面导航 =====
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');

    const page = item.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
  });
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
  document.getElementById('humidity').textContent = deviceStore.sensorData.humidity;
  document.getElementById('power').textContent = deviceStore.sensorData.power;
}
renderSensors();

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
  grid.innerHTML = deviceStore.devices.map(d => `
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
  renderDeviceCards();
  renderDeviceTable();
}

// ===== 设备表格渲染 =====
function renderDeviceTable() {
  const tbody = document.getElementById('deviceTableBody');
  tbody.innerHTML = deviceStore.devices.map(d => `
    <tr>
      <td><span style="margin-right:8px">${d.icon}</span>${d.name}</td>
      <td>${d.room}</td>
      <td><span class="status-badge ${d.on ? 'on' : 'off'}">${d.on ? '运行中' : '已关闭'}</span></td>
      <td>
        <button class="btn-action" onclick="handleToggle(${d.id});renderDeviceCards()">${d.on ? '关闭' : '开启'}</button>
        <button class="btn-action danger" onclick="handleDelete(${d.id})">删除</button>
      </td>
    </tr>
  `).join('');
}

function handleDelete(id) {
  deviceStore.deleteDevice(id);
  renderDeviceCards();
  renderDeviceTable();
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
  renderDeviceCards();
  renderDeviceTable();
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
  }
}
renderScenes();

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
