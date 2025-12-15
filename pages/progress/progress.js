Page({
  data: {
    // 用户进度数据
    userProgress: {
      totalSessions: 0,
      totalPlayTime: 0,
      favoriteGame: '',
      emotionHistory: [],
      achievements: [],
      weeklyGoal: 7,
      weeklyProgress: 0
    },
    
    // 测试历史数据
    testHistory: [],
    testStats: {
      totalTests: 0,
      earlySubmitCount: 0,
      averageScore: 0,
      dominantEmotion: '',
      lastTestDate: ''
    },
    
    // 图表数据
    emotionChartData: [],
    gameUsageData: [],
    
    // 成就列表
    achievements: [
      { id: 'first_session', name: '初次体验', description: '完成第一次游戏', icon: '🎯', unlocked: false },
      { id: 'streak_3', name: '连续3天', description: '连续3天使用应用', icon: '🔥', unlocked: false },
      { id: 'streak_7', name: '连续一周', description: '连续7天使用应用', icon: '⭐', unlocked: false },
      { id: 'all_games', name: '游戏探索者', description: '尝试所有游戏', icon: '🎮', unlocked: false },
      { id: 'emotion_master', name: '情绪管理师', description: '完成10次情绪测试', icon: '🧠', unlocked: false }
    ],
    
    // 推荐建议
    recommendations: [],
    
    loading: true,
    showTestHistory: false // 控制测试历史展示
  },

  onLoad() {
    this.loadUserProgress()
  },

  onShow() {
    this.refreshProgress()
  },

  // 加载用户进度
  loadUserProgress() {
    try {
      // 从存储加载数据
      const savedProgress = wx.getStorageSync('userProgress') || {}
      const emotionHistory = wx.getStorageSync('emotionHistory') || []
      const gameSessions = wx.getStorageSync('gameSessions') || []
      
      // 新的测试历史数据
      const testHistory = wx.getStorageSync('emotionTestResults') || []
      const testStats = this.calculateTestStats(testHistory)
      
      this.setData({
        'userProgress.totalSessions': savedProgress.totalSessions || 0,
        'userProgress.totalPlayTime': savedProgress.totalPlayTime || 0,
        'userProgress.favoriteGame': savedProgress.favoriteGame || '',
        'userProgress.emotionHistory': emotionHistory,
        'userProgress.weeklyProgress': savedProgress.weeklyProgress || 0,
        'userProgress.weeklyGoal': savedProgress.weeklyGoal || 7,
        testHistory: testHistory,
        testStats: testStats,
        emotionChartData: this.processEmotionHistory(emotionHistory),
        gameUsageData: this.processGameUsage(gameSessions),
        loading: false
      })
      
      // 检查成就
      this.checkAchievements()
      
      // 生成推荐
      this.generateRecommendations()
      
    } catch (error) {

      this.setData({ loading: false })
    }
  },

  // 刷新进度
  refreshProgress() {
    this.loadUserProgress()
  },

  // 计算测试统计数据
  calculateTestStats(testHistory) {
    if (!testHistory || testHistory.length === 0) {
      return {
        totalTests: 0,
        earlySubmitCount: 0,
        averageScore: 0,
        dominantEmotion: '',
        lastTestDate: ''
      }
    }
    
    const totalTests = testHistory.length
    const earlySubmitCount = testHistory.filter(test => test.isEarlySubmit).length
    const lastTest = testHistory[testHistory.length - 1]
    
    // 计算平均分数
    let totalScore = 0
    let validTests = 0
    const emotionCounts = {}
    
    testHistory.forEach(test => {
      if (test.emotionScores && test.emotionScores.length > 0) {
        // 计算这次测试的平均分数
        const testScore = test.emotionScores.reduce((sum, emotion) => sum + emotion.score, 0) / test.emotionScores.length
        totalScore += testScore
        validTests++
      }
      
      // 统计主要情绪
      const emotion = test.primaryEmotion || test.emotionType
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
    })
    
    const averageScore = validTests > 0 ? Math.round(totalScore / validTests) : 0
    
    // 找到主导情绪
    let dominantEmotion = ''
    let maxCount = 0
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count
        dominantEmotion = emotion
      }
    })
    
    return {
      totalTests: totalTests,
      earlySubmitCount: earlySubmitCount,
      averageScore: averageScore,
      dominantEmotion: this.getEmotionLabel(dominantEmotion),
      lastTestDate: lastTest ? this.formatDateTime(lastTest.timestamp) : ''
    }
  },

  // 处理情绪历史数据
  processEmotionHistory(history) {
    if (!history || history.length === 0) return []
    
    // 最近7天的情绪数据
    const last7Days = history.slice(-7)
    return last7Days.map(item => ({
      date: this.formatDate(item.date),
      emotion: item.emotion,
      score: item.score
    }))
  },

  // 处理游戏使用数据
  processGameUsage(sessions) {
    const gameCounts = {}
    sessions.forEach(session => {
      gameCounts[session.game] = (gameCounts[session.game] || 0) + 1
    })
    
    return Object.entries(gameCounts).map(([game, count]) => ({
      game: this.getGameName(game),
      count: count
    }))
  },

  // 获取情绪标签
  getEmotionLabel(emotion) {
    const labels = {
      calm: '平静',
      anxiety: '焦虑',
      low: '低落',
      depression: '抑郁'
    }
    return labels[emotion] || emotion || '未知'
  },

  // 格式化日期时间
  formatDateTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return '今天'
    } else if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
  },

  // 获取游戏名称
  getGameName(gameId) {
    const names = {
      'cloud-drifting': '云端漂流',
      'bubble-pop': '泡泡爆破',
      'forest-breeze': '森林微风',
      'light-healing': '光之治愈',
      'zen-puzzle': '禅意拼图',
      'memory-cards': '记忆卡片'
    }
    return names[gameId] || '未知游戏'
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  },

  // 切换测试历史展示
  toggleTestHistory() {
    this.setData({
      showTestHistory: !this.data.showTestHistory
    })
  },

  // 查看测试详情
  viewTestDetail(e) {
    const testId = e.currentTarget.dataset.testid
    const test = this.data.testHistory.find(t => t.testId === testId)
    
    if (test) {
      wx.showModal({
        title: '测试详情',
        content: this.generateTestDetailContent(test),
        showCancel: false,
        confirmText: '确定'
      })
    }
  },

  // 生成测试详情内容
  generateTestDetailContent(test) {
    const emotionType = this.getEmotionLabel(test.primaryEmotion || test.emotionType)
    const testDate = new Date(test.timestamp).toLocaleString()
    const completion = `${test.completedQuestions || 0}/${test.totalQuestions || 0}`
    
    let content = `测试时间: ${testDate}\n`
    content += `完成状态: ${test.isEarlySubmit ? '提前交卷' : '正常完成'} (${completion}题)\n`
    content += `主要情绪: ${emotionType}\n`
    content += `推荐游戏: ${this.getGameName(test.recommendedGame)}\n\n`
    
    if (test.emotionScores && test.emotionScores.length > 0) {
      content += '情绪评分:\n'
      test.emotionScores.forEach(item => {
        const formattedScore = Math.round(item.score * 10) / 10 // 保留1位小数
        content += `• ${this.getEmotionLabel(item.emotion)}: ${formattedScore}分\n`
      })
    }
    
    return content
  },

  // 检查成就
  checkAchievements() {
    const progress = this.data.userProgress
    const achievements = [...this.data.achievements]
    
    // 检查各个成就
    if (progress.totalSessions >= 1) {
      achievements.find(a => a.id === 'first_session').unlocked = true
    }
    
    if (progress.weeklyProgress >= 3) {
      achievements.find(a => a.id === 'streak_3').unlocked = true
    }
    
    if (progress.weeklyProgress >= 7) {
      achievements.find(a => a.id === 'streak_7').unlocked = true
    }
    
    // 使用新的测试历史数据检查成就
    if (this.data.testStats.totalTests >= 10) {
      achievements.find(a => a.id === 'emotion_master').unlocked = true
    }
    
    // 检查是否尝试了所有游戏
    const playedGames = [...new Set(progress.emotionHistory.map(h => h.game))]
    if (playedGames.length >= 6) {
      achievements.find(a => a.id === 'all_games').unlocked = true
    }
    
    this.setData({ achievements })
  },

  // 生成推荐建议
  generateRecommendations() {
    const progress = this.data.userProgress
    const recommendations = []
    const testStats = this.data.testStats
    
    // 基于使用频率的推荐
    if (progress.totalSessions < 3) {
      recommendations.push({
        type: 'usage',
        title: '新手建议',
        content: '建议每天使用10-15分钟，逐步建立情绪管理习惯。'
      })
    }
    
    // 基于测试历史的推荐
    if (testStats.totalTests > 0) {
      if (testStats.earlySubmitCount > testStats.totalTests * 0.3) {
        recommendations.push({
          type: 'test',
          title: '测试建议',
          content: '检测到您经常提前交卷，建议认真完成所有题目以获得更准确的分析。'
        })
      }
      
      if (testStats.dominantEmotion === '焦虑' || testStats.dominantEmotion === '低落') {
        recommendations.push({
          type: 'emotion',
          title: '情绪关注',
          content: '最近情绪状态需要关注，建议多尝试森林微风和光之治愈游戏。'
        })
      }
    }
    
    // 基于游戏偏好的推荐
    if (progress.favoriteGame) {
      recommendations.push({
        type: 'game',
        title: '游戏推荐',
        content: `你最近喜欢${this.getGameName(progress.favoriteGame)}，也可以试试其他游戏获得不同体验。`
      })
    }
    
    // 目标相关推荐
    if (progress.weeklyProgress < progress.weeklyGoal) {
      const remaining = progress.weeklyGoal - progress.weeklyProgress
      recommendations.push({
        type: 'goal',
        title: '目标提醒',
        content: `本周还需要${remaining}次使用就能达到目标，加油！`
      })
    }
    
    this.setData({ recommendations })
  },

  // 跳转到游戏
  navigateToGame(e) {
    const gameId = e.currentTarget.dataset.game
    wx.navigateTo({
      url: `/pages/games/${gameId}/${gameId}`
    })
  },

  // 分享进度
  onShareAppMessage() {
    const progress = this.data.userProgress
    return {
      title: `我在Heart Island完成了${progress.totalSessions}次情绪舒缓练习！`,
      path: '/pages/welcome/welcome',
      imageUrl: '/assets/share-progress.jpg'
    }
  },

  // 导出数据
  exportData() {
    const data = {
      userProgress: this.data.userProgress,
      emotionHistory: wx.getStorageSync('emotionHistory') || [],
      gameSessions: wx.getStorageSync('gameSessions') || [],
      testHistory: this.data.testHistory,
      testStats: this.data.testStats,
      exportDate: new Date().toISOString()
    }
    
    // 生成JSON文件
    const jsonStr = JSON.stringify(data, null, 2)
    
    wx.showModal({
      title: '导出数据',
      content: '数据将以JSON格式导出，可用于备份或分析。',
      confirmText: '复制数据',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: jsonStr,
            success: () => {
              wx.showToast({
                title: '数据已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 重置进度
  resetProgress() {
    wx.showModal({
      title: '重置进度',
      content: '确定要清除所有进度数据吗？此操作不可恢复。',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 清除所有相关存储
          wx.removeStorageSync('userProgress')
          wx.removeStorageSync('emotionHistory')
          wx.removeStorageSync('gameSessions')
          wx.removeStorageSync('emotionTestResults')
          
          // 重置数据
          this.setData({
            userProgress: {
              totalSessions: 0,
              totalPlayTime: 0,
              favoriteGame: '',
              emotionHistory: [],
              achievements: [],
              weeklyGoal: 7,
              weeklyProgress: 0
            },
            testHistory: [],
            testStats: {
              totalTests: 0,
              earlySubmitCount: 0,
              averageScore: 0,
              dominantEmotion: '',
              lastTestDate: ''
            },
            emotionChartData: [],
            gameUsageData: [],
            recommendations: [],
            showTestHistory: false
          })
          
          // 重置成就
          this.checkAchievements()
          
          wx.showToast({
            title: '进度已重置',
            icon: 'success'
          })
        }
      }
    })
  }
})