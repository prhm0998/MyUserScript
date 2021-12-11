namespace AnicoBan {
  //AnicoBinに簡易的なNG機能を追加します
  class GlobalVariable {
    readonly LOCALNGIDFILE = 'LocalNgIdList'
    readonly LOCALNGWORDFILE = 'LocalNgWordList'
    readonly LOCALOPTIONFILE = 'LocalOption'
    ngIdHash: Map<string, User>
    ngWordHash: Map<string, Word>
    hideNgComment: boolean = false //trueはNGを非表示, falseは薄く表示
    relatedCommentType: boolean = true //NGに対しての返信を(その記事内で)NGとして扱う
    relatedNGWordType: boolean = true //NGWordに該当したコメントのIDをNGIDに追加する
    commentCapCount: number = 10 //同じ記事内でn件以上コメントした場合(その記事内で)NG
    constructor() {
      this.ngIdHash = new Map<string, User>()
      this.ngWordHash = new Map<string, Word>()
    }
  }

  class User {
    id: string
    submitDate: string
    lastFind: string
    constructor(
      id: string,
      submitDate: string = getFormatDate(),
      lastFind: string = getFormatDate()
    ) {
      this.id = id
      this.submitDate = submitDate
      this.lastFind = lastFind
    }
  }
  class Word {
    word: string
    submitDate: string
    lastFind: string
    constructor(
      word: string,
      submitDate: string = getFormatDate(),
      lastFind: string = getFormatDate()
    ) {
      this.word = word
      this.submitDate = submitDate
      this.lastFind = lastFind
    }
  }
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

  let style
  // @ts-ignore
  GM_addStyle(GM_getResourceText('IMPORTED_CSS'))
  const GV = new GlobalVariable()
  window.addEventListener('load', async () => {
    await loadLocalNgIdList()
    await loadLocalNgWordList()
    await loadLocalOption()
    createSettingArea()
    console.log('load AnicoBan.js, date:' + getFormatDateF(), GV)
    overWrite_ContentsField()
    window.setTimeout(function () {
      setDisplayList()
    }, 350)
  })

  const overWrite_ContentsField = () => {
    const commentList = document.querySelector('#comments-list')
    //コメントを処理しやすいように配列化
    const commentsWork = Array.from(
      commentList.querySelectorAll('ol > li')
    ).map((m, index) => {
      // prettier-ignore
      const authorName = m.querySelector('.comment-author').lastChild.textContent.trim()
      // prettier-ignore
      const authorId = m.querySelector('.comment-id').firstChild.textContent.trim().replace(/ID:/g,'')
      // prettier-ignore
      const commentIndex = parseInt(m.querySelector('.comment-author > .nom').textContent)
      const commentDate = m.querySelector('.comment-date').textContent
      const commentText = m.querySelector('.comment-body').textContent
      /* 
        このコメントが返信しているコメント先のレス番を抜き出す
        ただし、文字引用などで正しくないアンカーが埋め込まれている可能性あり。他レスの全コピペなどがそうなりやすい
        とりあえず対策として未来へのアンカーは弾く、実際に使用する際にはundefinedのチェックをする
       */
      const anchorIndexes = Array.from(
        m.querySelectorAll('.comment-body .anchor')
      )
        .map((a) => {
          return parseInt(a.textContent.replace(/>/, ''))
        })
        .filter((m) => m <= index)

      // このコメントへ返信しているコメントのレス番
      const responseIndexes = Array.from(m.querySelectorAll('ul > .reres')).map(
        (a) => {
          return parseInt(a.textContent.replace(/返信:>>/g, ''))
        }
      )
      //console.log(commentIndex, anchorIndexes, responseIndexes)
      const commentObj = {
        element: m as HTMLElement,
        authorName,
        authorId,
        commentIndex, //表示上のレス番
        commentDate,
        commentText,
        anchorIndexes,
        responseIndexes,
        anchorIds: [],
        idCurrentCount: 0,
        idTotalCount: 0,
        isGuilty: false,
        isBannedId: false,
        isBannedCommentCount: false,
        //isBannedResponses: false,
        isContainsNgWord: false,
      }
      return commentObj
    })
    //書き込み回数、レス先のID、NGID情報を追加する
    const comments = commentsWork.map((m, currentIndex) => {
      // prettier-ignore
      const idTotalCount = commentsWork.filter((n) => n.authorId === m.authorId).length
      // prettier-ignore
      const idCurrentCount = commentsWork
        .slice(0, currentIndex + 1)
        .filter((n) => n.authorId === m.authorId).length
      // prettier-ignore
      const anchorIds = m.anchorIndexes.map( n => commentsWork.find(m => m.commentIndex === n )?.authorId)
      // prettier-ignore
      const containsNgWord = [...GV.ngWordHash.keys()].find((word) => m.commentText.includes(word))
      const isContainsNgWord = containsNgWord !== undefined
      if (isContainsNgWord) {
        update_BanWord(containsNgWord)
        //NGWordに該当した場合、NGIDに登録する
        if (!GV.ngIdHash.has(m.authorId)) ban_ID(m.authorId)
      }
      // prettier-ignore
      const isBannedId = GV.ngIdHash.has(m.authorId)
      const isBannedCommentCount = idTotalCount >= GV.commentCapCount
      if (isBannedId) {
        update_BanId(m.authorId)
      }
      m.idCurrentCount = idCurrentCount
      m.idTotalCount = idTotalCount
      m.isGuilty = isBannedId || isContainsNgWord || isBannedCommentCount
      m.isBannedId = isBannedId
      //m.isBannedResponses = isBannedResponses
      m.isContainsNgWord = isContainsNgWord
      m.isBannedCommentCount = isBannedCommentCount
      return m
    })

    //各コメントに対してHTMLを加工
    comments.forEach((comment, currentIndex) => {
      //このコメントが返信している先がNGならこのコメントもNG扱いにする
      const isBannedResponses = comment.anchorIndexes
        .map((m) => comments.find((n) => n.commentIndex === m)?.isGuilty)
        .some((m) => m === true)

      //書き込み回数を表示する
      if (!comment.element.querySelector('.comment-id-count')) {
        var countElm = document.createElement('span')
        countElm.className = 'comment-id-count'
        // prettier-ignore
        countElm.innerHTML =
          ' ' + comment.idCurrentCount + '/' + comment.idTotalCount + '件 '
      }

      //元からあるID表示部分を消してspanタグで作り直す
      const commentElm = comment.element.querySelector('.comment-id')
      if (!commentElm.querySelector('.author-id')) {
        const commentAnchor = commentElm.querySelector('a')
        commentElm.insertBefore(countElm, commentAnchor)
        commentElm.firstChild.remove()
        const newIdElm = document.createElement('span')
        newIdElm.className = 'author-id'
        newIdElm.innerHTML = comment.authorId
        if (comment.isBannedId) {
          newIdElm.style.color = '#fa8072'
        } else if (isBannedResponses) {
          newIdElm.style.color = '#dda0dd'
        } else if (comment.isContainsNgWord) {
          newIdElm.style.color = '#7b68ee'
        } else {
          newIdElm.style.color = ''
        }
        // prettier-ignore
        newIdElm.title = GV.ngIdHash.has(comment.authorId) ? 'NG解除' : '名前でNG'
        newIdElm.style.cursor = 'pointer'
        // @ts-ignore
        newIdElm.onmouseover = function (e: { target: HTMLDivElement }) {
          e.target.style.textDecoration = 'underline'
        }
        // @ts-ignore
        newIdElm.onmouseleave = function (e: { target: HTMLDivElement }) {
          e.target.style.textDecoration = 'none'
        }
        commentElm.prepend(newIdElm)
        //------------------------------------------------------
        // NGID BUTTON SET
        //------------------------------------------------------
        if (newIdElm.onclick == null) {
          newIdElm.onclick = function (e) {
            const targetElm = e.target as HTMLElement
            const clickedId = targetElm.textContent
            if (GV.ngIdHash.has(clickedId)) {
              unBan_ID(clickedId)
            } else {
              ban_ID(clickedId)
            }
            overWrite_ContentsField()
          }
        }
      } else {
        //既に.author_idが作られている場合はIDの色だけ設定する
        const idElm =
          comment.element.querySelector<HTMLSpanElement>('.author-id')
        if (comment.isBannedId) {
          idElm.style.color = '#fa8072'
        } else if (isBannedResponses) {
          idElm.style.color = '#ffa500'
        } else if (comment.isContainsNgWord) {
          idElm.style.color = '#7b68ee'
        } else {
          idElm.style.color = ''
        }
      }
      //------------------------------------------------------
      // NGコメントの処理
      //------------------------------------------------------
      if (comment.isGuilty || (GV.relatedCommentType && isBannedResponses)) {
        if (GV.hideNgComment) comment.element.style.display = 'none'
        comment.element.style.color = '#f0f0f0'
        const body = comment.element.querySelector('.comment-body > span')
        body.classList.remove('cf1', 'cf2', 'cf3')
        /*
          NGコメントがレスしている先のアンカー表示を消し飛ばす
          自身が保存しているanchorIndexesを元にレス先のelementを取り出す(currentArc)
          currentArcからアンカー表示部分を取り出す(reres, reresは他にもアンカーがある可能性があるため複数)
          reresの中からaタグのhrefに#comm+レス番 が含むものが自分用のアンカー表示
          それを消す
        */
        // prettier-ignore
        comment.anchorIndexes.forEach(anchorIndex => {
          const currentAnc = comments.find(
            (m) => m.commentIndex === anchorIndex
          )
          const reres = currentAnc.element.querySelectorAll<HTMLElement>('.reres')
          const targetAnc = Array.from(reres).filter(m => m.querySelector('a').getAttribute('href') === '#comm'+comment.commentIndex)
          targetAnc[0].style.display = "none" 
        })
      } else {
        //Not Guilty
        comment.element.style.color = ''
      }
    })
  }
  //------------------------------------------------------
  // BAN登録・解除
  //------------------------------------------------------
  const ban_ID = (target: string) => {
    if (GV.ngIdHash.has(target)) {
      return
    }
    GV.ngIdHash.set(target, new User(target))
    saveLocalNgIdList()
    setDisplayList()
  }
  const update_BanId = (target: string) => {
    if (!GV.ngIdHash.has(target)) {
      return
    }
    const currentUser = GV.ngIdHash.get(target)
    currentUser.lastFind = getFormatDate()
    saveLocalNgIdList()
    setDisplayList()
  }
  const unBan_ID = (target: string) => {
    GV.ngIdHash.delete(target)
    saveLocalNgIdList()
    setDisplayList()
  }
  const ban_Word = (target: string) => {
    if (GV.ngWordHash.has(target)) {
      return
    }
    // prettier-ignore
    GV.ngWordHash.set(target, new Word(target))
    saveLocalNgWordList()
    setDisplayList()
  }
  const update_BanWord = (target: string) => {
    if (!GV.ngWordHash.has(target)) {
      return
    }
    const currentWord = GV.ngWordHash.get(target)
    currentWord.lastFind = getFormatDate()
    saveLocalNgWordList()
    setDisplayList()
  }
  const unBan_Word = (target: string) => {
    GV.ngWordHash.delete(target)
    saveLocalNgWordList()
    setDisplayList()
  }

  function createSettingArea() {
    const dropDown = textToElm(`
    <div class="dropDown">
      <div>
        <label for="extentionOptions">拡張メニュー</label>
        <select id="extentionOptions">
          <option value="close" selected>閉じる</option>
          <option value="NGID">NGID</option>
          <option value="NGTEXT">NGTEXT</option>
          <option value="OPTION">OPTION</option>
        </select>
      </div>
      <div class="tab-wrap">
        <div class="ngIdDisplay tab-content" style="display:none">
          <textarea id="textArea1">..loading</textarea>
        </div>
        <div class="ngTextDisplay tab-content" style="display:none">
          <textarea id="textArea2">..loading</textarea>
        </div>
        <div class="optionDisplay tab-content" style="display:none">
          <label>
            <input type="checkbox" name="ngDisplayType">
            NGを非表示
          </label>
          <label>
            <input type="checkbox" name="relatedCommentType">
            NGに対するレスをNGとして扱う
          </label>
          <label>
            <input type='number' name='commentCapCount' style="margin-left:8px;width:35px">
            回以上コメントするとNGとして扱う
          </label>
          <label>
            <input type="checkbox" name="relatedNGWordType">
            NGワードに該当した場合、NGIDに登録する
          </label>
        </div>
      </div>
    </div>
    `)
    const mainContainer = document.querySelector('body')
    mainContainer.insertBefore(dropDown, mainContainer.firstChild)

    dropDown.addEventListener('change', (event) => {
      const tab = document.querySelector<HTMLElement>('.tab-wrap')
      const ngId = document.querySelector<HTMLElement>('.ngIdDisplay')
      const ngText = document.querySelector<HTMLElement>('.ngTextDisplay')
      const option = document.querySelector<HTMLElement>('.optionDisplay')
      tab.style.display = event.target.value === 'close' ? 'none' : ''
      ngId.style.display = event.target.value !== 'NGID' ? 'none' : ''
      ngText.style.display = event.target.value !== 'NGTEXT' ? 'none' : ''
      option.style.display = event.target.value !== 'OPTION' ? 'none' : ''
      event.stopPropagation()
    })

    const hideNgComment = getInputElm('ngDisplayType')
    const relatedCommentType = getInputElm('relatedCommentType')
    const commentCapCount = getInputElm('commentCapCount')
    const relatedNGWordType = getInputElm('relatedNGWordType')
    hideNgComment.checked = GV.hideNgComment
    relatedCommentType.checked = GV.relatedCommentType
    commentCapCount.value = GV.commentCapCount + ''
    relatedNGWordType.checked = GV.relatedNGWordType

    hideNgComment.addEventListener('change', (e) => {
      GV.hideNgComment = e.target.checked
      saveLocalOption()
      e.stopPropagation()
    })
    relatedCommentType.addEventListener('change', (e) => {
      GV.relatedCommentType = e.target.checked
      saveLocalOption()
      e.stopPropagation()
    })

    commentCapCount.addEventListener('change', (e) => {
      GV.commentCapCount = e.target.value
      saveLocalOption()
      e.stopPropagation()
    })

    relatedNGWordType.addEventListener('change', (e) => {
      GV.relatedNGWordType = e.target.checked
      saveLocalOption()
      e.stopPropagation()
    })

    const ngIdArea = document.querySelector<HTMLTextAreaElement>('#textArea1')
    if (ngIdArea) {
      ngIdArea.addEventListener('focusout', () => {
        updateNgIdHash(ngIdArea)
      })
    }
    const ngWordArea = document.querySelector<HTMLTextAreaElement>('#textArea2')
    if (ngWordArea) {
      ngWordArea.addEventListener('focusout', () => {
        updateNgWordHash(ngWordArea)
      })
    }

    function getInputElm(name: string) {
      return document.querySelector<HTMLInputElement>(`[name=${name}]`)
    }
  }
  function textToElm(text) {
    const blankElm = document.createElement('div')
    blankElm.innerHTML = text
    return blankElm.querySelector(':scope :first-child')
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

    const textArea2 = document.querySelector<HTMLTextAreaElement>('#textArea2')
    textArea2.value = ''
    textArea2.value =
      '\n' +
      [...GV.ngWordHash.values()]
        .map((cur) => cur.word)
        .reverse()
        .join('\n')
  }

  function updateNgIdHash(settingArea: HTMLTextAreaElement) {
    const ngIdArray = settingArea.value
      .split(/\r\n|\r|\n/)
      .filter((n) => n != '')
      .reverse()
    //入力欄を元に新たなmapを作る
    const newMap = new Map<string, User>()
    ngIdArray.forEach((element) => {
      if (GV.ngIdHash.has(element)) {
        const alreadryUser = GV.ngIdHash.get(element)
        newMap.set(alreadryUser.id, alreadryUser)
      } else {
        //手動で入力あり
        newMap.set(element, new User(element))
      }
    })
    GV.ngIdHash = newMap
    setDisplayList()
    saveLocalNgIdList()
  }

  function updateNgWordHash(settingArea: HTMLTextAreaElement) {
    //textfield to array
    const ngIdArray = settingArea.value
      .split(/\r\n|\r|\n/)
      .filter((n) => n != '')
      .reverse()
    //入力欄を元に新たなmapを作る
    const newMap = new Map<string, Word>()
    ngIdArray.forEach((element) => {
      if (GV.ngWordHash.has(element)) {
        const alreadyWord = GV.ngWordHash.get(element)
        newMap.set(alreadyWord.word, alreadyWord)
      } else {
        //手動で入力あり
        newMap.set(element, new Word(element))
      }
    })
    GV.ngWordHash = newMap
    setDisplayList()
    saveLocalNgWordList()
  }
  //---------------------------------
  // (greaseMonkey localStorage) Read/Save
  //---------------------------------

  async function loadLocalNgIdList() {
    const jsonString = await GM.getValue(GV.LOCALNGIDFILE, undefined)
    if (jsonString === undefined) {
      return
    }
    GV.ngIdHash.clear()
    //一度<unknown, unknown>のmapにする
    const tempMap = new Map(JSON.parse(jsonString))
    //改めてkey, classのmapにする, 一発でやりたい場合はJSON.parse時になんか色々するみたい JSON.parse(jsonString, (key, value) => {console.log(key,value)})
    //for ([key:string,val:User] of tempMap.entries()) {
    for (const entry of Array.from(tempMap.entries())) {
      const key = entry[0] as string
      const val = entry[1] as User
      GV.ngIdHash.set(key, new User(val.id, val.submitDate, val.lastFind))
    }
  }

  function saveLocalNgIdList() {
    //hashMapのJSON化については
    //https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
    const jsonString = JSON.stringify([...GV.ngIdHash])
    GM.setValue(GV.LOCALNGIDFILE, jsonString)
  }

  async function loadLocalNgWordList() {
    const jsonString = await GM.getValue(GV.LOCALNGWORDFILE, undefined)
    if (jsonString === undefined) {
      return
    }
    GV.ngWordHash.clear()
    const tempMap = new Map(JSON.parse(jsonString))
    for (const entry of Array.from(tempMap.entries())) {
      const key = entry[0] as string
      const val = entry[1] as Word
      GV.ngWordHash.set(key, new Word(val.word, val.submitDate, val.lastFind))
    }
  }

  function saveLocalNgWordList() {
    const jsonString = JSON.stringify([...GV.ngWordHash])
    GM.setValue(GV.LOCALNGWORDFILE, jsonString)
  }

  async function loadLocalOption() {
    const jsonString = await GM.getValue(GV.LOCALOPTIONFILE, undefined)
    if (jsonString === undefined) return
    const option = JSON.parse(jsonString)
    //console.log('load option', option)
    GV.hideNgComment = option.showNgComment
    GV.commentCapCount = option.commentCapCount
    GV.relatedCommentType = option.relatedCommentType
    GV.relatedNGWordType = option.relatedNGWordType
  }

  function saveLocalOption() {
    const option = {
      showNgComment: GV.hideNgComment,
      commentCapCount: GV.commentCapCount,
      relatedCommentType: GV.relatedCommentType,
      relatedNGWordType: GV.relatedNGWordType,
    }
    //console.log('save option', option)
    const jsonString = JSON.stringify(option)
    GM.setValue(GV.LOCALOPTIONFILE, jsonString)
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
