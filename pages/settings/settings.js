const store = require('../../utils/store.js')
const ai = require('../../utils/ai.js')

const PROVIDERS = [
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini'
  },
  {
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash'
  },
  {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-flash',
    def: true
  },
  {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-vl-max-latest'
  },
  {
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4v-flash'
  },
  {
    name: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k-vision-preview'
  },
  {
    name: '豆包（方舟）',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: '填入你的接入点 ID，形如 ep-xxxx'
  }
]

// 奇数个卡片时，最后一张拉通排，避免右侧空半格
PROVIDERS.forEach(function (p, i) {
  p.wide = PROVIDERS.length % 2 === 1 && i === PROVIDERS.length - 1
})

Page({
  data: {
    baseUrl: '',
    model: '',
    apiKey: '',
    showKey: false,
    providers: PROVIDERS,
    defaultUrl: store.DEFAULT_API.baseUrl,
    testing: false
  },

  onLoad() {
    this.loadFromStore()
  },

  loadFromStore() {
    const cfg = store.getApi()
    this.setData({
      baseUrl: cfg.baseUrl || '',
      model: cfg.model || '',
      apiKey: cfg.apiKey || ''
    })
  },

  // 恢复默认：地址和模型回到 DeepSeek，已填的 Key 保留
  onReset() {
    const that = this
    wx.showModal({
      title: '恢复默认配置',
      content: '接口地址和模型会改回 DeepSeek（' + store.DEFAULT_API.baseUrl + '），已填的 API Key 会保留。',
      confirmText: '恢复',
      success(res) {
        if (!res.confirm) return
        store.resetApi()
        that.loadFromStore()
        wx.showToast({ title: '已恢复 DeepSeek 默认', icon: 'none' })
      }
    })
  },

  save() {
    store.saveApi({
      baseUrl: (this.data.baseUrl || '').trim(),
      model: (this.data.model || '').trim(),
      apiKey: (this.data.apiKey || '').trim()
    })
  },

  onBaseUrl(e) {
    this.setData({ baseUrl: e.detail.value })
    this.save()
  },

  onModel(e) {
    this.setData({ model: e.detail.value })
    this.save()
  },

  onKey(e) {
    this.setData({ apiKey: e.detail.value })
    this.save()
  },

  toggleKey() {
    this.setData({ showKey: !this.data.showKey })
  },

  useProvider(e) {
    const p = PROVIDERS[e.currentTarget.dataset.index]
    this.setData({ baseUrl: p.baseUrl, model: p.model })
    this.save()
    wx.showToast({ title: '已填入 ' + p.name + '，再补 Key', icon: 'none' })
  },

  onTest() {
    if (this.data.testing) return
    const cfg = {
      baseUrl: (this.data.baseUrl || '').trim(),
      model: (this.data.model || '').trim(),
      apiKey: (this.data.apiKey || '').trim()
    }
    if (!cfg.apiKey) {
      wx.showToast({ title: '先填 API Key', icon: 'none' })
      return
    }
    if (!cfg.baseUrl || !cfg.model) {
      wx.showToast({ title: '接口地址和模型都要填', icon: 'none' })
      return
    }
    this.save()
    this.setData({ testing: true })
    wx.showLoading({ title: '测试中…', mask: true })

    ai.testConnection()
      .then(function (reply) {
        wx.hideLoading()
        wx.showModal({
          title: '连接成功',
          content: '模型有回应：' + String(reply).slice(0, 60),
          showCancel: false
        })
      })
      .catch(function (err) {
        wx.hideLoading()
        wx.showModal({
          title: '连接失败',
          content: err.message || '未知错误',
          showCancel: false
        })
      })
      .then(
        function () {
          this.setData({ testing: false })
        }.bind(this)
      )
  }
})
