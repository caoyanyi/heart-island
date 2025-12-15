/**
 * 音频管理器 - 提供统一的音频加载和错误处理
 * 处理音频文件损坏、加载失败等问题，提供降级方案
 */

class AudioManager {
  constructor() {
    this.audioCache = new Map()
    this.isAudioAvailable = true
    this.audioValidationCompleted = false
  }

  /**
   * 验证音频系统是否可用
   */
  async validateAudioSystem() {
    if (this.audioValidationCompleted) {
      return this.isAudioAvailable
    }

    try {
      // 测试音频文件
      const testAudio = wx.createInnerAudioContext()

      return new Promise((resolve) => {
        let timeoutId = setTimeout(() => {
          console.warn('Audio validation timeout')
          testAudio.destroy()
          this.isAudioAvailable = false
          this.audioValidationCompleted = true
          resolve(false)
        }, 2000)

        testAudio.onCanplay(() => {
          clearTimeout(timeoutId)
          testAudio.destroy()
          this.isAudioAvailable = true
          this.audioValidationCompleted = true
          resolve(true)
        })

        testAudio.onError((err) => {
          clearTimeout(timeoutId)
          console.warn('Audio validation failed:', err)
          testAudio.destroy()
          this.isAudioAvailable = false
          this.audioValidationCompleted = true
          resolve(false)
        })

        testAudio.src = 'https://file.okrcn.com/wx/sounds/pop.mp3'
      })
    } catch (error) {
      console.warn('Audio system validation error:', error)
      this.isAudioAvailable = false
      this.audioValidationCompleted = true
      return false
    }
  }

  /**
   * 创建音频实例（带错误处理）
   */
  createAudioInstance(config = {}) {
    if (!this.isAudioAvailable) {
      return this.createSilentAudioInstance()
    }

    try {
      const audioContext = wx.createInnerAudioContext()

      // 设置默认配置
      const defaultConfig = {
        volume: 0.7,
        loop: false,
        autoplay: false
      }

      const finalConfig = { ...defaultConfig, ...config }

      // 应用配置
      if (finalConfig.volume !== undefined) {
        audioContext.volume = finalConfig.volume
      }
      if (finalConfig.loop !== undefined) {
        audioContext.loop = finalConfig.loop
      }

      // 添加错误处理
      audioContext.onError((err) => {
        console.warn('Audio instance error:', err)
        this.handleAudioError(audioContext)
      })

      // 包装原始方法，添加错误处理
      const originalPlay = audioContext.play.bind(audioContext)
      audioContext.play = () => {
        if (!this.isAudioAvailable) {
          return Promise.resolve()
        }

        try {
          return originalPlay().catch((err) => {
            console.warn('Audio play failed:', err)
            this.handleAudioError(audioContext)
            return Promise.resolve()
          })
        } catch (error) {
          console.warn('Audio play error:', error)
          return Promise.resolve()
        }
      }

      return audioContext
    } catch (error) {
      console.warn('Failed to create audio instance:', error)
      return this.createSilentAudioInstance()
    }
  }

  /**
   * 创建静默音频实例（当音频不可用时）
   */
  createSilentAudioInstance() {
    return {
      play: () => Promise.resolve(),
      pause: () => {},
      stop: () => {},
      destroy: () => {},
      src: '',
      volume: 0,
      loop: false,
      currentTime: 0,
      duration: 0,
      paused: true,
      onError: () => {},
      onCanplay: () => {},
      onEnded: () => {}
    }
  }

  /**
   * 处理音频错误
   */
  handleAudioError(audioContext) {
    try {
      if (audioContext && typeof audioContext.destroy === 'function') {
        audioContext.destroy()
      }
    } catch (error) {
      console.warn('Failed to destroy audio context:', error)
    }

    // 提供震动反馈作为降级方案
    this.provideHapticFeedback()
  }

  /**
   * 提供触觉反馈（降级方案）
   */
  provideHapticFeedback() {
    try {
      if (wx.vibrateShort) {
        wx.vibrateShort()
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  /**
   * 安全加载音频文件
   */
  async loadAudioFile(audioContext, audioPath, timeout = 3000) {
    if (!this.isAudioAvailable || !audioContext) {
      return false
    }

    try {
      return new Promise((resolve) => {
        let timeoutId = setTimeout(() => {
          console.warn('Audio file load timeout:', audioPath)
          resolve(false)
        }, timeout)

        audioContext.onCanplay(() => {
          clearTimeout(timeoutId)
          resolve(true)
        })

        audioContext.onError((err) => {
          clearTimeout(timeoutId)
          console.warn('Audio file load failed:', audioPath, err)
          resolve(false)
        })

        audioContext.src = audioPath
      })
    } catch (error) {
      console.warn('Audio file load error:', audioPath, error)
      return false
    }
  }

  /**
   * 播放音效（带自动清理）
   */
  async playSoundEffect(audioPath, volume = 0.5) {
    if (!this.isAudioAvailable) {
      this.provideHapticFeedback()
      return
    }

    const soundContext = this.createAudioInstance({
      volume: volume,
      loop: false
    })

    const loadSuccess = await this.loadAudioFile(soundContext, audioPath)

    if (loadSuccess) {
      try {
        await soundContext.play()

        // 播放完成后自动清理
        soundContext.onEnded(() => {
          soundContext.destroy()
        })
      } catch (error) {
        console.warn('Sound effect play error:', error)
        soundContext.destroy()
      }
    } else {
      // 音频加载失败，使用震动反馈
      this.provideHapticFeedback()
      soundContext.destroy()
    }
  }

  /**
   * 播放背景音乐（带循环和错误恢复）
   */
  async playBackgroundMusic(audioPath, volume = 0.3) {
    if (!this.isAudioAvailable) {
      return null
    }

    const musicContext = this.createAudioInstance({
      volume: volume,
      loop: true
    })

    const loadSuccess = await this.loadAudioFile(musicContext, audioPath)

    if (loadSuccess) {
      try {
        await musicContext.play()
        return musicContext
      } catch (error) {
        console.warn('Background music play error:', error)
        musicContext.destroy()
        return null
      }
    } else {
      musicContext.destroy()
      return null
    }
  }

  /**
   * 停止并销毁音频实例
   */
  stopAndDestroy(audioContext) {
    try {
      if (audioContext) {
        if (typeof audioContext.stop === 'function') {
          audioContext.stop()
        }
        if (typeof audioContext.destroy === 'function') {
          audioContext.destroy()
        }
      }
    } catch (error) {
      console.warn('Failed to stop and destroy audio:', error)
    }
  }
}

// 创建全局音频管理器实例
const audioManager = new AudioManager()

module.exports = {
  AudioManager,
  audioManager
}