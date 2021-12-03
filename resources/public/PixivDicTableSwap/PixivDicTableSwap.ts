namespace PixivDicTableSwap {
  //Pixiv大百科内のテーブルの奇数偶数を入れ替えます
  // 上キャプション下画像になっていて見づらいときに使う
  // 関係ないテーブルが巻き込まれてるなーってときはスクリプトをオフにして対応
  window.onload = () => {
    console.log('PixivDicTableSwap2')
    tableSwap()
  }
  function tableSwap() {
    var tables = document.querySelectorAll('table')
    Array.from(tables).forEach((table) => {
      const tableRow = table.querySelectorAll('tr')
      const rowArr = Array.from(tableRow)
      const tobj = $(tableRow[0])
      if (tobj.has('td > ul').get().length > 0) {
        /*
          tbody > tr >tdの中に ulとdivでまとまってるパターン
          交互に色付するだけ
          上下入れ替えは面倒そうなのでやめた
         */
        rowArr.forEach((currentRow, index) => {
          const cols = currentRow.querySelectorAll('td')
          if (index % 2) {
            currentRow.style.backgroundColor = ''
          } else {
            currentRow.style.backgroundColor = '#f0f8ff'
          }
        })
      } else {
        /*
          tbody trの各列がキャラ名・画像の交互になってるパターン
          一応、列数が交互のパターンは飛ばす(明らかに関係ないテーブルを巻き込まない)
          交互に色付けする(2列で1まとまりなので2列ごと)
          各行を入れ替える
        */
        if (tableRow.length % 2 === 1) return
        rowArr.forEach((currentRow, index) => {
          //テーブルを交互に色分けする
          let isOdd = false
          switch (index % 4) {
            case 0:
              isOdd = true
              break
            case 1:
              isOdd = true
              break
            case 2:
              isOdd = false
              break
            case 3:
              isOdd = false
              break
            default:
              break
          }
          if (isOdd) {
            currentRow.style.backgroundColor = ''
          } else {
            currentRow.style.backgroundColor = '#f0f8ff'
          }
        })
        for (let index = 0; index < rowArr.length; index = index + 2) {
          const temp = rowArr[index].innerHTML
          rowArr[index].innerHTML = rowArr[index + 1].innerHTML
          rowArr[index + 1].innerHTML = temp
        }
      }
    })
  }
  //大雑把版
  const tableSwapx = () => {
    var tables = document.getElementsByTagName('table')
    for (var i = 0; i < tables.length; i++) {
      var contents = tables[i].getElementsByTagName('tr')
      for (var j = 0; j < contents.length; j = j + 2) {
        const temp = contents[j].innerHTML
        contents[j].innerHTML = contents[j + 1].innerHTML
        contents[j + 1].innerHTML = temp
      }
      for (var j = 0; j < contents.length; j++) {
        //テーブルを交互に色分けする
        //声優の担当キャラテーブルは2列1組になってるため 0,1行 2,3行....と分ける
        let isOdd = false
        switch (j % 4) {
          case 0:
            isOdd = true
            break
          case 1:
            isOdd = true
            break
          case 2:
            isOdd = false
            break
          case 3:
            isOdd = false
            break
          default:
            break
        }
        if (isOdd) {
          contents[j].style.backgroundColor = ''
        } else {
          contents[j].style.backgroundColor = '#e0ffff'
        }
      }
    }
  }
}
