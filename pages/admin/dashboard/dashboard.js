Page({
  data: {
    totalUsers: 1247,
    activeUsers: 856,
    totalTests: 3421,
    avgSessionTime: '12.5分钟',
    userChange: 15.2,
    activeChange: 8.7,
    testChange: 23.4,
    timeChange: -2.1,
    searchKeyword: '',
    emotionDistribution: [
      { emotion: 'calm', label: '平静', count: 1245, percentage: 36.4 },
      { emotion: 'anxiety', label: '焦虑', count: 987, percentage: 28.8 },
      { emotion: 'low', label: '低落', count: 756, percentage: 22.1 },
      { emotion: 'depression', label: '抑郁', count: 433, percentage: 12.7 }
    ],
    gamePreferences: [
      { game: 'cloud-drifting', name: '云端漂流', icon: '☁️', percentage: 32.5 },
      { game: 'bubble-pop', name: '泡泡爆破', icon: '🫧', percentage: 28.3 },
      { game: 'forest-breeze', name: '森林微风', icon: '🍃', percentage: 24.7 },
      { game: 'light-healing', name: '光之治愈', icon: '✨', percentage: 14.5 }
    ],
    users: [
      {
        id: 1,
        nickname: '小明',
        email: 'xiaoming@example.com',
        avatar: '/assets/avatar1.png',
        testCount: 5,
        gameCount: 12,
        lastActive: '2024-01-15'
      },
      {
        id: 2,
        nickname: '小红',
        email: 'xiaohong@example.com',
        avatar: '/assets/avatar2.png',
        testCount: 3,
        gameCount: 8,
        lastActive: '2024-01-14'
      },
      {
        id: 3,
        nickname: '小李',
        email: 'xiaoli@example.com',
        avatar: '/assets/avatar3.png',
        testCount: 7,
        gameCount: 15,
        lastActive: '2024-01-13'
      }
    ],
    filteredUsers: []
  },

  onLoad() {
    this.initializeData()
  },

  onShow() {
    // Check admin authentication
    this.checkAdminAuth()
  },

  initializeData() {
    // Set filtered users initially
    this.setData({
      filteredUsers: this.data.users
    })
    
    // Load real data from storage or cloud
    this.loadAnalyticsData()
  },

  checkAdminAuth() {
    // Simple admin check - in production, this should be more secure
    const isAdmin = wx.getStorageSync('isAdmin')
    if (!isAdmin) {
      wx.showModal({
        title: '权限检查',
        content: '需要管理员权限才能访问此页面',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
    }
  },

  loadAnalyticsData() {
    // Load analytics data from storage
    try {
      const analyticsData = wx.getStorageSync('analyticsData')
      if (analyticsData) {
        this.setData({
          totalUsers: analyticsData.totalUsers || this.data.totalUsers,
          activeUsers: analyticsData.activeUsers || this.data.activeUsers,
          totalTests: analyticsData.totalTests || this.data.totalTests,
          avgSessionTime: analyticsData.avgSessionTime || this.data.avgSessionTime,
          emotionDistribution: analyticsData.emotionDistribution || this.data.emotionDistribution,
          gamePreferences: analyticsData.gamePreferences || this.data.gamePreferences
        })
      }
    } catch (error) {

    }
  },

  refreshData() {
    wx.showLoading({
      title: '刷新数据中...'
    })
    
    // Simulate data refresh
    setTimeout(() => {
      this.updateAnalyticsData()
      wx.hideLoading()
      wx.showToast({
        title: '数据已更新',
        icon: 'success'
      })
    }, 1500)
  },

  updateAnalyticsData() {
    // Simulate updated data
    const newData = {
      totalUsers: this.data.totalUsers + Math.floor(Math.random() * 10),
      activeUsers: this.data.activeUsers + Math.floor(Math.random() * 5),
      totalTests: this.data.totalTests + Math.floor(Math.random() * 20),
      avgSessionTime: `${(12 + Math.random() * 5).toFixed(1)}分钟`,
      emotionDistribution: this.data.emotionDistribution.map(item => ({
        ...item,
        count: item.count + Math.floor(Math.random() * 20),
        percentage: Math.max(5, Math.min(45, item.percentage + (Math.random() - 0.5) * 5))
      })),
      gamePreferences: this.data.gamePreferences.map(item => ({
        ...item,
        percentage: Math.max(5, Math.min(40, item.percentage + (Math.random() - 0.5) * 3))
      }))
    }
    
    this.setData(newData)
    
    // Save to storage
    try {
      wx.setStorageSync('analyticsData', newData)
    } catch (error) {

    }
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  searchUsers() {
    const keyword = this.data.searchKeyword.toLowerCase()
    if (!keyword) {
      this.setData({
        filteredUsers: this.data.users
      })
      return
    }
    
    const filtered = this.data.users.filter(user => 
      user.nickname.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword)
    )
    
    this.setData({
      filteredUsers: filtered
    })
  },

  viewUserDetail(e) {
    const user = e.currentTarget.dataset.user
    wx.navigateTo({
      url: `/pages/admin/user-detail/user-detail?id=${user.id}`
    })
  },

  exportData() {
    wx.showModal({
      title: '导出数据',
      content: '确定要导出用户数据和分析报告吗？',
      success: (res) => {
        if (res.confirm) {
          this.performDataExport()
        }
      }
    })
  },

  performDataExport() {
    // Simulate data export
    wx.showLoading({
      title: '准备导出...'
    })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '数据导出成功',
        icon: 'success'
      })
    }, 2000)
  },

  openSettings() {
    wx.navigateTo({
      url: '/pages/admin/settings/settings'
    })
  }
})