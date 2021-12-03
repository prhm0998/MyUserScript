namespace Template {
  let style
  GM_addStyle(GM_getResourceText('IMPORTED_CSS'))
  function GM_addStyle(css) {
    if (!style) {
      var head = document.querySelector('head')
      if (!head) {
        return
      }
      style = document.createElement('style')
      style.type = 'text/css'
      head.appendChild(style)
    }
    style.appendChild(document.createTextNode(css))
  }
}
