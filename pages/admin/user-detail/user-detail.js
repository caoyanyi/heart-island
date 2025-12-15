// 用户详情页面
const privacyManager = require('../../../utils/privacy-manager');
const adManager = require('../../../utils/ad-manager');

Page({
  data: {
    userInfo: {},
    userStats: {},
    privacySettings: {},
    adSettings: {},
    loading: true
  },

  onLoad: function (options) {
    const userId = options.userId;
    if (userId) {
      this.loadUserDetail(userId);
    } else {
      wx.showToast({
        title: '用户ID缺失',
        icon: 'error'
      });
      wx.navigateBack();
    }
  },

  // 加载用户详情
  loadUserDetail: function (userId) {
    try {
      // 获取用户基本信息
      const userInfo = privacyManager.getUserData(userId);
      
      // 获取用户统计数据
      const userStats = this.getUserStats(userId);
      
      // 获取隐私设置
      const privacySettings = privacyManager.getPrivacySettings(userId);
      
      // 获取广告设置
      const adSettings = adManager.getUserAdSettings(userId);

      this.setData({
        userInfo: userInfo || {},
        userStats: userStats || {},
        privacySettings: privacySettings || {},
        adSettings: adSettings || {},
        loading: false
      });
    } catch (error) {
      console.error('加载用户详情失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 获取用户统计数据
  getUserStats: function (userId) {
    const stats = wx.getStorageSync(`user_stats_${userId}`) || {};
    return {
      totalSessions: stats.totalSessions || 0,
      totalGameTime: stats.totalGameTime || 0,
      completedGames: stats.completedGames || 0,
      achievements: stats.achievements || [],
      lastActiveTime: stats.lastActiveTime || '',
      averageEmotionScore: stats.averageEmotionScore || 0,
      favoriteGame: stats.favoriteGame || '未记录'
    };
  },

  // 导出用户数据
  exportUserData: function () {
    const userId = this.data.userInfo.userId;
    privacyManager.exportUserData(userId).then(result => {
      if (result.success) {
        wx.showToast({
          title: '导出成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '导出失败',
          icon: 'error'
        });
      }
    });
  },

  // 删除用户数据
  deleteUserData: function () {
    const userId = this.data.userInfo.userId;
    
    wx.showModal({
      title: '确认删除',
      content: '此操作将永久删除该用户的所有数据，不可恢复。是否继续？',
      confirmText: '删除',
      confirmColor: '#FF0000',
      success: (res) => {
        if (res.confirm) {
          privacyManager.deleteUserData(userId).then(result => {
            if (result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'error'
              });
            }
          });
        }
      }
    });
  },

  // 重置用户进度
  resetUserProgress: function () {
    const userId = this.data.userInfo.userId;
    
    wx.showModal({
      title: '确认重置',
      content: '此操作将重置该用户的所有游戏进度和统计数据。是否继续？',
      confirmText: '重置',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync(`user_stats_${userId}`);
            wx.removeStorageSync(`user_progress_${userId}`);
            wx.removeStorageSync(`user_achievements_${userId}`);
            
            wx.showToast({
              title: '重置成功',
              icon: 'success'
            });
            
            // 重新加载数据
            this.loadUserDetail(userId);
          } catch (error) {
            wx.showToast({
              title: '重置失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 编辑用户备注
  editUserNote: function () {
    const currentNote = this.data.userInfo.adminNote || '';
    
    wx.showModal({
      title: '编辑用户备注',
      content: '',
      editable: true,
      placeholderText: '请输入备注信息',
      value: currentNote,
      success: (res) => {
        if (res.confirm && res.content !== undefined) {
          const userId = this.data.userInfo.userId;
          const userInfo = this.data.userInfo;
          userInfo.adminNote = res.content;
          
          privacyManager.saveUserData(userId, userInfo);
          
          this.setData({
            'userInfo.adminNote': res.content
          });
          
          wx.showToast({
            title: '备注已保存',
            icon: 'success'
          });
        }
      }
    });
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  }
});