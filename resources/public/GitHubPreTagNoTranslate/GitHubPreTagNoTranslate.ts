namespace GitHubPreTagNoTranslate {
  window.addEventListener('load', () => {
    console.log('load GitHubPreTagNoTranslate.js')
    const pres = document.querySelectorAll('pre')
    pres.forEach((element) => element.classList.add('notranslate'))
  })
}
//翻訳の無効化
// ページ単位で無効化する場合は headに<meta name="google" content="notranslate" />
// エレメント単位では クラスにnotranslate または skiptranslateを付与する
