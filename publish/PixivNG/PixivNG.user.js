// ==UserScript==
// @name         PH_PixivNG
// @namespace    PH_PixivNG
// @version      0.1.0.0
// @author       PRHM
// @noframes
// @include      https://www.pixiv.net/*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @grant        GM.setValue
// @grant        GM.getValue
// @description  T
// @grant        GM_getResourceText
// @resource     IMPORTED_CSS https://raw.githubusercontent.com/prhm0998/MyUserScript/master/publish/PixivNG/PixivNG.css
// ==/UserScript==
// @updateURL    https://github.com/prhm0998/MyUserScript/raw/master/publish/PixivNG/PixivNG.user.js

C:\js\MyUserScript\compiled\public\PixivNG\PixivNG.js
var PixivNG;
(function (PixivNG) {
    class GlobalVariable {
        constructor() {
            this.LOCALNGIDFILE = 'LocalNgIdList';
            this.SEARCHCONTENTCOUNT = 3;
            this.lastScroll = -1;
            this.ngIdHash = new Map();
        }
    }
    class User {
        constructor(id, submitDate, lastFind) {
            this.id = id;
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
    (() => {
        console.log('load PixivNG.js,:' + getFormatDateF());
        GM_addStyle(GM_getResourceText('IMPORTED_CSS'));
        createSettingArea();
        loadLocalNgIdList();
        window.setTimeout(function () {
            setDisplayList();
        }, 350);
    })();
    window.addEventListener('scroll', () => {
        const st = window.pageYOffset || document.documentElement.scrollTop;
        if (st < GV.lastScroll - 90 ||
            st > GV.lastScroll + 90 ||
            GV.lastScroll === -1) {
            GV.lastScroll = st <= 0 ? 0 : st;
            search_Contents();
        }
    });
    const search_Contents = (target = document.querySelector('div#root')) => {
        Array.from(target.children)
            .filter((m) => m.children.length > 0)
            .forEach((child) => {
            search_Contents(child);
            if (child.children.length >= GV.SEARCHCONTENTCOUNT) {
                overWrite_ContentsField(child);
            }
        });
    };
    const overWrite_ContentsField = (contents) => {
        const hasUserElements = Array.from(contents.children)
            .filter((element) => hasUserElm(element))
            .map((element) => {
            return {
                id: getUserId(element),
                elm: element,
            };
        });
        function hasUserElm(target) {
            return getUserId(target) || false;
        }
        function getUserId(target) {
            const temp = target.querySelector('[href ^= "/users/"], [href ^= "/en/users/"]');
            if (temp === null) {
                return undefined;
            }
            else {
                const tempId = temp
                    .getAttribute('href')
                    .replace(/^\/en/, '')
                    .replace(/^\/users\//, '');
                const containsNonNumeric = /[^0-9]+/.test(tempId);
                return containsNonNumeric ? undefined : tempId;
            }
        }
        const idList = new Set(hasUserElements.map((o) => o.id));
        if (idList.size <= 2) {
            return;
        }
        hasUserElements.forEach((cur) => {
            const isGuilty = GV.ngIdHash.has(cur.id);
            if (isGuilty) {
                cur.elm.style.display = 'none';
                ban_UpDate(cur.id);
            }
            else {
                cur.elm.style.display = 'inline';
            }
            if (cur.elm.querySelector('.ngButton') === null) {
                const ngButton = document.createElement('button');
                ngButton.id = cur.id;
                ngButton.title = cur.id;
                ngButton.className = 'ngButton';
                ngButton.innerHTML = 'NG';
                ngButton.onclick = function (e) {
                    const curButton = e.target;
                    const selectedId = curButton.id;
                    ban_ID(selectedId);
                };
                cur.elm.appendChild(ngButton);
            }
        });
    };
    function ban_ID(target) {
        if (GV.ngIdHash.has(target)) {
            return;
        }
        GV.ngIdHash.set(target, new User(target, getFormatDate(), getFormatDate()));
        setDisplayList();
        saveLocalNgIdList();
        search_Contents();
    }
    function ban_UpDate(target) {
        if (!GV.ngIdHash.has(target)) {
            return;
        }
        const currentUser = GV.ngIdHash.get(target);
        currentUser.lastFind = getFormatDate();
        setDisplayList();
    }
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
    `);
        const settingArea = newElm.querySelector('#textArea1');
        if (settingArea) {
            settingArea.addEventListener('focusout', () => {
                updateNgIdHash(settingArea);
            });
        }
        const mainContainer = document.getElementById('root');
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
})(PixivNG || (PixivNG = {}));
