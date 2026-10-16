'use strict'

// Bridge from the Node server back into the neovim Lua plugin.
//
// Neovim is running us as an rpc job channel, so every call we make here ends
// up in the Lua process. `require('mkdp')._rpc(method, args)` is the single
// dispatch point on the Lua side.
//
// `nvim.lua(code, args)` executes `code` as a Lua chunk with `args` splatted
// into `...`.
function lua(nvim, method, args) {
  return nvim.lua("return require('mkdp')._rpc(...)", [
    method,
    args === undefined ? null : args
  ])
}

module.exports = { lua }
