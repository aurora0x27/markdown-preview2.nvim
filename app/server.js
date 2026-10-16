'use strict'

const http = require('http')
const socketio = require('socket.io')

const createAttach = require('./attach')
const routes = require('./routes')
const opener = require('./opener')
const { getIP } = require('./getIP')
const { lua } = require('./lua')
const { log } = require('./log')

function run() {
  const plugin = createAttach()

  process.on('uncaughtException', err => {
    const msg = `[markdown-preview.nvim] uncaught exception: ${
      (err && err.stack) || err
    }`
    log(msg)
    lua(plugin.nvim, 'echo', { hl: 'Error', msgs: msg.split('\n') })
  })

  process.on('unhandledRejection', reason => {
    log('unhandledRejection:', reason)
    lua(plugin.nvim, 'echo', {
      hl: 'Error',
      msgs: ['[markdown-preview.nvim] unhandledRejection', String(reason)]
    })
  })

  let clients = {}

  const openUrl = (url, browser) => {
    const handler = opener(url, browser)
    handler.on('error', err => {
      const message = err.message || ''
      const match = message.match(/\s*spawn\s+(.+)\s+ENOENT\s*/)
      if (match) {
        lua(plugin.nvim, 'echo', {
          hl: 'Error',
          msgs: [
            `[markdown-preview.nvim]: Can not open browser by using ${match[1]} command`
          ]
        })
      } else {
        lua(plugin.nvim, 'echo', {
          hl: 'Error',
          msgs: [err.name, err.message]
        })
      }
    })
  }

  const updateClientsActiveVar = () => {
    const active = Object.values(clients).some(cs =>
      cs.some(c => c.connected)
    )
      ? 1
      : 0
    plugin.nvim.setVar('mkdp_clients_active', active)
  }

  // http server
  const server = http.createServer(async (req, res) => {
    req.plugin = plugin
    // bufnr is the last path segment of the referer (or the request url)
    req.bufnr = (req.headers.referer || req.url)
      .replace(/[?#].*$/, '')
      .split('/')
      .pop()
    req.asPath = req.url.replace(/[?#].*$/, '')
    req.mkcss = await plugin.nvim.getVar('mkdp_markdown_css')
    req.hicss = await plugin.nvim.getVar('mkdp_highlight_css')
    req.custImgPath = await plugin.nvim.getVar('mkdp_images_path')
    routes(req, res)
  })

  // websocket server
  const io = socketio(server)

  io.on('connection', async client => {
    const bufnr = client.handshake.query.bufnr

    clients[bufnr] = clients[bufnr] || []
    clients[bufnr].push(client)
    updateClientsActiveVar()

    const buffers = await plugin.nvim.buffers
    buffers.forEach(async buffer => {
      if (buffer.id === Number(bufnr)) {
        const winline = await plugin.nvim.call('winline')
        const currentWindow = await plugin.nvim.window
        const winheight = await plugin.nvim.call('winheight', currentWindow.id)
        const cursor = await plugin.nvim.call('getpos', '.')
        const options = await plugin.nvim.getVar('mkdp_preview_options')
        const pageTitle = await plugin.nvim.getVar('mkdp_page_title')
        const theme = await plugin.nvim.getVar('mkdp_theme')
        const name = await buffer.name
        const content = await buffer.getLines()
        const currentBuffer = await plugin.nvim.buffer
        client.emit('refresh_content', {
          options,
          isActive: currentBuffer.id === buffer.id,
          winline,
          winheight,
          cursor,
          pageTitle,
          theme,
          name,
          content
        })
      }
    })

    client.on('disconnect', () => {
      clients[bufnr] = (clients[bufnr] || []).filter(c => c.id !== client.id)
      updateClientsActiveVar()
    })
  })

  async function startServer() {
    const openToTheWorld = await plugin.nvim.getVar('mkdp_open_to_the_world')
    const host = openToTheWorld ? '0.0.0.0' : '127.0.0.1'
    let port = await plugin.nvim.getVar('mkdp_port')
    port = port || 8080 + Number(`${Date.now()}`.slice(-3))

    server.listen({ host, port }, () => {
      log('server listening on', `${host}:${port}`)

      function refreshPage({ bufnr, data }) {
        ;(clients[bufnr] || []).forEach(c => {
          if (c.connected) {
            c.emit('refresh_content', data)
          }
        })
      }

      function closePage({ bufnr }) {
        clients[bufnr] = (clients[bufnr] || []).filter(c => {
          if (c.connected) {
            c.emit('close_page')
            return false
          }
          return true
        })
      }

      function closeAllPages() {
        Object.keys(clients).forEach(bufnr => {
          ;(clients[bufnr] || []).forEach(c => {
            if (c.connected) {
              c.emit('close_page')
            }
          })
        })
        clients = {}
      }

      async function openBrowser({ bufnr }) {
        const combinePreview = await plugin.nvim.getVar('mkdp_combine_preview')
        if (
          combinePreview &&
          Object.values(clients).some(cs => cs.some(c => c.connected))
        ) {
          Object.values(clients).forEach(cs => {
            cs.forEach(c => {
              if (c.connected) {
                c.emit('change_bufnr', bufnr)
              }
            })
          })
        } else {
          const openIp = await plugin.nvim.getVar('mkdp_open_ip')
          const openHost =
            openIp !== '' ? openIp : openToTheWorld ? getIP() : 'localhost'
          const url = `http://${openHost}:${port}/page/${bufnr}`
          const browserfunc = await plugin.nvim.getVar('mkdp_browserfunc')
          if (browserfunc) {
            lua(plugin.nvim, 'browserfunc', url)
          } else {
            const browser = await plugin.nvim.getVar('mkdp_browser')
            if (browser !== '') {
              openUrl(url, browser)
            } else {
              openUrl(url)
            }
          }
          const isEchoUrl = await plugin.nvim.getVar('mkdp_echo_preview_url')
          if (isEchoUrl) {
            lua(plugin.nvim, 'echo_url', url)
          }
        }
      }

      plugin.init({ refreshPage, closePage, closeAllPages, openBrowser })

      // Tell the editor the server is ready; the editor then notifies us with
      // the buffer to open, keeping the exact same round trip as before.
      lua(plugin.nvim, 'open_browser')
    })
  }

  startServer()
}

module.exports = { run }
