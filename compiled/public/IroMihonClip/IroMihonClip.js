var IroMihonClip;
(function (IroMihonClip) {
    let style;
    GM_addStyle(GM_getResourceText('IMPORTED_CSS'));
    window.onload = () => {
        console.log('色見本クリップ.js');
        search();
    };
    const search = () => {
        const table = document.querySelector('.colortable');
        const elm = contains(table, 'td', /#.{6}/);
        elm.forEach((element) => {
            add_button(element);
        });
    };
    const contains = (targetElm, selector, regexp) => {
        var elements = targetElm.querySelectorAll(selector);
        return Array.prototype.filter.call(elements, function (element) {
            return RegExp(regexp).test(element.textContent);
        });
    };
    const add_button = (element) => {
        const newDiv = document.createElement('span');
        newDiv.className = 'buttonGroup';
        const button1 = document.createElement('button');
        const match = element.textContent.match(/#(.{6})/);
        button1.textContent = '#';
        button1.className = 'setClipboard';
        button1.onclick = function () {
            GM.setClipboard(match[0]);
        };
        newDiv.appendChild(button1);
        const button2 = document.createElement('button');
        button2.textContent = 'clip';
        button2.className = 'setClipboard';
        button2.onclick = function () {
            GM.setClipboard(match[1]);
        };
        newDiv.appendChild(button2);
        element.appendChild(newDiv);
    };
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
})(IroMihonClip || (IroMihonClip = {}));
