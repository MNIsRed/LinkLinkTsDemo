// index.ts
import { CanvasDraw } from "../../canvas/canvasDraw";

import { WordDataInterface, Status, LinkAreaCoordinate, status2Color, WordBean } from '../../utils/linkCommon';
import { Coordinate, find2DIndices } from '../../utils/util'
import { allWords } from '../../utils/mock'
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
Component({
  data: {
    page: 0
  } as WordDataInterface,
  methods: {
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
      console.log(targetElement)
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
      console.log(e)
      if (linkFinished) return;
      canMove = true;
      let touchAction = this.touchBegin(e as WechatMiniprogram.Touch);
      if (touchAction.area != null) {
        if (touchAction.linkFinished.from != null && touchAction.linkFinished.end != null) {
          this.data.canvasTool.pointToLineFinish(app.globalData.area[touchAction.linkFinished.from.row][touchAction.linkFinished.from.col], app.globalData.area[touchAction.linkFinished.end.row][touchAction.linkFinished.end.col], "#FCC434");

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
        wx.showToast({ title: "连线完成" })
        linkItem.getLinkedResult().for

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
    }
  },
  lifetimes: {
    ready() {

      const query = wx.createSelectorQuery()
      query.select('#myCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res[0].node as WechatMiniprogram.Canvas
          const ctx = canvas.getContext('2d')
          let windowInfo = wx.getWindowInfo()
          const dpr = windowInfo.pixelRatio
          const rpxToPx = windowInfo.screenWidth / 750;
          let canvasW = (windowInfo.windowWidth - (30 * 2) * rpxToPx)
          let canvasH = (windowInfo.windowHeight - 100)
          canvas.width = canvasW * dpr
          canvas.height = canvasH * dpr
          let canvasTool = new CanvasDraw(canvas, ctx, canvasW, canvasH)
          this.setData({
            canvasTool: canvasTool,
            canvasW: canvasW,
            canvasH: canvasH
          })
          ctx.scale(dpr, dpr)
        })
      this.getWords();
    }
  }
})
