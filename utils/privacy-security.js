// 数据加密和隐私保护工具类
class DataEncryption {
  constructor() {
    this.encryptionKey = null;
    this.initKey();
  }

  // 初始化加密密钥
  initKey() {
    try {
      // 从本地存储获取或生成密钥
      let key = wx.getStorageSync('encryption_key');
      if (!key) {
        key = this.generateKey();
        wx.setStorageSync('encryption_key', key);
      }
      this.encryptionKey = key;
    } catch (e) {
      console.error('初始化加密密钥失败:', e);
      this.encryptionKey = this.generateKey();
    }
  }

  // 生成随机密钥
  generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  // 简单的加密函数（使用XOR加密）
  encrypt(text) {
    try {
      if (!text) return '';
      
      let result = '';
      const key = this.encryptionKey;
      
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode ^ keyChar);
      }
      
      // 转换为Base64
      return this.encodeBase64(result);
    } catch (e) {
      console.error('加密失败:', e);
      return text;
    }
  }

  // 简单的解密函数
  decrypt(encryptedText) {
    try {
      if (!encryptedText) return '';
      
      // 从Base64解码
      const decoded = this.decodeBase64(encryptedText);
      
      let result = '';
      const key = this.encryptionKey;
      
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode ^ keyChar);
      }
      
      return result;
    } catch (e) {
      console.error('解密失败:', e);
      return encryptedText;
    }
  }

  // Base64编码
  encodeBase64(text) {
    try {
      return wx.base64ToArrayBuffer ? 
        wx.arrayBufferToBase64(new TextEncoder().encode(text)) :
        btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
      return btoa(unescape(encodeURIComponent(text)));
    }
  }

  // Base64解码
  decodeBase64(base64) {
    try {
      return wx.base64ToArrayBuffer ?
        new TextDecoder().decode(wx.base64ToArrayBuffer(base64)) :
        decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      return decodeURIComponent(escape(atob(base64)));
    }
  }

  // 哈希函数（用于密码等敏感数据）
  hash(text) {
    try {
      let hash = 0;
      if (text.length === 0) return hash.toString();
      
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
      }
      
      return Math.abs(hash).toString(16);
    } catch (e) {
      console.error('哈希失败:', e);
      return text;
    }
  }

  // 生成随机ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 安全存储数据
  secureSetStorage(key, data) {
    try {
      const encrypted = this.encrypt(JSON.stringify(data));
      wx.setStorageSync(key, encrypted);
      return true;
    } catch (e) {
      console.error('安全存储失败:', e);
      return false;
    }
  }

  // 安全读取数据
  secureGetStorage(key) {
    try {
      const encrypted = wx.getStorageSync(key);
      if (!encrypted) return null;
      
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (e) {
      console.error('安全读取失败:', e);
      return null;
    }
  }

  // 安全删除数据
  secureRemoveStorage(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (e) {
      console.error('安全删除失败:', e);
      return false;
    }
  }

  // 清除所有加密数据
  clearSecureStorage() {
    try {
      const keys = ['user_data', 'game_progress', 'emotion_records', 'settings', 'statistics'];
      keys.forEach(key => {
        wx.removeStorageSync(key);
      });
      return true;
    } catch (e) {
      console.error('清除安全存储失败:', e);
      return false;
    }
  }
}

// 隐私控制管理器
class PrivacyManager {
  constructor() {
    this.privacySettings = this.loadPrivacySettings();
  }

  // 加载隐私设置
  loadPrivacySettings() {
    try {
      const settings = wx.getStorageSync('privacy_settings');
      return settings || this.getDefaultPrivacySettings();
    } catch (e) {
      return this.getDefaultPrivacySettings();
    }
  }

  // 获取默认隐私设置
  getDefaultPrivacySettings() {
    return {
      dataCollection: true,
      analyticsEnabled: true,
      adPersonalization: true,
      socialFeatures: true,
      dataRetention: 30, // 天数
      allowThirdParty: false,
      locationTracking: false,
      contactSync: false,
      marketingEmails: false
    };
  }

  // 保存隐私设置
  savePrivacySettings(settings) {
    try {
      this.privacySettings = { ...this.privacySettings, ...settings };
      wx.setStorageSync('privacy_settings', this.privacySettings);
      return true;
    } catch (e) {
      console.error('保存隐私设置失败:', e);
      return false;
    }
  }

  // 获取隐私设置
  getPrivacySettings() {
    return this.privacySettings;
  }

  // 检查是否允许数据收集
  isDataCollectionAllowed() {
    return this.privacySettings.dataCollection;
  }

  // 检查是否允许分析
  isAnalyticsEnabled() {
    return this.privacySettings.analyticsEnabled;
  }

  // 检查是否允许广告个性化
  isAdPersonalizationAllowed() {
    return this.privacySettings.adPersonalization;
  }

  // 检查是否允许社交功能
  isSocialFeaturesAllowed() {
    return this.privacySettings.socialFeatures;
  }

  // 检查是否允许第三方数据共享
  isThirdPartyAllowed() {
    return this.privacySettings.allowThirdParty;
  }

  // 获取数据保留期
  getDataRetentionDays() {
    return this.privacySettings.dataRetention;
  }

  // 检查数据是否过期
  isDataExpired(timestamp) {
    const retentionDays = this.getDataRetentionDays();
    const now = Date.now();
    const dataAge = (now - timestamp) / (1000 * 60 * 60 * 24);
    return dataAge > retentionDays;
  }

  // 请求隐私权限
  requestPrivacyPermission(permission) {
    return new Promise((resolve) => {
      wx.showModal({
        title: '隐私权限请求',
        content: this.getPermissionDescription(permission),
        showCancel: true,
        confirmText: '同意',
        cancelText: '拒绝',
        success: (res) => {
          resolve(res.confirm);
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  }

  // 获取权限描述
  getPermissionDescription(permission) {
    const descriptions = {
      dataCollection: '我们需要收集您的使用数据来改善应用体验',
      analytics: '我们需要分析您的使用行为来优化应用性能',
      adPersonalization: '我们需要使用您的数据来提供更相关的广告',
      socialFeatures: '我们需要访问您的社交信息来启用社交功能',
      location: '我们需要访问您的位置信息来提供基于位置的服务',
      contacts: '我们需要访问您的通讯录来同步联系人',
      marketing: '我们需要向您发送营销邮件和通知'
    };
    
    return descriptions[permission] || '我们需要您的权限来提供更好的服务';
  }

  // 导出数据（GDPR合规）
  exportUserData() {
    try {
      const userData = {};
      const keys = ['user_data', 'game_progress', 'emotion_records', 'settings', 'statistics'];
      
      keys.forEach(key => {
        try {
          const data = wx.getStorageSync(key);
          if (data) {
            userData[key] = data;
          }
        } catch (e) {
          console.error(`导出${key}失败:`, e);
        }
      });
      
      return {
        success: true,
        data: userData,
        exportTime: new Date().toISOString(),
        appVersion: '1.0.0'
      };
    } catch (e) {
      console.error('导出用户数据失败:', e);
      return {
        success: false,
        error: e.message
      };
    }
  }

  // 删除用户数据（GDPR合规）
  deleteUserData() {
    try {
      // 清除所有本地存储
      wx.clearStorageSync();
      
      // 重新设置隐私设置
      this.privacySettings = this.getDefaultPrivacySettings();
      wx.setStorageSync('privacy_settings', this.privacySettings);
      
      return {
        success: true,
        message: '用户数据已完全删除',
        deletionTime: new Date().toISOString()
      };
    } catch (e) {
      console.error('删除用户数据失败:', e);
      return {
        success: false,
        error: e.message
      };
    }
  }

  // 显示隐私政策
  showPrivacyPolicy() {
    const policy = `隐私政策

1. 数据收集
我们收集必要的数据来提供更好的服务体验。

2. 数据使用
我们仅将数据用于改善应用功能和用户体验。

3. 数据保护
我们采用加密技术保护您的个人信息。

4. 数据共享
未经您的同意，我们不会与第三方共享您的数据。

5. 用户权利
您有权查看、修改或删除您的个人数据。

6. 联系我们
如有隐私相关问题，请联系我们的客服团队。`;

    wx.showModal({
      title: '隐私政策',
      content: policy,
      showCancel: false,
      confirmText: '我已了解'
    });
  }
}

// 合规检查器
class ComplianceChecker {
  constructor() {
    this.encryption = new DataEncryption();
    this.privacy = new PrivacyManager();
  }

  // 检查数据合规性
  checkDataCompliance() {
    const issues = [];
    
    // 检查过期数据
    try {
      const keys = wx.getStorageInfoSync().keys;
      keys.forEach(key => {
        try {
          const data = wx.getStorageSync(key);
          if (data && data.timestamp && this.privacy.isDataExpired(data.timestamp)) {
            issues.push({
              type: 'expired_data',
              key: key,
              message: `数据已过期: ${key}`
            });
          }
        } catch (e) {
          issues.push({
            type: 'access_error',
            key: key,
            message: `访问数据失败: ${key}`
          });
        }
      });
    } catch (e) {
      issues.push({
        type: 'storage_error',
        message: '无法访问存储信息'
      });
    }
    
    return {
      compliant: issues.length === 0,
      issues: issues,
      timestamp: new Date().toISOString()
    };
  }

  // 执行合规清理
  performComplianceCleanup() {
    const compliance = this.checkDataCompliance();
    
    if (!compliance.compliant) {
      compliance.issues.forEach(issue => {
        if (issue.type === 'expired_data') {
          try {
            wx.removeStorageSync(issue.key);
    
          } catch (e) {
            console.error(`清理数据失败: ${issue.key}`, e);
          }
        }
      });
    }
    
    return compliance;
  }

  // 生成合规报告
  generateComplianceReport() {
    const privacySettings = this.privacy.getPrivacySettings();
    const compliance = this.checkDataCompliance();
    
    return {
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0',
      privacySettings: privacySettings,
      dataCompliance: compliance,
      recommendations: this.getComplianceRecommendations(),
      nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // 获取合规建议
  getComplianceRecommendations() {
    const recommendations = [];
    
    if (!this.privacy.isDataCollectionAllowed()) {
      recommendations.push({
        type: 'privacy',
        priority: 'high',
        message: '建议启用数据收集以获得更好的用户体验'
      });
    }
    
    if (this.privacy.getDataRetentionDays() > 90) {
      recommendations.push({
        type: 'data_retention',
        priority: 'medium',
        message: '建议缩短数据保留期以提高隐私保护'
      });
    }
    
    if (!this.privacy.isAnalyticsEnabled()) {
      recommendations.push({
        type: 'analytics',
        priority: 'low',
        message: '建议启用分析功能以改善应用性能'
      });
    }
    
    return recommendations;
  }
}

// 导出工具类
module.exports = {
  DataEncryption,
  PrivacyManager,
  ComplianceChecker
};