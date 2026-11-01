const foodDb = require('../../utils/food-db.js')

const app = getApp()
const QUICK = [50, 100, 150, 200]

Page({
  data: {
    keyword: '',
    cat: 'all',
    cats: foodDb.CATS,
    list: [],
    quick: QUICK,
    sheet: null,
    replacing: false
  },

  onLoad(options) {
    this.setData({ replacing: !!(options && options.replace === '1') })
    this.refresh()
  },

  refresh() {
    const list = foodDb.search(this.data.keyword, this.data.cat).map(function (f) {
      return {
        name: f.name,
        kcal: f.kcal,
        desc: '蛋白 ' + f.p + 'g · 碳水 ' + f.c + 'g · 脂肪 ' + f.f + 'g',
        food: f
      }
    })
    this.setData({ list: list })
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value })
    this.refresh()
  },

  onCat(e) {
    this.setData({ cat: e.currentTarget.dataset.key })
    this.refresh()
  },

  onPick(e) {
    const f = this.data.list[e.currentTarget.dataset.index].food
    this.setData({
      sheet: {
        name: f.name,
        per100: { kcal: f.kcal, protein: f.p, carb: f.c, fat: f.f },
        grams: 100,
        kcal: f.kcal
      }
    })
  },

  onSlide(e) {
    const g = e.detail.value
    const s = this.data.sheet
    if (!s) return
    this.setData({
      sheet: {
        name: s.name,
        per100: s.per100,
        grams: g,
        kcal: Math.round((s.per100.kcal * g) / 100)
      }
    })
  },

  onQuick(e) {
    const g = Number(e.currentTarget.dataset.g)
    const s = this.data.sheet
    if (!s) return
    this.setData({
      sheet: {
        name: s.name,
        per100: s.per100,
        grams: g,
        kcal: Math.round((s.per100.kcal * g) / 100)
      }
    })
  },

  closeSheet() {
    this.setData({ sheet: null })
  },

  onConfirm() {
    const s = this.data.sheet
    if (!s) return
    app.globalData.pickedFood = {
      name: s.name,
      grams: s.grams,
      per100: s.per100
    }
    wx.navigateBack()
  },

  noop() {}
})
