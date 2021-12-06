let style;
GM_addStyle(GM_getResourceText('IMPORTED_CSS'));
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
let GV = new GlobalVariables();
window.addEventListener('load', async () => {
    await loadLocalOption();
    addExtraOptionArea();
    const honbun = document.querySelector('#novel_honbun');
    if (GV.scrollOnLoad)
        honbun.scrollIntoView({ inline: 'start', behavior: 'smooth' });
    if (GV.wide)
        honbun.style.height = GV.height + 'vh';
    if (GV.latinToZen)
        latinToZen(honbun);
    honbun.addEventListener('wheel', horizonScroll);
    honbun.addEventListener('dblclick', doubleClick);
    const subTitle = document.querySelector('.novel_subtitle');
    honbun.prepend(subTitle);
    const bn = document.querySelectorAll('.novel_bn')[1].cloneNode(true);
    honbun.append(bn);
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
        GV.reverse = e.target.checked;
        saveLocalOption();
    });
    fixedOnLoad.addEventListener('change', (e) => {
        GV.scrollOnLoad = e.target.checked;
        saveLocalOption();
    });
    honbunHeight.addEventListener('change', (e) => {
        GV.wide = e.target.checked;
        saveLocalOption();
    });
    latinToZen.addEventListener('change', (e) => {
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
            return text.replace(/[A-Za-z]/g, (s) => {
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
