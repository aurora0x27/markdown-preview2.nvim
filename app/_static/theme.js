'use strict'

// The prebuilt frontend changes main[data-theme], while picture media queries
// normally follow the browser's preference. Keep native source selection, but
// resolve color preference conditions against the preview's active theme.
;(function () {
  const sources = new WeakMap()
  const preference = window.matchMedia('(prefers-color-scheme: dark)')
  const colorCondition = /\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)/gi

  function syncTheme() {
    const main = document.querySelector('main[data-theme]')
    if (!main) return

    const selected = main.getAttribute('data-theme')
    const theme = selected === 'dark' || selected === 'light'
      ? selected
      : preference.matches ? 'dark' : 'light'
    document.documentElement.style.colorScheme = theme

    main.querySelectorAll('picture > source[media]').forEach(source => {
      const media = source.getAttribute('media')
      let saved = sources.get(source)
      if (!saved || media !== saved.applied) {
        saved = { original: media, applied: media }
        sources.set(source, saved)
      }

      // Width cannot be negative: these conditions are always true/false.
      // Replacing only the color condition preserves widths, media types,
      // comma-separated alternatives and negation in the original query.
      const applied = saved.original.replace(colorCondition, (_, scheme) => (
        scheme.toLowerCase() === theme ? '(min-width: 0px)' : '(max-width: -1px)'
      ))
      saved.applied = applied
      if (media !== applied) source.setAttribute('media', applied)
    })
  }

  const observer = new MutationObserver(syncTheme)
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-theme', 'media']
  })
  preference.addEventListener('change', syncTheme)
  syncTheme()
})()
