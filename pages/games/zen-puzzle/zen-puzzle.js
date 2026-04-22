Page({
  data: {
    // 游戏状态
    gameStatus: 'ready', // ready, playing, paused, completed
    score: 0,
    moves: 0,
    timeLeft: 300, // 5分钟
    timeLeftText: '5分0秒',

    // 拼图数据
    puzzleSize: 3, // 3x3 拼图
    tiles: [],
    emptyPosition: { row: 2, col: 2 },

    // 原始图片
    originalImage: '/assets/images/zen-landscape.png',
    imageLoaded: false,
    imageError: false,
    pendingStart: false,

    // 游戏设置
    difficulty: 'medium', // easy, medium, hard
    soundEnabled: true,
    showNumbers: true,

    // 动画状态
    animatingTiles: [],

    // 计时器
    gameTimer: null,

    // 完成状态
    isCompleted: false,
    completionTime: 0,
    completionTimeText: '0分0秒',
    bestTime: null,
    bestTimeText: '',
    bestMoves: null
  },

  onLoad: function () {
    this.loadGameSettings();
    this.loadBestScores();
  },

  onReady: function () {
    // 页面准备好后检查图片，而不是直接初始化拼图
    this.checkImage();
  },

  onUnload: function () {
    this.stopTimer();

    // 清理所有音频实例
    if (this.moveAudio) {
      this.moveAudio.destroy();
      this.moveAudio = null;
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

  // 检查图片是否存在
  checkImage: function () {
    wx.getImageInfo({
      src: this.data.originalImage,
      success: (res) => {
        this.setData({
          imageLoaded: true,
          imageError: false
        });
        this.initPuzzle();
        if (this.data.pendingStart) {
          this.startGameAfterImageCheck();
        }
      },
      fail: (error) => {
        this.setData({
          imageLoaded: false,
          imageError: true
        });
        // 尝试备用图片
        this.tryBackupImage();
      }
    });
  },

  // 尝试备用图片
  tryBackupImage: function () {
    const backupImage = '/assets/images/forest-bg.svg';
    wx.getImageInfo({
      src: backupImage,
      success: (res) => {
        this.setData({
          originalImage: backupImage,
          imageLoaded: true,
          imageError: false
        });
        this.initPuzzle();
        if (this.data.pendingStart) {
          this.startGameAfterImageCheck();
        }
      },
      fail: (error) => {
        // 使用纯色背景作为最后手段
        this.setData({
          originalImage: '',
          imageLoaded: false,
          imageError: true
        });
        this.initPuzzle();
        if (this.data.pendingStart) {
          this.startGameAfterImageCheck();
        }
      }
    });
  },

  // 图片检查完成后开始游戏
  startGameAfterImageCheck: function () {
    this.setData({
      gameStatus: 'playing',
      moves: 0,
      timeLeft: 300,
      timeLeftText: this.formatTime(300),
      pendingStart: false,
      isCompleted: false
    });

    this.startTimer();
  },

  // 初始化拼图
  initPuzzle: function () {
    const size = this.data.puzzleSize;
    const tiles = [];

    // 创建拼图块
    for (let row = 0; row < size; row++) {
      tiles[row] = [];
      for (let col = 0; col < size; col++) {
        if (row === size - 1 && col === size - 1) {
          // 最后一个位置为空
          tiles[row][col] = { id: -1, number: -1, position: { row, col } };
        } else {
          const number = row * size + col + 1;
          tiles[row][col] = {
            id: number,
            number: number,
            position: { row, col },
            correctPosition: { row, col },
            backgroundPosition: `${(col * 100) / (size - 1)}% ${(row * 100) / (size - 1)}%`,
            isAnimating: false
          };
        }
      }
    }

    this.setData({ tiles });
    this.shufflePuzzle();
  },

  // 打乱拼图
  shufflePuzzle: function () {
    const tiles = this.data.tiles;
    const size = this.data.puzzleSize;
    let emptyRow = size - 1;
    let emptyCol = size - 1;

    // 进行随机移动来打乱拼图
    const moves = size * size * 20; // 根据难度调整移动次数

    for (let i = 0; i < moves; i++) {
      const possibleMoves = [];

      // 找到所有可能的移动
      if (emptyRow > 0) possibleMoves.push({ row: emptyRow - 1, col: emptyCol });
      if (emptyRow < size - 1) possibleMoves.push({ row: emptyRow + 1, col: emptyCol });
      if (emptyCol > 0) possibleMoves.push({ row: emptyRow, col: emptyCol - 1 });
      if (emptyCol < size - 1) possibleMoves.push({ row: emptyRow, col: emptyCol + 1 });

      // 随机选择一个移动
      const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

      // 交换位置
      const temp = tiles[randomMove.row][randomMove.col];
      tiles[randomMove.row][randomMove.col] = tiles[emptyRow][emptyCol];
      tiles[emptyRow][emptyCol] = temp;

      emptyRow = randomMove.row;
      emptyCol = randomMove.col;
    }

    this.setData({
      tiles,
      emptyPosition: { row: emptyRow, col: emptyCol }
    });
  },

  // 开始游戏
  startGame: function () {
    // 开始游戏前先检查图片
    this.setData({ pendingStart: true });
    this.checkImage();
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
      score: 0,
      moves: 0,
      timeLeft: 300,
      timeLeftText: this.formatTime(300),
      isCompleted: false,
      imageLoaded: false,
      imageError: false,
      pendingStart: true
    });
    // 重新开始时重新检查图片
    this.checkImage();
  },

  // 处理拼图块点击
  onTileTap: function (e) {
    if (this.data.gameStatus !== 'playing') return;

    const { row, col } = e.currentTarget.dataset;
    const emptyPos = this.data.emptyPosition;

    // 检查是否与空位置相邻
    const isAdjacent =
      (Math.abs(row - emptyPos.row) === 1 && col === emptyPos.col) ||
      (Math.abs(col - emptyPos.col) === 1 && row === emptyPos.row);

    if (isAdjacent) {
      this.moveTile(row, col);
    }
  },

  // 移动拼图块
  moveTile: function (targetRow, targetCol) {
    const tiles = this.data.tiles;
    const emptyPos = this.data.emptyPosition;

    // 添加动画效果
    this.addAnimation(targetRow, targetCol);

    // 交换位置
    const temp = tiles[targetRow][targetCol];
    tiles[targetRow][targetCol] = tiles[emptyPos.row][emptyPos.col];
    tiles[emptyPos.row][emptyPos.col] = temp;

    this.setData({
      tiles,
      emptyPosition: { row: targetRow, col: targetCol },
      moves: this.data.moves + 1
    });

    // 播放音效
    this.playMoveSound();

    // 检查是否完成
    setTimeout(() => {
      this.checkCompletion();
    }, 300);
  },

  // 添加动画效果
  addAnimation: function (row, col) {
    const animatingTiles = [...this.data.animatingTiles];
    const key = `${row}-${col}`;

    if (!animatingTiles.includes(key)) {
      const tiles = this.data.tiles;
      if (tiles[row] && tiles[row][col]) {
        tiles[row][col].isAnimating = true;
      }
      animatingTiles.push(key);
      this.setData({ animatingTiles, tiles });

      // 移除动画类
      setTimeout(() => {
        const newAnimatingTiles = this.data.animatingTiles.filter(item => item !== key);
        const latestTiles = this.data.tiles;
        if (latestTiles[row] && latestTiles[row][col]) {
          latestTiles[row][col].isAnimating = false;
        }
        this.setData({ animatingTiles: newAnimatingTiles, tiles: latestTiles });
      }, 300);
    }
  },

  // 检查是否完成
  checkCompletion: function () {
    const tiles = this.data.tiles;
    const size = this.data.puzzleSize;
    let isCompleted = true;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const tile = tiles[row][col];
        const expectedNumber = row * size + col + 1;

        if (tile.number !== expectedNumber && !(row === size - 1 && col === size - 1)) {
          isCompleted = false;
          break;
        }
      }
      if (!isCompleted) break;
    }

    if (isCompleted) {
      this.completeGame();
    }
  },

  // 完成游戏
  completeGame: function () {
    this.stopTimer();

    const completionTime = 300 - this.data.timeLeft;
    const score = Math.max(0, 1000 - this.data.moves * 5 - completionTime * 2);

    this.setData({
      gameStatus: 'completed',
      isCompleted: true,
      completionTime,
      completionTimeText: this.formatTime(completionTime),
      score
    });

    // 更新最佳成绩
    this.updateBestScores(completionTime, this.data.moves);
    getApp().recordGameSession({
      game: 'zen-puzzle',
      score,
      duration: completionTime,
      completed: true,
      detail: {
        moves: this.data.moves
      }
    });

    // 播放完成音效
    this.playCompleteSound();

    wx.showToast({
      title: '完成拼图',
      icon: 'success'
    });
  },

  // 显示完成消息
  showCompletionMessage: function () {
    const time = this.formatTime(this.data.completionTime);
    const moves = this.data.moves;

    wx.showModal({
      title: '恭喜完成！',
      content: `用时：${time}\n步数：${moves}\n得分：${this.data.score}`,
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
    getApp().recordGameSession({
      game: 'zen-puzzle',
      score: this.data.score,
      duration: 300,
      completed: false,
      detail: {
        moves: this.data.moves
      }
    });

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

  // 最佳成绩管理
  loadBestScores: function () {
    try {
      const bestTime = wx.getStorageSync('zenPuzzleBestTime');
      const bestMoves = wx.getStorageSync('zenPuzzleBestMoves');

      this.setData({
        bestTime: bestTime || null,
        bestTimeText: bestTime ? this.formatTime(bestTime) : '',
        bestMoves: bestMoves || null
      });
    } catch (error) {

    }
  },

  updateBestScores: function (time, moves) {
    let updated = false;

    if (!this.data.bestTime || time < this.data.bestTime) {
      this.setData({
        bestTime: time,
        bestTimeText: this.formatTime(time)
      });
      wx.setStorageSync('zenPuzzleBestTime', time);
      updated = true;
    }

    if (!this.data.bestMoves || moves < this.data.bestMoves) {
      this.setData({ bestMoves: moves });
      wx.setStorageSync('zenPuzzleBestMoves', moves);
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
      const settings = wx.getStorageSync('zenPuzzleSettings');
      if (settings) {
        this.setData({
          difficulty: settings.difficulty || 'medium',
          soundEnabled: settings.soundEnabled !== false,
          showNumbers: settings.showNumbers !== false
        });
      }
    } catch (error) {

    }
  },

  toggleNumbers: function () {
    this.setData({ showNumbers: !this.data.showNumbers });
    this.saveSettings();
  },

  toggleSound: function () {
    this.setData({ soundEnabled: !this.data.soundEnabled });
    this.saveSettings();
  },

  saveSettings: function () {
    const settings = {
      difficulty: this.data.difficulty,
      soundEnabled: this.data.soundEnabled,
      showNumbers: this.data.showNumbers
    };

    wx.setStorageSync('zenPuzzleSettings', settings);
  },

  // 音效
  playMoveSound: function () {
    if (this.data.soundEnabled) {
      // 播放移动音效
      if (this.moveAudio) {
        this.moveAudio.destroy();
      }
      this.moveAudio = wx.createInnerAudioContext();
      this.moveAudio.src = 'https://file.okrcn.com/wx/sounds/tile-move.mp3';
      this.moveAudio.volume = 0.3;
      this.moveAudio.play();
    }
  },

  playCompleteSound: function () {
    if (this.data.soundEnabled) {
      // 播放完成音效
      if (this.completeAudio) {
        this.completeAudio.destroy();
      }
      this.completeAudio = wx.createInnerAudioContext();
      this.completeAudio.src = 'https://file.okrcn.com/wx/sounds/puzzle-complete.mp3';
      this.completeAudio.volume = 0.5;
      this.completeAudio.play();
    }
  },

  // 获取提示
  getHint: function () {
    if (this.data.gameStatus !== 'playing') return;

    // 找到一个不在正确位置的拼图块
    const tiles = this.data.tiles;
    const size = this.data.puzzleSize;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const tile = tiles[row][col];
        const expectedNumber = row * size + col + 1;

        if (tile.number !== expectedNumber && tile.number !== -1) {
          // 高亮显示这个拼图块
          this.highlightTile(row, col);
          return;
        }
      }
    }
  },

  // 高亮拼图块
  highlightTile: function (row, col) {
    const key = `${row}-${col}`;
    const tiles = this.data.tiles;
    if (tiles[row] && tiles[row][col]) {
      tiles[row][col].isAnimating = true;
    }
    this.setData({
      animatingTiles: [...this.data.animatingTiles, key],
      tiles
    });

    setTimeout(() => {
      const newAnimatingTiles = this.data.animatingTiles.filter(item => item !== key);
      const latestTiles = this.data.tiles;
      if (latestTiles[row] && latestTiles[row][col]) {
        latestTiles[row][col].isAnimating = false;
      }
      this.setData({ animatingTiles: newAnimatingTiles, tiles: latestTiles });
    }, 1000);
  },

  // 返回
  goBack: function () {
    wx.navigateBack();
  },

  // 分享
  onShareAppMessage: function () {
    const message = this.data.isCompleted
      ? `我在禅意拼图中获得了${this.data.score}分！`
      : '来试试这个治愈系的拼图游戏吧！';

    return {
      title: message,
      path: '/pages/games/zen-puzzle/zen-puzzle'
    };
  }
});
