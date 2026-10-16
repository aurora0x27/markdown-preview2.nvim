'use strict'

const { attach } = require('@chemzqm/neovim')
const { log } = require('./log')

let app

// Attach to the neovim instance that spawned us. Everything the editor sends
// us arrives as an rpc notification / request on this channel.
function create() {
  const nvim = attach({ reader: process.stdin, writer: process.stdout })

  nvim.on('notification', async (method, args) => {
    const opts = args[0] || args
    const bufnr = opts && opts.bufnr
    const buffers = await nvim.buffers
    const buffer = buffers.find(b => b.id === bufnr)

    if (method === 'refresh_content') {
      const winline = await nvim.call('winline')
      const currentWindow = await nvim.window
      const winheight = await nvim.call('winheight', currentWindow.id)
      const cursor = await nvim.call('getpos', '.')
      const renderOpts = await nvim.getVar('mkdp_preview_options')
      const pageTitle = await nvim.getVar('mkdp_page_title')
      const theme = await nvim.getVar('mkdp_theme')
      const name = await buffer.name
      const content = await buffer.getLines()
      const currentBuffer = await nvim.buffer
      app.refreshPage({
        bufnr,
        data: {
          options: renderOpts,
          isActive: currentBuffer.id === buffer.id,
          winline,
          winheight,
          cursor,
          pageTitle,
          theme,
          name,
          content
        }
      })
    } else if (method === 'close_page') {
      app.closePage({ bufnr })
    } else if (method === 'open_browser') {
      app.openBrowser({ bufnr })
    }
  })

  nvim.on('request', (method, args, resp) => {
    if (method === 'close_all_pages') {
      app.closeAllPages()
    }
    resp.send()
  })

  nvim.channelId
    .then(channelId => {
      nvim.setVar('mkdp_node_channel_id', channelId)
    })
    .catch(e => {
      log('channelId:', e && e.message)
    })

  return {
    nvim,
    init: param => {
      app = param
    }
  }
}

module.exports = create
