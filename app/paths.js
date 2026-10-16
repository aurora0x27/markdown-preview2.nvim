'use strict'

const fs = require('fs')
const path = require('path')

// Locate the directory that holds the `out/` (frontend build) and `_static/`
// (css/fonts/js) folders. This works both when running the sources directly
// (__dirname === app/) and when running the esbuild bundle (__dirname ===
// app/dist/).
function findAppDir() {
  let dir = __dirname
  for (let i = 0; i < 4; i++) {
    if (
      fs.existsSync(path.join(dir, '_static')) ||
      fs.existsSync(path.join(dir, 'out'))
    ) {
      return dir
    }
    dir = path.join(dir, '..')
  }
  return path.join(__dirname, '..')
}

module.exports = { APP_DIR: findAppDir() }
