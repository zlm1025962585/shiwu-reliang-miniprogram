const store = require("../../utils/store.js");

Page({
  data: { groups: [], week: [], today: { kcal: 0, protein: 0, fat: 0, carbs: 0 } },

  onShow() { this.refresh(); },

  refresh() {
    const records = store.getRecords();
    const byDate = {};
    records.forEach(r => {
      if (!byDate[r.dateStr]) byDate[r.dateStr] = { dateStr: r.dateStr, total: 0, records: [] };
      byDate[r.dateStr].total += r.totalKcal || 0;
      byDate[r.dateStr].records.push({
        ...r,
        names: (r.items || []).map(i => i.name + " " + i.grams + "克").join("、"),
        timeText: new Date(r.time).toLocaleTimeString()
      });
    });
    const groups = Object.values(byDate).sort((a, b) => (a.dateStr < b.dateStr ? 1 : -1));

    const days = store.last7Days();
    const max = Math.max(...days.map(d => d.kcal), 1);
    const week = days.map(d => ({ ...d, h: Math.max(6, Math.round(d.kcal / max * 150)) }));

    this.setData({ groups, week, today: store.totalsForDate(store.todayStr()) });
  },

  remove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "删除这条记录？", content: "删除后无法恢复。",
      success: res => { if (res.confirm) { store.removeRecord(id); this.refresh(); } }
    });
  },

  clearAll() {
    wx.showModal({
      title: "清空全部记录？", content: "所有饮食记录都会被删除，无法恢复。",
      success: res => { if (res.confirm) { store.clearRecords(); this.refresh(); } }
    });
  }
});
