// component/top/top.ts
import { convertToPx } from '../../utils/util'
Component({

  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    barHeight: getApp<IAppOption>().globalData.barHeight,
    statusBarHeight: getApp<IAppOption>().globalData.statusBarHeight,
    iconSize: convertToPx(22)
  },

  /**
   * 组件的方法列表
   */
  methods: {
    goBack(){
      wx.navigateBack();
    }
  }
})