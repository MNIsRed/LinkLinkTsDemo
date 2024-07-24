// pages/home/home.ts
import { convertToPx, debounce, DebounceTimer } from '../../utils/util'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    barHeight: getApp<IAppOption>().globalData.barHeight,
    statusBarHeight: getApp<IAppOption>().globalData.statusBarHeight,
    iconSize: convertToPx(22)
  },
  debounceTimer: {
    timer: null
  } as DebounceTimer,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },
  goIndex(e: WechatMiniprogram.TouchEvent) {
    debounce(() => {
      let dataset = e.currentTarget.dataset;
      console.log("触发 goIndex")
      wx.navigateTo({
        url: '../index/index?answerMode=' + (dataset.mode == "answer")
      })
    }, this.debounceTimer)
  }
  
})