Page({
  data: {
    recommendedGame: '',
    recommendationIcon: '',
    recommendationTitle: '',
    recommendationText: ''
  },

  onLoad() {
    this.loadRecommendation()
  },

  onShow() {
    // Refresh recommendation when page shows
    this.loadRecommendation()
  },

  loadRecommendation() {
    const app = getApp()
    const emotionResult = app.globalData.emotionTestResults
    
    if (emotionResult && emotionResult.recommendedGame) {
      this.setData({
        recommendedGame: emotionResult.recommendedGame,
        recommendationIcon: this.getGameIcon(emotionResult.recommendedGame),
        recommendationTitle: this.getGameTitle(emotionResult.recommendedGame),
        recommendationText: this.getRecommendationText(emotionResult.recommendedGame, emotionResult.emotionType)
      })
    }
  },

  getGameIcon(game) {
    const icons = {
      'cloud-drifting': '☁️',
      'bubble-pop': '🫧',
      'forest-breeze': '🍃',
      'light-healing': '✨',
      'zen-puzzle': '🧩',
      'memory-cards': '🧠'
    }
    return icons[game] || '✨'
  },

  getGameTitle(game) {
    const titles = {
      'cloud-drifting': '云端漂流',
      'bubble-pop': '泡泡爆破',
      'forest-breeze': '森林微风',
      'light-healing': '光之治愈',
      'zen-puzzle': '禅意拼图',
      'memory-cards': '记忆卡片'
    }
    return titles[game] || '放松游戏'
  },

  getRecommendationText(game, emotionType) {
    const recommendations = {
      'cloud-drifting': {
        'anxiety': '云端漂流可以帮助你缓解焦虑，让心情平静下来',
        'depression': '在云朵间漂浮的感觉能够提升你的情绪',
        'calm': '继续保持平静的心态，享受云端的宁静',
        'low': '轻柔的云朵运动可以慢慢提升你的能量'
      },
      'bubble-pop': {
        'anxiety': '爆破泡泡可以释放紧张情绪，让你感到轻松',
        'depression': '看到泡泡消失的过程能带来小小的成就感',
        'calm': '保持专注，享受泡泡爆破的愉悦感',
        'low': '简单的点击动作能帮你重新找回活力'
      },
      'forest-breeze': {
        'anxiety': '森林的宁静和微风的温柔能安抚你的焦虑',
        'depression': '与自然的连接有助于改善你的情绪状态',
        'calm': '在森林中感受自然的韵律，保持内心的平和',
        'low': '让自然的能量重新充满你的内心'
      },
      'light-healing': {
        'anxiety': '点亮星星的过程能带来希望，驱散焦虑的阴霾',
        'depression': '光明象征着希望，能帮你走出情绪的低谷',
        'calm': '在光明中找到内心的平静和力量',
        'low': '让光明重新点燃你内心的热情'
      },
      'zen-puzzle': {
        'anxiety': '静心拼图能帮你集中注意力，缓解焦虑情绪',
        'depression': '完成拼图的过程能带来成就感，提升情绪',
        'calm': '在拼图的过程中保持内心的宁静和专注',
        'low': '专注的拼图过程能帮你找回内心的平静'
      },
      'memory-cards': {
        'anxiety': '记忆卡片游戏能帮你集中注意力，缓解焦虑',
        'depression': '挑战记忆力能激活大脑，改善情绪状态',
        'calm': '保持专注，享受记忆挑战的乐趣',
        'low': '记忆训练能帮你重新激活大脑活力'
      }
    }
    
    return recommendations[game]?.[emotionType] || '这个游戏很适合现在的你'
  },

  selectGame(e) {
    const game = e.currentTarget.dataset.game
    
    // Navigate to selected game
    wx.navigateTo({
      url: `/pages/games/${game}/${game}`
    })
  },

  goBack() {
    wx.navigateBack()
  }
})