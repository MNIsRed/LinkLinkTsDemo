// component/linkItem/linkItem.ts
import { WordBean, Status, status2Color, LinkAreaCoordinate, LinkResult } from '../../utils/linkCommon';
import { shuffleArray, Coordinate, save2ErrorBook } from '../../utils/util'




Component({

  /**
   * 组件的属性列表
   */
  properties: {
    // type字段被正确地设置为Array，并且value字段提供了一个空的WordBean[]数组作为默认值。TypeScript将会推断出wordsList属性的类型为WordBean[]，并且你可以在组件的使用中安全地使用这个类型
    dataList: { type: Array, value: [] as WordBean[] }
  },

  /**
   * 组件的初始数据
   */
  data: {
    status: [[
      Status.UNSELECT, Status.UNSELECT, Status.UNSELECT],
    [
      Status.UNSELECT, Status.UNSELECT, Status.UNSELECT]
    ],
    linkedData: new Map<String, String>(),
    linkedResult: [] as LinkResult[],
    wordList: [] as string[],
    meaningList: [] as string[],
    wordRandomList: [0, 1, 2],
    meaningRandomList: [0, 1, 2]
  },
  /**
   * 组件的方法列表
   */
  methods: {
    startSelect(index: number, position: number): LinkAreaCoordinate {
      var oldSelectedAreaIndex = -1;
      var oldSelectedPosition = -1;
      this.data.status.forEach((areaStatus, areaIndex) => {
        areaStatus.forEach((status, index) => {
          if (status == Status.ONSELECT) {
            oldSelectedAreaIndex = areaIndex;
            oldSelectedPosition = index;
          }
        })
      })
      if (oldSelectedAreaIndex == -1) {
        //未在选择中
        this.checkItemLinked(index, position);

        this.setData({
          [`status[${index}][${position}]`]: Status.ONSELECT
        })
        return {
          from: {
            row: index,
            col: position
          },
          end: null
        }
      } else if (oldSelectedAreaIndex != index) {
        //选择中，划到了另一侧数据
        this.checkItemLinked(index, position);

        let newLinkedMap = new Map([...this.data.linkedData])
        let newLinkedResult = this.data.linkedResult.slice()

        let setResultFunction = (wordIndex: number, meaningIndex: number) => {
          newLinkedMap.set(this.data.wordList[wordIndex], this.data.meaningList[meaningIndex]);
          newLinkedResult.push({
            wordIndex: wordIndex,
            meaningIndex: meaningIndex,
            correct: this.data.wordRandomList[wordIndex] == this.data.meaningRandomList[meaningIndex]
          })
        }
        //保存连接数据
        if (index == 0) {
          setResultFunction(position, oldSelectedPosition);
        } else {
          setResultFunction(oldSelectedPosition, position);
        }
        if (newLinkedMap.size >= this.data.wordList.length) {
          //已经连接完成
          let newStatus = this.data.status.slice()
          let wrongWords = [] as WordBean[]
          newLinkedResult.forEach((item) => {
            if (!item.correct) {
              // 真实数据对应真实顺序
              let realIndex = this.data.wordRandomList[item.wordIndex]
              wrongWords.push({
                word: this.data.dataList[realIndex].word,
                meaning: this.data.dataList[realIndex].meaning
              } as WordBean)
            }
            newStatus[0][item.wordIndex] = item.correct ? Status.CORRECT : Status.WRONG
            newStatus[1][item.meaningIndex] = item.correct ? Status.CORRECT : Status.WRONG
          });
          if (wrongWords.length > 0) {
            save2ErrorBook(wrongWords)
          }

          this.setData({
            status: newStatus,
            linkedData: newLinkedMap,
            linkedResult: newLinkedResult
          })
        } else {
          this.setData({
            [`status[${oldSelectedAreaIndex}][${oldSelectedPosition}]`]: Status.SELECTED,
            [`status[${index}][${position}]`]: Status.SELECTED,
            linkedData: newLinkedMap,
            linkedResult: newLinkedResult
          })
        }
        return {
          from: {
            row: oldSelectedAreaIndex,
            col: oldSelectedPosition
          },
          end: {
            row: index,
            col: position
          }
        };
      } else {
        //虽然在选择中，但是选择了同侧数据？异常状况
      }
      return {
        from: null,
        end: null
      };
    },
    cancelLink() {
      this.data.status.forEach((areaStatus, areaIndex) => {
        areaStatus.forEach((status, index) => {
          if (status == Status.ONSELECT) {
            this.setData({
              [`status[${areaIndex}][${index}]`]: Status.UNSELECT
            })
          }
        })
      })
    },
    checkItemLinked(index: number, position: number) {
      //检查当前数据是否已经连接，如果已经连接，需要去除之前的连接状态
      if (index == 0) {
        const oldWord = this.data.wordList[position]
        const oldMeaning = this.data.linkedData.get(oldWord)
        if (oldMeaning) {
          var oldMeaningIndex = -1;
          var resultIndex = -1;
          this.data.linkedResult.forEach((item, i) => {
            if (item.wordIndex == position) {
              oldMeaningIndex = item.meaningIndex;
              resultIndex = i;
            }
          });

          if (oldMeaningIndex != -1) {
            // oldMeaning存在，那大概率是不为-1，两个 status 都改变
            if (resultIndex != -1) {
              this.data.linkedResult.splice(resultIndex, 1)
            }
            console.log("aaaaa")
            this.setData({
              [`status[${0}][${position}]`]: Status.UNSELECT,
              [`status[${1}][${oldMeaningIndex}]`]: Status.UNSELECT
            })
            let newLinkedMap = new Map([...this.data.linkedData])
            newLinkedMap.delete(oldWord)
            this.setData({
              linkedData: newLinkedMap
            })
          } else {
            //容错处理，
            console.log("bbbbb")
            this.setData({
              [`status[${0}][${position}]`]: Status.UNSELECT,
            })
          }
        }
      } else {
        const oldMeaning = this.data.meaningList[position]
        var oldWord: String | null = null
        for (const [key, val] of this.data.linkedData.entries()) {
          if (val === oldMeaning) {
            oldWord = key;
            break;
          }
        }
        if (oldWord) {
          var oldWordIndex = -1;
          var resultIndex = -1;
          this.data.linkedResult.forEach((item, i) => {
            if (item.meaningIndex == position) {
              oldWordIndex = item.wordIndex;
              resultIndex = i;
            }
          });
          if (oldWordIndex != -1) {
            // oldMeaning存在，那大概率是不为-1，两个 status 都改变
            let newLinkedMap = new Map([...this.data.linkedData])
            newLinkedMap.delete(oldWord)
            if (resultIndex != -1) {
              this.data.linkedResult.splice(resultIndex, 1)
            }
            this.setData({
              [`status[${1}][${position}]`]: Status.UNSELECT,
              [`status[${0}][${oldWordIndex}]`]: Status.UNSELECT,
              linkedData: newLinkedMap
            })
          } else {
            //容错处理，
            this.setData({
              [`status[${1}][${position}]`]: Status.UNSELECT,
            })
          }
        }
      }
    },
    checkLinkFinished(): boolean {
      return this.data.linkedResult.length >= this.data.dataList.length;
    },
    getLinkedResult(): LinkResult[] {
      return this.data.linkedResult
    }
  },
  lifetimes: {
    ready: function () {

    }
  },
  observers: {
    'dataList': function (dataList) {
      let newStatus: Status[][] = Array.from({ length: 2 }, () =>
        Array(dataList.length).fill(Status.UNSELECT)
      );

      let newLinkedResult = new Array<LinkResult>();

      let newWordRandomList = shuffleArray(Array.from({ length: dataList.length }, (v, k) =>
        k
      ));
      let newMeaningRandomList = shuffleArray(Array.from({ length: dataList.length }, (v, k) =>
        k
      ));
      var newMeaningList = new Array<string>()
      newMeaningRandomList.forEach((item) => {
        newMeaningList.push(this.data.dataList[item].meaning)
      });

      let newWordList = new Array<string>()
      newWordRandomList.forEach((item) => {
        newWordList.push(this.data.dataList[item].word)
      });
      this.setData({
        status: newStatus,
        linkedData: new Map<String, String>(),
        linkedResult: newLinkedResult,
        wordRandomList: newWordRandomList,
        meaningRandomList: newMeaningRandomList,
        meaningList: newMeaningList,
        wordList: newWordList
      })
    }
  }
})