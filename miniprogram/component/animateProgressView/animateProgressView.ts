// compont/animateProgressView.ts

interface ProgressInfo {
  totalLevel: number,
  currentLevel: number,
  isDisableAnimate?: boolean
}

interface ProgressComponentData {
  isJumpLogoHidden: boolean
  progressViewHeight: number
  progressInnerLineWidth: number
  progressLeveTexWidth: number
  ipLogoTargetX: number
  ipLogoRunTargetX: number
  componentWidth: number
  currentLevel: number
  totalLevel: number
  minLevelWidth: number
  rpxToPx: number
  currentAnimateDuration: number
  currentNeedTranslateX: number
  originTranslateX: number
}

const minAnimateDuration = 1560

Component({

  /**
   * 组件的属性列表
   */
  properties: {
    progressInfo: {
      type: Object,
      value: {} as ProgressInfo
    }
  },

  observers: {
    'progressInfo': function () {
      if (!this.data.minLevelWidth) {
        return
      }
      if (this.data.currentLevel === this.properties.progressInfo.currentLevel) {
        return
      }
      if (this.properties.progressInfo.isDisableAnimate) {
        this.resetLogoLocation()
        return
      }
      setTimeout(() => {
        this.animateLogo()
      }, 0)
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    isJumpLogoHidden: true,
    progressViewHeight: 138,
    progressInnerLineWidth: 0,
    progressLeveTexWidth: 0,
    ipLogoTargetX: 0,
    currentLevel: 1
  } as ProgressComponentData,

  /**
   * 组件的方法列表
   */
  methods: {

    resetLogoLocation() {
      console.log("=========走了吗")
      let currentLevel = this.properties.progressInfo.currentLevel as number
      let minLevelWidth = this.data.componentWidth / (this.properties.progressInfo.totalLevel) as number
      let newTranslateX = currentLevel * minLevelWidth
      this.setData({
        minLevelWidth: minLevelWidth,
        currentLevel: currentLevel,
        originTranslateX: newTranslateX,
        progressInnerLineWidth: newTranslateX,
        progressLeveTexWidth: newTranslateX,
        totalLevel: this.properties.progressInfo.totalLevel
      });
      let ipLogoX = this.parseIpLogoTargetX()
      this.setData({
        ipLogoTargetX: ipLogoX,
        ipLogoRunTargetX: this.parseIpLogoRunTargetX()
      })
    },

    animateLogo() {
      let currentLevel = this.properties.progressInfo.currentLevel
      let originLevel = this.data.currentLevel
      let originTranslateX = this.data.originTranslateX
      let newTranslateX = currentLevel * this.data.minLevelWidth
      let needTranslateX = newTranslateX - originTranslateX
      let animatieDuration = Math.abs(minAnimateDuration * (currentLevel - originLevel))

      console.log("========", currentLevel, originLevel, originTranslateX, newTranslateX, needTranslateX, animatieDuration)

      this.setData({
        currentAnimateDuration: animatieDuration,
        currentNeedTranslateX: needTranslateX,
        originTranslateX: newTranslateX,
        currentLevel: currentLevel,
      })
      this.animateJumpLogo()
      this.setData({
        isJumpLogoHidden: false
      })
      this.animateProgressLine()
    },
    animateJumpLogo() {
      this.animate('#animate-logo', [
        { translateX: 0, ease: 'linear' },
        // { translateX: this.data.currentNeedTranslateX * 0.5, ease: 'ease-in-out' },
        { translateX: this.data.currentNeedTranslateX, ease: 'ease-in-out' }
      ], this.data.currentAnimateDuration, () => {
        this.clearAnimation('#animate-logo', function () { })
        this.setData({
          isJumpLogoHidden: true
        })
        this.standupLogoAppearAnimate()
      })
    },
    animateProgressLine() {
      let widthChange = this.data.currentLevel * this.data.minLevelWidth
      this.animate('.inner-progress-bg', [
        { width: this.data.progressInnerLineWidth + 'px' },
        { width: widthChange + 'px', ease: 'ease-in-out' },
      ], this.data.currentAnimateDuration, () => {
        this.clearAnimation('.inner-progress-bg', function () { })
        this.setData({
          progressInnerLineWidth: widthChange
        })
      })
      this.animate('.progress-level-text-bg', [
        { width: this.data.progressLeveTexWidth + 'px' },
        { width: widthChange + 'px', ease: 'ease-in-out' },
      ], this.data.currentAnimateDuration, () => {
        this.clearAnimation('.progress-level-text-bg', function () { })
        this.setData({
          progressLeveTexWidth: widthChange
        })
      })
    },

    standupLogoAppearAnimate() {
      this.setData({
        ipLogoTargetX: this.parseIpLogoTargetX(),
        ipLogoRunTargetX: this.parseIpLogoRunTargetX()
      })
      this.setData({
        isJumpLogoHidden: true
      })
    },

    parseIpLogoTargetX() {
      return this.data.currentLevel * this.data.minLevelWidth - 80 * this.data.rpxToPx 
    },

    parseIpLogoRunTargetX() {
      return this.data.currentLevel * this.data.minLevelWidth - 200 * this.data.rpxToPx + 11.5 * this.data.rpxToPx
    }

  },


  ready() {
    const query = wx.createSelectorQuery().in(this);
    query.select('.animate-bg')
      .fields({ size: true })
      .exec((res) => {
        if (res && res[0]) {
          const { width } = res[0];
          let windowInfo = wx.getWindowInfo()
          let minLevelWidth = width / (this.properties.progressInfo.totalLevel) as number
          const rpxToPx = windowInfo.screenWidth / 750;
          let currentLevel = this.properties.progressInfo.currentLevel as number
          let newTranslateX = currentLevel * minLevelWidth
          this.setData({
            componentWidth: width,
            minLevelWidth: minLevelWidth,
            rpxToPx: rpxToPx,
            currentLevel: currentLevel,
            originTranslateX: newTranslateX,
            progressInnerLineWidth: newTranslateX,
            progressLeveTexWidth: newTranslateX,
            totalLevel: this.properties.progressInfo.totalLevel
          });
          let ipLogoX = this.parseIpLogoTargetX()
          this.setData({
            ipLogoTargetX: ipLogoX,
            ipLogoRunTargetX: this.parseIpLogoRunTargetX()
          })
        } else {
          console.error('获取组件尺寸失败');
        }
      });
  }
})