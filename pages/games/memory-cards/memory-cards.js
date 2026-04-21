Page({
  data: {
    // 游戏状态
    gameStatus: 'ready', // ready, playing, paused, completed
    score: 0,
    matches: 0,
    attempts: 0,
    timeLeft: 180, // 3分钟
    timeLeftText: '3分0秒',

    // 卡片数据
    cards: [],
    flippedCards: [],
    matchedCards: [],
    isProcessing: false,

    // 游戏设置
    difficulty: 'medium', // easy, medium, hard
    gridSize: 4, // 4x4 网格
    cardTheme: 'nature', // nature, animals, symbols
    soundEnabled: true,

    // 主题配置
    themes: {
      nature: [
        '🌸', '🌺', '🌻', '🌲', '🌴', '🌵', '🍀', '🌿',
        '🍁', '🍂', '🌙', '⭐', '☀️', '🌈', '💧', '🔥'
      ],
      animals: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
        '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'
      ],
      symbols: [
        '❤️', '💛', '💚', '💙', '💜', '🧡', '💕', '💞',
        '💫', '⭐', '✨', '🔥', '💎', '🌟', '💝', '💖'
      ]
    },

    // 计时器
    gameTimer: null,

    // 完成状态
    isCompleted: false,
    completionTime: 0,
    completionTimeText: '0分0秒',
    accuracyRate: 0,
    bestTime: null,
    bestTimeText: '',
    bestScore: null,

    // 动画状态
    animatingCards: [],

    // 连击奖励
    comboCount: 0,
    maxCombo: 0,
    comboMultiplier: 1
  },

  onLoad: function () {
    this.loadGameSettings();
    this.loadBestScores();
  },

  onReady: function () {
    this.initGame();
  },

  onUnload: function () {
    this.stopTimer();

    // 清理音效实例
    if (this.flipAudio) {
      this.flipAudio.destroy();
      this.flipAudio = null;
    }
    if (this.matchAudio) {
      this.matchAudio.destroy();
      this.matchAudio = null;
    }
    if (this.mismatchAudio) {
      this.mismatchAudio.destroy();
      this.mismatchAudio = null;
    }
    if (this.completeAudio) {
      this.completeAudio.destroy();
      this.completeAudio = null;
    }
  },

  onHide: function () {
    if (this.data.gameStatus === 'playing') {
      this.pauseGame();
    }
  },

  // 初始化游戏
  initGame: function () {
    const gridSize = this.data.gridSize;
    const totalCards = gridSize * gridSize;
    const pairsNeeded = totalCards / 2;
    const theme = this.data.themes[this.data.cardTheme];

    // 选择卡片内容
    const selectedCards = theme.slice(0, pairsNeeded);

    // 创建卡片数组（每个内容两张）
    let cardData = [];
    selectedCards.forEach((content, index) => {
      cardData.push({
        id: index * 2,
        content: content,
        isFlipped: false,
        isMatched: false,
        isAnimating: false,
        canFlip: true
      });
      cardData.push({
        id: index * 2 + 1,
        content: content,
        isFlipped: false,
        isMatched: false,
        isAnimating: false,
        canFlip: true
      });
    });

    // 打乱卡片顺序
    cardData = this.shuffleArray(cardData);

    // 将卡片分配到网格中
    const cards = [];
    for (let row = 0; row < gridSize; row++) {
      cards[row] = [];
      for (let col = 0; col < gridSize; col++) {
        const cardIndex = row * gridSize + col;
        cards[row][col] = cardData[cardIndex];
      }
    }

    this.setData({
      cards,
      flippedCards: [],
      matchedCards: [],
      attempts: 0,
      matches: 0,
      score: 0,
      timeLeftText: this.formatTime(this.data.timeLeft),
      comboCount: 0,
      maxCombo: 0,
      comboMultiplier: 1,
      isProcessing: false
    });
  },

  // 打乱数组
  shuffleArray: function (array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // 开始游戏
  startGame: function () {
    this.setData({
      gameStatus: 'playing',
      timeLeft: 180,
      timeLeftText: this.formatTime(180),
      isCompleted: false
    });

    this.startTimer();
  },

  // 暂停游戏
  pauseGame: function () {
    this.setData({ gameStatus: 'paused' });
    this.stopTimer();
  },

  // 继续游戏
  resumeGame: function () {
    this.setData({ gameStatus: 'playing' });
    this.startTimer();
  },

  // 重新开始
  restartGame: function () {
    this.stopTimer();
    this.setData({
      gameStatus: 'ready',
      isCompleted: false
    });
    this.initGame();
  },

  // 处理卡片点击
  onCardTap: function (e) {
    if (this.data.gameStatus !== 'playing' || this.data.isProcessing) return;

    const { row, col } = e.currentTarget.dataset;
    const card = this.data.cards[row][col];

    // 检查卡片是否可以翻转
    if (!card.canFlip || card.isFlipped || card.isMatched) return;

    // 翻转卡片
    this.flipCard(row, col);
  },

  // 翻转卡片
  flipCard: function (row, col) {
    const cards = this.data.cards;
    const card = cards[row][col];

    // 更新卡片状态
    card.isFlipped = true;
    card.canFlip = false;

    // 添加动画效果
    this.addAnimation(row, col);

    this.setData({ cards });

    // 播放翻牌音效
    this.playFlipSound();

    // 添加到已翻转卡片列表
    const flippedCards = [...this.data.flippedCards, { row, col, content: card.content }];

    if (flippedCards.length === 2) {
      // 检查匹配
      this.checkMatch(flippedCards);
    } else {
      this.setData({ flippedCards });
    }
  },

  // 检查匹配
  checkMatch: function (flippedCards) {
    this.setData({ isProcessing: true });

    const [first, second] = flippedCards;
    const isMatch = first.content === second.content;

    if (isMatch) {
      // 匹配成功
      this.handleMatchSuccess(first, second);
    } else {
      // 匹配失败
      this.handleMatchFailure(first, second);
    }
  },

  // 处理匹配成功
  handleMatchSuccess: function (first, second) {
    const cards = this.data.cards;

    // 标记卡片为已匹配
    cards[first.row][first.col].isMatched = true;
    cards[second.row][second.col].isMatched = true;

    // 计算得分（考虑连击奖励）
    const baseScore = 100;
    const comboBonus = this.data.comboCount * 20;
    const score = (baseScore + comboBonus) * this.data.comboMultiplier;

    // 更新连击
    const newComboCount = this.data.comboCount + 1;
    const newMaxCombo = Math.max(this.data.maxCombo, newComboCount);
    const newMultiplier = Math.min(3, 1 + (newComboCount - 1) * 0.2);

    this.setData({
      cards,
      flippedCards: [],
      matches: this.data.matches + 1,
      attempts: this.data.attempts + 1,
      score: this.data.score + score,
      comboCount: newComboCount,
      maxCombo: newMaxCombo,
      comboMultiplier: newMultiplier,
      isProcessing: false
    });

    // 播放匹配成功音效
    this.playMatchSound();

    // 显示连击效果
    if (newComboCount > 1) {
      this.showComboEffect(newComboCount);
    }

    // 检查是否完成
    setTimeout(() => {
      this.checkCompletion();
    }, 500);
  },

  // 处理匹配失败
  handleMatchFailure: function (first, second) {
    // 重置连击
    this.setData({
      comboCount: 0,
      comboMultiplier: 1
    });

    // 延迟后翻回卡片
    setTimeout(() => {
      const cards = this.data.cards;

      // 翻回卡片
      cards[first.row][first.col].isFlipped = false;
      cards[first.row][first.col].canFlip = true;
      cards[second.row][second.col].isFlipped = false;
      cards[second.row][second.col].canFlip = true;

      this.setData({
        cards,
        flippedCards: [],
        attempts: this.data.attempts + 1,
        isProcessing: false
      });
    }, 1000);

    // 播放匹配失败音效
    this.playMismatchSound();
  },

  // 显示连击效果
  showComboEffect: function (comboCount) {
    wx.showToast({
      title: `${comboCount}连击！`,
      icon: 'none',
      duration: 1500,
      image: '/assets/images/combo-icon.png'
    });
  },

  // 添加动画效果
  addAnimation: function (row, col) {
    const animatingCards = [...this.data.animatingCards];
    const key = `${row}-${col}`;

    if (!animatingCards.includes(key)) {
      const cards = this.data.cards;
      if (cards[row] && cards[row][col]) {
        cards[row][col].isAnimating = true;
      }
      animatingCards.push(key);
      this.setData({ animatingCards, cards });

      // 移除动画类
      setTimeout(() => {
        const newAnimatingCards = this.data.animatingCards.filter(item => item !== key);
        const latestCards = this.data.cards;
        if (latestCards[row] && latestCards[row][col]) {
          latestCards[row][col].isAnimating = false;
        }
        this.setData({ animatingCards: newAnimatingCards, cards: latestCards });
      }, 600);
    }
  },

  // 检查是否完成
  checkCompletion: function () {
    const totalPairs = (this.data.gridSize * this.data.gridSize) / 2;

    if (this.data.matches >= totalPairs) {
      this.completeGame();
    }
  },

  // 完成游戏
  completeGame: function () {
    this.stopTimer();

    const completionTime = 180 - this.data.timeLeft;
    const accuracyRate = this.getAccuracyRate(this.data.matches, this.data.attempts);

    // 计算最终得分
    const timeBonus = Math.max(0, this.data.timeLeft * 2);
    const accuracyBonus = this.data.matches > 0 ?
      Math.floor((this.data.matches / this.data.attempts) * 200) : 0;
    const comboBonus = this.data.maxCombo * 50;

    const finalScore = this.data.score + timeBonus + accuracyBonus + comboBonus;

    this.setData({
      gameStatus: 'completed',
      isCompleted: true,
      completionTime,
      completionTimeText: this.formatTime(completionTime),
      accuracyRate,
      score: finalScore
    });

    // 更新最佳成绩
    this.updateBestScores(completionTime, finalScore);

    // 播放完成音效
    this.playCompleteSound();

    wx.showToast({
      title: '完成挑战',
      icon: 'success'
    });
  },

  // 显示完成消息
  showCompletionMessage: function () {
    const time = this.formatTime(this.data.completionTime);
    const accuracy = this.data.attempts > 0 ?
      Math.floor((this.data.matches / this.data.attempts) * 100) : 0;

    wx.showModal({
      title: '恭喜完成！',
      content: `用时：${time}\n准确率：${accuracy}%\n最高连击：${this.data.maxCombo}\n最终得分：${this.data.score}`,
      confirmText: '继续',
      cancelText: '返回',
      success: (res) => {
        if (res.confirm) {
          this.restartGame();
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  // 计时器相关
  startTimer: function () {
    const timerId = setInterval(() => {
      if (this.data.timeLeft > 0) {
        const nextTime = this.data.timeLeft - 1;
        this.setData({
          timeLeft: nextTime,
          timeLeftText: this.formatTime(nextTime)
        });
      } else {
        this.timeUp();
      }
    }, 1000);
    this.setData({ gameTimer: timerId });
  },

  stopTimer: function () {
    if (this.data.gameTimer) {
      clearInterval(this.data.gameTimer);
      this.setData({ gameTimer: null });
    }
  },

  timeUp: function () {
    this.stopTimer();
    this.setData({ gameStatus: 'ended' });

    wx.showToast({
      title: '时间到',
      icon: 'none'
    });
  },

  // 格式化时间
  formatTime: function (seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  },

  getAccuracyRate: function (matches, attempts) {
    return attempts > 0 ? Math.floor((matches / attempts) * 100) : 0;
  },

  // 最佳成绩管理
  loadBestScores: function () {
    try {
      const bestTime = wx.getStorageSync('memoryCardBestTime');
      const bestScore = wx.getStorageSync('memoryCardBestScore');

      this.setData({
        bestTime: bestTime || null,
        bestTimeText: bestTime ? this.formatTime(bestTime) : '',
        bestScore: bestScore || null
      });
    } catch (error) {

    }
  },

  updateBestScores: function (time, score) {
    let updated = false;

    if (!this.data.bestTime || time < this.data.bestTime) {
      this.setData({
        bestTime: time,
        bestTimeText: this.formatTime(time)
      });
      wx.setStorageSync('memoryCardBestTime', time);
      updated = true;
    }

    if (!this.data.bestScore || score > this.data.bestScore) {
      this.setData({ bestScore: score });
      wx.setStorageSync('memoryCardBestScore', score);
      updated = true;
    }

    if (updated) {
      wx.showToast({
        title: '新纪录！',
        icon: 'success',
        duration: 2000
      });
    }
  },

  // 设置管理
  loadGameSettings: function () {
    try {
      const settings = wx.getStorageSync('memoryCardSettings');
      if (settings) {
        this.setData({
          difficulty: settings.difficulty || 'medium',
          cardTheme: settings.cardTheme || 'nature',
          soundEnabled: settings.soundEnabled !== false
        });
      }
    } catch (error) {

    }
  },

  changeTheme: function (e) {
    const theme = e.currentTarget.dataset.theme;
    this.setData({ cardTheme: theme });
    this.saveSettings();
    this.initGame();
  },

  toggleSound: function () {
    this.setData({ soundEnabled: !this.data.soundEnabled });
    this.saveSettings();
  },

  saveSettings: function () {
    const settings = {
      difficulty: this.data.difficulty,
      cardTheme: this.data.cardTheme,
      soundEnabled: this.data.soundEnabled
    };

    wx.setStorageSync('memoryCardSettings', settings);
  },

  // 音效
  playFlipSound: function () {
    if (this.data.soundEnabled) {
      if (this.flipAudio) {
        this.flipAudio.destroy();
      }
      this.flipAudio = wx.createInnerAudioContext();
      this.flipAudio.src = 'https://file.okrcn.com/wx/sounds/card-flip.mp3';
      this.flipAudio.volume = 0.3;
      this.flipAudio.play();
    }
  },

  playMatchSound: function () {
    if (this.data.soundEnabled) {
      if (this.matchAudio) {
        this.matchAudio.destroy();
      }
      this.matchAudio = wx.createInnerAudioContext();
      this.matchAudio.src = 'https://file.okrcn.com/wx/sounds/match-success.mp3';
      this.matchAudio.volume = 0.5;
      this.matchAudio.play();
    }
  },

  playMismatchSound: function () {
    if (this.data.soundEnabled) {
      if (this.mismatchAudio) {
        this.mismatchAudio.destroy();
      }
      this.mismatchAudio = wx.createInnerAudioContext();
      this.mismatchAudio.src = 'https://file.okrcn.com/wx/sounds/match-fail.mp3';
      this.mismatchAudio.volume = 0.3;
      this.mismatchAudio.play();
    }
  },

  playCompleteSound: function () {
    if (this.data.soundEnabled) {
      if (this.completeAudio) {
        this.completeAudio.destroy();
      }
      this.completeAudio = wx.createInnerAudioContext();
      this.completeAudio.src = 'https://file.okrcn.com/wx/sounds/game-complete.mp3';
      this.completeAudio.volume = 0.6;
      this.completeAudio.play();
    }
  },

  // 获取提示
  getHint: function () {
    if (this.data.gameStatus !== 'playing' || this.data.isProcessing) return;

    // 找到一个已翻转但未匹配的卡片
    const cards = this.data.cards;
    const flippedCards = this.data.flippedCards;

    if (flippedCards.length === 1) {
      // 找到一个匹配的卡片
      const firstCard = flippedCards[0];

      for (let row = 0; row < cards.length; row++) {
        for (let col = 0; col < cards[row].length; col++) {
          const card = cards[row][col];
          if (card.content === firstCard.content &&
              !card.isFlipped &&
              !card.isMatched &&
              (row !== firstCard.row || col !== firstCard.col)) {
            // 高亮显示匹配的卡片
            this.highlightCard(row, col);
            return;
          }
        }
      }
    } else {
      // 随机显示一对未匹配的卡片
      const unmatchedPairs = [];
      const contentCount = {};

      // 统计每种内容的未匹配卡片数量
      for (let row = 0; row < cards.length; row++) {
        for (let col = 0; col < cards[row].length; col++) {
          const card = cards[row][col];
          if (!card.isMatched) {
            if (!contentCount[card.content]) {
              contentCount[card.content] = [];
            }
            contentCount[card.content].push({ row, col });
          }
        }
      }

      // 找到有两张未匹配卡片的对
      for (const content in contentCount) {
        if (contentCount[content].length === 2) {
          unmatchedPairs.push(contentCount[content]);
        }
      }

      if (unmatchedPairs.length > 0) {
        const randomPair = unmatchedPairs[Math.floor(Math.random() * unmatchedPairs.length)];
        this.highlightCard(randomPair[0].row, randomPair[0].col);
        this.highlightCard(randomPair[1].row, randomPair[1].col);
      }
    }
  },

  // 高亮卡片
  highlightCard: function (row, col) {
    const key = `${row}-${col}`;
    const cards = this.data.cards;
    if (cards[row] && cards[row][col]) {
      cards[row][col].isAnimating = true;
    }
    this.setData({
      animatingCards: [...this.data.animatingCards, key],
      cards
    });

    setTimeout(() => {
      const newAnimatingCards = this.data.animatingCards.filter(item => item !== key);
      const latestCards = this.data.cards;
      if (latestCards[row] && latestCards[row][col]) {
        latestCards[row][col].isAnimating = false;
      }
      this.setData({ animatingCards: newAnimatingCards, cards: latestCards });
    }, 1000);
  },

  // 返回
  goBack: function () {
    wx.navigateBack();
  },

  // 分享
  onShareAppMessage: function () {
    const message = this.data.isCompleted
      ? `我在记忆卡片中获得了${this.data.score}分！`
      : '来试试这个锻炼记忆力的游戏吧！';

    return {
      title: message,
      path: '/pages/games/memory-cards/memory-cards'
    };
  }
});
