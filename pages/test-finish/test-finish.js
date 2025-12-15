// 测试页面，用于验证finish页面
Page({
  data: {
    currentParams: ''
  },

  goToFinishWithData() {
    const params = {
      gameId: 'zen-puzzle',
      gameTitle: '禅意拼图',
      score: 1500,
      duration: '5:30',
      combo: 5,
      maxCombo: 8,
      isFromGame: 'true'
    };
    
    const paramString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = `/pages/finish/finish?${paramString}`;
    
    this.setData({ currentParams: JSON.stringify(params) });
    
    wx.navigateTo({
      url: url,
      success: () => {
        console.log('成功跳转到finish页面');
      },
      fail: (error) => {
        console.error('跳转到finish页面失败:', error);
        wx.showToast({
          title: '跳转失败: ' + (error.errMsg || '未知错误'),
          icon: 'none'
        });
      }
    });
  },

  goToFinishEmpty() {
    const url = '/pages/finish/finish';
    this.setData({ currentParams: '无参数' });
    
    wx.navigateTo({
      url: url,
      success: () => {
        console.log('成功跳转到finish页面');
      },
      fail: (error) => {
        console.error('跳转到finish页面失败:', error);
        wx.showToast({
          title: '跳转失败: ' + (error.errMsg || '未知错误'),
          icon: 'none'
        });
      }
    });
  },

  goToFinishSimple() {
    const params = {
      gameId: 'bubble-pop',
      gameTitle: '泡泡爆破',
      score: 2000,
      isFromGame: 'true'
    };
    
    const paramString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = `/pages/finish/finish?${paramString}`;
    
    this.setData({ currentParams: JSON.stringify(params) });
    
    wx.navigateTo({
      url: url,
      success: () => {
        console.log('成功跳转到finish页面');
      },
      fail: (error) => {
        console.error('跳转到finish页面失败:', error);
        wx.showToast({
          title: '跳转失败: ' + (error.errMsg || '未知错误'),
          icon: 'none'
        });
      }
    });
  }
});