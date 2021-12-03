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
