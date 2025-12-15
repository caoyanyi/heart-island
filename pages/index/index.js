const { audioManager } = require('../../utils/audio-manager.js')

Page({
  data: {
    animationData: {}
  },

  onLoad() {
    // Initialize welcome animation
    this.startWelcomeAnimation()

    // Play gentle background sound if audio is enabled
    if (getApp().globalData.audioEnabled) {
      this.playWelcomeSound()
    }
  },

  onShow() {
    // Check if user has previous emotion test results
    const app = getApp()
    if (app.globalData.emotionTestResults.length > 0) {
      this.setData({
        hasPreviousResults: true,
        lastEmotion: app.globalData.emotionTestResults[app.globalData.emotionTestResults.length - 1].emotionType
      })
    }
  },

  startWelcomeAnimation() {
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

    // Continue animation loop
    setInterval(() => {
      this.startWelcomeAnimation()
    }, 4000)
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
    wx.navigateTo({
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
    wx.navigateTo({
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
    // Clean up audio using audio manager
    if (this.innerAudioContext) {
      audioManager.stopAndDestroy(this.innerAudioContext)
      this.innerAudioContext = null
    }
  }
})