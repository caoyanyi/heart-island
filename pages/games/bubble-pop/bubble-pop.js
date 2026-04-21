Page({
  data: {
    // 画布尺寸
    canvasWidth: 0,
    canvasHeight: 0,

    // 游戏状态
    gameStatus: 'ready', // ready, playing, paused, ended
    score: 0,
    timeLeft: 60,
    combo: 0,
    maxCombo: 0,
    level: 1,

    // 气泡数组
    bubbles: [],
    particles: [],
    specialEffects: [],

    // 游戏设置
    soundEnabled: true,
    musicEnabled: true,
    gameDuration: 60,
    gameDurationIndex: 0,
    durationOptions: ['30秒', '60秒', '90秒', '120秒'],
    difficulty: 'normal',
    difficultyIndex: 1,
    difficultyOptions: ['简单', '普通', '困难', '专家'],
    showSettings: false,

    // 状态显示
    statusTitle: '气泡爆破',
    statusMessage: '点击彩色气泡释放压力，获得连击奖励',
    gameButtonText: '开始游戏',

    // 动画相关
    animationFrame: null,
    gameTimer: null,
    lastTime: 0,

    // 音频上下文
    audioContext: null,

    // 游戏参数
    bubbleSpawnRate: 0.03,
    maxBubbles: 15,
    comboTimeWindow: 1000, // 连击时间窗口（毫秒）
    lastBubblePop: 0,

    // 特殊气泡
    specialBubbleChance: 0.05,
    goldenBubbleMultiplier: 3,
    rainbowBubblePoints: 100
  },

  onLoad: function () {
    this.initGame();
    this.loadAudio();
    this.setData({
      gameStatus: 'loading',
      statusTitle: '气泡爆破',
      statusMessage: '游戏加载中...',
      gameButtonText: '准备中'
    });
  },

  onReady: function () {
    // 延迟初始化以确保DOM完全加载
    setTimeout(() => {
      this.initCanvas();
    }, 150);
  },

  onUnload: function () {
    this.stopGame();
    this.releaseAudio();

    // 清理所有音频实例
    if (this.audioContext) {
      this.audioContext.destroy();
      this.audioContext = null;
    }
  },

  onHide: function () {
    if (this.data.gameStatus === 'playing') {
      this.pauseGame();
    }
  },

  // 显示画布错误
  showCanvasError: function (message) {
    console.error('画布错误:', message);

    this.setData({
      gameStatus: 'error',
      statusTitle: '画布初始化失败',
      statusMessage: message + '，请尝试重新进入游戏',
      gameButtonText: '重试'
    });
  },

  // 初始化游戏
  initGame: function () {
    try {
      // 使用新的API替代弃用的wx.getSystemInfoSync
      const windowInfo = wx.getWindowInfo();
      const deviceInfo = wx.getDeviceInfo();

      this.setData({
        canvasWidth: windowInfo.windowWidth,
        canvasHeight: windowInfo.windowHeight
      });

      this.updateDifficultySettings();
    } catch (error) {

      // 降级处理
      this.setData({
        canvasWidth: 375,
        canvasHeight: 600
      });
    }
  },

  // 初始化画布
  initCanvas: function () {
    console.log('开始初始化画布...');

    // 如果已经在初始化中，避免重复调用
    if (this.data.gameStatus === 'initializing') {
      console.log('画布正在初始化中，跳过重复调用');
      return;
    }

    // 设置为初始化状态
    this.setData({ gameStatus: 'initializing' });

    // 确保页面已经渲染完成
    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.select('#bubbleCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          console.log('Canvas查询结果:', res);

          if (res && res[0] && res[0].node) {
            this.canvas = res[0].node;
            console.log('Canvas节点获取成功:', this.canvas);

            // 检查getContext是否可用
            try {
              this.ctx = this.canvas.getContext('2d');
              console.log('Canvas上下文获取成功:', this.ctx);

              if (!this.ctx) {
                console.error('无法获取画布上下文');
                this.showCanvasError('无法获取画布上下文');
                return;
              }
            } catch (error) {
              console.error('获取画布上下文失败:', error);
              this.showCanvasError('获取画布上下文失败');
              return;
            }

            try {
              // 使用新的API替代弃用的wx.getSystemInfoSync
              const deviceInfo = wx.getDeviceInfo();
              const dpr = deviceInfo.pixelRatio || 1;
              this.canvas.width = res[0].width * dpr;
              this.canvas.height = res[0].height * dpr;
              this.ctx.scale(dpr, dpr);
              console.log('Canvas尺寸设置成功，DPR:', dpr);
            } catch (error) {
              console.error('设置Canvas尺寸失败，使用降级方案:', error);
              // 降级处理
              this.canvas.width = res[0].width;
              this.canvas.height = res[0].height;
            }

            this.drawBackground();
            console.log('画布初始化完成，切换到就绪状态');

            // Canvas初始化成功，切换到就绪状态
            this.setData({
              gameStatus: 'ready',
              statusTitle: '气泡爆破',
              statusMessage: '点击泡泡获得分数，避开黑色泡泡！',
              gameButtonText: '开始游戏'
            });

          } else {
            console.error('画布初始化失败，未找到Canvas节点');
            this.showCanvasError('画布初始化失败');
          }
        });
    }, 100); // 延迟100ms确保DOM完全渲染
  },

  // 加载音频
  loadAudio: function () {
    if (!this.data.soundEnabled) {

      return;
    }

    try {
      this.audioContext = wx.createInnerAudioContext();

      // 验证音频文件是否有效
      this.validateAudioFile();

    } catch (error) {

      this.audioContext = null;
      this.setData({ soundEnabled: false }); // 禁用音效
    }
  },

  // 验证音频文件
  validateAudioFile: function () {
    if (!this.audioContext) return;

    this.audioContext.src = 'https://file.okrcn.com/wx/sounds/pop.mp3';

    // 使用正确的事件名称
    this.audioContext.onCanplay(() => {

      // 音频文件有效，可以正常使用
    });

    this.audioContext.onError((error) => {

      this.audioContext = null;
      this.setData({ soundEnabled: false }); // 禁用音效
    });
  },

  // 释放音频
  releaseAudio: function () {
    if (this.audioContext) {
      try {
        this.audioContext.destroy();
      } catch (error) {

      }
      this.audioContext = null;
    }
    // 清理其他音频实例
    if (this.popAudio) {
      this.popAudio.destroy();
      this.popAudio = null;
    }
    if (this.comboAudio) {
      this.comboAudio.destroy();
      this.comboAudio = null;
    }
  },

  // 播放音效
  playSound: function () {
    if (!this.data.soundEnabled) {
      return;
    }

    try {
      if (this.popAudio) {
        this.popAudio.destroy();
      }
      this.popAudio = wx.createInnerAudioContext();
      this.popAudio.src = 'https://file.okrcn.com/wx/sounds/pop.mp3';
      this.popAudio.volume = 0.3;
      this.popAudio.play();
    } catch (error) {
      // 播放失败时禁用音效
      this.setData({ soundEnabled: false });
    }
  },

  // 绘制背景
  drawBackground: function () {
    if (!this.ctx) return;

    try {
      // 清除整个画布
      this.ctx.clearRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);

      // 创建更丰富的渐变背景
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.data.canvasHeight);
      gradient.addColorStop(0, '#4ECDC4'); // 青绿色
      gradient.addColorStop(0.3, '#44A08D'); // 深绿色
      gradient.addColorStop(0.6, '#96CEB4'); // 浅绿色
      gradient.addColorStop(1, '#E0F6FF'); // 淡蓝色

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);

      // 添加一些装饰性的小圆点作为背景装饰
      this.ctx.save();
      this.ctx.globalAlpha = 0.1;
      for (let i = 0; i < 20; i++) {
        this.ctx.beginPath();
        this.ctx.arc(
          Math.random() * this.data.canvasWidth,
          Math.random() * this.data.canvasHeight,
          Math.random() * 3 + 1,
          0,
          Math.PI * 2
        );
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
      }
      this.ctx.restore();
    } catch (error) {
      console.error('绘制背景错误:', error);
    }
  },

  // 更新难度设置
  updateDifficultySettings: function () {
    const difficulties = {
      easy: { spawnRate: 0.02, maxBubbles: 12, specialChance: 0.03 },
      normal: { spawnRate: 0.03, maxBubbles: 15, specialChance: 0.05 },
      hard: { spawnRate: 0.04, maxBubbles: 20, specialChance: 0.07 },
      expert: { spawnRate: 0.05, maxBubbles: 25, specialChance: 0.1 }
    };

    const difficultyMap = ['easy', 'normal', 'hard', 'expert'];
    const currentDifficulty = difficultyMap[this.data.difficultyIndex];
    const settings = difficulties[currentDifficulty];

    this.setData({
      bubbleSpawnRate: settings.spawnRate,
      maxBubbles: settings.maxBubbles,
      specialBubbleChance: settings.specialChance
    });
  },

  // 生成气泡
  generateBubble: function () {
    const bubbles = this.data.bubbles;
    if (bubbles.length >= this.data.maxBubbles) return;

    const bubbleTypes = ['normal', 'golden', 'rainbow'];
    const weights = [
      1 - this.data.specialBubbleChance,
      this.data.specialBubbleChance * 0.6,
      this.data.specialBubbleChance * 0.4
    ];

    const bubbleType = this.weightedRandom(bubbleTypes, weights);

    const bubble = {
      x: Math.random() * (this.data.canvasWidth - 100) + 50,
      y: this.data.canvasHeight + 50,
      radius: 20 + Math.random() * 30,
      color: this.getBubbleColor(bubbleType),
      speed: 1 + Math.random() * 2,
      type: bubbleType,
      points: this.getBubblePoints(bubbleType),
      opacity: 0.8 + Math.random() * 0.2,
      pulsePhase: Math.random() * Math.PI * 2,
      wobble: Math.random() * 0.02 + 0.01
    };

    bubbles.push(bubble);
    this.setData({ bubbles });
  },

  // 加权随机选择
  weightedRandom: function (items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    return items[items.length - 1];
  },

  // 获取气泡颜色
  getBubbleColor: function (type) {
    const colors = {
      normal: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'],
      golden: ['#FFD700', '#FFA500', '#FF8C00'],
      rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
    };

    const typeColors = colors[type];
    return typeColors[Math.floor(Math.random() * typeColors.length)];
  },

  // 获取气泡分数
  getBubblePoints: function (type) {
    const points = {
      normal: 10,
      golden: 30,
      rainbow: 100
    };
    return points[type] || 10;
  },

  // 画布触摸事件
  onCanvasTouch: function (e) {
    if (this.data.gameStatus !== 'playing') return;

    const touch = e.touches[0];
    const x = touch.x;
    const y = touch.y;

    this.checkBubbleClick(x, y);
  },

  // 检查气泡点击
  checkBubbleClick: function (x, y) {
    const bubbles = this.data.bubbles;
    let popped = false;

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bubble = bubbles[i];
      const distance = Math.sqrt(
        Math.pow(x - bubble.x, 2) + Math.pow(y - bubble.y, 2)
      );

      if (distance <= bubble.radius) {
        // 爆破气泡
        this.popBubble(bubble, i);
        popped = true;
        break;
      }
    }

    if (popped) {
      this.setData({ bubbles });
    }
  },

  // 爆破气泡
  popBubble: function (bubble, index) {
    const bubbles = this.data.bubbles;

    // 计算连击
    this.updateCombo();

    // 计算分数
    let points = bubble.points;
    if (this.data.combo > 1) {
      points += Math.floor(this.data.combo / 5) * 5;
    }

    if (bubble.type === 'golden') {
      points *= this.data.goldenBubbleMultiplier;
    }

    // 创建粒子效果
    this.createParticles(bubble.x, bubble.y, bubble.color, bubble.type);

    // 创建特殊效果
    if (bubble.type === 'rainbow') {
      this.createRainbowEffect(bubble.x, bubble.y);
    }

    // 移除气泡
    bubbles.splice(index, 1);

    // 更新分数和等级
    this.setData({
      score: this.data.score + points,
      bubbles: bubbles
    });

    this.checkLevelUp();
    this.playSound();
  },

  // 更新连击
  updateCombo: function () {
    const currentTime = Date.now();
    const timeSinceLastPop = currentTime - this.data.lastBubblePop;

    let newCombo = this.data.combo;
    if (timeSinceLastPop <= this.data.comboTimeWindow) {
      newCombo++;
    } else {
      newCombo = 1;
    }

    this.setData({
      combo: newCombo,
      maxCombo: Math.max(this.data.maxCombo, newCombo),
      lastBubblePop: currentTime
    });
  },

  // 检查升级
  checkLevelUp: function () {
    const levelThresholds = [0, 500, 1000, 2000, 3500, 5000, 7500, 10000];
    let newLevel = this.data.level;

    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (this.data.score >= levelThresholds[i]) {
        newLevel = i + 1;
        break;
      }
    }

    if (newLevel > this.data.level) {
      this.setData({
        level: newLevel,
        timeLeft: this.data.timeLeft + 10 // 升级奖励时间
      });
      this.createLevelUpEffect();
    }
  },

  // 创建粒子效果
  createParticles: function (x, y, color, type) {
    const particles = this.data.particles;
    const particleCount = type === 'rainbow' ? 25 : (type === 'golden' ? 18 : 12);

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 3 + Math.random() * 4; // 增加粒子速度

      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: type === 'rainbow' ? this.getRainbowColor(i, particleCount) : color,
        size: 4 + Math.random() * 6, // 增大粒子尺寸
        life: 45 + Math.random() * 25, // 增加粒子寿命
        alpha: 1,
        gravity: 0.15 // 增加重力效果
      });
    }

    this.setData({ particles });
  },

  // 获取彩虹颜色
  getRainbowColor: function (index, total) {
    const hue = (index / total) * 360;
    return `hsl(${hue}, 100%, 50%)`;
  },

  // 创建彩虹效果
  createRainbowEffect: function (x, y) {
    const effects = this.data.specialEffects;

    effects.push({
      type: 'rainbow',
      x: x,
      y: y,
      radius: 0,
      maxRadius: 200,
      life: 30,
      alpha: 1
    });

    this.setData({ specialEffects: effects });
  },

  // 创建升级效果
  createLevelUpEffect: function () {
    const effects = this.data.specialEffects;

    effects.push({
      type: 'levelup',
      x: this.data.canvasWidth / 2,
      y: this.data.canvasHeight / 2,
      text: `等级提升！`,
      scale: 0,
      life: 60,
      alpha: 1
    });

    this.setData({ specialEffects: effects });
  },

  // 开始游戏
  // 开始游戏
  startGame: function () {
    console.log('开始游戏按钮被点击，当前状态:', this.data.gameStatus);

    // 检查Canvas是否初始化成功
    if (!this.canvas || !this.ctx) {
      console.log('Canvas未初始化，显示错误信息');
      this.showCanvasError('画布尚未初始化完成，请稍等片刻后重试');
      return;
    }

    console.log('Canvas已初始化，继续开始游戏');
    this.continueStartGame();
  },

  // 继续开始游戏
  continueStartGame: function () {
    this.setData({
      gameStatus: 'playing',
      score: 0,
      timeLeft: this.data.gameDuration,
      combo: 0,
      maxCombo: 0,
      level: 1,
      bubbles: [],
      particles: [],
      specialEffects: [],
      lastBubblePop: 0,
      animationFrame: null,
      gameTimer: null
    });

    this.startGameLoop();
    this.startTimer();
  },

  // 暂停游戏
  pauseGame: function () {
    this.setData({
      gameStatus: 'paused',
      statusTitle: '游戏暂停',
      statusMessage: '点击继续按钮恢复游戏',
      gameButtonText: '继续游戏'
    });
    this.stopGameLoop();
    this.stopTimer();
  },

  // 继续游戏
  resumeGame: function () {
    this.setData({ gameStatus: 'playing' });
    this.startGameLoop();
    this.startTimer();
  },

  // 重新开始
  restartGame: function () {
    console.log('重新开始游戏...');

    // 防止重复调用
    if (this.data.gameStatus === 'restarting') {
      console.log('游戏正在重新开始，跳过重复调用');
      return;
    }

    this.stopGameLoop();
    this.stopTimer();

    // 重置游戏数据
    this.setData({
      gameStatus: 'restarting',
      statusTitle: '重新开始',
      statusMessage: '正在准备新游戏...',
      gameButtonText: '请稍等'
    });

    // 如果是错误状态，先清除错误，然后重新初始化
    if (this.data.gameStatus === 'error') {
      console.log('清除错误状态并重新初始化Canvas...');
      this.setData({ gameStatus: 'ready' });
    }

    // 确保Canvas已初始化
    if (!this.canvas || !this.ctx) {
      console.log('Canvas未初始化，尝试初始化...');
      this.initCanvas();

      // 等待Canvas初始化完成
      setTimeout(() => {
        if (this.canvas && this.ctx) {
          console.log('Canvas初始化成功，开始新游戏');
          this.setData({
            gameStatus: 'ready',
            statusTitle: '气泡爆破',
            statusMessage: '点击泡泡获得分数，避开黑色泡泡！',
            gameButtonText: '开始游戏'
          });
          this.startGame();
        } else {
          console.error('Canvas初始化失败，显示错误信息');
          this.showCanvasError('画布初始化失败，请刷新页面重试');
        }
      }, 500); // 增加等待时间
      return;
    }

    // Canvas已初始化，直接开始新游戏
    console.log('Canvas已初始化，直接开始新游戏');
    this.setData({
      gameStatus: 'ready',
      statusTitle: '气泡爆破',
      statusMessage: '点击泡泡获得分数，避开黑色泡泡！',
      gameButtonText: '开始游戏'
    });
    this.startGame();
  },

  // 开始游戏循环
  startGameLoop: function () {
    if (this.data.animationFrame) {
      clearTimeout(this.data.animationFrame);
    }

    const gameLoop = () => {
      if (this.data.gameStatus === 'playing') {
        try {
          this.updateGame();
          this.renderGame();
          this.data.animationFrame = setTimeout(gameLoop, 16); // 约60fps
        } catch (error) {
          console.error('游戏循环错误:', error);
          this.stopGameLoop();
        }
      }
    };
    this.data.animationFrame = setTimeout(gameLoop, 16);
  },

  // 停止游戏循环
  stopGameLoop: function () {
    if (this.data.animationFrame) {
      clearTimeout(this.data.animationFrame);
      this.data.animationFrame = null;
      console.log('游戏循环已停止');
    }
  },

  // 开始计时器
  startTimer: function () {
    const timerId = setInterval(() => {
      if (this.data.timeLeft > 0) {
        this.setData({ timeLeft: this.data.timeLeft - 1 });
      } else {
        this.endGame();
      }
    }, 1000);
    this.setData({ gameTimer: timerId });
  },

  // 停止计时器
  stopTimer: function () {
    if (this.data.gameTimer) {
      clearInterval(this.data.gameTimer);
      this.setData({ gameTimer: null });
      console.log('计时器已停止');
    }
  },

  // 更新游戏
  updateGame: function () {
    try {
      this.updateBubbles();
      this.updateParticles();
      this.updateSpecialEffects();
      this.generateBubbles();
      this.checkComboTimeout();
    } catch (error) {
      console.error('更新游戏状态错误:', error);
      this.stopGameLoop();
    }
  },

  // 生成多个气泡
  generateBubbles: function () {
    const bubbles = this.data.bubbles;

    // 根据当前游戏状态和难度决定是否生成新气泡
    if (this.data.gameStatus !== 'playing') {
      return;
    }

    // 基于概率生成新气泡
    if (Math.random() < this.data.bubbleSpawnRate && bubbles.length < this.data.maxBubbles) {
      this.generateBubble();
    }
  },

  // 更新气泡
  updateBubbles: function () {
    const bubbles = this.data.bubbles;

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bubble = bubbles[i];

      // 上升运动
      bubble.y -= bubble.speed;

      // 摇摆效果
      bubble.x += Math.sin(Date.now() * bubble.wobble + bubble.pulsePhase) * 0.5;

      // 脉动效果
      bubble.pulsePhase += 0.1;

      // 移除超出屏幕的气泡
      if (bubble.y + bubble.radius < 0) {
        bubbles.splice(i, 1);
      }
    }

    this.setData({ bubbles });
  },

  // 更新粒子
  updateParticles: function () {
    const particles = this.data.particles;

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      // 更新位置
      particle.x += particle.vx;
      particle.y += particle.vy;

      // 应用重力
      particle.vy += particle.gravity;

      // 减少寿命
      particle.life--;

      // 缓慢减少透明度，让粒子更持久
      particle.alpha -= 0.015; // 减慢透明度下降速度

      // 添加阻力效果，让粒子逐渐减速
      particle.vx *= 0.98;
      particle.vy *= 0.98;

      // 移除消失的粒子
      if (particle.life <= 0 || particle.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    this.setData({ particles });
  },

  // 更新特殊效果
  updateSpecialEffects: function () {
    if (!this.data || !this.data.specialEffects) {
      return;
    }

    const effects = this.data.specialEffects;

    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];

      if (effect.type === 'rainbow') {
        effect.radius += 5;
        effect.alpha -= 0.02;
      } else if (effect.type === 'levelup') {
        effect.scale = Math.min(effect.scale + 0.05, 1);
        effect.alpha -= 0.015;
      }

      effect.life--;

      if (effect.life <= 0 || effect.alpha <= 0) {
        effects.splice(i, 1);
      }
    }

    this.setData({ specialEffects: effects });
  },

  // 检查连击超时
  checkComboTimeout: function () {
    const currentTime = Date.now();
    const timeSinceLastPop = currentTime - this.data.lastBubblePop;

    if (this.data.combo > 1 && timeSinceLastPop > this.data.comboTimeWindow) {
      this.setData({ combo: 0 });
    }
  },

  // 渲染游戏
  renderGame: function () {
    if (!this.ctx) return;

    try {
      this.drawBackground();
      this.drawBubbles();
      this.drawParticles();
      this.drawSpecialEffects();
      this.drawUI();
    } catch (error) {
      console.error('渲染游戏错误:', error);
    }
  },

  // 绘制气泡
  drawBubbles: function () {
    const bubbles = this.data.bubbles;

    bubbles.forEach(bubble => {
      this.ctx.save();

      // 脉动效果
      const pulseScale = 1 + Math.sin(bubble.pulsePhase) * 0.1;
      const radius = bubble.radius * pulseScale;

      // 绘制气泡主体
      this.ctx.globalAlpha = bubble.opacity;
      this.ctx.fillStyle = bubble.color;
      this.ctx.beginPath();
      this.ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // 绘制高光
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.beginPath();
      this.ctx.arc(bubble.x - radius * 0.3, bubble.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
      this.ctx.fill();

      // 特殊气泡效果
      if (bubble.type === 'golden') {
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(bubble.x, bubble.y, radius + 5, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (bubble.type === 'rainbow') {
        this.ctx.strokeStyle = bubble.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(bubble.x, bubble.y, radius + 3, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.restore();
    });
  },

  // 绘制粒子
  drawParticles: function () {
    const particles = this.data.particles;

    particles.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  },

  // 绘制特殊效果
  drawSpecialEffects: function () {
    if (!this.data || !this.data.specialEffects || !this.ctx) {
      return;
    }

    const effects = this.data.specialEffects;

    effects.forEach(effect => {
      this.ctx.save();
      this.ctx.globalAlpha = effect.alpha;

      if (effect.type === 'rainbow') {
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (effect.type === 'levelup') {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = `bold ${32 * effect.scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(effect.text, effect.x, effect.y);
      }

      this.ctx.restore();
    });
  },

  // 绘制UI
  drawUI: function () {
    if (!this.ctx) return;

    this.ctx.save();

    // 绘制分数
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`分数: ${this.data.score}`, 10, 30);

    // 绘制剩余时间
    const timeColor = this.data.timeLeft <= 10 ? '#FF0000' : '#FFFFFF';
    this.ctx.fillStyle = timeColor;
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`时间: ${this.data.timeLeft}s`, this.data.canvasWidth - 10, 30);

    // 绘制等级
    this.ctx.fillStyle = '#FFD700';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`等级: ${this.data.level}`, this.data.canvasWidth / 2, 30);

    // 绘制连击
    if (this.data.combo > 1) {
      this.ctx.fillStyle = '#FF4500';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillText(`连击 x${this.data.combo}`, this.data.canvasWidth / 2, 60);
    }

    this.ctx.restore();
  },

  // 结束游戏
  endGame: function () {
    this.stopGameLoop();
    this.stopTimer();

    this.setData({
      gameStatus: 'ended',
      statusTitle: '游戏结束',
      statusMessage: `最终得分: ${this.data.score}  最高连击: ${this.data.maxCombo}  最高等级: ${this.data.level}`,
      gameButtonText: '再玩一次'
    });

    this.saveGameProgress();
  },

  // 停止游戏
  stopGame: function () {
    this.stopGameLoop();
    this.stopTimer();
  },

  // 打开设置
  openSettings: function () {
    this.setData({ showSettings: true });
  },

  // 关闭设置
  closeSettings: function () {
    this.setData({ showSettings: false });
  },

  // 切换音效
  toggleSound: function (e) {
    this.setData({ soundEnabled: e.detail.value });
  },

  // 切换音乐
  toggleMusic: function (e) {
    this.setData({ musicEnabled: e.detail.value });
  },

  // 改变游戏时长
  changeGameDuration: function (e) {
    const index = parseInt(e.detail.value);
    const durations = [30, 60, 90, 120];

    this.setData({
      gameDurationIndex: index,
      gameDuration: durations[index],
      timeLeft: durations[index]
    });
  },

  // 改变难度
  changeDifficulty: function (e) {
    const index = parseInt(e.detail.value);

    this.setData({
      difficultyIndex: index
    });

    this.updateDifficultySettings();
  },

  // 保存游戏进度
  saveGameProgress: function () {
    const gameData = {
      score: this.data.score,
      maxCombo: this.data.maxCombo,
      maxLevel: this.data.level,
      timestamp: Date.now()
    };

    wx.setStorageSync('bubblePopProgress', gameData);
  },

  // 返回选择
  backToSelection: function () {
    wx.navigateBack();
  }
});
