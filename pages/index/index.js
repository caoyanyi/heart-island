const { audioManager } = require('../../utils/audio-manager.js')

Page({
  data: {
    animationData: {}
  },

  onLoad() {
    // Initialize welcome animation
    this.startWelcomeAnimation()

    // Play gentle background sound if audio is enabled
    const audioSettings = getApp().globalData.audioSettings || {}
    if (!audioSettings.isMuted) {
      this.playWelcomeSound()
    }
  },

  onShow() {
    this.startWelcomeAnimation()

    // Check if user has previous emotion test results
    const app = getApp()
    const emotionResults = app.globalData.emotionTestResults
    const latestResult = Array.isArray(emotionResults)
      ? emotionResults[emotionResults.length - 1]
      : emotionResults

    if (latestResult) {
      this.setData({
        hasPreviousResults: true,
        lastEmotion: latestResult.emotionType || latestResult.primaryEmotion
      })
    }
  },

  startWelcomeAnimation() {
    this.runWelcomeAnimation()

    if (this.welcomeAnimationTimer) {
      clearInterval(this.welcomeAnimationTimer)
    }

    // Continue animation loop without creating nested timers
    this.welcomeAnimationTimer = setInterval(() => {
      this.runWelcomeAnimation()
    }, 4000)
  },

  runWelcomeAnimation() {
    const animation = wx.createAnimation({
      duration: 2000,
      timingFunction: 'ease-in-out',
      delay: 500
    })

    // Floating animation for clouds
    animation.translateY(-20).step()
    animation.translateY(0).step()

    this.setData({
      animationData: animation.export()
    })
  },

  async playWelcomeSound() {
    try {
      // 验证音频系统
      await audioManager.validateAudioSystem()

      // 使用音频管理器播放背景音乐
      this.innerAudioContext = await audioManager.playBackgroundMusic('https://file.okrcn.com/wx/sounds/welcome-ambient.mp3', 0.3)

      if (!this.innerAudioContext) {
        console.log('Welcome sound not available, using silent mode')
      }
    } catch (error) {
      console.warn('Failed to play welcome sound:', error)
      this.innerAudioContext = null
    }
  },

  startEmotionTest() {
    // Navigate to emotion test page
    wx.switchTab({
      url: '/pages/emotion-test/emotion-test',
      success: () => {
        // Stop welcome sound
        if (this.innerAudioContext) {
          this.innerAudioContext.stop()
        }
      }
    })
  },

  exploreGames() {
    // Navigate to game selector page
    wx.switchTab({
      url: '/pages/game-selector/game-selector',
      success: () => {
        // Stop welcome sound
        if (this.innerAudioContext) {
          this.innerAudioContext.stop()
        }
      }
    })
  },

  onUnload() {
    if (this.welcomeAnimationTimer) {
      clearInterval(this.welcomeAnimationTimer)
      this.welcomeAnimationTimer = null
    }

    // Clean up audio using audio manager
    if (this.innerAudioContext) {
      audioManager.stopAndDestroy(this.innerAudioContext)
      this.innerAudioContext = null
    }
  },

  onHide() {
    if (this.welcomeAnimationTimer) {
      clearInterval(this.welcomeAnimationTimer)
      this.welcomeAnimationTimer = null
    }
  }
})
