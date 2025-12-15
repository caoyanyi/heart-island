// 社交分享功能工具类
const { DataEncryption } = require('./privacy-security.js');

class SocialSharingManager {
  constructor() {
    this.encryption = new DataEncryption();
    this.shareHistory = this.loadShareHistory();
  }

  // 分享游戏结果
  shareGameResult(gameData, options = {}) {
    const {
      gameName = '心理健康小游戏',
      score = 0,
      achievement = '',
      duration = 0,
      difficulty = 'normal',
      customMessage = ''
    } = options;

    // 生成分享内容
    const shareContent = this.generateShareContent({
      gameName,
      score,
      achievement,
      duration,
      difficulty,
      customMessage
    });

    // 创建分享对象
    const shareData = {
      title: shareContent.title,
      desc: shareContent.desc,
      path: `/pages/games/${gameData.gameType}/${gameData.gameType}?shared=true&score=${score}`,
      imageUrl: shareContent.imageUrl,
      success: (res) => {
        this.recordShare('game_result', gameData, shareContent);
        this.triggerShareReward(gameData.gameType);
        return {
          success: true,
          message: '分享成功',
          shareId: this.generateShareId()
        };
      },
      fail: (error) => {
        return {
          success: false,
          message: '分享失败',
          error: error
        };
      }
    };

    return shareData;
  }

  // 分享情绪评估结果
  shareEmotionResult(assessmentData, options = {}) {
    const {
      emotionType = '平静',
      score = 0,
      recommendations = [],
      customMessage = ''
    } = options;

    const shareContent = this.generateEmotionShareContent({
      emotionType,
      score,
      recommendations,
      customMessage
    });

    return {
      title: shareContent.title,
      desc: shareContent.desc,
      path: `/pages/emotion-assessment/emotion-assessment?shared=true&emotion=${emotionType}&score=${score}`,
      imageUrl: shareContent.imageUrl,
      success: (res) => {
        this.recordShare('emotion_result', assessmentData, shareContent);
        return {
          success: true,
          message: '情绪评估分享成功'
        };
      }
    };
  }

  // 生成游戏分享内容
  generateShareContent(data) {
    const { gameName, score, achievement, duration, difficulty, customMessage } = data;
    
    const templates = [
      {
        title: `我在${gameName}中获得了${score}分！`,
        desc: `${achievement} | 用时${this.formatDuration(duration)} | 难度:${this.getDifficultyText(difficulty)}`,
        imageUrl: '/assets/images/share-game-result.jpg'
      },
      {
        title: `挑战${gameName}，我的成绩是${score}分！`,
        desc: customMessage || '一起来玩这个有趣的心理健康小游戏吧！',
        imageUrl: '/assets/images/share-game-challenge.jpg'
      },
      {
        title: `心理健康小游戏 - ${score}分达成！`,
        desc: '通过游戏来放松心情，提升心理健康～',
        imageUrl: '/assets/images/share-wellness-game.jpg'
      }
    ];

    // 根据分数选择合适的模板
    let templateIndex = 0;
    if (score >= 80) templateIndex = 1;
    if (score >= 95) templateIndex = 2;

    return templates[templateIndex];
  }

  // 生成情绪分享内容
  generateEmotionShareContent(data) {
    const { emotionType, score, recommendations, customMessage } = data;
    
    const emotionTexts = {
      '快乐': { emoji: '😊', color: '#FFD700' },
      '平静': { emoji: '😌', color: '#87CEEB' },
      '兴奋': { emoji: '🤩', color: '#FF6B6B' },
      '放松': { emoji: '😴', color: '#98FB98' },
      '专注': { emoji: '🎯', color: '#DDA0DD' }
    };

    const emotionInfo = emotionTexts[emotionType] || { emoji: '😊', color: '#87CEEB' };
    
    const templates = [
      {
        title: `今日情绪：${emotionType} ${emotionInfo.emoji}`,
        desc: customMessage || '记录情绪，关爱心理健康～',
        imageUrl: '/assets/images/share-emotion-daily.jpg'
      },
      {
        title: `情绪评估结果：${emotionType} (${score}分)`,
        desc: recommendations.length > 0 ? recommendations[0] : '保持积极的心态，每一天都是新的开始！',
        imageUrl: '/assets/images/share-emotion-assessment.jpg'
      }
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  // 分享应用
  shareApp(options = {}) {
    const {
      customMessage = '',
      inviteCode = '',
      source = 'direct'
    } = options;

    const shareContent = {
      title: customMessage || '发现一个很棒的心理健康应用！',
      desc: '包含情绪评估、放松游戏等功能，帮助改善心理健康～',
      path: inviteCode ? `/pages/index/index?invite=${inviteCode}&source=${source}` : '/pages/index/index',
      imageUrl: '/assets/images/share-app-default.jpg',
      success: (res) => {
        this.recordShare('app_invite', { inviteCode, source }, shareContent);
        this.triggerInviteReward(inviteCode);
        return {
          success: true,
          message: '应用分享成功'
        };
      }
    };

    return shareContent;
  }

  // 分享到朋友圈（需要特殊处理）
  shareToTimeline(content, options = {}) {
    // 微信朋友圈分享需要特殊配置
    const timelineContent = {
      title: content.title,
      query: options.query || '',
      imageUrl: content.imageUrl,
      success: (res) => {
        this.recordShare('timeline', content, timelineContent);
        return {
          success: true,
          message: '朋友圈分享成功'
        };
      },
      fail: (error) => {
        return {
          success: false,
          message: '朋友圈分享失败',
          error: error
        };
      }
    };

    return timelineContent;
  }

  // 生成分享海报
  generateSharePoster(data, options = {}) {
    const {
      type = 'game_result',
      template = 'default',
      includeQRCode = true
    } = options;

    const posterData = {
      width: 750,
      height: 1334,
      backgroundColor: '#ffffff',
      elements: [
        {
          type: 'image',
          src: '/assets/images/poster-background.jpg',
          x: 0,
          y: 0,
          width: 750,
          height: 1334
        },
        {
          type: 'text',
          text: data.title,
          x: 375,
          y: 200,
          fontSize: 48,
          color: '#333333',
          textAlign: 'center',
          fontWeight: 'bold'
        },
        {
          type: 'text',
          text: data.desc,
          x: 375,
          y: 300,
          fontSize: 32,
          color: '#666666',
          textAlign: 'center'
        }
      ]
    };

    if (includeQRCode) {
      posterData.elements.push({
        type: 'qrcode',
        text: data.path || '/pages/index/index',
        x: 300,
        y: 1000,
        width: 150,
        height: 150
      });
    }

    return posterData;
  }

  // 记录分享历史
  recordShare(type, data, shareContent) {
    const shareRecord = {
      id: this.generateShareId(),
      type: type,
      timestamp: Date.now(),
      data: data,
      content: shareContent,
      success: true
    };

    this.shareHistory.unshift(shareRecord);
    
    // 限制历史记录数量
    if (this.shareHistory.length > 100) {
      this.shareHistory = this.shareHistory.slice(0, 100);
    }

    this.saveShareHistory();
  }

  // 获取分享统计
  getShareStats() {
    const stats = {
      totalShares: this.shareHistory.length,
      successfulShares: this.shareHistory.filter(s => s.success).length,
      shareTypes: {},
      recentShares: this.shareHistory.slice(0, 10),
      dailyShares: this.getDailyShareCount(),
      weeklyShares: this.getWeeklyShareCount()
    };

    // 按类型统计
    this.shareHistory.forEach(share => {
      if (!stats.shareTypes[share.type]) {
        stats.shareTypes[share.type] = 0;
      }
      stats.shareTypes[share.type]++;
    });

    return stats;
  }

  // 获取每日分享次数
  getDailyShareCount() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.shareHistory.filter(share => {
      const shareDate = new Date(share.timestamp);
      shareDate.setHours(0, 0, 0, 0);
      return shareDate.getTime() === today.getTime();
    }).length;
  }

  // 获取每周分享次数
  getWeeklyShareCount() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return this.shareHistory.filter(share => 
      share.timestamp >= weekAgo.getTime()
    ).length;
  }

  // 触发分享奖励
  triggerShareReward(gameType) {
    const reward = {
      type: 'share_reward',
      gameType: gameType,
      reward: {
        coins: 10,
        experience: 5,
        items: ['分享达人徽章']
      },
      timestamp: Date.now()
    };

    // 保存奖励记录
    this.saveReward(reward);
    
    return reward;
  }

  // 触发邀请奖励
  triggerInviteReward(inviteCode) {
    if (!inviteCode) return null;

    const reward = {
      type: 'invite_reward',
      inviteCode: inviteCode,
      reward: {
        coins: 50,
        experience: 20,
        items: ['邀请好友徽章', '双倍经验卡']
      },
      timestamp: Date.now()
    };

    this.saveReward(reward);
    
    return reward;
  }

  // 生成分享ID
  generateShareId() {
    return 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 格式化时长
  formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}小时${minutes}分`;
    }
  }

  // 获取难度文本
  getDifficultyText(difficulty) {
    const difficultyMap = {
      'easy': '简单',
      'normal': '普通',
      'hard': '困难',
      'expert': '专家'
    };
    return difficultyMap[difficulty] || '普通';
  }

  // 保存分享历史
  saveShareHistory() {
    try {
      const encryptedData = this.encryption.encrypt(JSON.stringify(this.shareHistory));
      wx.setStorageSync('share_history', encryptedData);
    } catch (error) {
      console.error('保存分享历史失败:', error);
    }
  }

  // 加载分享历史
  loadShareHistory() {
    try {
      const encryptedData = wx.getStorageSync('share_history');
      if (encryptedData) {
        const decryptedData = this.encryption.decrypt(encryptedData);
        return JSON.parse(decryptedData);
      }
    } catch (error) {
      console.error('加载分享历史失败:', error);
    }
    return [];
  }

  // 保存奖励记录
  saveReward(reward) {
    try {
      let rewards = [];
      const existingRewards = wx.getStorageSync('share_rewards');
      if (existingRewards) {
        rewards = JSON.parse(existingRewards);
      }
      
      rewards.push(reward);
      
      // 限制奖励记录数量
      if (rewards.length > 50) {
        rewards = rewards.slice(-50);
      }
      
      wx.setStorageSync('share_rewards', JSON.stringify(rewards));
    } catch (error) {
      console.error('保存奖励记录失败:', error);
    }
  }

  // 获取奖励历史
  getRewardHistory() {
    try {
      const rewards = wx.getStorageSync('share_rewards');
      return rewards ? JSON.parse(rewards) : [];
    } catch (error) {
      console.error('获取奖励历史失败:', error);
      return [];
    }
  }

  // 清除分享历史
  clearShareHistory() {
    this.shareHistory = [];
    this.saveShareHistory();
  }

  // 获取分享配置
  getShareConfig(type = 'default') {
    const configs = {
      default: {
        title: '心理健康小游戏',
        desc: '通过有趣的游戏改善心理健康～',
        imageUrl: '/assets/images/share-default.jpg'
      },
      game: {
        title: '挑战心理健康小游戏！',
        desc: '在游戏中放松心情，提升专注力～',
        imageUrl: '/assets/images/share-game.jpg'
      },
      emotion: {
        title: '记录每日情绪，关爱心理健康',
        desc: '科学的情绪评估，专业的建议指导～',
        imageUrl: '/assets/images/share-emotion.jpg'
      }
    };

    return configs[type] || configs.default;
  }
}

// 分享统计和分析
class ShareAnalytics {
  constructor() {
    this.analyticsData = this.loadAnalyticsData();
  }

  // 记录分享事件
  trackShareEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      data: data,
      platform: this.getPlatform(),
      version: this.getAppVersion()
    };

    this.analyticsData.push(event);
    this.saveAnalyticsData();
  }

  // 获取分享分析数据
  getShareAnalytics(timeRange = '7d') {
    const now = Date.now();
    const timeRanges = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const range = timeRanges[timeRange] || timeRanges['7d'];
    const startTime = now - range;

    const filteredEvents = this.analyticsData.filter(event => 
      event.timestamp >= startTime
    );

    const analytics = {
      totalEvents: filteredEvents.length,
      eventTypes: {},
      platformDistribution: {},
      hourlyDistribution: this.getHourlyDistribution(filteredEvents),
      popularContent: this.getPopularContent(filteredEvents),
      conversionRate: this.calculateConversionRate(filteredEvents)
    };

    // 统计事件类型
    filteredEvents.forEach(event => {
      if (!analytics.eventTypes[event.type]) {
        analytics.eventTypes[event.type] = 0;
      }
      analytics.eventTypes[event.type]++;

      // 统计平台分布
      if (!analytics.platformDistribution[event.platform]) {
        analytics.platformDistribution[event.platform] = 0;
      }
      analytics.platformDistribution[event.platform]++;
    });

    return analytics;
  }

  // 获取小时分布
  getHourlyDistribution(events) {
    const distribution = new Array(24).fill(0);
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      distribution[hour]++;
    });

    return distribution;
  }

  // 获取热门内容
  getPopularContent(events) {
    const contentMap = {};
    
    events.forEach(event => {
      const content = event.data.title || event.data.desc || '未知内容';
      if (!contentMap[content]) {
        contentMap[content] = 0;
      }
      contentMap[content]++;
    });

    return Object.entries(contentMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([content, count]) => ({ content, count }));
  }

  // 计算转化率
  calculateConversionRate(events) {
    const shareEvents = events.filter(e => e.type.includes('share'));
    const successEvents = shareEvents.filter(e => e.data.success);
    
    return shareEvents.length > 0 ? 
      (successEvents.length / shareEvents.length * 100).toFixed(2) + '%' : 
      '0%';
  }

  // 获取平台信息
  getPlatform() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      return systemInfo.platform;
    } catch (error) {
      return 'unknown';
    }
  }

  // 获取应用版本
  getAppVersion() {
    try {
      const accountInfo = wx.getAccountInfoSync();
      return accountInfo.miniProgram.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  // 保存分析数据
  saveAnalyticsData() {
    try {
      // 限制数据量，避免存储过大
      if (this.analyticsData.length > 1000) {
        this.analyticsData = this.analyticsData.slice(-500);
      }
      
      wx.setStorageSync('share_analytics', JSON.stringify(this.analyticsData));
    } catch (error) {
      console.error('保存分析数据失败:', error);
    }
  }

  // 加载分析数据
  loadAnalyticsData() {
    try {
      const data = wx.getStorageSync('share_analytics');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('加载分析数据失败:', error);
      return [];
    }
  }

  // 生成分析报告
  generateReport(timeRange = '7d') {
    const analytics = this.getShareAnalytics(timeRange);
    
    return {
      summary: {
        totalShares: analytics.totalEvents,
        successRate: analytics.conversionRate,
        topPlatform: Object.entries(analytics.platformDistribution)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'
      },
      details: analytics,
      recommendations: this.generateRecommendations(analytics),
      generatedAt: Date.now()
    };
  }

  // 生成建议
  generateRecommendations(analytics) {
    const recommendations = [];
    
    if (analytics.conversionRate < '30%') {
      recommendations.push('分享成功率较低，建议优化分享内容和时机');
    }
    
    const peakHour = analytics.hourlyDistribution.indexOf(Math.max(...analytics.hourlyDistribution));
    recommendations.push(`分享高峰时段为${peakHour}:00，建议在此时间发布内容`);
    
    if (analytics.popularContent.length > 0) {
      recommendations.push(`最受欢迎的内容是：${analytics.popularContent[0].content}`);
    }
    
    return recommendations;
  }
}

module.exports = {
  SocialSharingManager,
  ShareAnalytics
};