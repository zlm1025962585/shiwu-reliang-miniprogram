App({
  globalData: {
    // 待识别的图片路径（首页选图后写入，结果页读取，避免 URL 传参过长）
    pendingImage: "",
    // 本次识别是否为演示模式
    pendingDemo: false
  },
  onLaunch() {
    // 初始化本地设置默认值
    if (!wx.getStorageSync("settings")) {
      const config = require("./config.js");
      wx.setStorageSync("settings", {
        dailyGoal: config.defaultDailyGoal,
        recognizeEndpoint: config.recognizeEndpoint
      });
    }
  },
  getSettings() {
    const config = require("./config.js");
    return wx.getStorageSync("settings") || {
      dailyGoal: config.defaultDailyGoal,
      recognizeEndpoint: config.recognizeEndpoint
    };
  }
});
