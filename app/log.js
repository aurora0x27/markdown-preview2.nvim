'use strict'

// Diagnostics are suppressed by default so nothing pollutes the editor.
// Everything the server writes to stderr is echoed as an error by the Lua
// side, so keep stderr for genuine failures only. Set MKDP_DEBUG=1 to see
// informational logs.
function log(...args) {
  if (process.env.MKDP_DEBUG) {
    console.error('[mkdp]', ...args)
  }
}

module.exports = { log }
