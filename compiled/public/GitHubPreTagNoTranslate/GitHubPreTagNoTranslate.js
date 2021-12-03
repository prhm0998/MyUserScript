var GitHubPreTagNoTranslate;
(function (GitHubPreTagNoTranslate) {
    window.addEventListener('load', () => {
        console.log('load GitHubPreTagNoTranslate.js');
        const pres = document.querySelectorAll('pre');
        pres.forEach((element) => element.classList.add('notranslate'));
    });
})(GitHubPreTagNoTranslate || (GitHubPreTagNoTranslate = {}));
