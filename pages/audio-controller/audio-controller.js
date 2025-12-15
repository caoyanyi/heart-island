Page({
  data: {
    audioContext: null,
    isMuted: false,
    currentTrack: 'nature-ambient',
    availableTracks: [
      { id: 'nature-ambient', name: '自然氛围', icon: '🌿' },
      { id: 'forest-sounds', name: '森林声音', icon: '🌲' },
      { id: 'ocean-waves', name: '海浪声', icon: '🌊' },
      { id: 'rain-sounds', name: '雨声', icon: '🌧️' },
      { id: 'bird-songs', name: '鸟鸣声', icon: '🐦' },
      { id: 'wind-chimes', name: '风铃声', icon: '🎐' }
    ],
    volume: 0.7,
    isPlaying: false,
    showAudioPanel: false
  },

  onLoad() {
    this.initAudio()
  },

  onUnload() {
    this.stopAllAudio()
  },

  initAudio() {
    // Create audio context for background music
    this.data.audioContext = wx.createInnerAudioContext()
    
    // Set audio properties
    this.data.audioContext.loop = true
    this.data.audioContext.volume = this.data.volume
    
    // Load default track
    this.loadAudioTrack(this.data.currentTrack)
  },

  loadAudioTrack(trackId) {
    const tracks = {
      'nature-ambient': 'https://example.com/audio/nature-ambient.mp3',
      'forest-sounds': 'https://example.com/audio/forest-sounds.mp3',
      'ocean-waves': 'https://example.com/audio/ocean-waves.mp3',
      'rain-sounds': 'https://example.com/audio/rain-sounds.mp3',
      'bird-songs': 'https://example.com/audio/bird-songs.mp3',
      'wind-chimes': 'https://example.com/audio/wind-chimes.mp3'
    }
    
    if (this.data.audioContext) {
      this.data.audioContext.src = tracks[trackId] || tracks['nature-ambient']
      this.data.currentTrack = trackId
      
      if (!this.data.isMuted && this.data.isPlaying) {
        this.data.audioContext.play()
      }
    }
  },

  playAudio() {
    if (this.data.audioContext && !this.data.isMuted) {
      this.data.audioContext.play()
      this.setData({ isPlaying: true })
    }
  },

  pauseAudio() {
    if (this.data.audioContext) {
      this.data.audioContext.pause()
      this.setData({ isPlaying: false })
    }
  },

  stopAllAudio() {
    if (this.data.audioContext) {
      this.data.audioContext.stop()
      this.setData({ isPlaying: false })
    }
  },

  toggleMute() {
    const newMutedState = !this.data.isMuted
    
    if (this.data.audioContext) {
      this.data.audioContext.volume = newMutedState ? 0 : this.data.volume
    }
    
    this.setData({ isMuted: newMutedState })
  },

  changeVolume(e) {
    const volume = e.detail.value
    this.data.volume = volume
    
    if (this.data.audioContext && !this.data.isMuted) {
      this.data.audioContext.volume = volume
    }
    
    this.setData({ volume })
  },

  selectTrack(e) {
    const trackId = e.currentTarget.dataset.track
    
    if (trackId !== this.data.currentTrack) {
      this.loadAudioTrack(trackId)
      this.setData({ currentTrack: trackId })
    }
  },

  toggleAudioPanel() {
    this.setData({ showAudioPanel: !this.data.showAudioPanel })
  },

  // Sound effect methods for games
  playSoundEffect(effectType) {
    const soundContext = wx.createInnerAudioContext()
    
    const effects = {
      bubble: 'https://example.com/audio/bubble-pop.mp3',
      click: 'https://example.com/audio/click.mp3',
      success: 'https://example.com/audio/success.mp3',
      collect: 'https://example.com/audio/collect.mp3',
      wind: 'https://example.com/audio/wind.mp3',
      light: 'https://example.com/audio/light.mp3'
    }
    
    soundContext.src = effects[effectType] || effects.click
    soundContext.volume = this.data.isMuted ? 0 : this.data.volume * 0.5 // Lower volume for effects
    soundContext.play()
    
    // Clean up after playing
    soundContext.onEnded(() => {
      soundContext.destroy()
    })
  },

  // Game-specific sound effects
  playBubblePop() {
    this.playSoundEffect('bubble')
  },

  playClick() {
    this.playSoundEffect('click')
  },

  playSuccess() {
    this.playSoundEffect('success')
  },

  playCollect() {
    this.playSoundEffect('collect')
  },

  playWind() {
    this.playSoundEffect('wind')
  },

  playLight() {
    this.playSoundEffect('light')
  }
})