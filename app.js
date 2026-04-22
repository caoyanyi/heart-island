const { audioManager } = require('./utils/audio-manager.js')

const GAME_NAMES = {
  'cloud-drifting': '云端漂流',
  'bubble-pop': '泡泡爆破',
  'forest-breeze': '森林微风',
  'light-healing': '光之治愈',
  'zen-puzzle': '禅意拼图',
  'memory-cards': '记忆卡片'
}

const MOOD_LABELS = {
  calm: '平静',
  happy: '轻松',
  tired: '疲惫',
  anxious: '焦虑',
  low: '低落'
}

function padNumber(number) {
  return number < 10 ? `0${number}` : `${number}`
}

App({
  globalData: {
    userInfo: null,
    emotionTestResults: null,
    emotionTestHistory: [],
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
      const currentEmotionResult = wx.getStorageSync('currentEmotionTestResult')
      const emotionResults = wx.getStorageSync('emotionTestResults')
      const emotionHistory = this.normalizeEmotionResults(emotionResults)
      if (currentEmotionResult || emotionHistory.length > 0) {
        this.globalData.emotionTestHistory = emotionHistory
        // 使用最新的测试结果
        this.globalData.emotionTestResults = currentEmotionResult || emotionHistory[emotionHistory.length - 1]

        // 兼容旧版本曾经写入对象的情况，统一迁移为历史数组
        if (!Array.isArray(emotionResults)) {
          wx.setStorageSync('emotionTestResults', emotionHistory)
        }
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
        const storedResults = wx.getStorageSync('emotionTestResults')
        const emotionHistory = this.normalizeEmotionResults(storedResults)
        const currentResult = this.globalData.emotionTestResults
        const resultIndex = emotionHistory.findIndex(item => (
          (currentResult.testId && item.testId === currentResult.testId) ||
          (currentResult.timestamp && item.timestamp === currentResult.timestamp)
        ))

        if (resultIndex >= 0) {
          emotionHistory[resultIndex] = { ...emotionHistory[resultIndex], ...currentResult }
        } else {
          emotionHistory.push(currentResult)
        }

        if (emotionHistory.length > 50) {
          emotionHistory.splice(0, emotionHistory.length - 50)
        }

        this.globalData.emotionTestHistory = emotionHistory
        wx.setStorageSync('emotionTestResults', emotionHistory)
        wx.setStorageSync('currentEmotionTestResult', currentResult)
      }

      // Save game progress
      wx.setStorageSync('gameProgress', this.globalData.gameProgress)

      // Save audio settings
      wx.setStorageSync('audioSettings', this.globalData.audioSettings)
    } catch (error) {

    }
  },

  normalizeEmotionResults(results) {
    if (!results) {
      return []
    }

    if (Array.isArray(results)) {
      return results.filter(Boolean)
    }

    if (typeof results === 'object') {
      return [results]
    }

    return []
  },

  getDateKey(timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date()
    return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
  },

  getWeekStartKey(timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date()
    const day = date.getDay() || 7
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - day + 1)
    return this.getDateKey(date.getTime())
  },

  getGameName(gameId) {
    return GAME_NAMES[gameId] || '未知游戏'
  },

  normalizeGameSessions(sessions) {
    return Array.isArray(sessions) ? sessions.filter(Boolean) : []
  },

  getGameStats(sessions) {
    const stats = {}

    this.normalizeGameSessions(sessions).forEach(session => {
      const game = session.game
      if (!game) return

      if (!stats[game]) {
        stats[game] = {
          game,
          name: this.getGameName(game),
          count: 0,
          totalDuration: 0,
          bestScore: 0,
          lastPlayedAt: 0
        }
      }

      stats[game].count += 1
      stats[game].totalDuration += session.duration || 0
      stats[game].bestScore = Math.max(stats[game].bestScore, session.score || 0)
      stats[game].lastPlayedAt = Math.max(stats[game].lastPlayedAt, session.timestamp || 0)
    })

    return stats
  },

  buildUserProgress(sessions, previousProgress = {}) {
    const safeSessions = this.normalizeGameSessions(sessions)
    const lastSession = safeSessions[safeSessions.length - 1] || null
    const gameCounts = {}
    const activeDays = {}
    const currentWeek = this.getWeekStartKey()
    let totalPlayTime = 0

    safeSessions.forEach(session => {
      if (session.game) {
        gameCounts[session.game] = (gameCounts[session.game] || 0) + 1
      }
      if (session.weekKey === currentWeek && session.dateKey) {
        activeDays[session.dateKey] = true
      }
      totalPlayTime += session.duration || 0
    })

    const favoriteGame = Object.keys(gameCounts).sort((a, b) => gameCounts[b] - gameCounts[a])[0] || ''
    let streakDays = 0
    const dayMap = {}
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)

    safeSessions.forEach(session => {
      if (session.dateKey) {
        dayMap[session.dateKey] = true
      }
    })

    while (dayMap[this.getDateKey(cursor.getTime())]) {
      streakDays += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    return {
      ...previousProgress,
      totalSessions: safeSessions.length,
      totalPlayTime,
      favoriteGame,
      weeklyGoal: previousProgress.weeklyGoal || 7,
      weeklyProgress: Object.keys(activeDays).length,
      streakDays,
      lastPlayedGame: lastSession ? lastSession.game : '',
      lastPlayedAt: lastSession ? lastSession.timestamp : 0,
      playedGames: Object.keys(this.getGameStats(safeSessions))
    }
  },

  recordGameSession(options) {
    const now = Date.now()
    const session = {
      id: `${now}-${Math.floor(Math.random() * 10000)}`,
      game: options.game,
      gameName: this.getGameName(options.game),
      score: options.score || 0,
      duration: options.duration || 60,
      completed: !!options.completed,
      detail: options.detail || {},
      timestamp: now,
      dateKey: this.getDateKey(now),
      weekKey: this.getWeekStartKey(now)
    }

    const sessions = this.normalizeGameSessions(wx.getStorageSync('gameSessions'))
    sessions.push(session)

    if (sessions.length > 120) {
      sessions.splice(0, sessions.length - 120)
    }

    const progress = this.buildUserProgress(sessions, wx.getStorageSync('userProgress') || {})
    wx.setStorageSync('gameSessions', sessions)
    wx.setStorageSync('userProgress', progress)

    return { session, progress }
  },

  getProgressSummary() {
    const sessions = this.normalizeGameSessions(wx.getStorageSync('gameSessions'))
    const progress = this.buildUserProgress(sessions, wx.getStorageSync('userProgress') || {})
    const todayKey = this.getDateKey()
    const todaySessions = sessions.filter(session => session.dateKey === todayKey)
    const todayMinutes = Math.floor(todaySessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60)
    const stats = this.getGameStats(sessions)
    const recentGames = []
    const seen = {}

    sessions.slice().reverse().forEach(session => {
      if (session.game && !seen[session.game]) {
        seen[session.game] = true
        recentGames.push({
          game: session.game,
          name: this.getGameName(session.game),
          score: session.score || 0,
          timestamp: session.timestamp
        })
      }
    })

    return {
      progress,
      sessions,
      todayCount: todaySessions.length,
      todayMinutes,
      streakDays: progress.streakDays || 0,
      lastSession: sessions[sessions.length - 1] || null,
      gameStats: stats,
      recentGames: recentGames.slice(0, 3)
    }
  },

  getMoodLabel(mood) {
    return MOOD_LABELS[mood] || '未知'
  },

  normalizeMoodCheckins(checkins) {
    return Array.isArray(checkins) ? checkins.filter(Boolean) : []
  },

  recordMoodCheckin(options) {
    const now = Date.now()
    const dateKey = this.getDateKey(now)
    const checkins = this.normalizeMoodCheckins(wx.getStorageSync('moodCheckins'))
    const existingIndex = checkins.findIndex(item => item.dateKey === dateKey)
    const note = (options.note || '').trim().slice(0, 60)
    const checkin = {
      id: existingIndex >= 0 ? checkins[existingIndex].id : `${now}-${Math.floor(Math.random() * 10000)}`,
      mood: options.mood,
      moodLabel: this.getMoodLabel(options.mood),
      note,
      dateKey,
      timestamp: now
    }

    if (existingIndex >= 0) {
      checkins[existingIndex] = checkin
    } else {
      checkins.push(checkin)
    }

    if (checkins.length > 90) {
      checkins.splice(0, checkins.length - 90)
    }

    wx.setStorageSync('moodCheckins', checkins)
    return checkin
  },

  getMoodSummary() {
    const checkins = this.normalizeMoodCheckins(wx.getStorageSync('moodCheckins'))
    const todayKey = this.getDateKey()
    const todayCheckin = checkins.find(item => item.dateKey === todayKey) || null
    const moodCounts = {}

    checkins.forEach(item => {
      if (item.mood) {
        moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1
      }
    })

    const dominantMood = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a])[0] || ''

    return {
      checkins,
      todayCheckin,
      totalCheckins: checkins.length,
      dominantMood,
      dominantMoodLabel: this.getMoodLabel(dominantMood),
      recentCheckins: checkins.slice().reverse().slice(0, 5)
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
