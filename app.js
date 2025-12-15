const { audioManager } = require('./utils/audio-manager.js')

App({
  globalData: {
    userInfo: null,
    emotionTestResults: null,
    gameProgress: {},
    audioSettings: {
      isMuted: false,
      volume: 0.7,
      currentTrack: 'nature-ambient'
    }
  },

  onLaunch() {
    // Load user data from storage
    this.loadUserData()

    // Initialize audio system
    this.initAudioSystem()


  },

  loadUserData() {
    try {
      // Load emotion test results
      const emotionResults = wx.getStorageSync('emotionTestResults')
      if (emotionResults && emotionResults.length > 0) {
        // 使用最新的测试结果
        this.globalData.emotionTestResults = emotionResults[emotionResults.length - 1]
      }

      // Load game progress
      const gameProgress = wx.getStorageSync('gameProgress')
      if (gameProgress) {
        this.globalData.gameProgress = gameProgress
      }

      // Load audio settings
      const audioSettings = wx.getStorageSync('audioSettings')
      if (audioSettings) {
        this.globalData.audioSettings = audioSettings
      }
    } catch (error) {

    }
  },

  saveUserData() {
    try {
      // Save emotion test results
      if (this.globalData.emotionTestResults) {
        wx.setStorageSync('emotionTestResults', this.globalData.emotionTestResults)
      }

      // Save game progress
      wx.setStorageSync('gameProgress', this.globalData.gameProgress)

      // Save audio settings
      wx.setStorageSync('audioSettings', this.globalData.audioSettings)
    } catch (error) {

    }
  },

  async initAudioSystem() {
    try {
      // 使用音频管理器验证音频系统
      const isAudioAvailable = await audioManager.validateAudioSystem()

      if (!isAudioAvailable) {
        console.log('Audio system not available, running in silent mode')
        this.globalData.audioContext = null
        this.globalData.audioSettings.isMuted = true
        return
      }

      // 创建音频上下文
      this.globalData.audioContext = audioManager.createAudioInstance({
        volume: this.globalData.audioSettings.volume,
        loop: true
      })

      // 验证音频文件
      await this.validateAudioFiles()

    } catch (error) {
      console.warn('Audio system initialization failed:', error)
      this.globalData.audioContext = null
      this.globalData.audioSettings.isMuted = true
    }
  },

  async validateAudioFiles() {
    // 使用音频管理器验证音频文件
    try {
      const isValid = await audioManager.loadAudioFile(
        this.globalData.audioContext,
        'https://file.okrcn.com/wx/sounds/welcome-ambient.mp3'
      )

      if (isValid) {
        // 延迟播放背景音乐
        setTimeout(() => {
          if (!this.globalData.audioSettings.isMuted && this.globalData.audioContext) {
            this.playBackgroundMusic()
          }
        }, 1000)
      } else {
        console.warn('Audio files validation failed - switching to silent mode')
        this.globalData.audioSettings.isMuted = true
        if (this.globalData.audioContext) {
          audioManager.stopAndDestroy(this.globalData.audioContext)
          this.globalData.audioContext = null
        }
      }
    } catch (error) {
      console.warn('Audio validation error:', error)
      this.globalData.audioSettings.isMuted = true
      if (this.globalData.audioContext) {
        audioManager.stopAndDestroy(this.globalData.audioContext)
        this.globalData.audioContext = null
      }
    }
  },

  async playBackgroundMusic() {
    if (this.globalData.audioContext && !this.globalData.audioSettings.isMuted) {
      const tracks = {
        'nature-ambient': 'https://file.okrcn.com/wx/sounds/welcome-ambient.mp3',
        'forest-sounds': 'https://file.okrcn.com/wx/sounds/welcome-ambient.mp3',
        'ocean-waves': 'https://file.okrcn.com/wx/sounds/welcome-ambient.mp3',
        'rain-sounds': 'https://file.okrcn.com/wx/sounds/welcome-ambient.mp3',
        'bird-songs': 'https://file.okrcn.com/wx/sounds/welcome-ambient.mp3',
        'wind-chimes': 'https://file.okrcn.com/wx/sounds/welcome-ambient.mp3'
      }

      try {
        const audioPath = tracks[this.globalData.audioSettings.currentTrack] || tracks['nature-ambient']

        // 使用音频管理器加载音频文件
        const loadSuccess = await audioManager.loadAudioFile(this.globalData.audioContext, audioPath)

        if (loadSuccess) {
          await this.globalData.audioContext.play()
        } else {
          console.warn('Background music load failed')
          this.globalData.audioSettings.isMuted = true
          if (this.globalData.audioContext) {
            audioManager.stopAndDestroy(this.globalData.audioContext)
            this.globalData.audioContext = null
          }
        }
      } catch (error) {
        console.warn('Background music setup failed:', error)
        this.globalData.audioSettings.isMuted = true
        if (this.globalData.audioContext) {
          audioManager.stopAndDestroy(this.globalData.audioContext)
          this.globalData.audioContext = null
        }
      }
    }
  },

  pauseBackgroundMusic() {
    if (this.globalData.audioContext) {
      this.globalData.audioContext.pause()
    }
  },

  async playSoundEffect(effectType) {
    if (this.globalData.audioSettings.isMuted) return

    const effects = {
      bubble: 'https://file.okrcn.com/wx/sounds/pop.mp3',
      click: 'https://file.okrcn.com/wx/sounds/pop.mp3',
      success: 'https://file.okrcn.com/wx/sounds/pop.mp3',
      collect: 'https://file.okrcn.com/wx/sounds/pop.mp3',
      wind: 'https://file.okrcn.com/wx/sounds/pop.mp3',
      light: 'https://file.okrcn.com/wx/sounds/pop.mp3'
    }

    const audioPath = effects[effectType] || effects.click
    const volume = this.globalData.audioSettings.volume * 0.5

    try {
      await audioManager.playSoundEffect(audioPath, volume)
    } catch (error) {
      console.warn('Sound effect play error:', error)
    }
  },

  updateAudioSettings(settings) {
    this.globalData.audioSettings = { ...this.globalData.audioSettings, ...settings }

    // Update audio context
    if (this.globalData.audioContext) {
      this.globalData.audioContext.volume = this.globalData.audioSettings.isMuted ? 0 : this.globalData.audioSettings.volume
    }

    this.saveUserData()
  },

  onHide() {
    // Pause background music when app goes to background
    this.pauseBackgroundMusic()
  },

  onShow() {
    // Resume background music when app comes to foreground
    if (!this.globalData.audioSettings.isMuted) {
      this.playBackgroundMusic()
    }
  }
})