// index.ts
import { CanvasDraw } from "../../canvas/canvasDraw";
import { WordDataInterface, Status, LinkAreaCoordinate, status2Color, WordBean, LinkResult } from '../../utils/linkCommon';
import { find2DIndices, convertToPx } from '../../utils/util'
import { allWords, allWords2 } from '../../utils/mock'
import lottie from 'lottie-miniprogram'

//把点击区域保存在 globalData 中方便不同方法调用
let app = getApp<IAppOption>()

//area：当前事件是否发生在单词/含义区域，linkFinished：当前事件是否导致连线完成
interface TouchActionBean {
  area: LinkItemArea | null,
  linkFinished: LinkAreaCoordinate
}
//连线完成时，阻断后续touchMove监听
var canMove = false;
//三个单词连完，阻断touchStart 监听
var linkFinished = false;
//一页单词最大数量
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
    },
    dialogShowMode: 0,
    words: [] as WordBean[],
    flowerCanvasHidden: true,
    addWrong:wx.getStorageSync("addWrong"),
    isMute: false
  } as WordDataInterface,
  // lottie 动画对象
  ani: null as any,
  //当前的单词本
  currentWords: allWords,
  stationStartTime: 0,
  backgroundMusicAudio: wx.createInnerAudioContext(),
  backgroundStart: false,
  stopBackground: false,
  currentStationAllCorrect: true,
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
      // this.addLevel();
      this.data.canvasTool.cleanAllLine();
    }
  },
  retryPage() {
    if (!stationFinished) {
      this.currentStationAllCorrect = false;
      this.setData({
        page: this.data.page,
      })
      this.getWords();
      // this.addLevel();
      this.data.canvasTool.cleanAllLine();
    }
  },
  touchBegin(event: WechatMiniprogram.Touch, isMove: boolean): TouchActionBean {
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
      linkAreaCoordinate = linkItem.startSelect(targetElement.row, targetElement.col, isMove);
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
    if (e.touches.length > 1) {
      // 如果检测到多指触控，你可以阻止默认行为
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    console.log("开始点击", e)
    if (linkFinished) return;
    canMove = true;
    let touchAction = this.touchBegin(e as WechatMiniprogram.Touch, false);
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
    if (e.touches.length > 1) {
      // 如果检测到多指触控，你可以阻止默认行为
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (!canMove || linkFinished) return;
    let touchAction = this.touchBegin(e as WechatMiniprogram.Touch, true);
    if (touchAction.area != null) {
      if (touchAction.linkFinished.from != null && touchAction.linkFinished.end != null) {
        canMove = false;
        this.data.canvasTool.canvasTouchMove(e)
        this.data.canvasTool.pointToLineFinish(app.globalData.area[touchAction.linkFinished.from.row][touchAction.linkFinished.from.col], app.globalData.area[touchAction.linkFinished.end.row][touchAction.linkFinished.end.col], status2Color(Status.SELECTED));
        this.checkLinkFinished();
      } else if (touchAction.linkFinished.from != null || touchAction.linkFinished.end != null) {
        this.data.canvasTool.canvasTouchStart(e, touchAction.area, "#FCC434")
      } else {
        this.data.canvasTool.canvasTouchMove(e)
      }
    } else {
      this.data.canvasTool.canvasTouchMove(e)
    }
  },

  canvasTouchEnd(e: any) {
    console.log("触发canvasTouchEnd")
    this.data.canvasTool.canvasTouchEnd()
  },
  checkLinkFinished() {
    const linkItem = this.selectComponent("#linkItem")
    linkFinished = linkItem.checkLinkFinished();

    if (linkFinished) {
      // wx.showToast({ title: "连线完成" });
      let allCorrect = true;
      (linkItem.getLinkedResult() as LinkResult[]).forEach((item) => {
        this.data.canvasTool.pointToLineFinish(app.globalData.area[0][item.wordIndex], app.globalData.area[1][item.meaningIndex], status2Color(item.correct ? Status.CORRECT : Status.WRONG));
        if (!item.correct) {
          allCorrect = false;
        }
      });

      if (allCorrect) {
        setTimeout(() => {
          this.nextPage();
        }, 500)
      } else {
        setTimeout(() => {
          this.retryPage();
        }, 2000)
      }


    }
  },
  //
  showComplePop() {
    if (this.data.answerMode) {
      this.setData({
        dialogShowMode: this.currentStationAllCorrect ? 1 : 2,
        stationCompleteTime: Math.floor((Date.now() - this.stationStartTime) / 1000)
      })
      if (this.currentStationAllCorrect) {
        this.successFlowers()
      }
    } else {
      this.nextStation();
    }

  },
  //获取当前页单词数据
  getWords() {
    let start = pageSize * this.data.page
    let end = pageSize * (this.data.page + 1)
    if (pageSize * (this.data.page + 1) > this.currentWords.length) {
      end = this.currentWords.length
    }
    if (pageSize * this.data.page > this.currentWords.length) {
      stationFinished = true;
      this.showComplePop();
      return;
    }

    let totalPage = Math.floor(this.currentWords.length / pageSize) + (((this.currentWords.length % pageSize) == 0) ? 0 : 1);
    console.log("当前总页数", totalPage)
    this.setData({
      progressInfo: {
        totalLevel: totalPage,
        currentLevel: this.data.page + 1,
        isDisableAnimate: this.data.page == 0
      },
      words: this.currentWords.slice(start, end) as WordBean[]
    });
    setTimeout(() => {
      this.initAreaData();
    }, 100);

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
        let canvasTool = new CanvasDraw(canvas, ctx, canvasW, canvasH, this.data.barHeight + this.data.canvasTopMargin)
        let dialogWidth = windowInfo.windowWidth - convertToPx(120);
        this.setData({
          canvasTool: canvasTool,
          canvasW: canvasW,
          canvasH: canvasH,
          dialogWidth: dialogWidth,
          tipWordWidth: windowInfo.windowWidth - convertToPx(200),
          tipWordHeight: Math.floor(dialogWidth * 0.19)
        })
        ctx.scale(dpr, dpr)
      })
    this.getWords();

    this.createSelectorQuery().select('#tipCanvas').node(res => {
      let windowInfo = wx.getWindowInfo()
      const dpr = windowInfo.pixelRatio
      const canvas = res.node
      let canvasW = (windowInfo.windowWidth) * 5
      let canvasH = canvasW * 155 / 412
      canvas.width = dpr * canvasW
      canvas.height = dpr * canvasH
      this.setData({
        flowerCanvasW: canvasW,
        flowerCanvasH: canvasH,
        flowerCanvasBgLeft: (canvasW - windowInfo.windowWidth) * -0.5,
        flowerCanvasBgTop: -250
        
      })
      const context = canvas.getContext('2d')
      lottie.setup(canvas)
      this.ani = lottie.loadAnimation({
        animationData: require('../../lottieJson/success-flowers.js'),
        autoplay: false,
        loop: false,
        rendererSettings: {
          context,
        },
      })
      this.ani.addEventListener("complete", () => {
        console.log("当前动画执行完毕")
        this.setData({
          flowerCanvasHidden: true
        })
      })
    }).exec()
    this.stationStartTime = Date.now();
    this.stopBackground = wx.getStorageSync("stopBackground")
  },
  onShow() {
    if (this.ani) {
      console.log("动画启动", this.ani)
      // this.ani.play();
    }
    if (!this.backgroundStart && !this.stopBackground) {
      this.playBackground();
      console.log("重新播放")
    } else {
      console.log("没有重新播放")
    }
  },
  onHide() {

  },
  onUnload() {
    console.log("动画结束", this.ani)
    this.ani.destroy()
    console.log("停止播放")
    this.backgroundMusicAudio.stop();
  },
  addLevel() {
    let newProgress = this.data.progressInfo
    newProgress.currentLevel++;
    this.setData({
      progressInfo: newProgress
    })
  },
  retry() {
    this.data.canvasTool.cleanAllLine();
    stationFinished = false;
    this.stationStartTime = Date.now();
    this.currentStationAllCorrect = true;
    this.setData({
      page: 0,
      dialogShowMode: 0
    });
    this.getWords();
  },
  nextStation() {
    this.data.canvasTool.cleanAllLine();
    stationFinished = false;
    this.stationStartTime = Date.now();
    this.currentWords = allWords2
    this.currentStationAllCorrect = true;
    this.setData({
      page: 0,
      dialogShowMode: 0
    });
    this.getWords();
  },

  onLoad(options) {
    this.setData({
      answerMode: options.answerMode == "true"
    })
  },

  tipsAction() {
    this.setData({
      dialogShowMode: 3
    })
    // this.successFlowers()
  },
  successFlowers() {
    console.log("=======执行撒花动画")
    this.setData({
      flowerCanvasHidden: false
    })
    this.ani.goToAndPlay(0);
  },
  stopOrStartBackground() {
    console.log("222222")
    this.stopBackground = !this.stopBackground;
    this.setData({
      isMute: this.stopBackground
    })
    wx.setStorage({
      key: "stopBackground",
      data: this.stopBackground,
      success() {
        console.log("保存背景音乐播放状态成功")
      }
    })
    if (this.stopBackground) {
      console.log("停止播放")
      this.backgroundMusicAudio.pause();
    } else {
      this.playBackground();
    }
  },
  playBackground() {
    console.log("重新开始")
    this.backgroundMusicAudio.stop();
    // this.backgroundMusicAudio.autoplay = true
    this.backgroundMusicAudio.loop = true
    this.backgroundMusicAudio.src = 'https://oss.fxwljy.com/attach/file1720682520578.mp3'
    this.backgroundMusicAudio.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
    })
    this.backgroundStart = true
    //通过onAudioInterruptionBegin监听音频中断开始
    wx.onAudioInterruptionBegin((res) => {
      this.backgroundStart = false
    })
    this.backgroundMusicAudio.play()
  },
  onDialogDismiss() {
    this.setData({
      dialogShowMode: 0
    })
  },
  onClickOverlay() {
    console.log("clickOverlay", this.data.dialogShowMode)
    if (this.data.dialogShowMode == 3) {
      this.setData({
        dialogShowMode: 0
      })
    }
  },
  changeAddWrong(){
    let addWrong = !this.data.addWrong
    wx.setStorage({
      key:"addWrong",
      data:addWrong
    })
    this.setData({
      addWrong:addWrong
    })
  }
})
