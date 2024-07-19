// app.ts
// import { LinkItemArea } from './utils/linkCommon'
// import {IAppOption} from '../typings/index'

App<IAppOption>({
  globalData: {
    area: [] as LinkItemArea[][],
    statusBarHeight:0,
    barHeight: 0
  },
  onLaunch() {
    const systemInfo = wx.getSystemInfoSync();
    const menuRect = wx.getMenuButtonBoundingClientRect();
    console.log("对应位置", menuRect)
    this.globalData.barHeight = menuRect.bottom
    this.globalData.statusBarHeight = systemInfo.statusBarHeight
  },
})