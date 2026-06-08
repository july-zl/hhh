// 设备数据仓库
const deviceStore = {
  devices: [
    { id: 1, name: '客厅主灯',   room: '客厅', type: 'light',   icon: '💡', on: true },
    { id: 2, name: '卧室吸顶灯', room: '卧室', type: 'light',   icon: '💡', on: false },
    { id: 3, name: '厨房灯带',   room: '厨房', type: 'light',   icon: '💡', on: true },
    { id: 4, name: '客厅风扇',   room: '客厅', type: 'fan',     icon: '🌀', on: false },
    { id: 5, name: '卧室空调',   room: '卧室', type: 'ac',      icon: '❄️', on: false },
    { id: 6, name: '大门智能锁', room: '大门', type: 'lock',    icon: '🔒', on: true },
    { id: 7, name: '客厅窗帘',   room: '客厅', type: 'curtain', icon: '🪟', on: true },
    { id: 8, name: '书房台灯',   room: '书房', type: 'light',   icon: '💡', on: false },
  ],

  scenes: [
    { id: 1, name: '回家模式', icon: '🏠', desc: '自动开启客厅灯、关闭窗帘、空调调至26°C', active: false },
    { id: 2, name: '离家模式', icon: '🚪', desc: '关闭所有灯光和电器，门锁自动上锁', active: false },
    { id: 3, name: '睡眠模式', icon: '🌙', desc: '关闭所有灯和窗帘，仅保留卧室小夜灯', active: false },
    { id: 4, name: '观影模式', icon: '🎬', desc: '关闭主灯、拉上窗帘、开启氛围灯带', active: false },
    { id: 5, name: '起床模式', icon: '🌅', desc: '缓缓打开窗帘，开启厨房灯光', active: false },
  ],

  sensorData: {
    temperature: '26.5°C',
    humidity: '58%',
    power: '3.2 kWh',
  },

  nextId: 9,

  addDevice(name, room, type) {
    const iconMap = { light: '💡', fan: '🌀', ac: '❄️', lock: '🔒', curtain: '🪟' };
    this.devices.push({
      id: this.nextId++,
      name, room, type,
      icon: iconMap[type] || '📦',
      on: false,
    });
    return this.devices[this.devices.length - 1];
  },

  deleteDevice(id) {
    this.devices = this.devices.filter(d => d.id !== id);
  },

  toggleDevice(id) {
    const d = this.devices.find(d => d.id === id);
    if (d) d.on = !d.on;
  },

  activateScene(id) {
    this.scenes.forEach(s => s.active = (s.id === id));
  },
};
