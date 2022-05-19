// ==UserScript==
// @name         PH_AmazonUtil
// @namespace    PH_AmazonUtil
// @version      0.1.0.0
// @author       PRHM
// @include      https://www.amazon.co.jp/*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @description  コピーしたフォルダーをある程度整形してからpublic/privateに移動する
// @resource     IMPORTED_CSS https://raw.githubusercontent.com/prhm0998/MyUserScript/master/publish/AmazonUtil/AmazonUtil.css
// @updateURL    https://github.com/prhm0998/MyUserScript/raw/master/publish/AmazonUtil/AmazonUtil.user.js
// ==/UserScript==

var AmazonUtil;
(function (AmazonUtil) {
    GM_addStyle(GM_getResourceText('IMPORTED_CSS'));
    const elms = document.querySelectorAll('.a-size-base-plus.a-color-base.a-text-normal');
})(AmazonUtil || (AmazonUtil = {}));
