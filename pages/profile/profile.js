const store = require('../../utils/store.js')
const nutrition = require('../../utils/nutrition.js')

const ACTIVITIES = [
  { key: 'sedentary', label: '久坐不动', desc: '基本不运动' },
  { key: 'light', label: '轻度活动', desc: '每周运动 1-3 次' },
  { key: 'moderate', label: '中度活动', desc: '每周运动 3-5 次' },
  { key: 'active', label: '高度活动', desc: '几乎每天运动' }
]

const GOALS = [
  { key: 'fat_loss', label: '减脂' },
  { key: 'maintain', label: '维持' },
  { key: 'muscle_gain', label: '增肌' }
]

const ADVICE = {
  fat_loss: '每天大概少吃 20%，减重会更稳，也不容易反弹。',
  maintain: '按日常消耗吃，体重基本稳定。',
  muscle_gain: '比日常消耗多吃 10%，配合力量训练更容易长肌肉。'
}

function clamp(v, min, max, fallback) {
  const n = Number(v)
  if (!n || isNaN(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

Page({
  data: {
    profile: {},
    form: { age: '28', height: '175', weight: '70' },
    bmr: 0,
    tdee: 0,
    target: 0,
    advice: '',
    activities: ACTIVITIES,
    activityLabels: ACTIVITIES.map(function (a) {
      return a.label
    }),
    activityIndex: 1,
    activityLabel: '轻度活动',
    goals: GOALS,
    hasKey: false,
    modelName: '',
    apiStatus: '',
    mealCount: 0,
    dayCount: 0
  },

  onShow() {
    const p = store.getProfile()
    let idx = 0
    for (let i = 0; i < ACTIVITIES.length; i++) {
      if (ACTIVITIES[i].key === p.activity) {
        idx = i
        break
      }
    }
    const that = this
    const meals = store.getMeals()
    const dates = {}
    meals.forEach(function (m) {
      dates[m.date] = true
    })
    const api = store.getApi()
    const hasKey = !!api.apiKey

    that.setData({
      profile: p,
      form: {
        age: String(p.age),
        height: String(p.height),
        weight: String(p.weight)
      },
      activityIndex: idx,
      activityLabel: ACTIVITIES[idx].label,
      hasKey: hasKey,
      modelName: api.model || '',
      apiStatus: hasKey
        ? '已配置 · ' + (api.model || '未选模型')
        : '还没配置 · 点这里填自己的 API Key',
      mealCount: meals.length,
      dayCount: Object.keys(dates).length
    })
    that.compute()
  },

  compute() {
    const f = this.data.form
    const p = Object.assign({}, this.data.profile, {
      age: clamp(f.age, 1, 120, 28),
      height: clamp(f.height, 100, 250, 175),
      weight: clamp(f.weight, 25, 300, 70)
    })
    const base = nutrition.bmr(p)
    const total = nutrition.tdee(base, p.activity)
    const target = nutrition.targetIntake(total, p.goal)
    this.setData({
      bmr: base,
      tdee: total,
      target: target,
      advice: ADVICE[p.goal] || ''
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const patch = {}
    patch['form.' + field] = e.detail.value
    this.setData(patch)
    this.compute()
    this.persist()
  },

  onGender(e) {
    const v = e.currentTarget.dataset.v
    this.setData({ 'profile.gender': v })
    this.compute()
    this.persist()
  },

  onGoal(e) {
    const k = e.currentTarget.dataset.key
    this.setData({ 'profile.goal': k })
    this.compute()
    this.persist()
  },

  onActivity(e) {
    const idx = Number(e.detail.value)
    this.setData({
      activityIndex: idx,
      activityLabel: ACTIVITIES[idx].label,
      'profile.activity': ACTIVITIES[idx].key
    })
    this.compute()
    this.persist()
  },

  persist() {
    const f = this.data.form
    const p = Object.assign({}, this.data.profile, {
      age: clamp(f.age, 1, 120, 28),
      height: clamp(f.height, 100, 250, 175),
      weight: clamp(f.weight, 25, 300, 70)
    })
    store.saveProfile(p)
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  // 隐藏入口：长按底部版本号，二次确认后才进 AI 设置
  onVerLong() {
    const that = this
    wx.showModal({
      title: '进入 AI 设置？',
      content: '这里是配置接口和 API Key 的地方，平时不需要打开。',
      confirmText: '进入',
      cancelText: '取消',
      success(res) {
        if (res.confirm) that.goSettings()
      }
    })
  },

  onClear() {
    const that = this
    wx.showModal({
      title: '清空所有记录？',
      content: '所有餐次数据会被删除，无法恢复。身体数据会保留。',
      confirmText: '清空',
      confirmColor: '#EF4444',
      success(res) {
        if (res.confirm) {
          store.saveMeals([])
          that.onShow()
          wx.showToast({ title: '已清空', icon: 'none' })
        }
      }
    })
  }
})
