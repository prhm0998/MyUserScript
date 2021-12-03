// ==UserScript==
// @name         PH_GitHubPreTagNoTranslate
// @namespace    PH_GitHubPreTagNoTranslate
// @version      0.1.0.0
// @author       PRHM
// @include      https://github.com/*
// @description  Github内でコード記述を翻訳しない
// @updateURL    https://github.com/prhm0998/MyUserScript/raw/master/publish/GitHubPreTagNoTranslate.user.js
// ==/UserScript==

var GitHubPreTagNoTranslate;
(function (GitHubPreTagNoTranslate) {
    window.addEventListener('load', () => {
        console.log('load GitHubPreTagNoTranslate.js');
        const pres = document.querySelectorAll('pre');
        pres.forEach((element) => element.classList.add('notranslate'));
    });
})(GitHubPreTagNoTranslate || (GitHubPreTagNoTranslate = {}));
