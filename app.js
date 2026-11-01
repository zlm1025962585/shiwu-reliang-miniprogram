const store = require('./utils/store.js')

App({
  globalData: {
    // 从首页拍照后传给 result 页的待确认记录
    pendingMeal: null,
    // food-picker 页选中的食物，回传给 result 页
    pickedFood: null
  },

  onLaunch() {
    store.ensureProfile()
  }
})
