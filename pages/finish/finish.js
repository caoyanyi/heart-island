Page({
  data: {
    // 治愈语和图标
    healingMessage: '谢谢你给自己的心灵放了个小假',
    healingIcon: '🌸',
    
    // 游戏统计数据
    showStats: false,
    gameDuration: '',
    score: 0,
    combo: 0,
    maxCombo: 0,
    
    // 情绪感受选项
    feelingOptions: [
      { key: 'better', emoji: '😊', text: '轻松了一些' },
      { key: 'calm', emoji: '😌', text: '内心平静' },
      { key: 'refreshed', emoji: '😌', text: '精神焕发' },
      { key: 'energized', emoji: '⚡', text: '充满活力' },
      { key: 'normal', emoji: '😐', text: '没有特别感觉' },
      { key: 'same', emoji: '🙂', text: '和之前一样' }
    ],
    selectedFeeling: '',
    
    // 分享相关
    showSharing: true,
    isFromGame: false,
    gameId: '',
    gameTitle: '',
    
    // 页面状态
    pageReady: false
  },

  onLoad(options) {
    console.log('结束页加载，参数:', options);
    
    // 解析传入的参数
    this.parseOptions(options);
    
    // 初始化页面数据
    this.initPageData();
    
    // 设置页面就绪状态
    this.setData({
      pageReady: true
    });
  },

  // 解析页面参数
  parseOptions(options) {
    const {
      gameId = '',
      gameTitle = '',
      score = 0,
      duration = '',
      combo = 0,
      maxCombo = 0,
      isFromGame = false
    } = options;

    this.setData({
      gameId,
      gameTitle,
      score: parseInt(score) || 0,
      gameDuration: duration,
      combo: parseInt(combo) || 0,
      maxCombo: parseInt(maxCombo) || 0,
      isFromGame: isFromGame === 'true',
      showStats: score > 0 || duration !== ''
    });
  },

  // 初始化页面数据
  initPageData() {
    // 根据游戏类型选择不同的治愈语
    this.selectHealingMessage();
    
    // 如果没有传入情绪感受，使用默认的
    if (!this.data.selectedFeeling) {
      this.setData({
        selectedFeeling: 'better'
      });
    }
  },

  // 选择治愈语
  selectHealingMessage() {
    const healingMessages = [
      { keywords: ['cloud', '漂'], icon: '☁️', message: '如云般轻盈，愿你的心情也是如此洒脱' },
      { keywords: ['bubble', '泡'], icon: '🫧', message: '泡泡带走了烦恼，留下了内心的纯净' },
      { keywords: ['forest', '森林', '风'], icon: '🍃', message: '微风轻抚心灵，愿你在这片宁静中找到平衡' },
      { keywords: ['light', '光', '治愈'], icon: '✨', message: '每一盏心灯都被点亮，照亮前进的路' },
      { keywords: ['zen', '拼图', 'puzzle'], icon: '🧘', message: '在宁静中寻找完整，在专注中获得内心平和' },
      { keywords: ['memory', '记忆', 'card'], icon: '🧠', message: '记住美好的，释怀困扰的，生活如此美好' }
    ];

    let selectedMessage = { icon: '🌸', message: '谢谢你给自己的心灵放了个小假' };

    // 匹配游戏类型选择相应治愈语
    healingMessages.forEach(item => {
      if (item.keywords.some(keyword => 
        this.data.gameTitle.toLowerCase().includes(keyword.toLowerCase())
      )) {
        selectedMessage = item;
      }
    });

    // 如果是游戏结束后进入，默认使用通用的治愈语
    if (this.data.isFromGame) {
      const gameHealingMessages = [
        '谢谢你的陪伴，你的心灵值得被温柔对待',
        '每一次呼吸都带来新的可能',
        '感谢你为自己按下暂停键，让心灵稍作休息',
        '在忙碌的生活中，记得给自己一个温柔的拥抱',
        '你的心灵需要这样的温柔时光'
      ];
      
      selectedMessage = {
        icon: '🌸',
        message: gameHealingMessages[Math.floor(Math.random() * gameHealingMessages.length)]
      };
    }

    this.setData({
      healingIcon: selectedMessage.icon,
      healingMessage: selectedMessage.message
    });
  },

  // 选择情绪感受
  selectFeeling(e) {
    const feeling = e.currentTarget.dataset.feeling;
    this.setData({
      selectedFeeling: feeling
    });

    // 保存情绪记录
    this.saveEmotionRecord();
  },

  // 保存情绪记录
  saveEmotionRecord() {
    const record = {
      timestamp: new Date().toISOString(),
      feeling: this.data.selectedFeeling,
      healingMessage: this.data.healingMessage,
      gameId: this.data.gameId,
      gameTitle: this.data.gameTitle,
      score: this.data.score,
      gameDuration: this.data.gameDuration
    };

    try {
      // 保存到本地存储
      const emotionHistory = wx.getStorageSync('emotionHistory') || [];
      emotionHistory.unshift(record);
      
      // 只保留最近30条记录
      if (emotionHistory.length > 30) {
        emotionHistory.splice(30);
      }
      
      wx.setStorageSync('emotionHistory', emotionHistory);
      console.log('情绪记录保存成功:', record);
    } catch (error) {
      console.error('保存情绪记录失败:', error);
    }
  },

  // 分享给朋友
  shareToFriends() {
    const shareData = {
      title: '分享我的心灵治愈时光',
      path: '/pages/welcome/welcome',
      imageUrl: '/assets/images/share-emotion.jpg'
    };

    if (wx.onShareAppMessage) {
      wx.onShareAppMessage(() => shareData);
    }

    wx.showToast({
      title: '分享给朋友成功',
      icon: 'success'
    });
  },

  // 分享到朋友圈
  shareToMoment() {
    // 生成分享图片
    this.generateShareImage().then(imagePath => {
      wx.showModal({
        title: '分享到朋友圈',
        content: '请保存图片到相册，然后在微信朋友圈中分享',
        confirmText: '保存图片',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.saveImageToAlbum(imagePath);
          }
        }
      });
    }).catch(error => {
      console.error('生成分享图片失败:', error);
      wx.showToast({
        title: '分享图片生成失败',
        icon: 'none'
      });
    });
  },

  // 生成分享图片
  generateShareImage() {
    return new Promise((resolve, reject) => {
      // 这里可以集成具体的图片生成逻辑
      // 目前返回默认路径
      resolve('/assets/images/share-default.jpg');
    });
  },

  // 保存图片到相册
  saveImageToAlbum(imagePath) {
    wx.saveImageToPhotosAlbum({
      filePath: imagePath,
      success: () => {
        wx.showToast({
          title: '图片已保存到相册',
          icon: 'success'
        });
      },
      fail: (error) => {
        console.error('保存图片失败:', error);
        wx.showToast({
          title: '保存失败，请检查权限',
          icon: 'none'
        });
      }
    });
  },

  // 再玩一次
  playAgain() {
    if (this.data.gameId) {
      // 如果有游戏ID，跳转到对应游戏
      const gamePath = `/pages/games/${this.data.gameId}/${this.data.gameId}`;
      wx.navigateTo({
        url: gamePath,
        fail: () => {
          // 如果游戏页面不存在，跳转到游戏选择页
          wx.switchTab({
            url: '/pages/game-selector/game-selector'
          });
        }
      });
    } else {
      // 没有游戏ID，跳转到游戏选择页
      wx.switchTab({
        url: '/pages/game-selector/game-selector'
      });
    }
  },

  // 回到游戏选择
  backToGames() {
    wx.switchTab({
      url: '/pages/game-selector/game-selector'
    });
  },

  // 回到首页
  backToHome() {
    wx.switchTab({
      url: '/pages/welcome/welcome'
    });
  }
});