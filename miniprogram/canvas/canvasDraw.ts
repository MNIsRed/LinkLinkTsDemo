
class CanvasDraw {
  constructor(canvas: WechatMiniprogram.Canvas, ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D, canvasW: number, canvasH: number, canvasTop: number) {
    this.canvas = canvas
    this.ctx = ctx
    this.canvasW = canvasW
    this.canvasH = canvasH
    this.canvasTop = canvasTop
    this.loop()
  }
  canvas: WechatMiniprogram.Canvas
  ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D
  canvasW: number
  canvasH: number
  canvasTop: number
  animatedId?: number
  pointContainer?: PointContainer

  loop() {
    this.render()
    let animatedId = this.canvas.requestAnimationFrame(
      this.loop.bind(this)
    )
    this.animatedId = animatedId
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvasW, this.canvasH);
    if (!this.pointContainer) {
      return
    }
    for (let i = 0; i < this.pointContainer.points.length; i++) {
      this.ctx.beginPath();
      let currentPointLine = this.pointContainer.points[i];
      let currentStartPoint = currentPointLine.startPoint
      let currentEndPoint = currentPointLine.endPoint
      if (currentPointLine.lineColor) {
        this.ctx.strokeStyle = currentPointLine.lineColor; // 设置线条颜色
      }
      if (currentStartPoint) {
        this.ctx.moveTo(currentStartPoint.x, currentStartPoint.y - this.canvasTop); // 移动到上一个点
      }
      if (currentEndPoint) {
        this.ctx.lineTo(currentEndPoint.x, currentEndPoint.y - this.canvasTop); // 从上一个点画线到当前点
      }
      this.ctx.lineWidth = 3 // 设置线条宽度
      this.ctx.stroke(); // 进   
    }
  }


  canvasTouchStart(e: WechatMiniprogram.Touch, itemArea: LinkItemArea, lineColor: string) {
    const x: number = e.touches[0].clientX
    const y: number = e.touches[0].clientY
    let point = <Point>{
      x: x,
      y: y
    }
    let linePoint = this.transformLinePointWithItemArea(point, itemArea)
    console.log("++++++", linePoint)
    if (!linePoint) {
      return
    }
    console.log("=========", this.pointContainer)
    if (!this.pointContainer) {
      let pointLine: PointToLine = {
        startPoint: linePoint,
        lineColor: lineColor
      }
      let pointLines: PointToLine[] = []
      pointLines.push(pointLine)
      this.pointContainer = {
        points: pointLines,
        currentPointLine: pointLine
      }
      return
    }
    console.log("=======看下pointsTouchstart", this.pointContainer.points, this.pointContainer.points.length)
    let unFinishPointLineArr = this.pointContainer.points.filter((value) => {
      if (value.isFinishStroke) {
        return false
      }
      if (!value.startPoint) {
        return false
      }
      console.log("=======查询是否有未连接的线", value)
      return true
    })
    if (unFinishPointLineArr && unFinishPointLineArr.length > 0) {
      let pointLine = unFinishPointLineArr[0]
      if (pointLine.startPoint && pointLine.startPoint.x === linePoint.x) {
        pointLine.startPoint = linePoint
        this.removeExistPointToLine(linePoint, lineColor)
        return
      }
      pointLine.endPoint = linePoint
      pointLine.isFinishStroke = true
      console.log("=======点击连线完成", pointLine)
      return
    }
    this.removeExistPointToLine(linePoint, lineColor)
  }

  removeExistPointToLine(linePoint: Point, lineColor: string) {
    if (!this.pointContainer) {
      return
    }
    let existPointToLine: PointToLine = {}
    this.pointContainer.points.forEach((pointToLine) => {
      if (pointToLine.startPoint && linePoint) {
        if (pointToLine.startPoint.x === linePoint.x && pointToLine.startPoint.y === linePoint.y && pointToLine.isFinishStroke) {
          existPointToLine = pointToLine
          return
        }
      }
      if (pointToLine.endPoint && linePoint) {
        if (pointToLine.endPoint.x === linePoint.x && pointToLine.endPoint.y === linePoint.y && pointToLine.isFinishStroke) {
          existPointToLine = pointToLine
        }
      }
    })
    console.log("=======找到已完成连线的item", linePoint,this.pointContainer.points,existPointToLine)
    if (!existPointToLine.startPoint) {
      let pointLine: PointToLine = {
        startPoint: linePoint,
        lineColor: lineColor
      }
      this.pointContainer.points.push(pointLine)
      this.pointContainer.currentPointLine = pointLine
      return
    }
    let tempPointLineArr = this.pointContainer.points.filter((value) => {
      if (!existPointToLine.startPoint) {
        return true
      }
      if (!value.startPoint) {
        return false
      }
      if (value.startPoint.x === existPointToLine.startPoint.x && value.startPoint.y === existPointToLine.startPoint.y && value.isFinishStroke) {
        console.log("=======找到已完成连线的item,并剔除", value)
      }
      return !(value.startPoint.x === existPointToLine.startPoint.x && value.startPoint.y === existPointToLine.startPoint.y && value.isFinishStroke)
    })
    this.pointContainer.points = tempPointLineArr
    let pointLine: PointToLine = {
      startPoint: linePoint,
      lineColor: lineColor
    }
    this.pointContainer.points.push(pointLine)
    console.log("触发添加pointContainer")
    this.pointContainer.currentPointLine = pointLine
  }

  canvasTouchMove(e: WechatMiniprogram.Touch) {
    console.log("=======touchMove走了", this.pointContainer?.currentPointLine)
    const x = e.touches[0].clientX
    const y = e.touches[0].clientY
    if (!this.pointContainer) {
      return
    }
    if (!this.pointContainer.currentPointLine) {
      return
    }
    this.pointContainer.currentPointLine.endPoint = {
      x: x,
      y: y
    }
    this.pointContainer.currentPointLine.isTouchMoved = true
  }

  canvasTouchEnd() {
    if (!this.pointContainer) {
      return
    }
    if (this.pointContainer.currentPointLine && this.pointContainer.currentPointLine.isFinishStroke) {
      return
    }
    let tempLineArr = this.pointContainer.points.filter((line) => {
      if (!this.pointContainer) {
        return false
      }
      if (line.isTouchMoved && !line.isFinishStroke) {
        line.endPoint = undefined
      }
      return true
    })
    this.pointContainer.points = tempLineArr
    if (this.pointContainer.currentPointLine){
      this.pointContainer.currentPointLine.endPoint = undefined
    }
  }

  pointToLineFinish(firstArea: LinkItemArea, secondArea: LinkItemArea, lineColor: string) {
    if (!this.pointContainer) {
      return
    }
    let firstLinePoint = this.transformItemPointWithArea(firstArea)
    let secondLinePoint = this.transformItemPointWithArea(secondArea)
    let existPointToLine: PointToLine = {}

    this.pointContainer.points.forEach((pointToLine) => {
      if (pointToLine.startPoint && pointToLine.endPoint) {
        if ((pointToLine.startPoint.x === firstLinePoint.x && pointToLine.startPoint.y === firstLinePoint.y) || (pointToLine.startPoint.x === secondLinePoint.x && pointToLine.startPoint.y === secondLinePoint.y)) {
          existPointToLine = pointToLine
          return
        }
      }
    })

    if (existPointToLine.endPoint) {
      let pointInFirstArea = this.transformLinePointWithItemArea(existPointToLine.endPoint, firstArea)
      let pointInSecondArea = this.transformLinePointWithItemArea(existPointToLine.endPoint, secondArea)
      console.log("======检测结束点",pointInFirstArea,pointInSecondArea, existPointToLine, firstArea, secondArea)
      if (pointInFirstArea) {
        existPointToLine.endPoint = firstLinePoint
      } else if (pointInSecondArea) {
        existPointToLine.endPoint = secondLinePoint
      }
    }

    if (existPointToLine.startPoint) {
      let pointInFirstArea = this.transformLinePointWithItemArea(existPointToLine.startPoint, firstArea)
      let pointInSecondArea = this.transformLinePointWithItemArea(existPointToLine.startPoint, secondArea)
      console.log("======检测开始点",pointInFirstArea,pointInSecondArea, existPointToLine, firstArea, secondArea)
      if (pointInFirstArea) {
        existPointToLine.startPoint = firstLinePoint
      } else if (pointInSecondArea) {
        existPointToLine.startPoint = secondLinePoint
      }
    }
    existPointToLine.isFinishStroke = true
    existPointToLine.lineColor = lineColor
    let resultPointToLines = this.pointContainer.points.filter((pointLine) => {
      if (!existPointToLine.startPoint || !existPointToLine.endPoint) {
        return true
      }
      if (pointLine === existPointToLine) {
        return true
      }
      if (pointLine.startPoint) {
        if (pointLine.startPoint.x === existPointToLine.startPoint.x && pointLine.startPoint.y === existPointToLine.startPoint.y) {
          return false
        }
        if (pointLine.startPoint.x === existPointToLine.endPoint.x && pointLine.startPoint.y === existPointToLine.endPoint.y) {
          return false
        }
      }

      if (pointLine.endPoint) {
        if (pointLine.endPoint.x === existPointToLine.startPoint.x && pointLine.endPoint.y === existPointToLine.startPoint.y) {
          return false
        }
        if (pointLine.endPoint.x === existPointToLine.endPoint.x && pointLine.endPoint.y === existPointToLine.endPoint.y) {
          return false
        }
      }
      return true
    })
    this.pointContainer.points = resultPointToLines
    this.pointContainer.currentPointLine = undefined
  }

  transformLinePointWithItemArea(point: Point, itemArea: LinkItemArea): Point | undefined {
    if (point.x >= itemArea.left && point.x <= itemArea.right && point.y >= itemArea.top && point.y <= itemArea.bottom) {
      if (point.x > this.canvasW * 0.5) {
        return {
          x: itemArea.left,
          y: itemArea.top + (itemArea.bottom - itemArea.top) * 0.5
        }
      }
      return {
        x: itemArea.right,
        y: itemArea.top + (itemArea.bottom - itemArea.top) * 0.5
      }
    }
    return undefined
  }

  transformItemPointWithArea(itemArea: LinkItemArea): Point {
    if (itemArea.left > this.canvasW * 0.5) {
      return {
        x: itemArea.left,
        y: itemArea.top + (itemArea.bottom - itemArea.top) * 0.5
      }
    }
    return {
      x: itemArea.right,
      y: itemArea.top + (itemArea.bottom - itemArea.top) * 0.5
    }
  }


cleanAllLine() {
   if (!this.pointContainer){
     return
   }
   this.pointContainer.points = []
   this.pointContainer.currentPointLine = undefined
}
}

export {
  CanvasDraw
}
