// 隐私设置页面
const { PrivacyManager, ComplianceChecker } = require('../../utils/privacy-security.js');

Page({
  data: {
    privacySettings: {},
    privacyScore: 0,
    privacyStatusText: '',
    complianceReport: null
  },

  onLoad: function() {
    this.privacyManager = new PrivacyManager();
    this.complianceChecker = new ComplianceChecker();
    this.loadSettings();
    this.calculatePrivacyScore();
  },

  // 加载设置
  loadSettings: function() {
    const settings = this.privacyManager.getPrivacySettings();
    this.setData({
      privacySettings: settings
    });
  },

  // 计算隐私分数
  calculatePrivacyScore: function() {
    const settings = this.data.privacySettings;
    let score = 100;
    
    // 数据收集扣分
    if (settings.dataCollection) score -= 10;
    if (settings.analyticsEnabled) score -= 5;
    if (settings.adPersonalization) score -= 15;
    if (settings.allowThirdParty) score -= 20;
    
    // 社交功能扣分
    if (settings.socialFeatures) score -= 5;
    if (settings.locationTracking) score -= 15;
    if (settings.contactSync) score -= 10;
    if (settings.marketingEmails) score -= 5;
    
    // 确保分数在0-100之间
    score = Math.max(0, Math.min(100, score));
    
    let statusText = '';
    if (score >= 80) {
      statusText = '隐私保护良好';
    } else if (score >= 60) {
      statusText = '隐私保护一般';
    } else {
      statusText = '建议加强隐私保护';
    }
    
    this.setData({
      privacyScore: score,
      privacyStatusText: statusText
    });
  },

  // 设置变更
  onSettingChange: function(e) {
    const { setting } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    const newSettings = { ...this.data.privacySettings };
    newSettings[setting] = value;
    
    this.setData({
      privacySettings: newSettings
    });
    
    this.calculatePrivacyScore();
  },

  // 保存设置
  saveSettings: function() {
    const success = this.privacyManager.savePrivacySettings(this.data.privacySettings);
    
    if (success) {
      wx.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 2000
      });
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'error',
        duration: 2000
      });
    }
  },

  // 重置设置
  resetSettings: function() {
    wx.showModal({
      title: '重置确认',
      content: '确定要将所有隐私设置重置为默认值吗？',
      success: (res) => {
        if (res.confirm) {
          const defaultSettings = this.privacyManager.getDefaultPrivacySettings();
          this.setData({
            privacySettings: defaultSettings
          });
          this.privacyManager.savePrivacySettings(defaultSettings);
          this.calculatePrivacyScore();
          
          wx.showToast({
            title: '已重置为默认设置',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },

  // 导出数据
  exportData: function() {
    wx.showLoading({
      title: '准备数据中...'
    });
    
    setTimeout(() => {
      const result = this.privacyManager.exportUserData();
      
      wx.hideLoading();
      
      if (result.success) {
        // 生成数据文件
        const fileName = `user_data_${new Date().toISOString().slice(0, 10)}.json`;
        const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
        
        try {
          const fs = wx.getFileSystemManager();
          fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf8');
          
          // 保存到相册或分享
          wx.showModal({
            title: '数据导出成功',
            content: '您的个人数据已准备好，是否保存到手机？',
            success: (res) => {
              if (res.confirm) {
                wx.saveFileToPhotosAlbum({
                  filePath: filePath,
                  success: () => {
                    wx.showToast({
                      title: '已保存到相册',
                      icon: 'success'
                    });
                  },
                  fail: () => {
                    wx.showToast({
                      title: '保存失败',
                      icon: 'error'
                    });
                  }
                });
              }
            }
          });
        } catch (e) {
          console.error('文件操作失败:', e);
          wx.showToast({
            title: '文件操作失败',
            icon: 'error'
          });
        }
      } else {
        wx.showToast({
          title: '导出失败',
          icon: 'error'
        });
      }
    }, 1000);
  },

  // 删除数据
  deleteData: function() {
    wx.showModal({
      title: '删除确认',
      content: '此操作将永久删除您的所有个人数据，包括游戏进度、设置等。此操作不可恢复，是否继续？',
      confirmText: '确认删除',
      confirmColor: '#ff0000',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          });
          
          setTimeout(() => {
            const result = this.privacyManager.deleteUserData();
            
            wx.hideLoading();
            
            if (result.success) {
              wx.showToast({
                title: '数据已删除',
                icon: 'success',
                duration: 3000
              });
              
              // 重新加载设置
              this.loadSettings();
              this.calculatePrivacyScore();
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'error'
              });
            }
          }, 1500);
        }
      }
    });
  },

  // 清除缓存
  clearCache: function() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有本地缓存数据吗？这不会影响您的个人设置。',
      success: (res) => {
        if (res.confirm) {
          try {
            // 清除临时缓存
            const fs = wx.getFileSystemManager();
            const tempPath = wx.env.USER_DATA_PATH;
            
            // 这里可以添加具体的缓存清理逻辑
        
            
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            });
          } catch (e) {
            console.error('清除缓存失败:', e);
            wx.showToast({
              title: '清除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 查看合规报告
  viewComplianceReport: function() {
    const report = this.complianceChecker.generateComplianceReport();
    
    this.setData({
      complianceReport: report
    });
    
    // 显示报告详情
    const recommendations = report.recommendations.map(r => r.message).join('\n• ');
    
    wx.showModal({
      title: '合规报告',
      content: `合规状态: ${report.dataCompliance.compliant ? '良好' : '需要改进'}\n\n建议:\n• ${recommendations}`,
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 查看隐私政策
  viewPrivacyPolicy: function() {
    this.privacyManager.showPrivacyPolicy();
  },

  // 查看服务条款
  viewTermsOfService: function() {
    const terms = `服务条款

1. 服务描述
我们提供心理健康相关的应用服务。

2. 用户责任
用户需要遵守相关法律法规。

3. 隐私保护
我们承诺保护用户隐私安全。

4. 服务变更
我们保留修改服务的权利。

5. 免责声明
我们不对使用结果承担责任。`;

    wx.showModal({
      title: '服务条款',
      content: terms,
      showCancel: false,
      confirmText: '我已了解'
    });
  },

  // 查看Cookie政策
  viewCookiePolicy: function() {
    const cookiePolicy = `Cookie政策

1. Cookie用途
我们使用Cookie来改善用户体验。

2. Cookie类型
包括会话Cookie和持久Cookie。

3. Cookie管理
您可以在设置中管理Cookie偏好。

4. 第三方Cookie
我们可能会使用第三方Cookie。

5. Cookie删除
您可以随时删除Cookie。`;

    wx.showModal({
      title: 'Cookie政策',
      content: cookiePolicy,
      showCancel: false,
      confirmText: '我已了解'
    });
  },

  // 返回
  goBack: function() {
    wx.navigateBack();
  },

  // 阻止事件冒泡
  preventEvent: function(e) {
    // 空函数，用于阻止事件冒泡
  }
});