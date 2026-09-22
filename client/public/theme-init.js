;(function () {
  var theme = 'light'
  try {
    var stored = localStorage.getItem('foxtrack-theme')
    if (stored === 'light' || stored === 'dark') {
      theme = stored
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark'
    }
  } catch (error) {
    theme = 'light'
  }
  document.documentElement.setAttribute('data-theme', theme)
})()
