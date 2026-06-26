const qrCodeImageUrl = '/assets/images/vx.png'

Page({
  data: {
    qrCodeImageUrl
  },

  previewQrCode() {
    wx.previewImage({
      current: qrCodeImageUrl,
      urls: [qrCodeImageUrl]
    })
  },

  onShareAppMessage() {
    return {
      title: 'QR Code',
      path: '/pages/wechat-qrcode/wechat-qrcode',
      imageUrl: qrCodeImageUrl
    }
  }
})
