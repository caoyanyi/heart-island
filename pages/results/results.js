Page({
  data: {
    emotionIcon: '',
    emotionType: '',
    emotionDescription: '',
    recommendedGameIcon: '',
    recommendedGameTitle: '',
    recommendationReason: '',
    recommendedGame: '',
    navigatingGame: '',
    allGames: [
      {
        id: 'cloud-drifting',
        title: '云端漂流',
        icon: '☁️',
        description: '在云朵间漂浮，放松心情'
      },
      {
        id: 'bubble-pop',
        title: '泡泡爆破',
        icon: '🫧',
        description: '爆破泡泡，释放压力'
      },
      {
        id: 'forest-breeze',
        title: '森林微风',
        icon: '🍃',
        description: '感受森林的宁静'
      },
      {
        id: 'light-healing',
        title: '光之治愈',
        icon: '✨',
        description: '点亮星星，找到希望'
      },
      {
        id: 'zen-puzzle',
        title: '禅意拼图',
        icon: '🧩',
        description: '静心拼图，找回内心的平静与专注'
      },
      {
        id: 'memory-cards',
        title: '记忆卡片',
        icon: '🧠',
        description: '翻牌配对，挑战你的记忆力极限'
      }
    ]
  },

  onLoad() {
    this.loadTestResults()
  },

  onShow() {
    // Ensure we have results data
    const app = getApp()
    if (!app.globalData.emotionTestResults) {
      // No results, go back to emotion test
      wx.showModal({
        title: '提示',
        content: '请先完成情绪测试',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/emotion-test/emotion-test'
          })
        }
      })
    }
  },

  loadTestResults() {
    const app = getApp()
    const results = app.globalData.emotionTestResults
    
    if (!results) {
      return
    }

    // Set emotion data
    this.setData({
      emotionIcon: this.getEmotionIcon(results.emotionType),
      emotionType: this.getEmotionTypeText(results.emotionType),
      emotionDescription: this.getEmotionDescription(results.emotionType),
      recommendedGame: results.recommendedGame,
      recommendedGameIcon: this.getGameIcon(results.recommendedGame),
      recommendedGameTitle: this.getGameTitle(results.recommendedGame),
      recommendationReason: this.getRecommendationReason(results.recommendedGame, results.emotionType)
    })

    // Save results to storage
    this.saveResultsToStorage(results)
  },

  getEmotionIcon(emotionType) {
    const icons = {
      'anxiety': '😰',
      'depression': '😔',
      'calm': '😌',
      'low': '😕'
    }
    return icons[emotionType] || '😐'
  },

  getEmotionTypeText(emotionType) {
    const types = {
      'anxiety': '焦虑状态',
      'depression': '低落状态',
      'calm': '平静状态',
      'low': '能量不足'
    }
    return types[emotionType] || '未知状态'
  },

  getEmotionDescription(emotionType) {
    const descriptions = {
      'anxiety': '你目前可能感到一些焦虑和压力。这是很正常的情绪反应，每个人都会有这样的时刻。通过我们的放松游戏，你可以慢慢缓解这种紧张感，让心情平静下来。',
      'depression': '你似乎正处于情绪比较低落的状态。请记住，这只是暂时的感受，就像天空中的云朵一样，情绪也会来来去去。让我们一起通过游戏找到一些小小的快乐。',
      'calm': '你目前的状态很好，内心比较平静。保持这种平和的心态很重要，我们的游戏可以帮助你继续维持这种良好的状态，或者探索更多放松的方式。',
      'low': '你可能感到有些疲惫或能量不足。这时候需要一些温和的活动来慢慢恢复活力，而不是强行振作。让我们的游戏陪伴你度过这段时光。'
    }
    return descriptions[emotionType] || '你的情绪状态很独特，让我们通过游戏来更好地了解你。'
  },

  getGameIcon(gameId) {
    const icons = {
      'cloud-drifting': '☁️',
      'bubble-pop': '🫧',
      'forest-breeze': '🍃',
      'light-healing': '✨',
      'zen-puzzle': '🧩',
      'memory-cards': '🧠'
    }
    return icons[gameId] || '✨'
  },

  getGameTitle(gameId) {
    const titles = {
      'cloud-drifting': '云端漂流',
      'bubble-pop': '泡泡爆破',
      'forest-breeze': '森林微风',
      'light-healing': '光之治愈',
      'zen-puzzle': '禅意拼图',
      'memory-cards': '记忆卡片'
    }
    return titles[gameId] || '放松游戏'
  },

  getRecommendationReason(gameId, emotionType) {
    const reasons = {
      'cloud-drifting': {
        'anxiety': '轻柔的云朵运动可以帮助你缓解焦虑，让心情慢慢平静下来。',
        'depression': '在云朵间漂浮的感觉能够让你暂时忘记烦恼，提升情绪。',
        'calm': '继续保持平静的心态，享受云端的宁静和安详。',
        'low': '轻柔的云朵运动可以慢慢提升你的能量，不会过于刺激。'
      },
      'bubble-pop': {
        'anxiety': '爆破泡泡的动作可以释放紧张情绪，让你感到轻松和满足。',
        'depression': '看到泡泡消失的过程能带来小小的成就感，改善情绪。',
        'calm': '保持专注，享受泡泡爆破的愉悦感和节奏感。',
        'low': '简单的点击动作能帮你重新找回活力，不会消耗太多精力。'
      },
      'forest-breeze': {
        'anxiety': '森林的宁静和微风的温柔能很好地安抚你的焦虑情绪。',
        'depression': '与自然的连接有助于改善你的情绪状态，带来宁静。',
        'calm': '在森林中感受自然的韵律，保持内心的平和与宁静。',
        'low': '让自然的能量重新充满你的内心，温和地恢复活力。'
      },
      'light-healing': {
        'anxiety': '点亮星星的过程能带来希望，驱散焦虑的阴霾。',
        'depression': '光明象征着希望，能帮你走出情绪的低谷，看到美好。',
        'calm': '在光明中找到内心的平静和力量，保持积极的心态。',
        'low': '让光明重新点燃你内心的热情和动力。'
      },
      'zen-puzzle': {
        'anxiety': '静心拼图能帮你集中注意力，缓解焦虑情绪，让内心平静。',
        'depression': '完成拼图的过程能带来成就感，逐步提升你的情绪状态。',
        'calm': '在拼图的过程中保持内心的宁静和专注，维持平和心态。',
        'low': '专注的拼图过程能帮你找回内心的平静，温和地恢复精力。'
      },
      'memory-cards': {
        'anxiety': '记忆卡片游戏能帮你集中注意力，缓解焦虑，训练大脑。',
        'depression': '挑战记忆力能激活大脑，改善情绪状态，带来积极感受。',
        'calm': '保持专注，享受记忆挑战的乐趣，维持内心的平和。',
        'low': '记忆训练能帮你重新激活大脑活力，温和地提升能量。'
      }
    }
    
    return reasons[gameId]?.[emotionType] || '这个游戏很适合现在的你，试试看吧。'
  },

  saveResultsToStorage(results) {
    try {
      const storedResults = wx.getStorageSync('emotionTestResults')
      const resultHistory = Array.isArray(storedResults)
        ? storedResults.filter(Boolean)
        : (storedResults ? [storedResults] : [])
      const resultToSave = {
        ...results,
        timestamp: results.timestamp || new Date().toISOString()
      }
      const resultIndex = resultHistory.findIndex(item => (
        (resultToSave.testId && item.testId === resultToSave.testId) ||
        (resultToSave.timestamp && item.timestamp === resultToSave.timestamp)
      ))

      if (resultIndex >= 0) {
        resultHistory[resultIndex] = { ...resultHistory[resultIndex], ...resultToSave }
      } else {
        resultHistory.push(resultToSave)
      }

      if (resultHistory.length > 50) {
        resultHistory.splice(0, resultHistory.length - 50)
      }

      wx.setStorageSync('emotionTestResults', resultHistory)
      wx.setStorageSync('currentEmotionTestResult', resultToSave)
    } catch (error) {

    }
  },

  selectGame(e) {
    const gameId = e.currentTarget.dataset.game
    this.navigateToGame(gameId)
  },

  startRecommendedGame() {
    this.navigateToGame(this.data.recommendedGame)
  },

  navigateToGame(gameId) {
    if (!gameId || this.data.navigatingGame) {
      if (this.data.navigatingGame) {
        return
      }

      wx.showToast({
        title: '请选择一个游戏',
        icon: 'none'
      })
      return
    }

    this.setData({ navigatingGame: gameId })

    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' })
    }

    wx.showLoading({
      title: '准备游戏',
      mask: true
    })

    // Navigate to the selected game
    wx.navigateTo({
      url: `/pages/games/${gameId}/${gameId}`,
      fail: () => {
        wx.showToast({
          title: '游戏暂时无法打开',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
        this.setData({ navigatingGame: '' })
      }
    })
  },

  retakeTest() {
    // Clear results and go back to emotion test
    const app = getApp()
    app.globalData.emotionTestResults = null
    
    try {
      wx.setStorageSync('shouldResetEmotionTest', true)
      wx.removeStorageSync('currentEmotionTestResult')
    } catch (error) {

    }
    
    wx.switchTab({
      url: '/pages/emotion-test/emotion-test'
    })
  },

  onShareAppMessage() {
    return {
      title: '我刚完成了心岛游戏的情绪测试',
      path: '/pages/welcome/welcome',
      imageUrl: '/assets/images/share-emotion-assessment.jpg'
    }
  }
})
