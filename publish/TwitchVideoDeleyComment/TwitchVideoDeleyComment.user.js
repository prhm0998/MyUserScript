// ==UserScript==
// @name         PH_TwitchVideoDeleyComment
// @namespace    PH_TwitchVideoDeleyComment
// @version      0.1.0.0
// @author       PRHM
// @noframes
// @include      https://www.twitch.tv/videos/*
// @description	 アーカイブ視聴時にコメント表示を指定時間分遅らせる
// @updateURL    https://github.com/prhm0998/MyUserScript/raw/master/publish/TwitchVideoDeleyComment.user.js
// ==/UserScript==

var TwitchVideoDeleyComment;
(function (TwitchVideoDeleyComment) {
    const deley = 1800;
    const chatClass = '.video-chat__message-list-wrapper';
    window.addEventListener('load', () => {
        const chatArea = document.querySelector(chatClass);
        const callBack = (mutationList) => {
            mutationList.forEach((element) => {
                deleyDisplay(element.addedNodes[0]);
            });
        };
        const observer = new MutationObserver(callBack);
        observer.observe(chatArea, { childList: true, subtree: true });
    });
    const deleyDisplay = (comment) => {
        comment.style.display = 'none';
        console.log(comment);
        const timer = setTimeout(() => {
            comment.style.display = '';
            clearTimeout(timer);
        }, deley);
    };
})(TwitchVideoDeleyComment || (TwitchVideoDeleyComment = {}));
