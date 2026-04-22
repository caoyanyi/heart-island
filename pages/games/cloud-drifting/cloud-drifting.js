Page({
  data: {
    // 画布尺寸
    canvasWidth: 0,
    canvasHeight: 0,

    // 游戏状态
    gameStatus: 'ready', // ready, playing, paused, ended
    isPlaying: false,
    isPaused: false,
    isBusy: false,
    showEntryPanel: true,
    showEntryTips: true,
    showGameControls: false,
    canvasVisible: false,
    score: 0,
    timeLeft: 60,
    combo: 0,
    maxCombo: 0,

    // 玩家云朵
    playerCloud: {
      x: 0,
      y: 0,
      size: 40,
      color: '#FFFFFF',
      vx: 0,
      vy: 0
    },

    // 游戏元素
    bubbles: [],
    darkClouds: [],
    particles: [],
    surpriseAnimals: [],

    // 游戏设置
    soundEnabled: true,
    musicEnabled: true,
    gameDuration: 60,
    gameDurationIndex: 0,
    durationOptions: ['30秒', '60秒', '90秒', '120秒'],
    showSettings: false,

    // 状态显示
    statusTitle: '云朵漂流',
    statusMessage: '拖拽云朵收集气泡，避开乌云',
    gameButtonText: '开始游戏',

    // 动画相关
    animationFrame: null,
    gameTimer: null,
    lastTime: 0,

    // 音频上下文
    audioContext: null
  },

  onLoad() {
    console.log('云漂流游戏页面加载');
    this.initGame();
    this.loadAudio();
    // 延迟设置加载状态，确保页面已经准备好
    this.$ready = false;
    this.$pendingDataUpdates = [];
    setTimeout(() => {
      this.setData({
        gameStatus: 'loading',
        ...this.getStatusViewState('loading'),
        statusTitle: '云朵漂流',
        statusMessage: '游戏加载中...',
        gameButtonText: '准备中'
      });
      this.$ready = true;
      // 处理pending的数据更新
      this.processPendingDataUpdates();
    }, 50);
  },

  getStatusViewState: function (status) {
    const isPlaying = status === 'playing';
    const isPaused = status === 'paused';
    return {
      isPlaying,
      isPaused,
      isBusy: status === 'loading' || status === 'initializing' || status === 'restarting',
      showEntryPanel: !isPlaying,
      showEntryTips: status === 'ready' || isPaused,
      showGameControls: isPlaying || isPaused,
      canvasVisible: isPlaying
    };
  },

  withStatusViewState: function (data) {
    if (data && Object.prototype.hasOwnProperty.call(data, 'gameStatus')) {
      return {
        ...data,
        ...this.getStatusViewState(data.gameStatus)
      };
    }
    return data;
  },

  // 安全的setData包装方法
  safeSetData: function (data, callback) {
    data = this.withStatusViewState(data);
    if (!this.$ready) {
      console.warn('页面未准备好，缓存数据更新:', data);
      this.$pendingDataUpdates.push({ data, callback });
      return;
    }

    try {
      this.setData(data, callback);
    } catch (error) {
      console.error('setData失败:', error);
      // 降级处理：逐个设置数据
      const keys = Object.keys(data);
      keys.forEach(key => {
        try {
          this.setData({ [key]: data[key] });
        } catch (innerError) {
          console.error(`设置 ${key} 失败:`, innerError);
        }
      });
      if (callback) callback();
    }
  },

  // 处理pending的数据更新
  processPendingDataUpdates: function () {
    while (this.$pendingDataUpdates && this.$pendingDataUpdates.length > 0) {
      const update = this.$pendingDataUpdates.shift();
      try {
        this.setData(update.data, update.callback);
      } catch (error) {
        console.error('处理pending数据更新失败:', error);
      }
    }
  },

  onReady: function () {
    // 延迟初始化以确保DOM完全加载
    setTimeout(() => {
      this.initCanvas();
    }, 150);
  },

  onShow: function () {
    if (this.data.gameStatus !== 'playing') {
      this.setData(this.getStatusViewState(this.data.gameStatus || 'ready'));
    }
  },

  onUnload: function () {
    // 清理所有定时器
    if (this.canvasInitTimer) {
      clearTimeout(this.canvasInitTimer);
      this.canvasInitTimer = null;
    }

    // 停止游戏循环和计时器
    this.stopGame();

    // 释放音频资源
    this.releaseAudio();

    // 清理其他引用
    this.ctx = null;
  },

  onHide: function () {
    if (this.data.gameStatus === 'playing') {
      this.pauseGame();
    }
  },

  // 初始化游戏
  initGame: function () {
    try {
      // 使用新的API替代弃用的wx.getSystemInfoSync
      const windowInfo = wx.getWindowInfo();
      const deviceInfo = wx.getDeviceInfo();

      const canvasWidth = windowInfo.windowWidth;
      const canvasHeight = Math.max(400, windowInfo.windowHeight - 100); // 确保最小高度

      this.setData({
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        'playerCloud.x': canvasWidth / 2,
        'playerCloud.y': canvasHeight / 2
      });
      
      console.log('游戏初始化成功', { canvasWidth, canvasHeight });
    } catch (error) {
      console.warn('游戏初始化降级处理:', error);

      // 降级处理
      this.setData({
        canvasWidth: 375,
        canvasHeight: 600,
        'playerCloud.x': 187,
        'playerCloud.y': 300
      });
    }
  },

  // 初始化画布
  initCanvas: function () {
    // 清理之前的定时器
    if (this.canvasInitTimer) {
      clearTimeout(this.canvasInitTimer);
      this.canvasInitTimer = null;
    }

    // 延迟Canvas初始化，确保页面完全渲染
    this.canvasInitTimer = setTimeout(() => {
      try {
        const query = wx.createSelectorQuery();
        query.select('#cloudCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            console.log('Canvas初始化开始...', res);

            if (res && res[0] && res[0].node) {
              const canvas = res[0].node;
              this.ctx = canvas.getContext('2d');
              console.log('Canvas节点获取成功');

              // 设置画布尺寸和缩放
              try {
                const deviceInfo = wx.getDeviceInfo();
                const dpr = deviceInfo.pixelRatio || 1;
                canvas.width = res[0].width * dpr;
                canvas.height = res[0].height * dpr;
                this.ctx.scale(dpr, dpr);
                console.log('Canvas缩放设置成功', { dpr, width: canvas.width, height: canvas.height });
              } catch (error) {
                console.warn('Canvas缩放设置失败，使用降级方案:', error);
                canvas.width = res[0].width;
                canvas.height = res[0].height;
              }

              this.drawBackground();
              // Canvas初始化成功，切换到就绪状态 - 确保页面准备好再更新状态
              setTimeout(() => {
                this.safeSetData({
                  gameStatus: 'ready',
                  statusTitle: '云朵漂流',
                  statusMessage: '拖拽云朵收集气泡，避开乌云',
                  gameButtonText: '开始游戏'
                });
              }, 100);
              console.log('Canvas初始化完成，切换到就绪状态');
            } else {
              console.warn('Canvas节点获取失败，使用降级方案');
              // 降级处理
              this.ctx = wx.createCanvasContext('cloudCanvas', this);
              // 确保页面准备好再更新状态
              setTimeout(() => {
                this.safeSetData({
                  gameStatus: 'ready',
                  statusTitle: '云朵漂流',
                  statusMessage: '拖拽云朵收集气泡，避开乌云',
                  gameButtonText: '开始游戏'
                });
              }, 100);
            }
          });
      } catch (error) {
        console.error('Canvas初始化异常:', error);
        // 最终降级方案
        this.ctx = wx.createCanvasContext('cloudCanvas', this);
        // 确保页面准备好再更新状态
        setTimeout(() => {
          this.safeSetData({
            gameStatus: 'ready',
            statusTitle: '云朵漂流',
            statusMessage: '拖拽云朵收集气泡，避开乌云',
            gameButtonText: '开始游戏'
          });
        }, 100);
      }
    }, 150); // 延迟150ms确保DOM完全渲染
  },

  // 加载音频
  loadAudio() {
    if (!this.data.soundEnabled) return;
    try {
      // 使用音频管理器创建音效音频上下文
      const { audioManager } = require('../../../utils/audio-manager.js');
      this.audioContext = wx.createInnerAudioContext();

      // 使用音频管理器加载音频文件
      audioManager.loadAudioFile(this.audioContext, 'https://file.okrcn.com/wx/sounds/pop.mp3')
        .then(loadSuccess => {
          if (loadSuccess) {
            this.audioContext.volume = 0.3;
            console.log('Audio loaded successfully');
          } else {
            console.warn('Audio file load failed, using fallback');
            this.audioContext = null;
            // 降级处理：使用振动反馈
            if (wx.vibrateShort) {
              wx.vibrateShort();
            }
          }
        })
        .catch(error => {
          console.warn('Audio initialization failed:', error);
          this.audioContext = null;
          // 降级处理
          if (wx.vibrateShort) {
            wx.vibrateShort();
          }
        });
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      this.audioContext = null;
      // 降级处理
      if (wx.vibrateShort) {
        wx.vibrateShort();
      }
    }
  },

  // 释放音频
  releaseAudio: function () {
    if (this.audioContext) {
      try {
        const { audioManager } = require('../../../utils/audio-manager.js');
        audioManager.stopAndDestroy(this.audioContext);
        this.audioContext = null;
      } catch (error) {
        console.warn('Release audio failed:', error);
      }
    }
  },

  // 播放音效（降级方案）
  playSound() {
    if (!this.data.soundEnabled) return;

    if (this.audioContext) {
      try {
        this.audioContext.stop();
        this.audioContext.seek(0);
        this.audioContext.play().catch(error => {
          console.warn('Failed to play sound:', error);
          // 降级到震动反馈
          this.vibrateFeedback();
        });
      } catch (error) {
        console.warn('Failed to play sound:', error);
        // 降级到震动反馈
        this.vibrateFeedback();
      }
    } else {
      // 没有音频上下文，使用震动反馈
      this.vibrateFeedback();
    }
  },

  // 震动反馈作为音效降级
  vibrateFeedback: function () {
    if (wx.vibrateShort) {
      wx.vibrateShort();
    }
  },

  // 绘制背景
  drawBackground: function () {
    if (!this.ctx) return;

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.data.canvasHeight);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);
  },

  // 生成气泡
  generateBubble: function () {
    const bubbles = this.data.bubbles;
    if (bubbles.length < 8) {
      const bubble = {
        x: Math.random() * this.data.canvasWidth,
        y: -20,
        size: 15 + Math.random() * 10,
        color: this.getRandomColor(),
        speed: 1 + Math.random() * 2,
        points: Math.floor(10 + Math.random() * 20)
      };
      bubbles.push(bubble);
      // 使用safeSetData确保数据更新安全
      this.safeSetData({ bubbles });
    }
  },

  // 生成乌云
  generateDarkCloud: function () {
    const darkClouds = this.data.darkClouds;
    if (darkClouds.length < 3) {
      const darkCloud = {
        x: Math.random() * this.data.canvasWidth,
        y: -30,
        size: 25 + Math.random() * 15,
        speed: 0.5 + Math.random() * 1.5,
        damage: 10
      };
      darkClouds.push(darkCloud);
      // 使用safeSetData确保数据更新安全
      this.safeSetData({ darkClouds });
    }
  },

  // 获取随机颜色
  getRandomColor: function () {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // 生成惊喜动物
  generateSurpriseAnimal: function () {
    const surpriseAnimals = this.data.surpriseAnimals;
    
    // 限制同时存在的惊喜动物数量
    if (surpriseAnimals.length >= 2) return;

    // 确保画布尺寸已正确初始化
    if (!this.data.canvasWidth || !this.data.canvasHeight || 
        this.data.canvasWidth <= 0 || this.data.canvasHeight <= 0) {
      console.warn('Canvas尺寸未初始化，跳过惊喜动物生成');
      return;
    }

    const animalTypes = [
      { type: '🐱', name: '小猫', points: 50 },
      { type: '🐰', name: '小兔', points: 40 },
      { type: '🐻', name: '小熊', points: 60 },
      { type: '🦋', name: '蝴蝶', points: 30 },
      { type: '🐦', name: '小鸟', points: 35 },
      { type: '🦉', name: '猫头鹰', points: 45 }
    ];

    const randomAnimal = animalTypes[Math.floor(Math.random() * animalTypes.length)];
    
    // 安全生成动物位置，确保在有效范围内
    const maxX = Math.max(60, this.data.canvasWidth - 60);
    const maxY = Math.max(60, this.data.canvasHeight - 60);
    
    const animal = {
      x: Math.random() * (maxX - 30) + 30,
      y: Math.random() * (maxY - 30) + 30,
      type: randomAnimal.type,
      name: randomAnimal.name,
      points: randomAnimal.points,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      floatPhase: 0,
      stayTime: 300, // 停留5秒 (60FPS * 5秒)
      collected: false
    };

    surpriseAnimals.push(animal);
    this.safeSetData({ surpriseAnimals });
    
    // 播放特殊音效或震动反馈
    this.playSpecialSound();
    
    console.log(`惊喜动物出现: ${randomAnimal.name} ${randomAnimal.type}`);
  },

  // 播放特殊音效
  playSpecialSound: function () {
    if (!this.data.soundEnabled) return;
    
    try {
      // 使用特殊音效或震动反馈
      if (this.audioContext) {
        this.audioContext.stop();
        this.audioContext.seek(0);
        this.audioContext.play();
      } else {
        // 使用轻微震动作为惊喜反馈
        if (wx.vibrateShort) {
          wx.vibrateShort({ type: 'light' });
        }
      }
    } catch (error) {
      console.warn('Special sound play failed:', error);
    }
  },

  // 触摸开始
  onTouchStart: function (e) {
    if (this.data.gameStatus !== 'playing') return;

    const touch = e.touches[0];
    const playerCloud = this.data.playerCloud;

    // 使用safeSetData确保数据更新安全
    this.safeSetData({
      'playerCloud.vx': (touch.x - playerCloud.x) * 0.1,
      'playerCloud.vy': (touch.y - playerCloud.y) * 0.1
    });
  },

  // 触摸移动
  onTouchMove: function (e) {
    if (this.data.gameStatus !== 'playing') return;

    const touch = e.touches[0];
    // 使用safeSetData确保数据更新安全
    this.safeSetData({
      'playerCloud.x': touch.x,
      'playerCloud.y': touch.y
    });
  },

  // 触摸结束
  onTouchEnd: function () {
    if (this.data.gameStatus !== 'playing') return;

    // 使用safeSetData确保数据更新安全
    this.safeSetData({
      'playerCloud.vx': 0,
      'playerCloud.vy': 0
    });
  },

  // 开始游戏
  startGame() {
    console.log('开始游戏，当前状态:', this.data.gameStatus);

    // 确保页面准备好再开始游戏
    if (!this.$ready) {
      console.warn('页面还未准备好，延迟开始游戏');
      setTimeout(() => this.startGame(), 100);
      return;
    }

    // 确保画布已初始化
    if (!this.ctx) {
      console.log('画布未初始化，先初始化画布');
      this.initCanvas();

      // 延迟开始以确保Canvas初始化完成
      setTimeout(() => {
        if (!this.ctx) {
          console.error('Canvas initialization failed, cannot start game');
          this.safeSetData({
            gameStatus: 'ready',
            gameButtonText: '开始游戏',
            statusTitle: '初始化失败',
            statusMessage: '画布初始化失败，请重试'
          });
          return;
        }
        this.proceedWithGameStart();
      }, 1000);
    } else {
      this.proceedWithGameStart();
    }
  },

  // 继续游戏开始流程
  proceedWithGameStart: function () {
    if (!this.ctx) {
      console.error('Canvas context not available, cannot start game');
      return;
    }

    console.log('继续游戏开始流程');

    // 使用safeSetData确保数据更新安全
    this.safeSetData({
      gameStatus: 'playing',
      score: 0,
      timeLeft: this.data.gameDuration,
      combo: 0,
      maxCombo: 0,
      bubbles: [],
      darkClouds: [],
      particles: []
    }, () => {
      // 数据更新完成后再开始游戏循环和计时器
      this.startGameLoop();
      this.startTimer();
      // 添加开始动画
      this.showStartAnimation();
    });
  },

  // 暂停游戏
  pauseGame: function () {
    // 使用safeSetData确保数据更新安全
    this.safeSetData({
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
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ gameStatus: 'playing' });
    this.startGameLoop();
    this.startTimer();
  },

  // 重新开始
  restartGame() {
    this.stopGameLoop();
    this.stopTimer();
    this.startGame();
  },

  // 开始游戏循环
  startGameLoop: function () {
    // 确保页面准备好再开始游戏循环
    if (!this.$ready) {
      console.warn('页面还未准备好，延迟启动游戏循环');
      setTimeout(() => this.startGameLoop(), 100);
      return;
    }

    const gameLoop = () => {
      if (this.data.gameStatus === 'playing') {
        try {
          this.updateGame();
          this.renderGame();
          // 使用小程序的定时器替代requestAnimationFrame
          const frameId = setTimeout(gameLoop, 16); // 约60FPS
          // 使用safeSetData确保数据更新安全
          this.safeSetData({ animationFrame: frameId });
        } catch (error) {
          console.error('Game loop error:', error);
        }
      }
    };
    // 使用小程序的定时器替代requestAnimationFrame
    const initialFrameId = setTimeout(gameLoop, 16); // 约60FPS
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ animationFrame: initialFrameId });
  },

  // 停止游戏循环
  stopGameLoop: function () {
    if (this.data.animationFrame) {
      clearTimeout(this.data.animationFrame);
      // 使用safeSetData确保数据更新安全
      this.safeSetData({ animationFrame: null });
    }
  },

  // 开始计时器
  startTimer: function () {
    const timerId = setInterval(() => {
      if (this.data.timeLeft > 0) {
        // 使用safeSetData确保数据更新安全
        this.safeSetData({ timeLeft: this.data.timeLeft - 1 });
      } else {
        this.endGame();
      }
    }, 1000);
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ gameTimer: timerId });
  },

  // 停止计时器
  stopTimer: function () {
    if (this.data.gameTimer) {
      clearInterval(this.data.gameTimer);
      // 使用safeSetData确保数据更新安全
      this.safeSetData({ gameTimer: null });
    }
  },

  // 更新游戏
  updateGame: function () {
    this.updatePlayerCloud();
    this.updateBubbles();
    this.updateDarkClouds();
    this.updateParticles();
    this.updateSurpriseAnimals();
    this.checkCollisions();

    // 生成新元素
    if (Math.random() < 0.02) this.generateBubble();
    if (Math.random() < 0.005) this.generateDarkCloud();
    // 随机生成惊喜动物 (低概率，大约每30秒一次)
    if (Math.random() < 0.003) this.generateSurpriseAnimal();
  },

  // 更新玩家云朵
  updatePlayerCloud: function () {
    const playerCloud = this.data.playerCloud;

    // 应用速度
    playerCloud.x += playerCloud.vx;
    playerCloud.y += playerCloud.vy;

    // 边界检测
    if (playerCloud.x < playerCloud.size) {
      playerCloud.x = playerCloud.size;
      playerCloud.vx = 0;
    }
    if (playerCloud.x > this.data.canvasWidth - playerCloud.size) {
      playerCloud.x = this.data.canvasWidth - playerCloud.size;
      playerCloud.vx = 0;
    }
    if (playerCloud.y < playerCloud.size) {
      playerCloud.y = playerCloud.size;
      playerCloud.vy = 0;
    }
    if (playerCloud.y > this.data.canvasHeight - playerCloud.size) {
      playerCloud.y = this.data.canvasHeight - playerCloud.size;
      playerCloud.vy = 0;
    }

    // 使用safeSetData确保数据更新安全
    this.safeSetData({ playerCloud });
  },

  // 更新气泡
  updateBubbles: function () {
    const bubbles = this.data.bubbles;
    for (let i = bubbles.length - 1; i >= 0; i--) {
      bubbles[i].y += bubbles[i].speed;
      if (bubbles[i].y > this.data.canvasHeight + 20) {
        bubbles.splice(i, 1);
      }
    }
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ bubbles });
  },

  // 更新乌云
  updateDarkClouds: function () {
    const darkClouds = this.data.darkClouds;
    for (let i = darkClouds.length - 1; i >= 0; i--) {
      darkClouds[i].y += darkClouds[i].speed;
      if (darkClouds[i].y > this.data.canvasHeight + 30) {
        darkClouds.splice(i, 1);
      }
    }
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ darkClouds });
  },

  // 更新粒子效果
  updateParticles: function () {
    const particles = this.data.particles;
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].x += particles[i].vx;
      particles[i].y += particles[i].vy;
      particles[i].life--;
      particles[i].alpha -= 0.02;

      if (particles[i].life <= 0 || particles[i].alpha <= 0) {
        particles.splice(i, 1);
      }
    }
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ particles });
  },

  // 更新惊喜动物
  updateSurpriseAnimals: function () {
    const surpriseAnimals = this.data.surpriseAnimals;
    for (let i = surpriseAnimals.length - 1; i >= 0; i--) {
      const animal = surpriseAnimals[i];
      
      // 动物漂浮动画
      animal.x += animal.vx;
      animal.y += animal.vy;
      animal.floatPhase += 0.1;
      animal.y += Math.sin(animal.floatPhase) * 0.5; // 漂浮效果
      
      // 停留时间检测
      animal.stayTime--;
      
      // 如果停留时间结束或者飞出边界，移除动物
      if (animal.stayTime <= 0 || animal.x < -50 || animal.x > this.data.canvasWidth + 50) {
        surpriseAnimals.splice(i, 1);
      }
    }
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ surpriseAnimals });
  },

  // 检测碰撞
  checkCollisions: function () {
    const playerCloud = this.data.playerCloud;

    // 检测气泡碰撞
    const bubbles = this.data.bubbles;
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bubble = bubbles[i];
      const distance = Math.sqrt(
        Math.pow(playerCloud.x - bubble.x, 2) +
        Math.pow(playerCloud.y - bubble.y, 2)
      );

      if (distance < playerCloud.size + bubble.size) {
        // 收集气泡
        this.collectBubble(bubble);
        bubbles.splice(i, 1);
        this.createParticles(bubble.x, bubble.y, bubble.color);
      }
    }

    // 检测乌云碰撞
    const darkClouds = this.data.darkClouds;
    for (let i = darkClouds.length - 1; i >= 0; i--) {
      const darkCloud = darkClouds[i];
      const distance = Math.sqrt(
        Math.pow(playerCloud.x - darkCloud.x, 2) +
        Math.pow(playerCloud.y - darkCloud.y, 2)
      );

      if (distance < playerCloud.size + darkCloud.size) {
        // 碰到乌云
        this.hitDarkCloud(darkCloud);
        darkClouds.splice(i, 1);
      }
    }

    // 检测惊喜动物碰撞
    const surpriseAnimals = this.data.surpriseAnimals;
    for (let i = surpriseAnimals.length - 1; i >= 0; i--) {
      const animal = surpriseAnimals[i];
      if (animal.collected) continue; // 跳过已收集的动物
      
      const distance = Math.sqrt(
        Math.pow(playerCloud.x - animal.x, 2) +
        Math.pow(playerCloud.y - animal.y, 2)
      );

      if (distance < playerCloud.size + 20) { // 动物碰撞检测半径
        // 收集惊喜动物
        this.collectSurpriseAnimal(animal);
        surpriseAnimals.splice(i, 1);
      }
    }

    // 使用safeSetData确保数据更新安全
    this.safeSetData({ bubbles, darkClouds, surpriseAnimals });
  },

  // 收集气泡
  collectBubble: function (bubble) {
    const newCombo = this.data.combo + 1;
    const comboBonus = Math.floor(newCombo / 5) * 5;
    const points = bubble.points + comboBonus;

    // 使用safeSetData确保数据更新安全
    this.safeSetData({
      score: this.data.score + points,
      combo: newCombo,
      maxCombo: Math.max(this.data.maxCombo, newCombo)
    });

    // 播放音效（异步，但不等待）
    this.playSound();
  },

  // 碰到乌云
  hitDarkCloud: function (darkCloud) {
    // 使用safeSetData确保数据更新安全
    this.safeSetData({
      score: Math.max(0, this.data.score - darkCloud.damage),
      combo: 0
    });
  },

  // 收集惊喜动物
  collectSurpriseAnimal: function (animal) {
    const bonusScore = animal.points + (this.data.combo * 2); // 连击奖励
    
    // 使用safeSetData确保数据更新安全
    this.safeSetData({
      score: this.data.score + bonusScore,
      combo: this.data.combo + 1,
      maxCombo: Math.max(this.data.maxCombo, this.data.combo + 1)
    });

    // 播放特殊音效或震动反馈
    this.playSpecialSound();
    
    // 创建特殊粒子效果
    this.createSpecialParticles(animal.x, animal.y, '#FFD700');
    
    // 显示收集提示
    this.showCollectMessage(`${animal.name} ${animal.type} 带来惊喜！+${bonusScore}分`);

    console.log(`收集惊喜动物: ${animal.name} ${animal.type}, 获得 ${bonusScore} 分`);
  },

  // 创建特殊粒子效果
  createSpecialParticles: function (x, y, color) {
    const particles = this.data.particles;
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: color,
        size: 4 + Math.random() * 6,
        life: 60,
        alpha: 1
      });
    }
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ particles });
  },

  // 显示收集消息
  showCollectMessage: function (message) {
    // 检查消息有效性，防止undefined
    if (!message || typeof message !== 'string') {
      console.warn('收集消息无效:', message);
      return;
    }
    
    console.log('🎉', message);
    
    // 未来可以扩展为显示在游戏UI中的临时消息
    // this.showTemporaryMessage(message);
  },

  // 创建粒子效果
  createParticles: function (x, y, color) {
    const particles = this.data.particles;
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: color,
        size: 3 + Math.random() * 3,
        life: 30,
        alpha: 1
      });
    }
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ particles });
  },

  // 渲染游戏
  renderGame: function () {
    if (!this.ctx) {
      console.warn('Canvas context not available');
      return;
    }

    try {
      // 清空画布
      this.ctx.clearRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);

      this.drawBackground();
      this.drawBubbles();
      this.drawDarkClouds();
      this.drawSurpriseAnimals();
      this.drawPlayerCloud();
      this.drawParticles();
    } catch (error) {
      console.error('Render game error:', error);
    }
  },

  // 绘制气泡
  drawBubbles: function () {
    const bubbles = this.data.bubbles;
    bubbles.forEach(bubble => {
      this.ctx.fillStyle = bubble.color;
      this.ctx.beginPath();
      this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      this.ctx.fill();

      // 气泡高光
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  },

  // 绘制乌云
  drawDarkClouds: function () {
    const darkClouds = this.data.darkClouds;
    darkClouds.forEach(darkCloud => {
      this.ctx.fillStyle = '#696969';
      this.ctx.beginPath();
      this.ctx.arc(darkCloud.x, darkCloud.y, darkCloud.size, 0, Math.PI * 2);
      this.ctx.fill();

      // 乌云阴影
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      this.ctx.beginPath();
      this.ctx.arc(darkCloud.x + 2, darkCloud.y + 2, darkCloud.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  },

  // 绘制惊喜动物
  drawSurpriseAnimals: function () {
    const surpriseAnimals = this.data.surpriseAnimals;
    
    surpriseAnimals.forEach(animal => {
      if (animal.collected) return; // 跳过已收集的动物
      
      // 检查动物数据有效性
      if (!animal || typeof animal.x !== 'number' || typeof animal.y !== 'number' || 
          !animal.type || !animal.name) {
        console.warn('动物数据异常:', animal);
        return;
      }
      
      this.ctx.save();
      
      // 设置透明度（淡入效果）
      this.ctx.globalAlpha = Math.min(1, animal.life / 30);
      
      // 绘制动物背景圆圈
      this.ctx.fillStyle = animal.color || '#87CEEB';
      this.ctx.beginPath();
      this.ctx.arc(animal.x, animal.y, 20, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 绘制动物图标（简化版本）
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(animal.type, animal.x, animal.y + 5);
      
      // 绘制收集提示点
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(animal.x + 15, animal.y - 15, 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  },

  // 绘制玩家云朵
  drawPlayerCloud: function () {
    const playerCloud = this.data.playerCloud;

    this.ctx.fillStyle = playerCloud.color;
    this.ctx.beginPath();
    this.ctx.arc(playerCloud.x, playerCloud.y, playerCloud.size, 0, Math.PI * 2);
    this.ctx.fill();

    // 云朵阴影
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.beginPath();
    this.ctx.arc(playerCloud.x + 2, playerCloud.y + 2, playerCloud.size, 0, Math.PI * 2);
    this.ctx.fill();

    // 云朵高光
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(playerCloud.x - playerCloud.size * 0.3, playerCloud.y - playerCloud.size * 0.3, playerCloud.size * 0.4, 0, Math.PI * 2);
    this.ctx.fill();
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

  // 显示开始动画
  showStartAnimation: function () {
    // 创建开始粒子效果
    for (let i = 0; i < 15; i++) {
      this.data.particles.push({
        x: this.data.playerCloud.x,
        y: this.data.playerCloud.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: '#FFD700',
        size: 4 + Math.random() * 4,
        life: 45,
        alpha: 1
      });
    }

    // 生成一些初始气泡作为欢迎
    for (let i = 0; i < 3; i++) {
      this.generateBubble();
    }


  },

  // 结束游戏
  endGame: function () {
    this.stopGameLoop();
    this.stopTimer();

    // 使用safeSetData确保数据更新安全
    this.safeSetData({
      gameStatus: 'ended',
      statusTitle: '游戏结束',
      statusMessage: `最终得分: ${this.data.score}\n最高连击: ${this.data.maxCombo}`,
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
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ showSettings: true });
  },

  // 关闭设置
  closeSettings: function () {
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ showSettings: false });
  },

  // 切换音效
  toggleSound: function (e) {
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ soundEnabled: e.detail.value });
  },

  // 切换音乐
  toggleMusic: function (e) {
    // 使用safeSetData确保数据更新安全
    this.safeSetData({ musicEnabled: e.detail.value });
  },

  // 改变游戏时长
  changeGameDuration: function (e) {
    const index = parseInt(e.detail.value);
    const durations = [30, 60, 90, 120];

    // 使用safeSetData确保数据更新安全
    this.safeSetData({
      gameDurationIndex: index,
      gameDuration: durations[index],
      timeLeft: durations[index]
    });
  },

  // 保存游戏进度
  saveGameProgress: function () {
    const gameData = {
      score: this.data.score,
      maxCombo: this.data.maxCombo,
      timestamp: Date.now()
    };

    wx.setStorageSync('cloudDriftingProgress', gameData);
  },

  // 返回选择
  backToSelection: function () {
    wx.navigateBack();
  }
});
