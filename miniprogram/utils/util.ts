import { WordBean } from "./linkCommon";

//二维数组被作为坐标系，第一级的数组的下表是 row，作为主轴
export type Coordinate = {
  row: number;
  col: number;
};

export function findTarget2DIndices<T>(matrix: T[][], target: T): Coordinate | null {
  // 函数实现
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] === target) {
        return { row, col }; // 返回 Coordinate 类型
      }
    }
  }
  return null
}

export function find2DIndices<T>(matrix: T[][], predicate: (args0: T) => Boolean): Coordinate | null {
  // 函数实现
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (predicate(matrix[row][col])) {
        return { row, col }; // 返回 Coordinate 类型
      }
    }
  }
  return null
}

export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // 随机选取一个小于i的索引
    [array[i], array[j]] = [array[j], array[i]]; // 交换元素
  }
  return array;
}

export function save2ErrorBook(errors: WordBean[]) {
  // 存到错题本
  wx.getStorage({
    key: "error_book",
    success(res) {
      try {
        // 之前有旧数据
        let oldWords = JSON.parse(res.data) as WordBean[]
        console.log("获取旧错题本成功")
        console.log(oldWords)
        errors = errors.concat(oldWords)
      } finally {
        let noRepeatErrors = removeArrayRepeatItem(errors)
        wx.setStorage({
          key: "error_book",
          data: JSON.stringify(noRepeatErrors),
          success() {
            console.log("保存新的错题本成功")
            console.log(noRepeatErrors)
          }
        });
      }
    },
    fail(e) {
      if (e.errMsg == "getStorage:fail data not found") {
        wx.setStorage({
          key: "error_book",
          data: JSON.stringify(removeArrayRepeatItem(errors)),
          success() {
            console.log("保存新的错题本成功")
            console.log(errors)
          }
        });
      }
    }
  });
}
function removeArrayRepeatItem(array:WordBean[]):WordBean[]{
  let newArray = new Array()
  let map = new Map()
  array.forEach((item)=>{
    if(!map.has(item.word)){
      map.set(item.word,true)
      newArray.push(item) 
    }
  })
  return newArray
}

const windowWidth = wx.getSystemInfoSync().windowWidth;
const pixelRatio = wx.getSystemInfoSync().pixelRatio;

export function convertToPx(rpx:number) {
  return rpx * (windowWidth / 750);
}

export function convertToRpx(px:number) {
  return px / (windowWidth / 750);
}