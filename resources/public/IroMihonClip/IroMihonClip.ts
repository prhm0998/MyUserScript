namespace IroMihonClip {
  //色見本のカラー一覧にclipボタンを設置します
  let style
  // @ts-ignore
  GM_addStyle(GM_getResourceText('IMPORTED_CSS'))

  window.onload = () => {
    console.log('色見本クリップ.js')
    search()
  }
  const search = () => {
    const table = document.querySelector('.colortable')
    const elm: Element[] = contains(table, 'td', /#.{6}/)
    elm.forEach((element) => {
      add_button(element)
    })
  }

  //https://www.it-swarm.jp.net/ja/javascript/javascript-queryselector-find-ltdivgt-by-innertext/824825545/
  const contains = (targetElm: Element, selector: string, regexp: RegExp) => {
    var elements = targetElm.querySelectorAll<Element>(selector)
    return Array.prototype.filter.call(elements, function (element) {
      return RegExp(regexp).test(element.textContent) as boolean
    })
  }
  const add_button = (element: Element) => {
    const newDiv = document.createElement('span') //<span>だとだいたい真横に追加、縦方向のサイズが変わりづらい
    newDiv.className = 'buttonGroup'
    //
    const button1 = document.createElement('button')
    const match = element.textContent.match(/#(.{6})/)
    button1.textContent = '#'
    button1.className = 'setClipboard'
    button1.onclick = function () {
      GM.setClipboard(match[0])
    }
    newDiv.appendChild(button1)
    //
    const button2 = document.createElement('button')
    button2.textContent = 'clip'
    button2.className = 'setClipboard'
    button2.onclick = function () {
      GM.setClipboard(match[1])
    }
    newDiv.appendChild(button2)

    element.appendChild(newDiv)
  }
  //---------------------------------
  // alternative default GM_addStyle
  //---------------------------------
  function GM_addStyle(css) {
    if (!style) {
      var head = document.querySelector('head')
      if (!head) {
        return
      }
      style = document.createElement('style')
      style.type = 'text/css'
      head.appendChild(style)
    }
    style.appendChild(document.createTextNode(css))
  }
}
