const store = require('../../utils/store.js')
const nutrition = require('../../utils/nutrition.js')
const ai = require('../../utils/ai.js')

const app = getApp()
const ORDER = ['breakfast', 'lunch', 'dinner', 'snack']
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍪' }

Page({
  data: {
    dateLabel: '',
    greeting: '',
    total: { kcal: 0, protein: 0, carb: 0, fat: 0 },
    target: 1800,
    percent: 0,
    over: false,
    remainText: '',
    groups: [],
    count: 0,
    hasKey: false,
    busy: false
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const now = new Date()
    const today = store.dateStr(now)
    const profile = store.getProfile()
    const target = nutrition.targetIntake(
      nutrition.tdee(nutrition.bmr(profile), profile.activity),
      profile.goal
    )
    const meals = store.mealsOf(today)
    const total = nutrition.sumMeals(meals)

    const groups = ORDER.map(function (type) {
      const list = meals
        .filter(function (m) {
          return m.mealType === type
        })
        .map(function (m) {
          return {
            id: m.id,
            time: m.time,
            image: m.image || '',
            kcal: m.total ? m.total.kcal : 0,
            itemsText: (m.items || [])
              .map(function (i) {
                return i.name
              })
              .join('、')
          }
        })
      const kcal = list.reduce(function (s, m) {
        return s + m.kcal
      }, 0)
      return {
        key: type,
        label: nutrition.MEAL_LABEL[type],
        icon: ICONS[type],
        meals: list,
        kcal: kcal
      }
    }).filter(function (g) {
      return g.meals.length > 0
    })

    const percent =
      target > 0 ? Math.min(100, Math.round((total.kcal / target) * 100)) : 0
    const remain = target - total.kcal
    const h = now.getHours()
    let greeting = '晚上好 🌙'
    if (h < 11) greeting = '早上好 ☀️'
    else if (h < 14) greeting = '中午好 🍚'
    else if (h < 18) greeting = '下午好 🌤'

    this.setData({
      dateLabel: now.getMonth() + 1 + '月' + now.getDate() + '日 ' + WEEK[now.getDay()],
      greeting: greeting,
      total: total,
      target: target,
      percent: percent,
      over: total.kcal > target,
      remainText:
        remain >= 0 ? '还能吃 ' + remain + ' kcal' : '已超出 ' + -remain + ' kcal',
      groups: groups,
      count: meals.length,
      hasKey: !!store.getApi().apiKey
    })
  },

  onTapSnap() {
    if (this.data.busy) return
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      sizeType: ['compressed'],
      camera: 'back',
      success(res) {
        const file = res.tempFiles[0]
        that.startRecognize(file.tempFilePath, file.size)
      },
      fail() {}
    })
  },

  startRecognize(path, size) {
    const that = this
    const cfg = store.getApi()
    if (!cfg.apiKey) {
      wx.showModal({
        title: '这台手机还没配 AI',
        content:
          'API Key 存在各自手机本地，不通用。填一个你自己的大模型 Key 就能自动认食物、算热量；也可以先手动记录这一餐。',
        confirmText: '去设置',
        cancelText: '手动记',
        success(res) {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/settings/settings' })
          } else {
            that.goResult(path, [], '')
          }
        }
      })
      return
    }

    if (size && size > 10 * 1024 * 1024) {
      wx.showToast({ title: '图片太大，换一张', icon: 'none' })
      return
    }

    this.setData({ busy: true })
    wx.showLoading({ title: '正在认食物…', mask: true })

    ai.recognize(path)
      .then(function (result) {
        wx.hideLoading()
        that.setData({ busy: false })
        if (!result.items.length) {
          wx.showModal({
            title: '没认出食物',
            content: result.note || '照片里没有可识别的食物，换个角度再拍，或者手动添加。',
            confirmText: '手动添加',
            showCancel: false,
            success() {
              that.goResult(path, [], result.note || '')
            }
          })
          return
        }
        that.goResult(path, result.items, result.note || '')
      })
      .catch(function (err) {
        wx.hideLoading()
        that.setData({ busy: false })
        wx.showModal({
          title: '识别失败',
          content: err.message || '未知错误',
          confirmText: '手动记',
          cancelText: '知道了',
          success(res) {
            if (res.confirm) that.goResult(path, [], '')
          }
        })
      })
  },

  goResult(image, items, note) {
    app.globalData.pendingMeal = {
      image: image,
      items: items,
      note: note,
      mealType: nutrition.guessMealType(new Date()),
      time: store.timeStr(),
      date: store.dateStr()
    }
    wx.navigateTo({ url: '/pages/result/result' })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    const that = this
    wx.showModal({
      title: '删除这条记录？',
      confirmText: '删除',
      confirmColor: '#EF4444',
      success(res) {
        if (res.confirm) {
          store.removeMeal(id)
          that.refresh()
          wx.showToast({ title: '已删除', icon: 'none' })
        }
      }
    })
  },

  goHistory() {
    wx.switchTab({ url: '/pages/history/history' })
  }
})
