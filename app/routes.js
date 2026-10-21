'use strict'

const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const { APP_DIR } = require('./paths')
const { log } = require('./log')

const OUT_DIR = path.join(APP_DIR, 'out')
const STATIC_DIR = path.join(APP_DIR, '_static')

const routes = []
const use = fn => routes.push(fn)

// /page/:number -> frontend entry point
use((req, res, next) => {
  if (/^\/page\/\d+\/?$/.test(req.asPath)) {
    return fs.createReadStream(path.join(OUT_DIR, 'index.html')).pipe(res)
  }
  next()
})

// The frontend rewrites the url from /page/:number to /:number (see
// window.history.replaceState in the page bundle). Redirect it back so a
// browser refresh loads index.html again and the app can parse the bufnr.
use((req, res, next) => {
  const match = req.asPath.match(/^\/(\d+)\/?$/)
  if (match) {
    res.writeHead(302, { Location: `/page/${match[1]}` })
    return res.end()
  }
  next()
})

// /_next/... -> next.js static chunks
use((req, res, next) => {
  if (/^\/_next\//.test(req.asPath)) {
    const file = path.join(OUT_DIR, req.asPath)
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return fs.createReadStream(file).pipe(res)
    }
  }
  next()
})

// Custom css overrides: /_static/markdown.css and /_static/highlight.css
use((req, res, next) => {
  try {
    if (req.mkcss && req.asPath === '/_static/markdown.css') {
      if (fs.existsSync(req.mkcss)) {
        return fs.createReadStream(req.mkcss).pipe(res)
      }
    } else if (req.hicss && req.asPath === '/_static/highlight.css') {
      if (fs.existsSync(req.hicss)) {
        return fs.createReadStream(req.hicss).pipe(res)
      }
    }
  } catch (e) {
    log('load custom css fail:', req.asPath, e.message)
  }
  next()
})

// /_static/... -> bundled css/fonts/js
use((req, res, next) => {
  if (/^\/_static\//.test(req.asPath)) {
    const rel = req.asPath.replace(/^\/_static\//, '')
    const file = path.join(STATIC_DIR, rel)
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return fs.createReadStream(file).pipe(res)
    }
    log('no such static file:', req.asPath)
  }
  next()
})

// /_local_image_/... -> local images relative to the buffer directory
use(async (req, res, next) => {
  const reg = /^\/_local_image_/
  if (reg.test(req.asPath) && req.asPath !== '') {
    const plugin = req.plugin
    const buffers = await plugin.nvim.buffers
    const buffer = buffers.find(b => b.id === Number(req.bufnr))
    if (buffer) {
      let fileDir = ''
      if (req.custImgPath) {
        fileDir = req.custImgPath
      } else {
        fileDir = await plugin.nvim.call('expand', `#${req.bufnr}:p:h`)
      }

      const mingwHome = process.env.MINGW_HOME
      if (mingwHome && !fileDir.includes(':')) {
        // fileDir is unix-like (/Z/x/y/...) and should become win-like (Z:\x\y)
        try {
          const result = childProcess.execSync(`cygpath.exe -w -a ${fileDir}`)
          fileDir = result.toString('utf8').replace('\n', '')
        } catch (e) {
          log('cygpath fail:', e.message)
        }
      }

      let imgPath = decodeURIComponent(
        decodeURIComponent(req.asPath.replace(reg, ''))
      )
      imgPath = imgPath.replace(/\\ /g, ' ')
      if (imgPath[0] !== '/' && imgPath[0] !== '\\') {
        imgPath = path.join(fileDir, imgPath)
      } else if (!fs.existsSync(imgPath)) {
        let tmpDirPath = fileDir
        while (tmpDirPath !== '/' && tmpDirPath !== '\\') {
          tmpDirPath = path.normalize(path.join(tmpDirPath, '..'))
          const tmpImgPath = path.join(tmpDirPath, imgPath)
          if (fs.existsSync(tmpImgPath)) {
            imgPath = tmpImgPath
            break
          }
        }
      }

      if (fs.existsSync(imgPath) && !fs.statSync(imgPath).isDirectory()) {
        if (imgPath.endsWith('svg')) {
          res.setHeader('content-type', 'image/svg+xml')
        }
        return fs.createReadStream(imgPath).pipe(res)
      }
      log('image not exists:', imgPath)
    }
  }
  next()
})

// 404 fallback
use((req, res) => {
  res.statusCode = 404
  const file = path.join(OUT_DIR, '404.html')
  if (fs.existsSync(file)) {
    return fs.createReadStream(file).pipe(res)
  }
  res.end('404')
})

module.exports = function (req, res) {
  let i = 0
  const next = err => {
    if (err) {
      res.statusCode = 500
      return res.end(String(err))
    }
    const route = routes[i++]
    if (route) {
      return route(req, res, next)
    }
  }
  next()
}
