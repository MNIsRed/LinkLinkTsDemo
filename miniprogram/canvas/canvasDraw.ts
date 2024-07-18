
class CanvasDraw {
  constructor(canvas: WechatMiniprogram.Canvas, ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D, canvasW: number, canvasH: number) {
    this.canvas = canvas
    this.ctx = ctx
    this.canvasW = canvasW
    this.canvasH = canvasH
    this.loop()
  }
  canvas: WechatMiniprogram.Canvas
  ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D
  canvasW: number
  canvasH: number
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
    // this.ctx.beginPath();
    for (let i = 0; i < this.pointContainer.points.length; i++) {
      this.ctx.beginPath();

      let currentPointLine = this.pointContainer.points[i];
      let currentStartPoint = currentPointLine.startPoint
      let currentEndPoint = currentPointLine.endPoint
      if (currentPointLine.lineColor) {
        this.ctx.strokeStyle = currentPointLine.lineColor; // 设置线条颜色
      }
      if (currentStartPoint) {
        this.ctx.moveTo(currentStartPoint.x, currentStartPoint.y); // 移动到上一个点
        // console.log("ssssssss", currentStartPoint)
      }
      if (currentEndPoint) {
        this.ctx.lineTo(currentEndPoint.x, currentEndPoint.y); // 从上一个点画线到当前点
        // console.log("ssssssss", currentEndPoint)
      }
      this.ctx.lineWidth = 2 // 设置线条宽度
      this.ctx.stroke(); // 进   
    }
    // this.ctx.lineWidth = 2 // 设置线条宽度
    // this.ctx.stroke(); // 进   
  }


  canvasTouchStart(e: WechatMiniprogram.Touch, itemArea: LinkItemArea, lineColor: string) {
    console.log("======", e)
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
    if (!this.pointContainer) {
      let pointLine: PointToLine = {
        startPoint: linePoint,
        lineColor: lineColor
      }
      let pointLines: PointToLine[] = []
      pointLines.push(pointLine)
      console.log(pointLines)
      this.pointContainer = {
        points: pointLines,
        currentPointLine: pointLine
      }
      console.log(this.pointContainer.points)
      console.log(this.pointContainer)
      console.log("---------", pointLine)
      return
    }

    let existPointToLine: PointToLine = {}
    this.pointContainer.points.forEach((pointToLine) => {
      if (pointToLine.startPoint) {
        if (pointToLine.startPoint === linePoint || pointToLine.endPoint === linePoint) {
          existPointToLine = pointToLine
          return
        }
      }
      if (pointToLine.endPoint) {
        if (pointToLine.endPoint === linePoint) {
          existPointToLine = pointToLine
        }
      }
    })
    console.log(1111)
    if (!existPointToLine.startPoint) {
      console.log(2222)
      let pointLine: PointToLine = {
        startPoint: linePoint,
        lineColor: lineColor
      }
      this.pointContainer.points.push(pointLine)
      this.pointContainer.currentPointLine = pointLine
      return
    }
    let tempPointLineArr = this.pointContainer.points.filter((value) => {
      return value !== existPointToLine
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
    const x = e.touches[0].clientX
    const y = e.touches[0].clientY
    if (!this.pointContainer) {
      return
    }
    this.pointContainer.currentPointLine.endPoint = {
      x: x,
      y: y
    }
  }

  canvasTouchEnd() {
    if (!this.pointContainer) {
      return
    }
    if (this.pointContainer.currentPointLine.isFinishStroke) {
      return
    }
    let tempLineArr = this.pointContainer.points.filter((line) => {
      if (!this.pointContainer) {
        return false
      }
      return line !== this.pointContainer.currentPointLine
    })
    this.pointContainer.points = tempLineArr
  }

  pointToLineFinish(firstArea: LinkItemArea, secondArea: LinkItemArea, lineColor: string) {
    console.log("触发pointToLineFinish")
    console.log(firstArea)
    console.log(secondArea)
    console.log(lineColor)
    if (!this.pointContainer) {
      return
    }
    let firstLinePoint = this.transformItemPointWithArea(firstArea)
    let secondLinePoint = this.transformItemPointWithArea(secondArea)
    console.log("askljdaksjhdkas")
    console.log(firstLinePoint)
    let existPointToLine: PointToLine = {}
    console.log(this.pointContainer)
    this.pointContainer.points.forEach((pointToLine) => {
      if (pointToLine.startPoint && pointToLine.endPoint) {
        if ((pointToLine.startPoint.x === firstLinePoint.x, pointToLine.startPoint.y === firstLinePoint.y) || (pointToLine.startPoint.x === secondLinePoint.x, pointToLine.startPoint.y === secondLinePoint.y)) {
          existPointToLine = pointToLine
          return
        }
      }
    })

    if (existPointToLine.endPoint) {
      let area = this.transformLinePointWithItemArea(existPointToLine.endPoint, firstArea)
      console.log("XXXXX")
      console.log(area)
      if (area) {
        existPointToLine.endPoint = firstLinePoint
      } else {
        existPointToLine.endPoint = secondLinePoint
      }
    }

    if (existPointToLine.startPoint) {
      let area = this.transformLinePointWithItemArea(existPointToLine.startPoint, firstArea)
      console.log("YYYYY")
      console.log(area)
      if (area) {
        existPointToLine.startPoint = firstLinePoint
      } else {
        existPointToLine.startPoint = secondLinePoint
      }
    }

    console.log("XZXXXXXXXXZZZZZZZ")
    console.log(existPointToLine)
    existPointToLine.isFinishStroke = true
    existPointToLine.lineColor = lineColor
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
}

export {
  CanvasDraw
}
