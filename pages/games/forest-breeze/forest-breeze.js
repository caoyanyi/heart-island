Page({
  data: {
    canvasWidth: 0,
    canvasHeight: 0,
    leaves: [],
    particles: [],
    windLines: [],
    surpriseAnimals: [], // 惊喜动物数组
    score: 0,
    remainingTime: 60,
    gameStarted: false,
    gameOver: false,
    paused: false,
    showInstructions: true,
    completionMessage: '',
    animationId: null,
    windPower: 1,
    lastWindTime: 0,
    swipeStartX: 0,
    swipeStartY: 0,
    isSwiping: false
  },

  onLoad() {
    this.initCanvas()
    this.loadGameAssets()
  },

  onReady() {
    const query = wx.createSelectorQuery()
    query.select('.forest-game-container').boundingClientRect((rect) => {
      this.setData({
        canvasWidth: rect.width,
        canvasHeight: rect.height
      })
      this.initGame()
    }).exec()
  },

  onUnload() {
    // 清理Canvas初始化定时器
    if (this.canvasInitTimer) {
      clearTimeout(this.canvasInitTimer)
      this.canvasInitTimer = null
    }

    // 清理动画定时器
    if (this.data.animationId) {
      clearTimeout(this.data.animationId)
    }

    // 清理游戏计时器
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
      this.gameTimer = null
    }

    // 清理音频资源
    if (this.windSound) {
      this.windSound.destroy()
      this.windSound = null
    }
    if (this.leafSound) {
      this.leafSound.destroy()
      this.leafSound = null
    }
    if (this.backgroundMusic) {
      this.backgroundMusic.stop()
      this.backgroundMusic.destroy()
      this.backgroundMusic = null
    }

    // 清理其他引用
    this.ctx = null
    this.canvas = null
  },

  onHide() {
    if (this.data.gameStarted && !this.data.gameOver && !this.data.paused) {
      this.pauseGame()
    }
  },

  initCanvas() {
    // 清理之前的定时器
    if (this.canvasInitTimer) {
      clearTimeout(this.canvasInitTimer)
      this.canvasInitTimer = null
    }

    // 延迟Canvas初始化，确保页面完全渲染
    this.canvasInitTimer = setTimeout(() => {
      try {
        // 优先使用Canvas 2D API
        const query = wx.createSelectorQuery().in(this)
        query.select('#forestGameCanvas').fields({ node: true, size: true }).exec((res) => {


          if (res && res[0] && res[0].node) {
            this.canvas = res[0].node
            this.ctx = this.canvas.getContext('2d')


            // 设置画布尺寸和缩放
            try {
              const deviceInfo = wx.getDeviceInfo();
              const dpr = deviceInfo.pixelRatio || 1;
              this.canvas.width = res[0].width * dpr;
              this.canvas.height = res[0].height * dpr;
              this.ctx.scale(dpr, dpr);

            } catch (error) {

              // 降级处理
              this.canvas.width = res[0].width;
              this.canvas.height = res[0].height;
            }
          } else {
            // 降级使用旧的createCanvasContext

            this.ctx = wx.createCanvasContext('forestGameCanvas', this)
          }
        })
      } catch (error) {

        // 最终降级方案
        this.ctx = wx.createCanvasContext('forestGameCanvas', this)
      }
    }, 150); // 延迟150ms确保DOM完全渲染
  },

  loadGameAssets() {
    // 验证音频文件是否存在，如果不存在则禁用音效
    this.validateAudioFiles()
  },

  // 验证音频文件
  validateAudioFiles: function () {
    try {
      // 创建音频上下文并验证文件
      this.windSound = wx.createInnerAudioContext()
      this.windSound.src = 'https://file.okrcn.com/wx/sounds/wind.mp3'
      this.windSound.volume = 0.3

      this.leafSound = wx.createInnerAudioContext()
      this.leafSound.src = 'https://file.okrcn.com/wx/sounds/leaf-rustle.mp3'
      this.leafSound.volume = 0.4

      this.backgroundMusic = wx.createInnerAudioContext()
      this.backgroundMusic.src = 'https://file.okrcn.com/wx/sounds/forest-ambient.mp3'
      this.backgroundMusic.volume = 0.2
      this.backgroundMusic.loop = true

      // 监听音频错误，如果文件不存在则禁用音效
      const audioErrorHandler = (error) => {

        this.windSound = null
        this.leafSound = null
        this.backgroundMusic = null
        getApp().globalData.audioEnabled = false
      }

      this.windSound.onError(audioErrorHandler)
      this.leafSound.onError(audioErrorHandler)
      this.backgroundMusic.onError(audioErrorHandler)

    } catch (error) {

      this.windSound = null
      this.leafSound = null
      this.backgroundMusic = null
      getApp().globalData.audioEnabled = false
    }
  },

  initGame() {
    // Generate initial leaves
    this.generateLeaves()
  },

  generateLeaves() {
    const leaves = []
    const leafColors = [
      '#8B4513', '#CD853F', '#D2691E', '#A0522D',
      '#DAA520', '#B8860B', '#D2691E', '#F4A460'
    ]

    for (let i = 0; i < 8; i++) {
      leaves.push(this.createLeaf(leafColors))
    }

    this.setData({ leaves })
  },

  createLeaf(leafColors) {
    const { canvasWidth, canvasHeight } = this.data

    return {
      id: Date.now() + Math.random(),
      x: Math.random() * canvasWidth,
      y: -50 - Math.random() * 100,
      width: 20 + Math.random() * 15,
      height: 25 + Math.random() * 20,
      color: leafColors[Math.floor(Math.random() * leafColors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      fallSpeed: 1 + Math.random() * 2,
      swayAmplitude: 20 + Math.random() * 30,
      swaySpeed: 0.02 + Math.random() * 0.03,
      swayPhase: Math.random() * Math.PI * 2,
      windAffected: false,
      opacity: 0.8 + Math.random() * 0.2
    }
  },

  onTouchStart(e) {
    if (!this.data.gameStarted || this.data.gameOver || this.data.paused) return

    // 阻止默认行为，防止页面拖拽
    if (e.preventDefault) {
      e.preventDefault()
    }

    const touch = e.touches[0]
    this.setData({
      swipeStartX: touch.x,
      swipeStartY: touch.y,
      isSwiping: true
    })
  },

  onTouchMove(e) {
    if (!this.data.gameStarted || this.data.gameOver || this.data.paused || !this.data.isSwiping) return

    // 阻止默认行为，防止页面拖拽
    if (e.preventDefault) {
      e.preventDefault()
    }

    const touch = e.touches[0]
    const deltaX = touch.x - this.data.swipeStartX
    const deltaY = touch.y - this.data.swipeStartY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance > 30) { // Minimum swipe distance
      this.createWindEffect(touch.x, touch.y, deltaX, deltaY, distance)
      this.setData({
        swipeStartX: touch.x,
        swipeStartY: touch.y
      })
    }
  },

  onTouchEnd() {
    if (!this.data.gameStarted || this.data.gameOver || this.data.paused) return

    this.setData({
      isSwiping: false
    })
  },

  createWindEffect(x, y, directionX, directionY, distance) {
    const currentTime = Date.now()

    // Calculate wind power based on swipe distance and speed
    const windPower = Math.min(5, Math.max(1, distance / 20))

    this.setData({
      windPower: windPower,
      lastWindTime: currentTime
    })

    // Create wind lines for visual effect
    const windLines = []
    for (let i = 0; i < 5; i++) {
      windLines.push({
        id: Date.now() + Math.random(),
        startX: x + (Math.random() - 0.5) * 100,
        startY: y + (Math.random() - 0.5) * 100,
        endX: x + directionX * 2 + (Math.random() - 0.5) * 50,
        endY: y + directionY * 2 + (Math.random() - 0.5) * 50,
        opacity: 0.6,
        life: 30
      })
    }

    this.setData({
      windLines: [...this.data.windLines, ...windLines]
    })

    // Apply wind to leaves
    this.applyWindToLeaves(x, y, directionX, directionY, windPower)

    // 检测惊喜动物碰撞
    this.checkSurpriseAnimalCollisions(x, y, windPower)

    // Play wind sound
    if (getApp().globalData.audioEnabled && this.windSound) {
      this.windSound.play()
    }
  },

  // 检测惊喜动物碰撞
  checkSurpriseAnimalCollisions(windX, windY, windPower) {
    const { surpriseAnimals } = this.data
    const updatedAnimals = surpriseAnimals.map(animal => {
      if (animal.collected) return animal

      const distance = Math.sqrt(
        Math.pow(animal.x - windX, 2) + Math.pow(animal.y - windY, 2)
      )

      if (distance < 80) {
        // 收集惊喜动物
        this.collectSurpriseAnimal(animal)
        return { ...animal, collected: true }
      }

      return animal
    }).filter(animal => !animal.collected)

    this.setData({ surpriseAnimals: updatedAnimals })
  },

  // 收集惊喜动物
  collectSurpriseAnimal(animal) {
    const bonusScore = animal.points + (this.data.score / 100) // 基于当前得分的奖励
    
    this.setData({
      score: this.data.score + bonusScore
    })

    // 播放特殊音效或反馈
    if (getApp().globalData.audioEnabled && this.leafSound) {
      this.leafSound.play()
    }

    // 创建粒子效果
    this.createAnimalParticles(animal.x, animal.y, animal.color)

    // 显示收集提示
    console.log(`🎉 ${animal.name} 带来惊喜！+${Math.floor(bonusScore)}分`)
  },

  // 创建动物粒子效果
  createAnimalParticles(x, y, color) {
    const particles = this.data.particles || []
    
    for (let i = 0; i < 12; i++) {
      particles.push({
        id: Date.now() + Math.random(),
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: color,
        size: 3 + Math.random() * 4,
        life: 60,
        alpha: 1
      })
    }

    this.setData({ particles })
  },

  applyWindToLeaves(windX, windY, directionX, directionY, windPower) {
    const { leaves } = this.data

    const updatedLeaves = leaves.map(leaf => {
      const distance = Math.sqrt(
        Math.pow(leaf.x - windX, 2) + Math.pow(leaf.y - windY, 2)
      )

      if (distance < 150) { // Wind effect radius
        const force = (150 - distance) / 150 * windPower * 0.5

        return {
          ...leaf,
          x: leaf.x + directionX * force,
          y: leaf.y + directionY * force * 0.3, // Less vertical movement
          rotation: leaf.rotation + force * 0.1,
          windAffected: true,
          fallSpeed: Math.max(0.5, leaf.fallSpeed - force * 0.1) // Slow fall when wind hits
        }
      }

      return leaf
    })

    this.setData({ leaves: updatedLeaves })
  },

  startGame() {
    this.setData({
      showInstructions: false,
      gameStarted: true,
      paused: false,
      score: 0,
      remainingTime: 60,
      windPower: 1
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
    if (this.data.gameOver || this.data.paused) return

    this.updateGame()
    this.render()

    // 使用setTimeout替代requestAnimationFrame，16ms间隔约60fps
    const animationId = setTimeout(() => this.gameLoop(), 16)
    this.setData({ animationId })
  },

  pauseGame() {
    if (!this.data.gameStarted || this.data.gameOver || this.data.paused) return

    if (this.gameTimer) {
      clearInterval(this.gameTimer)
      this.gameTimer = null
    }
    if (this.data.animationId) {
      clearTimeout(this.data.animationId)
    }
    if (this.backgroundMusic) {
      this.backgroundMusic.pause()
    }

    this.setData({ paused: true })
  },

  resumeGame() {
    if (!this.data.gameStarted || this.data.gameOver || !this.data.paused) return

    this.setData({ paused: false })
    if (this.backgroundMusic) {
      this.backgroundMusic.play()
    }
    this.startGameTimer()
    this.gameLoop()
  },

  restartGame() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
      this.gameTimer = null
    }
    if (this.data.animationId) {
      clearTimeout(this.data.animationId)
    }

    this.setData({
      score: 0,
      remainingTime: 60,
      gameOver: false,
      paused: false,
      showInstructions: false,
      gameStarted: true,
      leaves: [],
      windLines: [],
      windPower: 1,
      lastWindTime: 0
    })

    this.generateLeaves()
    this.startGameTimer()
    this.gameLoop()
  },

  updateGame() {
    const { leaves, windLines, windPower, lastWindTime, surpriseAnimals } = this.data
    const currentTime = Date.now()

    // Update wind power (decay over time)
    if (currentTime - lastWindTime > 1000) {
      this.setData({
        windPower: Math.max(1, windPower * 0.98)
      })
    }

    // Update leaves
    const updatedLeaves = leaves.map(leaf => {
      const swayOffset = Math.sin(leaf.swayPhase) * leaf.swayAmplitude

      let newLeaf = {
        ...leaf,
        y: leaf.y + leaf.fallSpeed,
        x: leaf.x + swayOffset * 0.1,
        rotation: leaf.rotation + leaf.rotationSpeed,
        swayPhase: leaf.swayPhase + leaf.swaySpeed,
        fallSpeed: leaf.windAffected ? Math.min(3, leaf.fallSpeed + 0.02) : leaf.fallSpeed,
        windAffected: false // Reset wind effect
      }

      // Check if leaf reached the bottom
      if (newLeaf.y > this.data.canvasHeight + 50) {
        // Award points for successfully guiding leaf down
        this.setData({
          score: this.data.score + 10
        })

        // Create new leaf at top
        const leafColors = [
          '#8B4513', '#CD853F', '#D2691E', '#A0522D',
          '#DAA520', '#B8860B', '#D2691E', '#F4A460'
        ]
        newLeaf = this.createLeaf(leafColors)
      }

      return newLeaf
    })

    this.setData({ leaves: updatedLeaves })

    // Update wind lines
    const updatedWindLines = windLines.map(line => ({
      ...line,
      life: line.life - 1,
      opacity: line.opacity * 0.95
    })).filter(line => line.life > 0)

    this.setData({ windLines: updatedWindLines })

    // 更新惊喜动物
    this.updateSurpriseAnimals()
  },

  // 生成惊喜动物
  generateSurpriseAnimal() {
    const animalTypes = [
      { name: '小鹿', icon: '🦌', color: '#8B4513', points: 50, appearProbability: 0.3 },
      { name: '松鼠', icon: '🐿️', color: '#D2691E', points: 40, appearProbability: 0.25 },
      { name: '鸟儿', icon: '🐦', color: '#32CD32', points: 35, appearProbability: 0.2 },
      { name: '小熊', icon: '🐻', color: '#8B4513', points: 60, appearProbability: 0.15 },
      { name: '小兔', icon: '🐰', color: '#FFFFFF', points: 45, appearProbability: 0.1 }
    ];

    // 加权随机选择
    const totalProbability = animalTypes.reduce((sum, type) => sum + type.appearProbability, 0);
    let random = Math.random() * totalProbability;
    let selectedType = animalTypes[0];

    for (const type of animalTypes) {
      random -= type.appearProbability;
      if (random <= 0) {
        selectedType = type;
        break;
      }
    }

    const animal = {
      id: Date.now() + Math.random(),
      x: Math.random() * (this.data.canvasWidth - 100) + 50,
      y: Math.random() * (this.data.canvasHeight - 200) + 100,
      ...selectedType,
      life: 180, // 存在时间
      collected: false,
      movementPhase: Math.random() * Math.PI * 2
    };

    return animal;
  },

  // 更新惊喜动物
  updateSurpriseAnimals() {
    if (Math.random() < 0.002 && this.data.surpriseAnimals.length < 3) { // 0.2% 概率生成，最多3个
      const newAnimal = this.generateSurpriseAnimal();
      this.setData({
        surpriseAnimals: [...this.data.surpriseAnimals, newAnimal]
      });
    }

    // 更新现有惊喜动物
    const updatedAnimals = this.data.surpriseAnimals.map(animal => {
      if (animal.collected) return animal;

      return {
        ...animal,
        life: animal.life - 1,
        movementPhase: animal.movementPhase + 0.02,
        // 随机缓慢移动
        x: animal.x + Math.sin(animal.movementPhase) * 0.5,
        y: animal.y + Math.cos(animal.movementPhase * 0.7) * 0.3
      };
    }).filter(animal => animal.life > 0 && !animal.collected);

    this.setData({ surpriseAnimals: updatedAnimals });
  },

  render() {
    const ctx = this.ctx
    const { canvasWidth, canvasHeight, leaves, windLines, windPower, surpriseAnimals, particles } = this.data

    // Clear canvas with forest gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight)
    gradient.addColorStop(0, '#87CEEB')
    gradient.addColorStop(0.3, '#98FB98')
    gradient.addColorStop(1, '#228B22')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw wind lines
    windLines.forEach(line => {
      ctx.globalAlpha = line.opacity
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(line.startX, line.startY)
      ctx.lineTo(line.endX, line.endY)
      ctx.stroke()
    })

    // Draw leaves
    leaves.forEach(leaf => {
      ctx.globalAlpha = leaf.opacity
      ctx.save()

      // Move to leaf center and rotate
      ctx.translate(leaf.x, leaf.y)
      ctx.rotate(leaf.rotation)

      // Draw leaf shape
      ctx.fillStyle = leaf.color
      ctx.beginPath()

      // 使用贝塞尔曲线绘制叶子形状，避免使用不兼容的ellipse方法
      const w = leaf.width / 2
      const h = leaf.height / 2

      ctx.moveTo(0, -h) // 顶部
      ctx.bezierCurveTo(w * 0.8, -h * 0.8, w * 0.8, -h * 0.2, w * 0.6, h * 0.2) // 右上
      ctx.bezierCurveTo(w * 0.4, h * 0.6, w * 0.2, h * 0.8, 0, h) // 右下
      ctx.bezierCurveTo(-w * 0.2, h * 0.8, -w * 0.4, h * 0.6, -w * 0.6, h * 0.2) // 左下
      ctx.bezierCurveTo(-w * 0.8, -h * 0.2, -w * 0.8, -h * 0.8, 0, -h) // 左上
      ctx.closePath()

      ctx.fill()

      // Leaf vein
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, -leaf.height/2)
      ctx.lineTo(0, leaf.height/2)
      ctx.stroke()

      ctx.restore()
    })

    // 绘制惊喜动物
    surpriseAnimals.forEach(animal => {
      if (animal.collected) return
      
      ctx.save()
      
      // 设置透明度（淡入效果）
      ctx.globalAlpha = Math.min(1, animal.life / 30)
      
      // 绘制动物背景圆圈
      ctx.fillStyle = animal.color
      ctx.beginPath()
      ctx.arc(animal.x, animal.y, 18, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制动物图标（简化版本）
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(animal.icon, animal.x, animal.y + 6)
      
      // 绘制收集提示点
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(animal.x + 12, animal.y - 12, 3, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    })

    // 绘制粒子效果
    if (particles && particles.length > 0) {
      particles.forEach(particle => {
        ctx.save()
        ctx.globalAlpha = particle.alpha
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // 更新粒子
      const updatedParticles = particles.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        alpha: particle.alpha * 0.98,
        life: particle.life - 1
      })).filter(particle => particle.life > 0)

      this.setData({ particles: updatedParticles })
    }

    // Draw wind power indicator
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`风力 ${windPower}x`, canvasWidth/2, canvasHeight - 50)

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
      this.gameTimer = null
    }
    if (this.backgroundMusic) {
      this.backgroundMusic.stop()
    }

    // Set completion message
    let message = '你感受到了自然的宁静'
    if (this.data.score > 150) {
      message = '你成为了森林的朋友！'
    } else if (this.data.score > 100) {
      message = '微风带走了你的烦恼'
    } else if (this.data.score > 50) {
      message = '你学会了与自然和谐相处'
    }

    this.setData({
      completionMessage: message
    })

    // Save game progress
    const app = getApp()
    app.globalData.gameProgress.forestBreeze = {
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
      paused: false,
      showInstructions: true,
      gameStarted: false,
      leaves: [],
      windLines: [],
      windPower: 1,
      lastWindTime: 0
    })

    // Regenerate game elements
    this.generateLeaves()
  },

  backToSelector() {
    wx.navigateBack()
  }
})
