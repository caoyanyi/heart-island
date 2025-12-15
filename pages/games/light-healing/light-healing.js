Page({
  data: {
    canvasWidth: 0,
    canvasHeight: 0,
    stars: [],
    lightOrbs: [],
    particles: [],
    score: 0,
    remainingTime: 60,
    lightEnergy: 100,
    gameStarted: false,
    gameOver: false,
    showInstructions: true,
    completionMessage: '',
    healingWords: [],
    currentHealingWord: '',
    showHealingWord: false,
    animationId: null,
    lastLightTime: 0,
    lightRegenRate: 0.5,
    maxLightEnergy: 100
  },

  onLoad() {
    this.initCanvas()
    this.loadGameAssets()
  },

  onReady() {
    try {
      // 使用新的API替代弃用的wx.getSystemInfoSync
      const windowInfo = wx.getWindowInfo();

      this.setData({
        canvasWidth: windowInfo.windowWidth,
        canvasHeight: windowInfo.windowHeight - 100
      });

      this.initGame();
    } catch (error) {

      // 降级处理 - 使用默认值
      this.setData({
        canvasWidth: 375,
        canvasHeight: 600
      });
      this.initGame();
    }
  },

  onUnload() {
    if (this.data.animationId) {
      clearTimeout(this.data.animationId) // 清除定时器
    }
    // Stop timer and music
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
      this.gameTimer = null
    }
    if (this.backgroundMusic) {
      this.backgroundMusic.stop()
      this.backgroundMusic.destroy()
      this.backgroundMusic = null
    }
    // 清理音效实例
    if (this.lightSound) {
      this.lightSound.destroy()
      this.lightSound = null
    }
    if (this.starSound) {
      this.starSound.destroy()
      this.starSound = null
    }
  },

  initCanvas() {
    // 延迟Canvas初始化，确保页面完全渲染
    setTimeout(() => {
      try {
        // 使用Canvas 2D API替代旧的createCanvasContext
        const query = wx.createSelectorQuery()
        query.select('#lightGameCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {


            if (res && res[0] && res[0].node) {
              const canvas = res[0].node
              this.ctx = canvas.getContext('2d')


              // 设置画布尺寸
              try {
                const deviceInfo = wx.getDeviceInfo();
                const dpr = deviceInfo.pixelRatio || 1;
                canvas.width = res[0].width * dpr;
                canvas.height = res[0].height * dpr;
                this.ctx.scale(dpr, dpr);

              } catch (error) {

                // 降级处理
                canvas.width = res[0].width;
                canvas.height = res[0].height;
              }
            } else {
              // 降级处理 - 使用旧的API

              this.ctx = wx.createCanvasContext('lightGameCanvas', this)
            }
          })
      } catch (error) {

        // 降级处理 - 使用旧的API
        this.ctx = wx.createCanvasContext('lightGameCanvas', this)
      }
    }, 150); // 延迟150ms确保DOM完全渲染
  },

  loadGameAssets() {
    // 验证音频文件，如果不存在则禁用音效
    this.validateAudioFiles()
  },

  // 验证音频文件
  validateAudioFiles: function () {
    try {
      // 创建音频上下文并验证文件
      this.lightSound = wx.createInnerAudioContext()
      this.lightSound.src = 'https://file.okrcn.com/wx/sounds/light-sparkle.mp3'
      this.lightSound.volume = 0.4

      this.starSound = wx.createInnerAudioContext()
      this.starSound.src = 'https://file.okrcn.com/wx/sounds/star-twinkle.mp3'
      this.starSound.volume = 0.5

      this.backgroundMusic = wx.createInnerAudioContext()
      this.backgroundMusic.src = 'https://file.okrcn.com/wx/sounds/light-ambient.mp3'
      this.backgroundMusic.volume = 0.2
      this.backgroundMusic.loop = true

      // 监听音频错误，如果文件不存在则禁用音效
      const audioErrorHandler = (error) => {

        this.lightSound = null
        this.starSound = null
        this.backgroundMusic = null
        getApp().globalData.audioEnabled = false
      }

      this.lightSound.onError(audioErrorHandler)
      this.starSound.onError(audioErrorHandler)
      this.backgroundMusic.onError(audioErrorHandler)

    } catch (error) {

      this.lightSound = null
      this.starSound = null
      this.backgroundMusic = null
      getApp().globalData.audioEnabled = false
    }
  },

  initGame() {
    // Generate initial stars and light orbs
    this.generateStars()
    this.generateLightOrbs()
    // Initialize healing words
    this.initializeHealingWords()
  },

  generateStars() {
    const stars = []
    const starColors = [
      '#FFD700', '#FFA500', '#FF69B4', '#87CEEB',
      '#98FB98', '#DDA0DD', '#F0E68C', '#FFB6C1'
    ]

    for (let i = 0; i < 12; i++) {
      stars.push({
        id: Date.now() + Math.random(),
        x: Math.random() * this.data.canvasWidth,
        y: Math.random() * this.data.canvasHeight,
        size: 3 + Math.random() * 5,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        brightness: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        twinklePhase: Math.random() * Math.PI * 2,
        lit: false,
        lightRequired: 20 + Math.random() * 30
      })
    }

    this.setData({ stars })
  },

  generateLightOrbs() {
    const lightOrbs = []

    for (let i = 0; i < 3; i++) {
      lightOrbs.push({
        id: Date.now() + Math.random(),
        x: Math.random() * this.data.canvasWidth,
        y: Math.random() * this.data.canvasHeight,
        radius: 8 + Math.random() * 12,
        energy: 15 + Math.random() * 25,
        pulseSpeed: 0.03 + Math.random() * 0.02,
        pulsePhase: Math.random() * Math.PI * 2,
        collected: false
      })
    }

    this.setData({ lightOrbs })
  },

  // Initialize healing words with random healing phrases
  initializeHealingWords() {
    const healingWords = [
      "你比想象中更坚强",
      "每一个明天都充满希望",
      "你的努力终将开花结果",
      "相信自己的力量",
      "今天也要加油呀",
      "温柔对待自己",
      "你值得被爱",
      "困难都会过去的",
      "你已经很棒了",
      "保持内心的宁静",
      "阳光总在风雨后",
      "相信自己值得美好",
      "每个瞬间都是新的开始",
      "你的笑容很温暖",
      "慢慢来会比较快",
      "你比昨天更进步了",
      "内心的平静是最珍贵的",
      "相信时间会治愈一切",
      "你的人生很有意义",
      "保持乐观的心态"
    ]

    // Shuffle the array to randomize the order
    for (let i = healingWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [healingWords[i], healingWords[j]] = [healingWords[j], healingWords[i]]
    }

    this.setData({ healingWords })
  },

  // Show random healing word when lighting up stars
  showRandomHealingWord() {
    const { healingWords, currentHealingWord } = this.data
    
    if (healingWords.length === 0) return

    // Select a random healing word different from current one
    let newWord = currentHealingWord
    while (newWord === currentHealingWord && healingWords.length > 1) {
      const randomIndex = Math.floor(Math.random() * healingWords.length)
      newWord = healingWords[randomIndex]
    }

    this.setData({
      currentHealingWord: newWord,
      showHealingWord: true
    })

    // Hide the healing word after 3 seconds
    setTimeout(() => {
      this.setData({ showHealingWord: false })
    }, 3000)
  },

  onTouchStart(e) {
    if (!this.data.gameStarted || this.data.gameOver) return

    // 阻止默认行为，防止页面拖拽
    if (e.preventDefault) {
      e.preventDefault()
    }

    const touch = e.touches[0]
    this.releaseLight(touch.x, touch.y)
  },

  onTouchMove(e) {
    if (!this.data.gameStarted || this.data.gameOver) return

    // 阻止默认行为，防止页面拖拽
    if (e.preventDefault) {
      e.preventDefault()
    }

    const touch = e.touches[0]
    this.releaseLight(touch.x, touch.y)
  },

  releaseLight(x, y) {
    const { lightEnergy, lastLightTime } = this.data
    const currentTime = Date.now()

    // Check cooldown
    if (currentTime - lastLightTime < 100) return

    // Check if enough light energy
    if (lightEnergy < 5) return

    // Consume light energy
    this.setData({
      lightEnergy: Math.max(0, lightEnergy - 5),
      lastLightTime: currentTime
    })

    // Create light particles
    this.createLightParticles(x, y)

    // Check star illumination
    this.checkStarIllumination(x, y)

    // Check light orb collection
    this.checkLightOrbCollection(x, y)

    // Play sound
    if (getApp().globalData.audioEnabled && this.lightSound) {
      this.lightSound.play()
    }
  },

  createLightParticles(x, y) {
    const particles = []
    const particleCount = 6 + Math.random() * 4

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5
      const speed = 2 + Math.random() * 3

      particles.push({
        id: Date.now() + Math.random(),
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: '#FFD700',
        life: 1,
        decay: 0.03 + Math.random() * 0.02,
        brightness: 0.8 + Math.random() * 0.2
      })
    }

    this.setData({
      particles: [...this.data.particles, ...particles]
    })
  },

  checkStarIllumination(lightX, lightY) {
    const { stars } = this.data

    const updatedStars = stars.map(star => {
      const distance = Math.sqrt(
        Math.pow(star.x - lightX, 2) + Math.pow(star.y - lightY, 2)
      )

      if (distance < 80 && !star.lit) {
        // Star is illuminated
        this.setData({
          score: this.data.score + star.lightRequired
        })

        // Create illumination effect
        this.createIlluminationEffect(star.x, star.y, star.color)

        // Show random healing word
        this.showRandomHealingWord()

        // Play sound
        if (getApp().globalData.audioEnabled && this.starSound) {
          this.starSound.play()
        }

        return {
          ...star,
          lit: true,
          brightness: 1
        }
      }

      return star
    })

    this.setData({ stars: updatedStars })
  },

  createIlluminationEffect(x, y, color) {
    const particles = []
    const particleCount = 10

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = 1 + Math.random() * 2

      particles.push({
        id: Date.now() + Math.random(),
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 2,
        color: color,
        life: 1,
        decay: 0.02,
        brightness: 1
      })
    }

    this.setData({
      particles: [...this.data.particles, ...particles]
    })
  },

  checkLightOrbCollection(x, y) {
    const { lightOrbs, lightEnergy } = this.data

    const remainingOrbs = lightOrbs.filter(orb => {
      const distance = Math.sqrt(
        Math.pow(orb.x - x, 2) + Math.pow(orb.y - y, 2)
      )

      if (distance < orb.radius + 20 && !orb.collected) {
        // Collect light orb
        this.setData({
          lightEnergy: Math.min(this.data.maxLightEnergy, lightEnergy + orb.energy),
          score: this.data.score + 50
        })

        return false // Remove orb
      }

      return true
    })

    if (remainingOrbs.length !== lightOrbs.length) {
      this.setData({ lightOrbs: remainingOrbs })

      // Generate new orb after delay
      setTimeout(() => {
        const newOrbs = this.data.lightOrbs
        newOrbs.push({
          id: Date.now() + Math.random(),
          x: Math.random() * this.data.canvasWidth,
          y: Math.random() * this.data.canvasHeight,
          radius: 8 + Math.random() * 12,
          energy: 15 + Math.random() * 25,
          pulseSpeed: 0.03 + Math.random() * 0.02,
          pulsePhase: Math.random() * Math.PI * 2,
          collected: false
        })
        this.setData({ lightOrbs: newOrbs })
      }, 2000)
    }
  },

  startGame() {
    this.setData({
      showInstructions: false,
      gameStarted: true,
      score: 0,
      lightEnergy: 100
    })

    // Start background music
    if (getApp().globalData.audioEnabled && this.backgroundMusic) {
      this.backgroundMusic.play()
    }

    // Start game timer
    this.startGameTimer()

    // Start game loop
    this.gameLoop()
  },

  startGameTimer() {
    const timerId = setInterval(() => {
      if (this.data.remainingTime > 0) {
        this.setData({
          remainingTime: this.data.remainingTime - 1
        })
      } else {
        this.endGame()
      }
    }, 1000)
    this.gameTimer = timerId
  },

  gameLoop() {
    if (this.data.gameOver) return

    this.updateGame()
    this.render()

    // 使用微信的定时器替代requestAnimationFrame
    const animationId = setTimeout(() => {
      this.gameLoop()
    }, 16) // 约60fps
    this.setData({ animationId })
  },

  updateGame() {
    const { stars, lightOrbs, particles, lightEnergy, lightRegenRate } = this.data

    // Regenerate light energy
    this.setData({
      lightEnergy: Math.min(this.data.maxLightEnergy, lightEnergy + lightRegenRate)
    })

    // Update stars
    const updatedStars = stars.map(star => ({
      ...star,
      twinklePhase: star.twinklePhase + star.twinkleSpeed,
      brightness: star.lit ? 1 : (0.3 + Math.sin(star.twinklePhase) * 0.4)
    }))

    this.setData({ stars: updatedStars })

    // Update light orbs
    const updatedLightOrbs = lightOrbs.map(orb => ({
      ...orb,
      pulsePhase: orb.pulsePhase + orb.pulseSpeed
    }))

    this.setData({ lightOrbs: updatedLightOrbs })

    // Update particles
    const updatedParticles = particles.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vx: particle.vx * 0.98,
      vy: particle.vy * 0.98,
      life: particle.life - particle.decay,
      brightness: particle.brightness * 0.99
    })).filter(particle => particle.life > 0)

    this.setData({ particles: updatedParticles })
  },

  render() {
    const ctx = this.ctx
    const { canvasWidth, canvasHeight, stars, lightOrbs, particles, lightEnergy } = this.data

    // Clear canvas with dark gradient (night sky)
    const gradient = ctx.createRadialGradient(
      canvasWidth/2, canvasHeight/2, 0,
      canvasWidth/2, canvasHeight/2, Math.max(canvasWidth, canvasHeight)
    )
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#0f0f1e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life * particle.brightness
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()

      // Add glow effect
      ctx.globalAlpha = particle.life * particle.brightness * 0.3
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw light orbs
    lightOrbs.forEach(orb => {
      const pulseSize = orb.radius * (1 + Math.sin(orb.pulsePhase) * 0.2)

      ctx.globalAlpha = 0.8

      // Outer glow
      const glowGradient = ctx.createRadialGradient(
        orb.x, orb.y, 0,
        orb.x, orb.y, pulseSize * 2
      )
      glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)')
      glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(orb.x, orb.y, pulseSize * 2, 0, Math.PI * 2)
      ctx.fill()

      // Inner orb
      ctx.globalAlpha = 1
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(orb.x, orb.y, pulseSize, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw stars
    stars.forEach(star => {
      ctx.globalAlpha = star.brightness

      if (star.lit) {
        // Lit star with glow
        const glowGradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 3
        )
        glowGradient.addColorStop(0, star.color)
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
        ctx.fill()

        // Star core
        ctx.globalAlpha = star.brightness
        ctx.fillStyle = star.color
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Unlit star
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // Draw light energy indicator
    ctx.globalAlpha = 1
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`光能 ${Math.floor(lightEnergy)}%`, canvasWidth/2, canvasHeight - 50)

    // Canvas 2D API不需要draw()方法，绘制是即时的
  },

  endGame() {
    this.setData({
      gameOver: true,
      gameStarted: false
    })

    // Stop timer and music
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
    }
    if (this.backgroundMusic) {
      this.backgroundMusic.stop()
    }

    // Set completion message
    let message = '你点亮了内心的光明'
    const litStars = this.data.stars.filter(star => star.lit).length

    if (litStars > 8) {
      message = '你让星空重新闪耀！'
    } else if (litStars > 6) {
      message = '你带来了希望的光芒'
    } else if (litStars > 4) {
      message = '你感受了温暖的光明'
    }

    this.setData({
      completionMessage: message
    })

    // Save game progress
    const app = getApp()
    app.globalData.gameProgress.lightHealing = {
      score: this.data.score,
      timestamp: new Date().toISOString()
    }
    app.saveUserData()
  },

  playAgain() {
    // Reset game state
    this.setData({
      score: 0,
      remainingTime: 60,
      gameOver: false,
      showInstructions: true,
      gameStarted: false,
      stars: [],
      lightOrbs: [],
      particles: [],
      lightEnergy: 100,
      lastLightTime: 0
    })

    // Regenerate game elements
    this.generateStars()
    this.generateLightOrbs()
  },

  backToSelector() {
    wx.navigateBack()
  }
})