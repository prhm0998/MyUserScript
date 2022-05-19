// ==UserScript==
// @name         PH_TateNarou
// @namespace    PH_TateNarou
// @version      0.1.0.0
// @author       PRHM
// @include      https://ncode.syosetu.com/n*
// @grant        GM.setValue
// @grant        GM.getValue
// @description  縦書き表示
// @description  本文エリアのマウスホイール
// @description  本文エリアをダブルクリックで本文エリアに合わせてスクロール
// @description  「表示調整」にオプション追加
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @resource     IMPORTED_CSS https://raw.githubusercontent.com/prhm0998/MyUserScript/master/publish/TateNarou/TateNarou.css
// @updateURL    https://github.com/prhm0998/MyUserScript/raw/master/publish/TateNarou/TateNarou.user.js
// ==/UserScript==

let style;
class GlobalVariables {
    constructor() {
        this.reverse = false;
        this.amount = 200;
        this.wide = true;
        this.height = 100;
        this.latinToZen = true;
        this.scrollOnLoad = true;
    }
}
GM_addStyle(GM_getResourceText('IMPORTED_CSS'));
let GV = new GlobalVariables();
window.addEventListener('load', async () => {
    var _a;
    await loadLocalOption();
    addExtraOptionArea();
    const honbun = document.querySelector('#novel_honbun');
    if (GV.wide)
        honbun.style.height = GV.height + 'vh';
    honbun.addEventListener('wheel', horizonScroll);
    honbun.addEventListener('dblclick', doubleClick);
    const title = document.querySelector('.novel_title');
    if (title)
        honbun.prepend(title);
    const subTitle = document.querySelector('.novel_subtitle');
    if (subTitle)
        honbun.prepend(subTitle);
    const novelpp = document.querySelectorAll('.novel_view#novel_p > p');
    if (novelpp)
        novelpp.forEach((p) => honbun.prepend(p));
    const novelap = document.querySelectorAll('.novel_view#novel_a > p');
    if (novelap)
        novelap.forEach((p) => honbun.append(p));
    const bn = (_a = document.querySelectorAll('.novel_bn')[1]) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
    if (bn)
        honbun.append(bn);
    if (GV.scrollOnLoad)
        honbun.scrollIntoView({ inline: 'start', behavior: 'smooth' });
    if (GV.latinToZen)
        latinToZen(honbun);
    const novelp = document.querySelector('.novel_view#novel_p');
    if (novelp)
        novelp.remove();
    const novela = document.querySelector('.novel_view#novel_a');
    if (novela)
        novela.remove();
});
function addExtraOptionArea() {
    const nav = document.querySelector('.novelview_navi');
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
  `);
    nav.appendChild(extraOptions);
    const closeButton = document.querySelector('#menu_off_2');
    nav.appendChild(closeButton);
    const wheelReverse = getInputElm('wheelReverse');
    const fixedOnLoad = getInputElm('fixedOnLoad');
    const honbunHeight = getInputElm('honbunHeight');
    const latinToZen = getInputElm('latinToZen');
    wheelReverse.addEventListener('change', (e) => {
        if (e.target instanceof HTMLInputElement && e.target.checked)
            GV.reverse = e.target.checked;
        saveLocalOption();
    });
    fixedOnLoad.addEventListener('change', (e) => {
        if (e.target instanceof HTMLInputElement && e.target.checked)
            GV.scrollOnLoad = e.target.checked;
        saveLocalOption();
    });
    honbunHeight.addEventListener('change', (e) => {
        if (e.target instanceof HTMLInputElement && e.target.checked)
            GV.wide = e.target.checked;
        saveLocalOption();
    });
    latinToZen.addEventListener('change', (e) => {
        if (e.target instanceof HTMLInputElement && e.target.checked)
            GV.latinToZen = e.target.checked;
        saveLocalOption();
    });
    wheelReverse.checked = GV.reverse;
    fixedOnLoad.checked = GV.scrollOnLoad;
    honbunHeight.checked = GV.wide;
    latinToZen.checked = GV.latinToZen;
    function getInputElm(name) {
        return document.querySelector(`[name=${name}]`);
    }
}
function latinToZen(element) {
    if (element.childNodes.length) {
        element.childNodes.forEach((child) => latinToZen(child));
    }
    else {
        element.textContent = replaceText(element.textContent);
        function replaceText(text) {
            return text.replace(/[0-9A-Za-z]/g, (s) => {
                return String.fromCharCode(s.charCodeAt(0) + 65248);
            });
        }
    }
}
function horizonScroll(e) {
    const movelr = e.deltaY > 0 ? -1 : 1;
    const speed = GV.reverse ? GV.amount : -GV.amount;
    const moving = this.scrollLeft - speed * movelr;
    this.scrollTo({ left: moving, behavior: 'smooth' });
    e.preventDefault();
}
function doubleClick(e) {
    this.scrollIntoView({ inline: 'start', behavior: 'smooth' });
    e.preventDefault();
}
function textToElm(text) {
    const blankElm = document.createElement('div');
    blankElm.innerHTML = text;
    return blankElm.querySelector(':scope :first-child');
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
async function loadLocalOption() {
    const jsonString = await GM.getValue('LOCALOPTION', undefined);
    if (jsonString === undefined)
        return;
    GV = JSON.parse(jsonString);
}
function saveLocalOption() {
    const jsonString = JSON.stringify(GV);
    GM.setValue('LOCALOPTION', jsonString);
}
