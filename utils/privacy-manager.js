// 数据加密和隐私控制工具类
class PrivacyManager {
  constructor() {
    this.encryptionKey = null
    this.userConsent = false
    this.dataRetentionDays = 30
    this.initEncryption()
  }

  // 初始化加密系统
  initEncryption() {
    try {
      // 生成或获取加密密钥
      this.encryptionKey = this.generateEncryptionKey()
  
    } catch (error) {
      console.error('Failed to initialize encryption:', error)
    }
  }

  // 生成加密密钥
  generateEncryptionKey() {
    // 使用微信小程序的随机数生成器
    const randomBytes = new Uint8Array(32)
    if (typeof wx !== 'undefined' && wx.getRandomValues) {
      wx.getRandomValues(randomBytes)
    } else {
      // 备用方案
      for (let i = 0; i < 32; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256)
      }
    }
    return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // 简单的加密函数（使用XOR加密）
  encrypt(text) {
    try {
      if (!this.encryptionKey || !text) return text
      
      let result = ''
      const key = this.encryptionKey
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
      }
      return btoa(result) // Base64编码
    } catch (error) {
      console.error('Encryption failed:', error)
      return text
    }
  }

  // 简单的解密函数
  decrypt(encryptedText) {
    try {
      if (!this.encryptionKey || !encryptedText) return encryptedText
      
      const decoded = atob(encryptedText) // Base64解码
      let result = ''
      const key = this.encryptionKey
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length))
      }
      return result
    } catch (error) {
      console.error('Decryption failed:', error)
      return encryptedText
    }
  }

  // 获取用户同意状态
  getUserConsent() {
    try {
      const consent = wx.getStorageSync('userConsent')
      return consent || false
    } catch (error) {
      console.error('Failed to get user consent:', error)
      return false
    }
  }

  // 设置用户同意
  setUserConsent(consent) {
    try {
      this.userConsent = consent
      wx.setStorageSync('userConsent', consent)
      
      if (consent) {
        this.logPrivacyEvent('user_consent_given')
      } else {
        this.logPrivacyEvent('user_consent_withdrawn')
      }
      return true
    } catch (error) {
      console.error('Failed to set user consent:', error)
      return false
    }
  }

  // 显示隐私同意对话框
  showConsentDialog() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '隐私政策',
        content: '我们重视您的隐私。本应用会收集必要的使用数据来改善体验，所有数据都会加密存储并遵循相关隐私法规。您是否同意我们的隐私政策？',
        confirmText: '同意',
        cancelText: '拒绝',
        success: (res) => {
          const consent = res.confirm
          this.setUserConsent(consent)
          resolve(consent)
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  }

  // 安全存储数据
  secureSetStorage(key, data) {
    try {
      if (!this.userConsent) {
        console.warn('Cannot store data without user consent')
        return false
      }

      const encryptedData = this.encrypt(JSON.stringify(data))
      wx.setStorageSync(key, encryptedData)
      
      // 添加数据过期时间
      const expiryKey = `${key}_expiry`
      const expiryTime = Date.now() + (this.dataRetentionDays * 24 * 60 * 60 * 1000)
      wx.setStorageSync(expiryKey, expiryTime)
      
      return true
    } catch (error) {
      console.error('Failed to securely store data:', error)
      return false
    }
  }

  // 安全读取数据
  secureGetStorage(key) {
    try {
      if (!this.userConsent) {
        console.warn('Cannot retrieve data without user consent')
        return null
      }

      // 检查数据是否过期
      const expiryKey = `${key}_expiry`
      const expiryTime = wx.getStorageSync(expiryKey)
      
      if (expiryTime && Date.now() > expiryTime) {
        // 数据已过期，删除数据
        this.secureRemoveStorage(key)
        return null
      }

      const encryptedData = wx.getStorageSync(key)
      if (!encryptedData) return null

      const decryptedData = this.decrypt(encryptedData)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error('Failed to securely retrieve data:', error)
      return null
    }
  }

  // 安全删除数据
  secureRemoveStorage(key) {
    try {
      wx.removeStorageSync(key)
      const expiryKey = `${key}_expiry`
      wx.removeStorageSync(expiryKey)
      return true
    } catch (error) {
      console.error('Failed to securely remove data:', error)
      return false
    }
  }

  // 清理过期数据
  cleanupExpiredData() {
    try {
      const storageInfo = wx.getStorageInfoSync()
      let cleanedCount = 0

      storageInfo.keys.forEach(key => {
        if (key.endsWith('_expiry')) {
          const expiryTime = wx.getStorageSync(key)
          if (expiryTime && Date.now() > expiryTime) {
            const dataKey = key.replace('_expiry', '')
            this.secureRemoveStorage(dataKey)
            cleanedCount++
          }
        }
      })

      
      return cleanedCount
    } catch (error) {
      console.error('Failed to cleanup expired data:', error)
      return 0
    }
  }

  // 记录隐私事件
  logPrivacyEvent(eventType, data = {}) {
    try {
      const event = {
        type: eventType,
        timestamp: Date.now(),
        data: data,
        userId: this.getAnonymousUserId()
      }

      // 存储到本地日志（不加密，因为只是事件记录）
      const logs = wx.getStorageSync('privacyLogs') || []
      logs.push(event)
      
      // 限制日志数量
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }
      
      wx.setStorageSync('privacyLogs', logs)
    } catch (error) {
      console.error('Failed to log privacy event:', error)
    }
  }

  // 获取匿名用户ID
  getAnonymousUserId() {
    try {
      let userId = wx.getStorageSync('anonymousUserId')
      if (!userId) {
        userId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        wx.setStorageSync('anonymousUserId', userId)
      }
      return userId
    } catch (error) {
      console.error('Failed to get anonymous user ID:', error)
      return 'anon_unknown'
    }
  }

  // 导出用户数据（GDPR合规）
  exportUserData() {
    try {
      if (!this.userConsent) {
        throw new Error('Cannot export data without user consent')
      }

      const userData = {}
      const storageInfo = wx.getStorageSync('storageInfo')
      
      storageInfo.keys.forEach(key => {
        if (!key.includes('_expiry') && !key.includes('privacyLogs')) {
          const data = this.secureGetStorage(key)
          if (data) {
            userData[key] = data
          }
        }
      })

      return {
        userId: this.getAnonymousUserId(),
        exportDate: new Date().toISOString(),
        data: userData,
        consentHistory: this.getConsentHistory()
      }
    } catch (error) {
      console.error('Failed to export user data:', error)
      throw error
    }
  }

  // 获取同意历史
  getConsentHistory() {
    try {
      const logs = wx.getStorageSync('privacyLogs') || []
      return logs.filter(log => log.type === 'user_consent_given' || log.type === 'user_consent_withdrawn')
        .map(log => ({
          timestamp: log.timestamp,
          action: log.type,
          date: new Date(log.timestamp).toISOString()
        }))
    } catch (error) {
      console.error('Failed to get consent history:', error)
      return []
    }
  }

  // 删除所有用户数据（GDPR合规）
  deleteAllUserData() {
    try {
      if (!this.userConsent) {
        console.warn('No user consent to delete data')
        return false
      }

      const storageInfo = wx.getStorageInfoSync()
      let deletedCount = 0

      storageInfo.keys.forEach(key => {
        if (!key.includes('privacyLogs')) {
          wx.removeStorageSync(key)
          deletedCount++
        }
      })

      // 记录删除事件
      this.logPrivacyEvent('user_data_deleted', { deletedItems: deletedCount })
      
      // 重置用户同意状态
      this.setUserConsent(false)
      
      
      return true
    } catch (error) {
      console.error('Failed to delete all user data:', error)
      return false
    }
  }

  // 验证数据完整性
  validateDataIntegrity(key) {
    try {
      const data = this.secureGetStorage(key)
      if (!data) return false

      // 简单的完整性检查
      const originalHash = wx.getStorageSync(`${key}_hash`)
      const currentHash = this.simpleHash(JSON.stringify(data))
      
      return originalHash === currentHash
    } catch (error) {
      console.error('Failed to validate data integrity:', error)
      return false
    }
  }

  // 简单的哈希函数
  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return hash.toString(36)
  }

  // 添加数据完整性哈希
  addDataIntegrity(key, data) {
    try {
      const hash = this.simpleHash(JSON.stringify(data))
      wx.setStorageSync(`${key}_hash`, hash)
    } catch (error) {
      console.error('Failed to add data integrity:', error)
    }
  }
}

// 创建全局隐私管理器实例
const privacyManager = new PrivacyManager()

// 导出供应用使用
module.exports = {
  PrivacyManager,
  privacyManager
}