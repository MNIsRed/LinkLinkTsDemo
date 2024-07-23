// interface LinkItemArea {
//   bottom: number,
//   top: number,
//   left: number,
//   right: number
// }

interface Point {
  x: number,
  y: number
}

interface PointToLine {
  startPoint?: Point,
  endPoint?: Point,
  isFinishStroke?: boolean,
  lineColor?: string,
  isTouchMoved?: boolean,
}

interface PointContainer {
  points: PointToLine[],
  currentPointLine?: PointToLine
}