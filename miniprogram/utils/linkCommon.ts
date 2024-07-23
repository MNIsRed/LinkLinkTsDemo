import { CanvasDraw } from "../canvas/canvasDraw";
import {Coordinate} from "../utils/util"

export interface LinkResult {
  wordIndex: number,
  meaningIndex: number
  correct: Boolean
}

export interface LinkAreaCoordinate{
  from:Coordinate|null,
  end:Coordinate|null
}

export interface WordBean {
  word: string,
  meaning: string,
  // id:number
}

export enum Status {
  UNSELECT = "unselect",
  ONSELECT = "onSelect",
  SELECTED = "selected",
  CORRECT = "correct",
  WRONG = "wrong"
}

export interface WordDataInterface {
  words: Array<WordBean>,
  page:number,
  barHeight:number,
  completeShow:boolean,
  tipTempPath:string,
  progressInfo: ProgressInfo,
  canvasTopMargin:number,
  canvasTool: CanvasDraw,
  canvasW: number,
  canvasH: number,
  dialogWidth:number,
  answerMode:boolean
}

// export interface LinkItemArea {
//   bottom: number,
//   top: number,
//   left: number,
//   right: number
// }

export function status2Color(status: Status) {
  switch (status) {
    case Status.UNSELECT:
      return '#FFFFFF00';
      break;
    case Status.ONSELECT:
      return '#FCC434';
      break;
    case Status.SELECTED:
      return '#37C23E';
      break;
    case Status.CORRECT:
      return '#37C23E';
      break;
    case Status.WRONG:
      return '#F76C53';
      break;
  }
}


