const store = require("../../utils/store.js");

Page({
  data: { today: { kcal: 0, protein: 0, fat: 0, carbs: 0 }, goal: 1800, percent: 0, remain: 1800, recent: [], hasEndpoint: false },

  onShow() { this.refresh(); },

  refresh() {
    const app = getApp();
    const settings = app.getSettings();
    const today = store.totalsForDate(store.todayStr());
    const percent = settings.dailyGoal > 0 ? Math.min(100, Math.round(today.kcal / settings.dailyGoal * 100)) : 0;
    const recent = store.getRecords().slice(0, 3).map(r => ({
      ...r,
      names: (r.items || []).map(i => i.name).join("、"),
      timeText: new Date(r.time).toLocaleString()
    }));
    this.setData({
      today, goal: settings.dailyGoal, percent,
      remain: settings.dailyGoal - today.kcal,
      over: Math.max(0, today.kcal - settings.dailyGoal),
      recent, hasEndpoint: !!settings.recognizeEndpoint
    });
  },

  takePhoto() { this.pick(["camera"]); },
  chooseAlbum() { this.pick(["album"]); },

  pick(sourceType) {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType,
      sizeType: ["compressed"],
      success: res => {
        const file = res.tempFiles[0];
        getApp().globalData.pendingImage = file.tempFilePath;
        wx.navigateTo({ url: "/pages/result/result" });
      },
      fail: err => {
        if (err && err.errMsg && err.errMsg.indexOf("cancel") < 0) {
          wx.showToast({ title: "选图失败，请重试", icon: "none" });
        }
      }
    });
  },

  // 不拍照直接手动记一餐（跳过识别，手动添加食物）
  manualEntry() {
    getApp().globalData.pendingImage = "";
    wx.navigateTo({ url: "/pages/result/result?manual=1" });
  },

  goHistory() { wx.switchTab({ url: "/pages/history/history" }); }
});
