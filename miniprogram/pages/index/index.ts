// index.ts
/// <reference path="../../miniprogram_npm/lottie-miniprogram/index.d.ts" />
import { CanvasDraw } from "../../canvas/canvasDraw";

import { WordDataInterface, Status, LinkAreaCoordinate, status2Color, WordBean, LinkResult } from '../../utils/linkCommon';
import { Coordinate, find2DIndices, convertToPx } from '../../utils/util'
import { allWords } from '../../utils/mock'
import lottie from 'lottie-miniprogram'

let app = getApp<IAppOption>()
interface TouchActionBean {
  area: LinkItemArea | null,
  linkFinished: LinkAreaCoordinate
}
var canMove = false;
var linkFinished = false;
const pageSize = 3;
//关卡完成
var stationFinished = false;
// var allWords = [] as Array<WordBean>
Page({
  data: {
    page: 0,
    barHeight: getApp<IAppOption>().globalData.barHeight,
    canvasTopMargin: convertToPx(250),
    progressInfo: {
      totalLevel: 9,
      currentLevel: 1
    }
  } as WordDataInterface,
  ani: null as any,
  //初始化区域数据
  initAreaData() {
    const linkItem = this.selectComponent("#linkItem")
    const query = linkItem.createSelectorQuery();
    query.selectAll('#word').fields({
      node: true,
      dataset: true,
      rect: true,
      size: true
    })
    query.selectAll('#meaning').fields({
      node: true,
      dataset: true,
      rect: true,
      size: true
    })
    query.exec((res) => {
      console.log("单词区域", res)
      app.globalData.area = res
    });
  },
  nextPage() {
    if (!stationFinished) {
      this.setData({
        page: this.data.page + 1
      })
      this.getWords();
    }
  },
  touchBegin(event: WechatMiniprogram.Touch): TouchActionBean {
    const x = event.changedTouches[0].clientX;
    const y = event.changedTouches[0].clientY;

    const linkItem = this.selectComponent("#linkItem")
    let app = getApp<IAppOption>();
    let targetElement = find2DIndices<LinkItemArea>(app.globalData.area, (element) => {
      if ((element.left < x && element.right > x) && element.top < y && element.bottom > y) {
        return true;
      }
      return false;
    })
    let area = null
    var linkAreaCoordinate = {
      from: null,
      end: null
    }
    if (targetElement != null) {
      linkAreaCoordinate = linkItem.startSelect(targetElement.row, targetElement.col);
      area = app.globalData.area[targetElement.row][targetElement.col];
    }
    // if (!hasFindItem) {
    //   linkItem.cancelLink();
    // }

    return {
      area: area,
      linkFinished: linkAreaCoordinate
    }
  },
  canvasTouchStart(e: any) {
    console.log("开始点击", e)
    if (linkFinished) return;
    canMove = true;
    let touchAction = this.touchBegin(e as WechatMiniprogram.Touch);
    if (touchAction.area != null) {
      if (touchAction.linkFinished.from != null && touchAction.linkFinished.end != null) {
        this.data.canvasTool.canvasTouchStart(e, touchAction.area, status2Color(Status.SELECTED));

        this.data.canvasTool.pointToLineFinish(app.globalData.area[touchAction.linkFinished.from.row][touchAction.linkFinished.from.col], app.globalData.area[touchAction.linkFinished.end.row][touchAction.linkFinished.end.col], status2Color(Status.SELECTED));

        this.checkLinkFinished();
      } else {
        this.data.canvasTool.canvasTouchStart(e, touchAction.area, "#FCC434")
      }
    }

  },

  canvasTouchMove(e: any) {
    if (!canMove) return;
    let touchAction = this.touchBegin(e as WechatMiniprogram.Touch);
    if (touchAction.area != null) {
      if (touchAction.linkFinished.from != null && touchAction.linkFinished.end != null) {
        canMove = false;
        this.data.canvasTool.canvasTouchMove(e)
        this.data.canvasTool.pointToLineFinish(app.globalData.area[touchAction.linkFinished.from.row][touchAction.linkFinished.from.col], app.globalData.area[touchAction.linkFinished.end.row][touchAction.linkFinished.end.col], status2Color(Status.SELECTED));
        this.checkLinkFinished();
      } else {
        this.data.canvasTool.canvasTouchMove(e)
      }
    } else {
      this.data.canvasTool.canvasTouchMove(e)
    }
  },

  canvasTouchEnd(e: any) {
    this.data.canvasTool.canvasTouchEnd()
  },
  checkLinkFinished() {
    const linkItem = this.selectComponent("#linkItem")
    linkFinished = linkItem.checkLinkFinished();

    if (linkFinished) {
      wx.showToast({ title: "连线完成" });
      (linkItem.getLinkedResult() as LinkResult[]).forEach((item) => {
        this.data.canvasTool.pointToLineFinish(app.globalData.area[0][item.wordIndex], app.globalData.area[1][item.meaningIndex], status2Color(item.correct ? Status.CORRECT : Status.WRONG));
      });
    }
  },
  //获取当前页单词数据
  getWords() {
    let start = pageSize * this.data.page
    let end = pageSize * (this.data.page + 1)
    if (pageSize * (this.data.page + 1) > allWords.length) {
      end = allWords.length
      stationFinished = true;
    }

    this.setData({
      words: allWords.slice(start, end) as WordBean[]
    });
    this.initAreaData();
    linkFinished = false;
  },
  onReady() {
    const query = wx.createSelectorQuery()
    query.select('#myCanvas')
      .fields({ node: true, size: true, rect: true })
      .exec((res) => {
        const canvas = res[0].node as WechatMiniprogram.Canvas
        const ctx = canvas.getContext('2d')
        let windowInfo = wx.getWindowInfo()
        const dpr = windowInfo.pixelRatio
        const rpxToPx = windowInfo.screenWidth / 750;
        let canvasW = (windowInfo.windowWidth)
        let canvasH = (windowInfo.windowHeight - this.data.barHeight - this.data.canvasTopMargin)
        canvas.width = canvasW * dpr
        canvas.height = canvasH * dpr
        let canvasTool = new CanvasDraw(canvas, ctx, canvasW, canvasH, res[0].top)
        this.setData({
          canvasTool: canvasTool,
          canvasW: canvasW,
          canvasH: canvasH
        })
        ctx.scale(dpr, dpr)
      })
    this.getWords();

    this.createSelectorQuery().select('#tipCanvas').node(res => {
      const canvas = res.node
      const context = canvas.getContext('2d')
      lottie.setup(canvas)
      this.ani = lottie.loadAnimation({
        path: "https://oss.fxwljy.com/attach/file1721377474335.json",
        autoplay: true,
        loop: true,
        rendererSettings: {
          context,
        },
      })
    }).exec()
  },
  onShow() {
    if (this.ani) {
      console.log("动画启动", this.ani)
      this.ani.play();
    }
  },
  onHide() {
    this.ani.play();
  },
  onUnload() {
    console.log("动画结束", this.ani)
    this.ani.destroy()
  },
  addLevel() {
    let newProgress = this.data.progressInfo
    newProgress.currentLevel++;
    this.setData({
      progressInfo: newProgress
    })
  }
})
