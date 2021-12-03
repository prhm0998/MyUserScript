var AnicoBan;
(function (AnicoBan) {
    class GlobalVariable {
        constructor() {
            this.LOCALNGIDFILE = 'LocalNgIdList';
            this.LOCALNGWORDFILE = 'LocalNgWordList';
            this.ngIdHash = new Map();
            this.ngWordHash = new Map();
        }
    }
    class User {
        constructor(id, submitDate = getFormatDate(), lastFind = getFormatDate()) {
            this.id = id;
            this.submitDate = submitDate;
            this.lastFind = lastFind;
        }
    }
    class Word {
        constructor(word, submitDate = getFormatDate(), lastFind = getFormatDate()) {
            this.word = word;
            this.submitDate = submitDate;
            this.lastFind = lastFind;
        }
    }
    const GV = new GlobalVariable();
    const getFormatDate = (date = new Date()) => {
        const y = date.getFullYear();
        const m = ('00' + (date.getMonth() + 1)).slice(-2);
        const d = ('00' + date.getDate()).slice(-2);
        return y + '-' + m + '-' + d;
    };
    const getFormatDateF = (date = new Date()) => {
        const y = date.getFullYear();
        const m = ('00' + (date.getMonth() + 1)).slice(-2);
        const d = ('00' + date.getDate()).slice(-2);
        const hh = ('00' + date.getHours()).slice(-2);
        const mm = ('00' + date.getMinutes()).slice(-2);
        const ss = ('00' + date.getSeconds()).slice(-2);
        return y + '-' + m + '-' + d + ' ' + hh + ':' + mm + ':' + ss;
    };
    let style;
    GM_addStyle(GM_getResourceText('IMPORTED_CSS'));
    loadLocalNgIdList();
    loadLocalNgWordList();
    createSettingArea();
    window.addEventListener('load', () => {
        console.log('load AnicoBan.js, date:' + getFormatDateF());
        overWrite_ContentsField();
        window.setTimeout(function () {
            setDisplayList();
        }, 350);
    });
    const ngIdArea = document.querySelector('#textArea1');
    if (ngIdArea) {
        ngIdArea.addEventListener('focusout', () => {
            updateNgIdHash(ngIdArea);
        });
    }
    const ngWordArea = document.querySelector('#textArea2');
    if (ngWordArea) {
        ngWordArea.addEventListener('focusout', () => {
            updateNgWordHash(ngWordArea);
        });
    }
    const overWrite_ContentsField = () => {
        const commentList = document.querySelector('#comments-list');
        const commentsWork = Array.from(commentList.querySelectorAll('ol > li')).map((m, index) => {
            const authorName = m.querySelector('.comment-author').lastChild.textContent.trim();
            const authorId = m.querySelector('.comment-id').firstChild.textContent.trim().replace(/ID:/g, '');
            const commentIndex = parseInt(m.querySelector('.comment-author > .nom').textContent);
            const commentDate = m.querySelector('.comment-date').textContent;
            const commentText = m.querySelector('.comment-body').textContent;
            const anchorIndexes = Array.from(m.querySelectorAll('.comment-body .anchor'))
                .map((a) => {
                return parseInt(a.textContent.replace(/>/, ''));
            })
                .filter((m) => m <= index);
            const responseIndexes = Array.from(m.querySelectorAll('ul > .reres')).map((a) => {
                return parseInt(a.textContent.replace(/返信:>>/g, ''));
            });
            const commentObj = {
                element: m,
                authorName,
                authorId,
                commentIndex,
                commentDate,
                commentText,
                anchorIndexes,
                responseIndexes,
                anchorIds: [],
                idCurrentCount: 0,
                idTotalCount: 0,
                isGuilty: false,
                isBannedId: false,
                isBannedResponses: false,
                isContainsNgWord: false,
            };
            return commentObj;
        });
        const comments = commentsWork.map((m, currentIndex) => {
            const idTotalCount = commentsWork.filter((n) => n.authorId === m.authorId).length;
            const idCurrentCount = commentsWork
                .slice(0, currentIndex + 1)
                .filter((n) => n.authorId === m.authorId).length;
            const anchorIds = m.anchorIndexes.map(n => { var _a; return (_a = commentsWork.find(m => m.commentIndex === n)) === null || _a === void 0 ? void 0 : _a.authorId; });
            const containsNgWord = [...GV.ngWordHash.keys()].find((word) => m.commentText.includes(word));
            const isBannedId = GV.ngIdHash.has(m.authorId);
            if (isBannedId) {
                update_BanId(m.authorId);
            }
            const isBannedResponses = anchorIds.some((n) => GV.ngIdHash.has(n));
            if (isBannedResponses) {
                anchorIds
                    .filter((n) => GV.ngIdHash.has(n))
                    .forEach((l) => {
                    update_BanId(l);
                });
            }
            const isContainsNgWord = containsNgWord !== undefined;
            if (isContainsNgWord) {
                update_BanWord(containsNgWord);
            }
            m.idCurrentCount = idCurrentCount;
            m.idTotalCount = idTotalCount;
            m.isGuilty = isBannedId || isBannedResponses || isContainsNgWord;
            m.isBannedId = isBannedId;
            m.isBannedResponses = isBannedResponses;
            m.isContainsNgWord = isContainsNgWord;
            return m;
        });
        comments.forEach((comment, currentIndex) => {
            if (!comment.element.querySelector('.comment-id-count')) {
                var countElm = document.createElement('span');
                countElm.className = 'comment-id-count';
                countElm.innerHTML =
                    ' ' + comment.idCurrentCount + '/' + comment.idTotalCount + '件 ';
            }
            const commentElm = comment.element.querySelector('.comment-id');
            if (!commentElm.querySelector('.author-id')) {
                const commentAnchor = commentElm.querySelector('a');
                commentElm.insertBefore(countElm, commentAnchor);
                commentElm.firstChild.remove();
                const newIdElm = document.createElement('span');
                newIdElm.className = 'author-id';
                newIdElm.innerHTML = comment.authorId;
                if (comment.isBannedId) {
                    newIdElm.style.color = '#fa8072';
                }
                else if (comment.isBannedResponses) {
                    newIdElm.style.color = '#dda0dd';
                }
                else if (comment.isContainsNgWord) {
                    newIdElm.style.color = '#7b68ee';
                }
                else {
                    newIdElm.style.color = '';
                }
                newIdElm.title = GV.ngIdHash.has(comment.authorId) ? 'NG解除' : '名前でNG';
                newIdElm.style.cursor = 'pointer';
                newIdElm.onmouseover = function (e) {
                    e.target.style.textDecoration = 'underline';
                };
                newIdElm.onmouseleave = function (e) {
                    e.target.style.textDecoration = 'none';
                };
                commentElm.prepend(newIdElm);
                if (newIdElm.onclick == null) {
                    newIdElm.onclick = function (e) {
                        const targetElm = e.target;
                        const clickedId = targetElm.textContent;
                        if (GV.ngIdHash.has(clickedId)) {
                            unBan_ID(clickedId);
                        }
                        else {
                            ban_ID(clickedId);
                        }
                        overWrite_ContentsField();
                    };
                }
            }
            else {
                const idElm = comment.element.querySelector('.author-id');
                if (comment.isBannedId) {
                    idElm.style.color = '#fa8072';
                }
                else if (comment.isBannedResponses) {
                    idElm.style.color = '#ffa500';
                }
                else if (comment.isContainsNgWord) {
                    idElm.style.color = '#7b68ee';
                }
                else {
                    idElm.style.color = '';
                }
            }
            if (comment.isGuilty) {
                comment.element.style.color = '#f0f0f0';
                const body = comment.element.querySelector('.comment-body > span');
                body.classList.remove('cf1', 'cf2', 'cf3');
                comment.anchorIndexes.forEach(anchorIndex => {
                    const currentAnc = comments.find((m) => m.commentIndex === anchorIndex);
                    const reres = currentAnc.element.querySelectorAll('.reres');
                    const targetAnc = Array.from(reres).filter(m => m.querySelector('a').getAttribute('href') === '#comm' + comment.commentIndex);
                    targetAnc[0].style.display = "none";
                });
            }
            else {
                comment.element.style.color = '';
            }
        });
    };
    const ban_ID = (target) => {
        if (GV.ngIdHash.has(target)) {
            return;
        }
        GV.ngIdHash.set(target, new User(target));
        saveLocalNgIdList();
        setDisplayList();
    };
    const update_BanId = (target) => {
        if (!GV.ngIdHash.has(target)) {
            return;
        }
        const currentUser = GV.ngIdHash.get(target);
        currentUser.lastFind = getFormatDate();
        saveLocalNgIdList();
        setDisplayList();
    };
    const unBan_ID = (target) => {
        GV.ngIdHash.delete(target);
        saveLocalNgIdList();
        setDisplayList();
    };
    const ban_Word = (target) => {
        if (GV.ngWordHash.has(target)) {
            return;
        }
        GV.ngWordHash.set(target, new Word(target));
        saveLocalNgWordList();
        setDisplayList();
    };
    const update_BanWord = (target) => {
        if (!GV.ngWordHash.has(target)) {
            return;
        }
        const currentWord = GV.ngWordHash.get(target);
        currentWord.lastFind = getFormatDate();
        saveLocalNgWordList();
        setDisplayList();
    };
    const unBan_Word = (target) => {
        GV.ngWordHash.delete(target);
        saveLocalNgWordList();
        setDisplayList();
    };
    function createSettingArea() {
        const newElm = textToElm(`
    <div class="setting-area">
      <div class="tab-wrap">
        <input id="TAB-01" type="radio" name="TAB" class="tab-switch" /><label class="tab-label" id="TAB-01" for="TAB-01">ID</label>
        <div class="tab-content">
          <textarea id="textArea1">..loading</textarea>
        </div>
        <input id="TAB-02" type="radio" name="TAB" class="tab-switch" /><label class="tab-label" id="TAB-02" for="TAB-02">TEXT</label>
        <div class="tab-content">
          <textarea id="textArea2">..loading</textarea>
        </div>
        <input id="Minimize" type="radio" name="TAB" class="tab-switch" checked="checked" /><label class="tab-label" for="Minimize">minimize</label>
        <div class="tab-content">
        </div>
      </div>
    </div>
    `);
        const mainContainer = document.querySelector('body');
        mainContainer.insertBefore(newElm, mainContainer.firstChild);
        function textToElm(text) {
            const blankElm = document.createElement('div');
            blankElm.innerHTML = text;
            return blankElm.querySelector(':scope :first-child');
        }
    }
    function setDisplayList() {
        const textArea1 = document.querySelector('#textArea1');
        textArea1.value = '';
        textArea1.value =
            '\n' +
                [...GV.ngIdHash.values()]
                    .map((cur) => cur.id)
                    .reverse()
                    .join('\n');
        const idTab = document.querySelector('label#TAB-01');
        idTab.innerHTML = 'ID( ' + GV.ngIdHash.size + ' )';
        const textArea2 = document.querySelector('#textArea2');
        textArea2.value = '';
        textArea2.value =
            '\n' +
                [...GV.ngWordHash.values()]
                    .map((cur) => cur.word)
                    .reverse()
                    .join('\n');
        const textTab = document.querySelector('label#TAB-02');
        textTab.innerHTML = 'TEXT( ' + GV.ngWordHash.size + ' )';
    }
    function updateNgIdHash(settingArea) {
        const ngIdArray = settingArea.value
            .split(/\r\n|\r|\n/)
            .filter((n) => n != '')
            .reverse();
        const newMap = new Map();
        ngIdArray.forEach((element) => {
            if (GV.ngIdHash.has(element)) {
                const alreadryUser = GV.ngIdHash.get(element);
                newMap.set(alreadryUser.id, alreadryUser);
            }
            else {
                newMap.set(element, new User(element, getFormatDate(), getFormatDate()));
            }
        });
        GV.ngIdHash = newMap;
        setDisplayList();
        saveLocalNgIdList();
    }
    function updateNgWordHash(settingArea) {
        const ngIdArray = settingArea.value
            .split(/\r\n|\r|\n/)
            .filter((n) => n != '')
            .reverse();
        const newMap = new Map();
        ngIdArray.forEach((element) => {
            if (GV.ngWordHash.has(element)) {
                const alreadyWord = GV.ngWordHash.get(element);
                newMap.set(alreadyWord.word, alreadyWord);
            }
            else {
                newMap.set(element, new Word(element, getFormatDate(), getFormatDate()));
            }
        });
        GV.ngWordHash = newMap;
        setDisplayList();
        saveLocalNgWordList();
    }
    async function loadLocalNgIdList() {
        const jsonString = await GM.getValue(GV.LOCALNGIDFILE, undefined);
        if (jsonString === undefined) {
            return;
        }
        GV.ngIdHash.clear();
        const tempMap = new Map(JSON.parse(jsonString));
        for (const entry of Array.from(tempMap.entries())) {
            const key = entry[0];
            const val = entry[1];
            GV.ngIdHash.set(key, new User(val.id, val.submitDate, val.lastFind));
        }
    }
    function saveLocalNgIdList() {
        const jsonString = JSON.stringify([...GV.ngIdHash]);
        GM.setValue(GV.LOCALNGIDFILE, jsonString);
    }
    async function loadLocalNgWordList() {
        const jsonString = await GM.getValue(GV.LOCALNGWORDFILE, undefined);
        if (jsonString === undefined) {
            return;
        }
        GV.ngWordHash.clear();
        const tempMap = new Map(JSON.parse(jsonString));
        for (const entry of Array.from(tempMap.entries())) {
            const key = entry[0];
            const val = entry[1];
            GV.ngWordHash.set(key, new Word(val.word, val.submitDate, val.lastFind));
        }
    }
    function saveLocalNgWordList() {
        const jsonString = JSON.stringify([...GV.ngWordHash]);
        GM.setValue(GV.LOCALNGWORDFILE, jsonString);
    }
    function GM_addStyle(css) {
        if (!style) {
            var head = document.querySelector('head');
            if (!head) {
                return;
            }
            style = document.createElement('style');
            style.type = 'text/css';
            head.appendChild(style);
        }
        style.appendChild(document.createTextNode(css));
    }
})(AnicoBan || (AnicoBan = {}));
