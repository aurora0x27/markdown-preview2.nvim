'use strict'

const path = require('path')
const esbuild = require('esbuild')

esbuild
  .build({
    entryPoints: [path.join(__dirname, 'entry.js')],
    bundle: true,
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    outfile: path.join(__dirname, 'dist', 'mkdp-server.cjs'),
    // optional native addons for `ws`/engine.io, not required at runtime
    external: ['bufferutil', 'utf-8-validate', 'uws'],
    logLevel: 'info'
  })
  .catch(() => process.exit(1))
