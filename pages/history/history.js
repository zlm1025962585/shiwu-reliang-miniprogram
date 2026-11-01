const store = require('../../utils/store.js')
const nutrition = require('../../utils/nutrition.js')

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function dayLabel(ds) {
  const today = store.dateStr()
  if (ds === today) return '今天'
  const y = new Date()
  y.setDate(y.getDate() - 1)
  if (ds === store.dateStr(y)) return '昨天'
  const p = ds.split('-')
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
  return Number(p[1]) + '月' + Number(p[2]) + '日 ' + WEEK[d.getDay()]
}

Page({
  data: {
    days: [],
    bars: [],
    hasData: false,
    avg: 0,
    daysCount: 0,
    overCount: 0,
    target: 1800,
    rangeText: ''
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const profile = store.getProfile()
    const target = nutrition.targetIntake(
      nutrition.tdee(nutrition.bmr(profile), profile.activity),
      profile.goal
    )
    const meals = store.getMeals()

    // 分组
    const map = {}
    meals.forEach(function (m) {
      if (!map[m.date]) map[m.date] = []
      map[m.date].push(m)
    })

    const dates = Object.keys(map).sort().reverse()
    const days = dates.map(function (d) {
      const list = map[d].slice().sort(function (a, b) {
        return a.time < b.time ? -1 : 1
      })
      const total = nutrition.sumMeals(list)
      return {
        date: d,
        label: dayLabel(d),
        kcal: total.kcal,
        over: total.kcal > target,
        meals: list.map(function (m) {
          return {
            id: m.id,
            typeLabel: nutrition.MEAL_LABEL[m.mealType] || '加餐',
            time: m.time,
            kcal: m.total ? m.total.kcal : 0,
            itemsText: (m.items || [])
              .map(function (i) {
                return i.name
              })
              .join('、')
          }
        })
      }
    })

    // 近 7 天柱状
    const bars = []
    let max = target
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = store.dateStr(d)
      const list = map[ds] || []
      const kcal = nutrition.sumMeals(list).kcal
      if (kcal > max) max = kcal
      bars.push({
        date: ds,
        short: d.getMonth() + 1 + '/' + d.getDate(),
        kcal: kcal,
        isToday: i === 0
      })
    }
    bars.forEach(function (b) {
      b.height = Math.max(b.kcal > 0 ? 4 : 2, Math.round((b.kcal / max) * 100))
      b.over = b.kcal > target
    })

    const sum = bars.reduce(function (s, b) {
      return s + b.kcal
    }, 0)
    const recorded = bars.filter(function (b) {
      return b.kcal > 0
    }).length
    const avg = recorded ? Math.round(sum / recorded) : 0
    const overCount = dates.filter(function (d) {
      return nutrition.sumMeals(map[d]).kcal > target
    }).length

    this.setData({
      days: days,
      bars: bars,
      hasData: days.length > 0,
      avg: avg,
      daysCount: dates.length,
      overCount: overCount,
      target: target,
      rangeText: '近 7 天'
    })
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
        }
      }
    })
  }
})
