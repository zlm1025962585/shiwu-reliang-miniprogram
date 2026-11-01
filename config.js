// 全局配置
// recognizeEndpoint：识别接口地址。
// - 留空 = 演示模式：拍照后可体验「示例识别」流程，并可手动搜索添加食物、调整分量，热量计算是真实的。
// - 填入你部署好的云函数 / 服务器接口地址（POST，接收 { imageBase64 }，返回 { foods: [{ name, grams, confidence }] }）
//   后即为真实 AI 识别。接口示例见项目里的 cloudfunctions/recognizeFood，可直接部署到微信云开发。
// 在「我的」页面也可以填写并保存接口地址，会覆盖这里的值。
module.exports = {
  recognizeEndpoint: "",
  // 每日热量目标默认值（千卡），可在「我的」里修改
  defaultDailyGoal: 1800,
  appName: "食热量"
};
