const store = require("../../utils/store.js");
const { FOODS } = require("../../data/foods.js");

Page({
  data: { dailyGoal: 1800, recognizeEndpoint: "", foodCount: FOODS.length },

  onShow() {
    const s = getApp().getSettings();
    this.setData({ dailyGoal: s.dailyGoal, recognizeEndpoint: s.recognizeEndpoint || "" });
  },

  goalChange(e) { this.setData({ dailyGoal: e.detail.value }); },
  endpointInput(e) { this.setData({ recognizeEndpoint: e.detail.value.trim() }); },

  saveSettings() {
    wx.setStorageSync("settings", {
      dailyGoal: this.data.dailyGoal,
      recognizeEndpoint: this.data.recognizeEndpoint
    });
    wx.showToast({ title: "已保存", icon: "success" });
  },

  clearData() {
    wx.showModal({
      title: "清空全部记录？", content: "无法恢复。",
      success: res => {
        if (res.confirm) { store.clearRecords(); wx.showToast({ title: "已清空", icon: "none" }); }
      }
    });
  }
});
