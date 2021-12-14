/**
  //Pixivに簡易的なNG機能を追加します
  //仕組み上、作品内コメント欄については動作したりしなかったりします
  */
namespace PixivNG {
  class GlobalVariable {
    readonly LOCALNGIDFILE = 'LocalNgIdList'
    /**
     * SERACHCONTENTCOUNT
     * n個以上の子要素を持つエレメントをNG判定対象にします<br>
     * NG判定は画面スクロール時に行っているので、少ないと重くなる可能性大<br>
     *    =8 1ページは埋まるような検索しかしない場合、これで十分<br>
     * =4 確認した範囲では不具合が出ない最小の値<br>
     * =3 検索結果のトップタブ内がまるごと非表示になる不具合が発生するが、作品別のコメント欄を開いてない状態(3つのコメント)に対してもNG判定をするようになる。大体問題ない。<br>
     * =2 これ以下にすると閲覧に支障が出るため不可<br>
     */
    readonly SEARCHCONTENTCOUNT = 3
    lastScroll = -1
    ngIdHash: Map<string, User>
    constructor() {
      this.ngIdHash = new Map<string, User>()
    }
  }
  class User {
    id: string
    submitDate: string
    lastFind: string
    constructor(id: string, submitDate: string, lastFind: string) {
      this.id = id
      this.submitDate = submitDate
      this.lastFind = lastFind
    }
  }
  const GV = new GlobalVariable()
  const getFormatDate = (date = new Date()) => {
    const y = date.getFullYear()
    const m = ('00' + (date.getMonth() + 1)).slice(-2)
    const d = ('00' + date.getDate()).slice(-2)
    return y + '-' + m + '-' + d
  }
  const getFormatDateF = (date = new Date()) => {
    const y = date.getFullYear()
    const m = ('00' + (date.getMonth() + 1)).slice(-2)
    const d = ('00' + date.getDate()).slice(-2)
    const hh = ('00' + date.getHours()).slice(-2)
    const mm = ('00' + date.getMinutes()).slice(-2)
    const ss = ('00' + date.getSeconds()).slice(-2)
    return y + '-' + m + '-' + d + ' ' + hh + ':' + mm + ':' + ss
  }

  //pixiv用のuserscriptはwindow.loadだと不発になったりする
  let style
  ;(() => {
    console.log('load PixivNG.js,:' + getFormatDateF())
    // @ts-ignore
    GM_addStyle(GM_getResourceText('IMPORTED_CSS'))
    createSettingArea()
    loadLocalNgIdList()
    window.setTimeout(function () {
      setDisplayList()
    }, 350)
  })()

  window.addEventListener('scroll', () => {
    //画面スクロールで何度でもチェックする
    const st = window.pageYOffset || document.documentElement.scrollTop
    if (
      st < GV.lastScroll - 90 ||
      st > GV.lastScroll + 90 ||
      GV.lastScroll === -1
    ) {
      GV.lastScroll = st <= 0 ? 0 : st
      search_Contents()
    }
  })

  // prettier-ignore
  const search_Contents = (target = document.querySelector<HTMLElement>('div#root')) => {
    //渡された要素の子要素をすべて調べる
    Array.from(target.children)
      .filter((m) => m.children.length > 0)
      .forEach((child: HTMLElement) => {
        //孫要素を再帰的に調べていく
        search_Contents(child)
        //指定数以上の孫要素を持つ場合、ユーザーIDを持つ要素の連なりかどうかを判定しつつNG処理
        if (child.children.length >= GV.SEARCHCONTENTCOUNT) {
          overWrite_ContentsField(child)
        }
      })
  }

  /**
   * 指定エレメントのNG判定
   */
  const overWrite_ContentsField = (contents: HTMLElement) => {
    const hasUserElements = Array.from(contents.children)
      .filter((element) => hasUserElm(element))
      .map((element: HTMLElement) => {
        return {
          id: getUserId(element),
          elm: element,
        }
      })
    function hasUserElm(target: Element): any {
      return getUserId(target) || false
    }
    function getUserId(target: Element): string | undefined {
      const temp = target.querySelector(
        '[href ^= "/users/"], [href ^= "/en/users/"]'
      ) //英語だけ? /enがつく

      if (temp === null) {
        return undefined
      } else {
        const tempId = temp
          .getAttribute('href')
          .replace(/^\/en/, '')
          .replace(/^\/users\//, '')
        // userid/illustrations/... 等の余計なものがついている場合、IDではない
        const containsNonNumeric = /[^0-9]+/.test(tempId)
        return containsNonNumeric ? undefined : tempId
      }
    }
    //極少数のidしか含まない場合はNG判定を避ける(アーティスト個別の作品リストにNGボタンがずらっと並ぶのを回避)
    const idList = new Set(hasUserElements.map((o) => o.id))
    if (idList.size <= 2) {
      return
    }

    //NGチェックとNGボタン設置
    hasUserElements.forEach((cur) => {
      //------------------------------------------------------
      // NG USER CHECK
      //------------------------------------------------------
      const isGuilty = GV.ngIdHash.has(cur.id)
      if (isGuilty) {
        cur.elm.style.display = 'none'
        ban_UpDate(cur.id)
      } else {
        cur.elm.style.display = 'inline'
      }
      //------------------------------------------------------
      // ADD NG BUTTON
      //------------------------------------------------------
      //ボタンが作成されているかどうかは毎回チェックする
      if (cur.elm.querySelector('.ngButton') === null) {
        const ngButton = document.createElement('button') as HTMLButtonElement
        ngButton.id = cur.id
        ngButton.title = cur.id
        ngButton.className = 'ngButton'
        ngButton.innerHTML = 'NG'
        ngButton.onclick = function (e) {
          const curButton = e.target as HTMLButtonElement
          const selectedId = curButton.id
          ban_ID(selectedId)
        }
        cur.elm.appendChild(ngButton)
      }
    })
  }
  //------------------------------------------------------
  // BAN登録・解除
  //------------------------------------------------------
  function ban_ID(target: string) {
    if (GV.ngIdHash.has(target)) {
      return
    }
    GV.ngIdHash.set(target, new User(target, getFormatDate(), getFormatDate()))
    setDisplayList()
    saveLocalNgIdList()
    search_Contents()
  }
  function ban_UpDate(target: string) {
    if (!GV.ngIdHash.has(target)) {
      return
    }
    const currentUser = GV.ngIdHash.get(target)
    currentUser.lastFind = getFormatDate()
    setDisplayList()
  }
  //未使用 非表示にしちゃったので呼び出す方法がない
  //const unBan_ID = (target) => {
  //  GV.ngIdHash.delete(target)
  //  saveLocalNgIdList()
  //  search_Contents()
  //  setDisplayList() //NGID更新
  //}

  function createSettingArea() {
    const newElm = textToElm(`
    <div class="setting-area">
      <div class="tab-wrap">
        <input id="TAB-01" type="radio" name="TAB" class="tab-switch" /><label class="tab-label" id="TAB-01" for="TAB-01">ID</label>
        <div class="tab-content">
          <textarea id="textArea1">..loading</textarea>
        </div>
        <input id="Minimize" type="radio" name="TAB" class="tab-switch" checked="checked" /><label class="tab-label" for="Minimize">minimize</label>
        <div class="tab-content">
        </div>
      </div>
    </div>
    `)

    const settingArea = newElm.querySelector<HTMLTextAreaElement>('#textArea1')
    if (settingArea) {
      settingArea.addEventListener('focusout', () => {
        updateNgIdHash(settingArea)
      })
    }

    //作成した要素をページに追加
    const mainContainer = document.getElementById('root')
    mainContainer.insertBefore(newElm, mainContainer.firstChild)
    function textToElm(text) {
      const blankElm = document.createElement('div')
      blankElm.innerHTML = text
      return blankElm.querySelector(':scope :first-child')
    }
  }

  function setDisplayList() {
    const textArea1 = document.querySelector<HTMLTextAreaElement>('#textArea1')
    textArea1.value = ''
    textArea1.value =
      '\n' +
      [...GV.ngIdHash.values()]
        .map((cur) => cur.id)
        .reverse()
        .join('\n')
    const idTab = document.querySelector('label#TAB-01')
    idTab.innerHTML = 'ID( ' + GV.ngIdHash.size + ' )'
  }

  function updateNgIdHash(settingArea: HTMLTextAreaElement) {
    //textfield to array
    const ngIdArray = settingArea.value
      .split(/\r\n|\r|\n/)
      .filter((n) => n != '')
      .reverse()
    //入力欄のIDを元に新たなmapを作る
    const newMap = new Map<string, User>()
    ngIdArray.forEach((element) => {
      if (GV.ngIdHash.has(element)) {
        const alreadryUser = GV.ngIdHash.get(element)
        newMap.set(alreadryUser.id, alreadryUser)
      } else {
        //手動でID入力あり
        newMap.set(element, new User(element, getFormatDate(), getFormatDate()))
      }
    })
    GV.ngIdHash = newMap
    setDisplayList()
    saveLocalNgIdList()
  }
  //---------------------------------
  // (greaseMonkey localStorage) Read/Write
  //---------------------------------
  async function loadLocalNgIdList() {
    const jsonString = await GM.getValue(GV.LOCALNGIDFILE, undefined)
    if (jsonString === undefined) {
      return
    }
    GV.ngIdHash.clear()
    //一度key,objectのmapにする
    const tempMap = new Map(JSON.parse(jsonString))
    //改めてkey, classのmapにする, 一発でやりたい場合はJSON.parse時になんか色々するみたい JSON.parse(jsonString, (key, value) => {console.log(key,value)})
    //for ([key,val:User] of tempMap.entries()) {
    for (const entry of Array.from(tempMap.entries())) {
      const key = entry[0] as string
      const val = entry[1] as User
      GV.ngIdHash.set(key, new User(val.id, val.submitDate, val.lastFind))
    }
  }
  function saveLocalNgIdList() {
    //hashMapのJSON化
    //https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
    const jsonString = JSON.stringify([...GV.ngIdHash])
    GM.setValue(GV.LOCALNGIDFILE, jsonString)
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
