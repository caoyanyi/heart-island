Page({
  data: {
    currentQuestion: 1,
    totalQuestions: 10, // 增加到10题
    progress: 0,
    selectedOption: null,
    showResults: false,
    showEarlySubmit: false, // 添加提前交卷提示
    answers: [],
    testStartTime: null, // 测试开始时间
    testId: null, // 测试ID，用于历史记录

    questions: [
      {
        id: 1,
        text: "最近一周，你的睡眠质量如何？",
        options: [
          { text: "睡眠质量很好，容易入睡", score: { calm: 3, anxiety: -1, low: 0, depression: -1 } },
          { text: "睡眠一般，偶尔难以入睡", score: { calm: 1, anxiety: 1, low: 0, depression: 0 } },
          { text: "睡眠质量较差，经常失眠", score: { calm: -1, anxiety: 2, low: 1, depression: 2 } },
          { text: "睡眠很差，几乎每晚都失眠", score: { calm: -2, anxiety: 3, low: 2, depression: 3 } }
        ]
      },
      {
        id: 2,
        text: "你感到焦虑或担心的频率如何？",
        options: [
          { text: "很少感到焦虑，心态平和", score: { calm: 3, anxiety: -2, low: 1, depression: 0 } },
          { text: "偶尔会感到焦虑，但可以控制", score: { calm: 1, anxiety: 1, low: 0, depression: 0 } },
          { text: "经常感到焦虑，影响日常生活", score: { calm: -1, anxiety: 3, low: 1, depression: 1 } },
          { text: "总是感到焦虑，无法控制", score: { calm: -2, anxiety: 4, low: 1, depression: 2 } }
        ]
      },
      {
        id: 3,
        text: "你对日常活动的兴趣程度如何？",
        options: [
          { text: "对大多数活动都很感兴趣", score: { calm: 2, anxiety: 0, low: -1, depression: -2 } },
          { text: "对日常活动兴趣一般", score: { calm: 1, anxiety: 0, low: 0, depression: 0 } },
          { text: "对活动兴趣减少，提不起劲", score: { calm: 0, anxiety: 1, low: 2, depression: 2 } },
          { text: "对任何活动都失去兴趣", score: { calm: -1, anxiety: 1, low: 3, depression: 4 } }
        ]
      },
      {
        id: 4,
        text: "你的情绪状态通常是怎样的？",
        options: [
          { text: "情绪稳定，心情愉快", score: { calm: 3, anxiety: -1, low: -1, depression: -2 } },
          { text: "情绪基本稳定，偶有波动", score: { calm: 1, anxiety: 0, low: 0, depression: 0 } },
          { text: "情绪低落，容易沮丧", score: { calm: -1, anxiety: 1, low: 3, depression: 2 } },
          { text: "情绪很糟糕，经常绝望", score: { calm: -2, anxiety: 1, low: 2, depression: 4 } }
        ]
      },
      {
        id: 5,
        text: "你的精力水平如何？",
        options: [
          { text: "精力充沛，充满活力", score: { calm: 2, anxiety: 1, low: -1, depression: -1 } },
          { text: "精力正常，能够应对日常", score: { calm: 1, anxiety: 0, low: 0, depression: 0 } },
          { text: "精力不足，容易疲劳", score: { calm: 0, anxiety: 1, low: 2, depression: 1 } },
          { text: "几乎没有精力，总是疲惫", score: { calm: -1, anxiety: 1, low: 3, depression: 3 } }
        ]
      },
      {
        id: 6,
        text: "你对未来的看法如何？",
        options: [
          { text: "对未来充满希望和期待", score: { calm: 2, anxiety: -1, low: -2, depression: -2 } },
          { text: "对未来比较乐观", score: { calm: 1, anxiety: 0, low: -1, depression: -1 } },
          { text: "对未来感到不确定", score: { calm: 0, anxiety: 1, low: 1, depression: 1 } },
          { text: "对未来感到悲观绝望", score: { calm: -1, anxiety: 2, low: 3, depression: 4 } }
        ]
      },
      {
        id: 7,
        text: "你的社交状态如何？",
        options: [
          { text: "喜欢与人交流，有很多朋友", score: { calm: 1, anxiety: -1, low: -2, depression: -2 } },
          { text: "正常社交，有几个好朋友", score: { calm: 1, anxiety: 0, low: 0, depression: 0 } },
          { text: "社交减少，不太愿意与人交往", score: { calm: 0, anxiety: 1, low: 2, depression: 1 } },
          { text: "完全避免社交，感到孤独", score: { calm: -1, anxiety: 1, low: 3, depression: 3 } }
        ]
      },
      {
        id: 8,
        text: "你的工作或学习表现如何？",
        options: [
          { text: "表现很好，效率很高", score: { calm: 2, anxiety: 0, low: -1, depression: -1 } },
          { text: "表现正常，能完成任务", score: { calm: 1, anxiety: 0, low: 0, depression: 0 } },
          { text: "表现下降，难以集中注意力", score: { calm: 0, anxiety: 1, low: 2, depression: 1 } },
          { text: "表现很差，无法正常工作学习", score: { calm: -1, anxiety: 2, low: 3, depression: 3 } }
        ]
      },
      {
        id: 9,
        text: "你对压力的应对能力如何？",
        options: [
          { text: "能很好应对压力，保持冷静", score: { calm: 3, anxiety: -2, low: 0, depression: -1 } },
          { text: "基本能应对，偶尔感到压力", score: { calm: 1, anxiety: 1, low: 0, depression: 0 } },
          { text: "难以应对压力，经常感到紧张", score: { calm: 0, anxiety: 2, low: 1, depression: 1 } },
          { text: "完全无法应对，压力让我崩溃", score: { calm: -1, anxiety: 3, low: 2, depression: 3 } }
        ]
      },
      {
        id: 10,
        text: "你对现在的自己满意吗？",
        options: [
          { text: "非常满意，对自己很有信心", score: { calm: 2, anxiety: -1, low: -2, depression: -2 } },
          { text: "比较满意，基本满意现状", score: { calm: 1, anxiety: 0, low: 0, depression: 0 } },
          { text: "不太满意，希望有所改变", score: { calm: 0, anxiety: 1, low: 1, depression: 1 } },
          { text: "很不满意对自己感到失望", score: { calm: -1, anxiety: 1, low: 3, depression: 3 } }
        ]
      }
    ],

    emotionLabels: {
      calm: '平静',
      anxiety: '焦虑',
      low: '低落',
      depression: '抑郁'
    },

    primaryEmotion: '',
    emotionDescription: '',
    emotionScores: [],
    recommendations: []
  },

  onLoad() {
    this.resetTestState()
  },

  onShow() {
    try {
      const shouldReset = wx.getStorageSync('shouldResetEmotionTest')
      if (shouldReset) {
        wx.removeStorageSync('shouldResetEmotionTest')
        this.resetTestState()
      }
    } catch (error) {

    }
  },

  // 格式化情绪分数，保留指定小数位
  formatEmotionScores(score, decimals = 1) {
    return Math.round(score * Math.pow(10, decimals)) / Math.pow(10, decimals)
  },

  // 获取中文情绪标签
  getEmotionLabel(emotion) {
    const emotionLabels = {
      calm: '平静',
      anxiety: '焦虑',
      low: '低落',
      depression: '抑郁'
    }
    return emotionLabels[emotion] || emotion
  },

  // 初始化测试数据
  initTest() {
    const testStartTime = new Date().toISOString()
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this.setData({
      testStartTime: testStartTime,
      testId: testId
    })
  },

  resetTestState() {
    this.setData({
      currentQuestion: 1,
      progress: 0,
      selectedOption: null,
      showResults: false,
      showEarlySubmit: false,
      answers: [],
      primaryEmotion: '',
      emotionDescription: '',
      emotionScores: [],
      recommendations: []
    })
    this.initTest()
    this.updateProgress()
  },

  // 选择答案
  selectOption(e) {
    const optionIndex = e.currentTarget.dataset.index
    const hasChangedSelection = this.data.selectedOption !== optionIndex

    this.setData({
      selectedOption: optionIndex
    })

    if (hasChangedSelection && wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' })
    }
  },

  // 显示提前交卷确认
  showEarlySubmitModal() {
    const hasCurrentAnswer = this.data.selectedOption !== null && this.data.selectedOption !== undefined
    const currentQuestionAnswered = this.data.answers.some(answer => answer.questionId === this.data.currentQuestion)
    const completedQuestions = this.data.answers.length + (hasCurrentAnswer && !currentQuestionAnswered ? 1 : 0)
    const remainingQuestions = this.data.totalQuestions - completedQuestions

    wx.showModal({
      title: '查看当前结果',
      content: `你已完成 ${completedQuestions} 题，还有 ${remainingQuestions} 题未回答。可以先基于当前答案生成结果，也可以继续完成全部题目。`,
      confirmText: '查看结果',
      cancelText: '继续完成',
      success: (res) => {
        if (res.confirm) {
          this.earlySubmitTest()
        }
      }
    })
  },

  // 提前交卷
  earlySubmitTest() {
    let currentAnswers = [...this.data.answers]

    // 如果当前题目已选择答案，也包含在内
    if (this.data.selectedOption !== null && this.data.selectedOption !== undefined) {
      const currentAnswer = {
        questionId: this.data.currentQuestion,
        optionIndex: this.data.selectedOption,
        scores: this.data.questions[this.data.currentQuestion - 1].options[this.data.selectedOption].score
      }
      currentAnswers = currentAnswers.filter(answer => answer.questionId !== this.data.currentQuestion)
      currentAnswers.push(currentAnswer)
    }

    // 对未回答的问题设置为默认值
    const allAnswers = []
    for (let i = 1; i <= this.data.totalQuestions; i++) {
      const existingAnswer = currentAnswers.find(a => a.questionId === i)
      if (existingAnswer) {
        allAnswers.push(existingAnswer)
      } else {
        // 未回答的问题使用中性评分
        allAnswers.push({
          questionId: i,
          optionIndex: -1, // 表示未回答
          scores: { calm: 0, anxiety: 0, low: 0, depression: 0 },
          isEmpty: true
        })
      }
    }

    // 完成测试
    this.completeTest(allAnswers, true) // true 表示提前交卷
  },

  nextQuestion() {
    if (this.data.selectedOption === null || this.data.selectedOption === undefined) {
      wx.showToast({
        title: '请选择一个答案',
        icon: 'none'
      })
      return
    }

    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' })
    }

    // Save current answer
    const currentAnswer = {
      questionId: this.data.currentQuestion,
      optionIndex: this.data.selectedOption,
      scores: this.data.questions[this.data.currentQuestion - 1].options[this.data.selectedOption].score
    }

    const answers = this.data.answers
      .filter(answer => answer.questionId !== this.data.currentQuestion)
      .concat(currentAnswer)
      .sort((a, b) => a.questionId - b.questionId)

    if (this.data.currentQuestion < this.data.totalQuestions) {
      const nextQuestion = this.data.currentQuestion + 1
      const nextAnswer = answers.find(answer => answer.questionId === nextQuestion)
      // Next question
      this.setData({
        currentQuestion: nextQuestion,
        selectedOption: nextAnswer ? nextAnswer.optionIndex : null,
        answers: answers
      })
      this.updateProgress()
    } else {
      // Complete test
      wx.showLoading({
        title: '生成结果中',
        mask: true
      })
      this.completeTest(answers)
      wx.hideLoading()
    }
  },

  previousQuestion() {
    if (this.data.currentQuestion > 1) {
      const previousAnswer = this.data.answers[this.data.currentQuestion - 2]
      this.setData({
        currentQuestion: this.data.currentQuestion - 1,
        selectedOption: previousAnswer ? previousAnswer.optionIndex : null
      })
      this.updateProgress()
    }
  },

  updateProgress() {
    const progress = ((this.data.currentQuestion - 1) / this.data.totalQuestions) * 100
    this.setData({
      progress: progress
    })
  },

  completeTest(answers, isEarlySubmit = false) {
    // Calculate emotion scores
    const emotionScores = {
      calm: 0,
      anxiety: 0,
      low: 0,
      depression: 0
    }

    // 只计算有回答的问题分数
    answers.forEach(answer => {
      if (!answer.isEmpty && answer.scores) {
        Object.keys(answer.scores).forEach(emotion => {
          emotionScores[emotion] += answer.scores[emotion]
        })
      }
    })

    // Convert to percentage and find primary emotion
    const maxScore = Math.max(...Object.values(emotionScores))
    const minScore = Math.min(...Object.values(emotionScores))
    const range = maxScore - minScore || 1

    const emotionScoresArray = Object.keys(emotionScores).map(emotion => ({
      emotion: emotion,
      label: this.getEmotionLabel(emotion), // 添加中文标签
      score: this.formatEmotionScores(Math.max(0, Math.min(100, ((emotionScores[emotion] - minScore) / range) * 100)), 1) // 保留1位小数
    }))

    const primaryEmotion = emotionScoresArray.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    ).emotion

    // Generate recommendations
    const recommendations = this.generateRecommendations(primaryEmotion, emotionScores)

    // Generate description
    const emotionDescription = this.getEmotionDescription(primaryEmotion, emotionScores, isEarlySubmit)

    this.setData({
      showResults: true,
      primaryEmotion: primaryEmotion,
      emotionDescription: emotionDescription,
      emotionScores: emotionScoresArray,
      recommendations: recommendations
    })

    // Save results with history
    this.saveTestResults(answers, primaryEmotion, emotionScoresArray, isEarlySubmit)
  },

  generateRecommendations(primaryEmotion, emotionScores) {
    const recommendations = []

    switch (primaryEmotion) {
      case 'calm':
        recommendations.push('继续保持良好的情绪状态')
        recommendations.push('尝试冥想或瑜伽来维持内心平静')
        recommendations.push('推荐游戏：森林微风、禅意拼图')
        break
      case 'anxiety':
        recommendations.push('尝试深呼吸练习来缓解焦虑')
        recommendations.push('保持规律的作息时间')
        recommendations.push('推荐游戏：泡泡爆破、记忆卡片')
        break
      case 'low':
        recommendations.push('多与朋友家人交流，分享感受')
        recommendations.push('尝试户外散步，接触自然')
        recommendations.push('推荐游戏：云端漂流、禅意拼图')
        break
      case 'depression':
        recommendations.push('建议寻求专业心理咨询师的帮助')
        recommendations.push('保持简单的日常活动，逐步建立信心')
        recommendations.push('推荐游戏：光之治愈、记忆卡片')
        break
    }

    return recommendations
  },

  getEmotionDescription(primaryEmotion, emotionScores, isEarlySubmit = false) {
    let baseDescription = ''
    const earlySubmitNote = isEarlySubmit ? '（注：本次测试为提前交卷）' : ''

    const descriptions = {
      calm: `你的情绪状态相对平静，这表明你目前的心理状态比较健康。继续保持这种积极的心态。${earlySubmitNote}`,
      anxiety: `你表现出一定的焦虑倾向，这是很多人都会经历的情绪状态。适当的放松和调节会有帮助。${earlySubmitNote}`,
      low: `你目前情绪较为低落，这可能与生活压力或环境因素有关。适当的休息和调整很重要。${earlySubmitNote}`,
      depression: `你的测试结果显示可能有抑郁倾向，建议寻求专业的心理健康支持。${earlySubmitNote}`
    }

    return descriptions[primaryEmotion] || `基于你的回答，我们为你提供了个性化的情绪分析。${earlySubmitNote}`
  },

  saveTestResults(answers, primaryEmotion, emotionScores, isEarlySubmit = false) {
    const testResult = {
      timestamp: new Date().toISOString(),
      testStartTime: this.data.testStartTime,
      testEndTime: new Date().toISOString(),
      testId: this.data.testId,
      answers: answers,
      primaryEmotion: primaryEmotion,
      emotionScores: emotionScores,
      recommendations: this.data.recommendations,
      emotionType: primaryEmotion,
      recommendedGame: this.getRecommendedGame(primaryEmotion),
      isEarlySubmit: isEarlySubmit,
      completedQuestions: answers.filter(a => !a.isEmpty).length,
      totalQuestions: this.data.totalQuestions
    }

    try {
      // Save to global data
      const app = getApp()
      app.globalData.lastEmotionTest = testResult
      app.globalData.emotionTestResults = testResult

      // Save to storage (enhanced history)
      const storedResults = wx.getStorageSync('emotionTestResults')
      const existingResults = Array.isArray(storedResults)
        ? storedResults.filter(Boolean)
        : (storedResults ? [storedResults] : [])
      const existingIndex = existingResults.findIndex(item => item.testId === testResult.testId)

      if (existingIndex >= 0) {
        existingResults[existingIndex] = { ...existingResults[existingIndex], ...testResult }
      } else {
        existingResults.push(testResult)
      }

      // 只保留最近50次测试结果
      if (existingResults.length > 50) {
        existingResults.splice(0, existingResults.length - 50)
      }

      wx.setStorageSync('emotionTestResults', existingResults)
      wx.setStorageSync('currentEmotionTestResult', testResult)

      // Update analytics
      this.updateAnalytics(testResult)

    } catch (error) {
      console.error('保存测试结果失败:', error)
    }
  },

  getRecommendedGame(emotionType) {
    const gameMap = {
      'calm': 'forest-breeze',
      'anxiety': 'bubble-pop',
      'low': 'cloud-drifting',
      'depression': 'light-healing'
    }
    return gameMap[emotionType] || 'forest-breeze'
  },

  updateAnalytics(testResult) {
    try {
      let analyticsData = wx.getStorageSync('analyticsData') || {}

      // Update emotion distribution
      if (!analyticsData.emotionDistribution) {
        analyticsData.emotionDistribution = [
          { emotion: 'calm', label: '平静', count: 0, percentage: 0 },
          { emotion: 'anxiety', label: '焦虑', count: 0, percentage: 0 },
          { emotion: 'low', label: '低落', count: 0, percentage: 0 },
          { emotion: 'depression', label: '抑郁', count: 0, percentage: 0 }
        ]
      }

      const emotionEntry = analyticsData.emotionDistribution.find(
        item => item.emotion === testResult.primaryEmotion
      )
      if (emotionEntry) {
        emotionEntry.count += 1
      }

      // Recalculate percentages
      const total = analyticsData.emotionDistribution.reduce((sum, item) => sum + item.count, 0)
      analyticsData.emotionDistribution.forEach(item => {
        item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
      })

      // Update total tests count
      analyticsData.totalTests = (analyticsData.totalTests || 0) + 1

      wx.setStorageSync('analyticsData', analyticsData)

    } catch (error) {

    }
  },

  viewRecommendedGames() {
    wx.redirectTo({
      url: '/pages/results/results'
    })
  },

  retakeTest() {
    this.resetTestState()
  },

  onShareAppMessage() {
    return {
      title: '情绪评估测试 - 了解你的心理状态',
      path: '/pages/emotion-test/emotion-test'
    }
  }
})
