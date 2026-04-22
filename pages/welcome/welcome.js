Page({
  data: {
    hasShownContinueModal: false,
    moodOptions: [
      { key: 'calm', icon: '🌿', label: '平静' },
      { key: 'happy', icon: '☀️', label: '轻松' },
      { key: 'tired', icon: '🌙', label: '疲惫' },
      { key: 'anxious', icon: '🌧️', label: '焦虑' },
      { key: 'low', icon: '🍂', label: '低落' }
    ],
    selectedMood: '',
    moodNote: '',
    todayMoodLabel: '',
    todayMoodNote: '',
    hasTodayMood: false
  },

  onLoad() {
    // Initialize welcome page
    this.loadUserProgress()
  },

  onShow() {
    this.loadTodayMood()

    // Check if user has completed emotion test before
    const app = getApp()
    if (app.globalData.emotionTestResults && !this.data.hasShownContinueModal) {
      // User has completed test, offer to go directly to games
      this.setData({ hasShownContinueModal: true })
      this.showContinueOption()
    }
  },

  loadUserProgress() {
    // Load any saved user progress or preferences
    try {
      const progress = wx.getStorageSync('userProgress')
      if (progress) {
        // Handle existing user data
      }
    } catch (error) {

    }
  },

  loadTodayMood() {
    const summary = getApp().getMoodSummary()
    const todayMood = summary.todayCheckin

    this.setData({
      selectedMood: todayMood ? todayMood.mood : '',
      moodNote: todayMood ? todayMood.note : '',
      todayMoodLabel: todayMood ? todayMood.moodLabel : '',
      todayMoodNote: todayMood ? todayMood.note : '',
      hasTodayMood: !!todayMood
    })
  },

  selectMood(e) {
    const mood = e.currentTarget.dataset.mood
    this.setData({ selectedMood: mood })

    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' })
    }
  },

  onMoodNoteInput(e) {
    this.setData({ moodNote: e.detail.value })
  },

  saveMoodCheckin() {
    if (!this.data.selectedMood) {
      wx.showToast({
        title: '先选择一个心情',
        icon: 'none'
      })
      return
    }

    const checkin = getApp().recordMoodCheckin({
      mood: this.data.selectedMood,
      note: this.data.moodNote
    })

    this.setData({
      todayMoodLabel: checkin.moodLabel,
      todayMoodNote: checkin.note,
      hasTodayMood: true
    })

    wx.showToast({
      title: '已记录',
      icon: 'success'
    })
  },

  showContinueOption() {
    // Show option to continue to games or retake test
    wx.showModal({
      title: '欢迎回来',
      content: '你已经完成了情绪测试，要继续上次的游戏吗？',
      confirmText: '继续游戏',
      cancelText: '重新测试',
      success: (res) => {
        if (res.confirm) {
          // Go to game selector
          wx.switchTab({
            url: '/pages/game-selector/game-selector'
          })
        } else if (res.cancel) {
          // Reset and allow retake
          this.resetUserData()
        }
      }
    })
  },

  resetUserData() {
    // Clear emotion test results to allow retake
    const app = getApp()
    app.globalData.emotionTestResults = null
    
    try {
      wx.setStorageSync('shouldResetEmotionTest', true)
    } catch (error) {
    }

    wx.switchTab({
      url: '/pages/emotion-test/emotion-test'
    })
  },

  startEmotionTest() {
    // Navigate to emotion test
    wx.switchTab({
      url: '/pages/emotion-test/emotion-test'
    })
  },

  navigateToAssessment() {
    // Navigate to emotion assessment
    wx.switchTab({
      url: '/pages/emotion-test/emotion-test'
    })
  },

  navigateToGames() {
    // Navigate to game selector
    wx.switchTab({
      url: '/pages/game-selector/game-selector'
    })
  },

  navigateToProgress() {
    // Navigate to progress tracking
    wx.navigateTo({
      url: '/pages/progress/progress'
    })
  },

  onShareAppMessage() {
    // Share functionality
    return {
      title: '心岛游戏 - 治愈你的内心世界',
      path: '/pages/welcome/welcome',
      imageUrl: '/assets/images/share-default.jpg'
    }
  }
})
