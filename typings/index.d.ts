/// <reference path="./types/index.d.ts" />

interface LinkItemArea {
  bottom: number,
  top: number,
  left: number,
  right: number
}

interface IAppOption {
  globalData: {
    area: Array<Array<LinkItemArea>>
  }
}