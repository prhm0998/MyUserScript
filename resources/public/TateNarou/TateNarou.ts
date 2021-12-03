// option /////////////
let style
GM_addStyle(GM_getResourceText('IMPORTED_CSS'))
class GlobalVariables {
  reverse: boolean = false //方向反転
  amount: number = 200 //スクロール量 矢印キーの移動が200ぐらいだったので合わせた
  wide: boolean = true //本文エリアの高さをウィンドウサイズまで広げる
  height: number = 100 //高さ(vh)
  latinToZen: boolean = true //本文中の半角英字を全角英字に変換する
  scrollOnLoad: boolean = true //画面読み込み時、本文に位置を合わせる
}
let GV = new GlobalVariables()
window.addEventListener('load', async () => {
  await loadLocalOption()
  addExtraOptionArea()
  const honbun = document.querySelector<HTMLElement>('#novel_honbun')
  //ページ読み込み時に本文の位置へ移動する
  if (GV.scrollOnLoad)
    honbun.scrollIntoView({ inline: 'start', behavior: 'smooth' })
  //ページ読み込み時のみ 本文の表示領域(高さ)を変更する
  if (GV.wide) honbun.style.height = GV.height + 'vh'
  //ページ読み込み時のみ 半角英字を全角にする
  if (GV.latinToZen) latinToZen(honbun)
  //
  honbun.addEventListener('wheel', horizonScroll)
  honbun.addEventListener('dblclick', doubleClick)
})

function addExtraOptionArea() {
  const nav = document.querySelector<HTMLElement>('.novelview_navi')
  //nav.style.display = 'block' //テスト用 リロード直後にオプションを表示する

  //追加のオプション
  const extraOptions = textToElm(`
  <div class="exOption">
    <br>
    <div> ▼拡張オプション
    </div>
    <label>
      <input type="checkbox" name="wheelReverse">
       ホイール方向を反転する
    </label>
    <label>
      <input type="checkbox" name="fixedOnLoad">
      (*)本文に位置を合わせる
    </label>
    <label>
      <input type="checkbox" name="honbunHeight">
      (*)本文エリアの高さを変更
    </label>
    <label>
      <input type="checkbox" name="latinToZen">
      (*)全角英字に変換する
    </label>
    </div>
  </div>
  `)
  nav.appendChild(extraOptions)
  //もともとある閉じるボタンを一番最後に持ってくる
  const closeButton = document.querySelector('#menu_off_2')
  nav.appendChild(closeButton)

  //ボタンイベントのセット
  const wheelReverse = getInputElm('wheelReverse')
  const fixedOnLoad = getInputElm('fixedOnLoad')
  const honbunHeight = getInputElm('honbunHeight')
  const latinToZen = getInputElm('latinToZen')
  wheelReverse.addEventListener('change', (e) => {
    GV.reverse = e.target.checked
    saveLocalOption()
  })
  fixedOnLoad.addEventListener('change', (e) => {
    GV.scrollOnLoad = e.target.checked
    saveLocalOption()
  })
  honbunHeight.addEventListener('change', (e) => {
    GV.wide = e.target.checked
    saveLocalOption()
  })
  latinToZen.addEventListener('change', (e) => {
    GV.latinToZen = e.target.checked
    saveLocalOption()
  })

  //表示変更
  wheelReverse.checked = GV.reverse
  fixedOnLoad.checked = GV.scrollOnLoad
  honbunHeight.checked = GV.wide
  latinToZen.checked = GV.latinToZen

  function getInputElm(name: string) {
    return document.querySelector<HTMLInputElement>(`[name=${name}]`)
  }
}

/**
 * 半角英字を全角にする
 * どんなelementにも対応できているわけではなさそうなのでコピペ注意
 */
function latinToZen(element: HTMLElement) {
  if (element.childNodes.length) {
    element.childNodes.forEach((child: HTMLElement) => latinToZen(child))
  } else {
    element.textContent = replaceText(element.textContent)
    function replaceText(text: string) {
      return text.replace(/[A-Za-z]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) + 65248) //アルファベットの半角を全角へ変換
      })
    }
  }
}

function horizonScroll(this: HTMLElement, e: WheelEvent) {
  const movelr = e.deltaY > 0 ? -1 : 1 //ホイールの入力方向を判定
  const speed: number = GV.reverse ? GV.amount : -GV.amount
  const moving = this.scrollLeft - speed * movelr
  this.scrollTo({ left: moving, behavior: 'smooth' })
  e.preventDefault() //本来のホイール入力を無効にする
}

function doubleClick(this: HTMLElement, e) {
  //fixed menubar // "上部メニューを固定" に対応する場合はこのへんが使えるかも ※未実装
  //const opt = document.querySelector<HTMLInputElement>('[name=fix_menu_bar]')
  //console.log(opt.checked)

  this.scrollIntoView({ inline: 'start', behavior: 'smooth' }) //縦書きエリアなので、inline:で制御
  e.preventDefault()
}

// 普段使っているtextToElmと違うので注意しよう
function textToElm(text) {
  const blankElm = document.createElement('div')
  blankElm.innerHTML = text
  return blankElm.querySelector(':scope :first-child')
}

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

//---------------------------------
// (greaseMonkey localStorage) Read/Write
//---------------------------------
async function loadLocalOption() {
  const jsonString = await GM.getValue('LOCALOPTION', undefined)
  if (jsonString === undefined) return
  GV = JSON.parse(jsonString)
}
function saveLocalOption() {
  const jsonString = JSON.stringify(GV)
  GM.setValue('LOCALOPTION', jsonString)
}