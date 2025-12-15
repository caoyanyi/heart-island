// 广告管理和跟踪系统
class AdManager {
  constructor() {
    this.adUnits = {
      banner: 'adunit-xxxxxxxxx', // 横幅广告
      interstitial: 'adunit-yyyyyyyyy', // 插屏广告
      rewarded: 'adunit-zzzzzzzzz' // 激励视频广告
    }
    this.adConfig = {
      banner: {
        enabled: true,
        refreshInterval: 30000, // 30秒刷新
        showAfterActions: 5 // 5次操作后显示
      },
      interstitial: {
        enabled: true,
        showInterval: 180000, // 3分钟间隔
        actionsBeforeShow: 10 // 10次操作后显示
      },
      rewarded: {
        enabled: true,
        dailyLimit: 5, // 每日限制
        rewardAmount: 100 // 奖励积分
      }
    }
    this.userActions = 0
    this.lastAdShowTime = 0
    this.dailyAdCount = {
      banner: 0,
      interstitial: 0,
      rewarded: 0
    }
    this.trackingData = []
    this.init()
  }

  // 初始化广告系统
  init() {
    try {
      this.loadAdConfig()
      this.loadTrackingData()
      this.resetDailyCounts()
  
    } catch (error) {
      console.error('Failed to initialize ad manager:', error)
    }
  }

  // 加载广告配置
  loadAdConfig() {
    try {
      const savedConfig = wx.getStorageSync('adConfig')
      if (savedConfig) {
        this.adConfig = { ...this.adConfig, ...savedConfig }
      }
    } catch (error) {
      console.error('Failed to load ad config:', error)
    }
  }

  // 保存广告配置
  saveAdConfig() {
    try {
      wx.setStorageSync('adConfig', this.adConfig)
    } catch (error) {
      console.error('Failed to save ad config:', error)
    }
  }

  // 加载跟踪数据
  loadTrackingData() {
    try {
      const savedData = wx.getStorageSync('adTrackingData')
      if (savedData) {
        this.trackingData = savedData
      }
    } catch (error) {
      console.error('Failed to load tracking data:', error)
    }
  }

  // 保存跟踪数据
  saveTrackingData() {
    try {
      wx.setStorageSync('adTrackingData', this.trackingData)
    } catch (error) {
      console.error('Failed to save tracking data:', error)
    }
  }

  // 重置每日计数
  resetDailyCounts() {
    try {
      const lastResetDate = wx.getStorageSync('adLastResetDate')
      const today = new Date().toDateString()
      
      if (lastResetDate !== today) {
        this.dailyAdCount = { banner: 0, interstitial: 0, rewarded: 0 }
        wx.setStorageSync('adLastResetDate', today)
        wx.setStorageSync('dailyAdCount', this.dailyAdCount)
      } else {
        const savedCount = wx.getStorageSync('dailyAdCount')
        if (savedCount) {
          this.dailyAdCount = savedCount
        }
      }
    } catch (error) {
      console.error('Failed to reset daily counts:', error)
    }
  }

  // 记录用户行为
  trackUserAction(action) {
    this.userActions++
    
    // 记录跟踪数据
    this.recordTrackingEvent('user_action', {
      action: action,
      userActions: this.userActions,
      timestamp: Date.now()
    })

    // 检查是否显示广告
    this.checkAdDisplay()
  }

  // 检查广告显示条件
  checkAdDisplay() {
    const now = Date.now()
    
    // 检查横幅广告
    if (this.shouldShowBanner()) {
      this.showBannerAd()
    }
    
    // 检查插屏广告
    if (this.shouldShowInterstitial(now)) {
      this.showInterstitialAd()
    }
  }

  // 是否应该显示横幅广告
  shouldShowBanner() {
    if (!this.adConfig.banner.enabled) return false
    if (this.dailyAdCount.banner >= 20) return false // 每日限制
    return this.userActions >= this.adConfig.banner.showAfterActions
  }

  // 是否应该显示插屏广告
  shouldShowInterstitial(now) {
    if (!this.adConfig.interstitial.enabled) return false
    if (this.dailyAdCount.interstitial >= 10) return false // 每日限制
    if (now - this.lastAdShowTime < this.adConfig.interstitial.showInterval) return false
    return this.userActions >= this.adConfig.interstitial.actionsBeforeShow
  }

  // 显示横幅广告
  showBannerAd() {
    try {
      if (!this.adUnits.banner) return

      const bannerAd = wx.createBannerAd({
        adUnitId: this.adUnits.banner,
        adIntervals: this.adConfig.banner.refreshInterval / 1000, // 转换为秒
        style: {
          left: 0,
          top: 0,
          width: 300
        }
      })

      bannerAd.onLoad(() => {
  
        this.recordTrackingEvent('banner_ad_loaded')
      })

      bannerAd.onError((err) => {
        console.error('Banner ad error:', err)
        this.recordTrackingEvent('banner_ad_error', { error: err })
      })

      bannerAd.onClose(() => {
  
        this.recordTrackingEvent('banner_ad_closed')
      })

      bannerAd.show()
      
      this.dailyAdCount.banner++
      this.lastAdShowTime = Date.now()
      this.userActions = 0 // 重置用户行为计数
      
      wx.setStorageSync('dailyAdCount', this.dailyAdCount)
      
    } catch (error) {
      console.error('Failed to show banner ad:', error)
    }
  }

  // 显示插屏广告
  showInterstitialAd() {
    try {
      if (!this.adUnits.interstitial) return

      const interstitialAd = wx.createInterstitialAd({
        adUnitId: this.adUnits.interstitial
      })

      interstitialAd.onLoad(() => {
  
        this.recordTrackingEvent('interstitial_ad_loaded')
      })

      interstitialAd.onError((err) => {
        console.error('Interstitial ad error:', err)
        this.recordTrackingEvent('interstitial_ad_error', { error: err })
      })

      interstitialAd.onClose((res) => {
  
        this.recordTrackingEvent('interstitial_ad_closed', { ended: res && res.isEnded })
      })

      interstitialAd.show().catch((err) => {
        console.error('Failed to show interstitial ad:', err)
      })
      
      this.dailyAdCount.interstitial++
      this.lastAdShowTime = Date.now()
      this.userActions = 0 // 重置用户行为计数
      
      wx.setStorageSync('dailyAdCount', this.dailyAdCount)
      
    } catch (error) {
      console.error('Failed to show interstitial ad:', error)
    }
  }

  // 显示激励视频广告
  showRewardedAd(onReward, onCancel) {
    try {
      if (!this.adUnits.rewarded) {
        if (onCancel) onCancel()
        return
      }

      if (this.dailyAdCount.rewarded >= this.adConfig.rewarded.dailyLimit) {
        wx.showToast({
          title: '今日观看次数已达上限',
          icon: 'none'
        })
        if (onCancel) onCancel()
        return
      }

      const rewardedAd = wx.createRewardedVideoAd({
        adUnitId: this.adUnits.rewarded
      })

      rewardedAd.onLoad(() => {
  
        this.recordTrackingEvent('rewarded_ad_loaded')
      })

      rewardedAd.onError((err) => {
        console.error('Rewarded ad error:', err)
        this.recordTrackingEvent('rewarded_ad_error', { error: err })
        wx.showToast({
          title: '广告加载失败',
          icon: 'none'
        })
        if (onCancel) onCancel()
      })

      rewardedAd.onClose((res) => {
  
        if (res && res.isEnded) {
          // 用户完整观看了广告
          this.dailyAdCount.rewarded++
          this.recordTrackingEvent('rewarded_ad_completed')
          
          if (onReward) {
            onReward(this.adConfig.rewarded.rewardAmount)
          }
        } else {
          // 用户提前关闭了广告
          this.recordTrackingEvent('rewarded_ad_skipped')
          if (onCancel) onCancel()
        }
        
        wx.setStorageSync('dailyAdCount', this.dailyAdCount)
      })

      rewardedAd.show().catch((err) => {
        console.error('Failed to show rewarded ad:', err)
        if (onCancel) onCancel()
      })
      
    } catch (error) {
      console.error('Failed to show rewarded ad:', error)
      if (onCancel) onCancel()
    }
  }

  // 记录跟踪事件
  recordTrackingEvent(eventType, data = {}) {
    try {
      const event = {
        type: eventType,
        timestamp: Date.now(),
        data: data,
        userActions: this.userActions,
        dailyCounts: { ...this.dailyAdCount }
      }

      this.trackingData.push(event)
      
      // 限制数据数量
      if (this.trackingData.length > 1000) {
        this.trackingData = this.trackingData.slice(-500)
      }
      
      this.saveTrackingData()
    } catch (error) {
      console.error('Failed to record tracking event:', error)
    }
  }

  // 获取广告统计
  getAdStats() {
    try {
      const today = new Date().toDateString()
      const todayEvents = this.trackingData.filter(event => {
        const eventDate = new Date(event.timestamp).toDateString()
        return eventDate === today
      })

      return {
        dailyCounts: { ...this.dailyAdCount },
        totalEvents: this.trackingData.length,
        todayEvents: todayEvents.length,
        lastEvent: this.trackingData[this.trackingData.length - 1],
        userActions: this.userActions
      }
    } catch (error) {
      console.error('Failed to get ad stats:', error)
      return {}
    }
  }

  // 获取跟踪报告
  getTrackingReport(startDate, endDate) {
    try {
      const filteredEvents = this.trackingData.filter(event => {
        const eventDate = new Date(event.timestamp)
        return eventDate >= startDate && eventDate <= endDate
      })

      const report = {
        totalEvents: filteredEvents.length,
        eventsByType: {},
        dailyCounts: {},
        userEngagement: {
          totalActions: 0,
          averageActionsPerSession: 0
        }
      }

      // 按事件类型统计
      filteredEvents.forEach(event => {
        if (!report.eventsByType[event.type]) {
          report.eventsByType[event.type] = 0
        }
        report.eventsByType[event.type]++
      })

      // 计算用户参与度
      const totalActions = filteredEvents.reduce((sum, event) => {
        return sum + (event.userActions || 0)
      }, 0)
      
      report.userEngagement.totalActions = totalActions
      report.userEngagement.averageActionsPerSession = 
        filteredEvents.length > 0 ? Math.round(totalActions / filteredEvents.length) : 0

      return report
    } catch (error) {
      console.error('Failed to get tracking report:', error)
      return {}
    }
  }

  // 清除跟踪数据
  clearTrackingData() {
    try {
      this.trackingData = []
      this.saveTrackingData()

    } catch (error) {
      console.error('Failed to clear tracking data:', error)
    }
  }

  // 更新广告配置
  updateAdConfig(newConfig) {
    try {
      this.adConfig = { ...this.adConfig, ...newConfig }
      this.saveAdConfig()

    } catch (error) {
      console.error('Failed to update ad config:', error)
    }
  }

  // 禁用所有广告
  disableAllAds() {
    try {
      Object.keys(this.adConfig).forEach(adType => {
        this.adConfig[adType].enabled = false
      })
      this.saveAdConfig()

    } catch (error) {
      console.error('Failed to disable ads:', error)
    }
  }

  // 启用所有广告
  enableAllAds() {
    try {
      Object.keys(this.adConfig).forEach(adType => {
        this.adConfig[adType].enabled = true
      })
      this.saveAdConfig()

    } catch (error) {
      console.error('Failed to enable ads:', error)
    }
  }
}

// 创建全局广告管理器实例
const adManager = new AdManager()

// 导出供应用使用
module.exports = {
  AdManager,
  adManager
}