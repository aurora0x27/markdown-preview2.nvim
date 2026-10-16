'use strict'

// Fork from https://github.com/domenic/opener
const childProcess = require('child_process')
const os = require('os')

function opener(args, tool) {
  let platform = process.platform
  args = [].concat(args)

  // Detect Windows Subsystem for Linux: treat it as win32 so `cmd.exe start`
  // is used (xdg-open does not work without an X server).
  if (
    platform === 'linux' &&
    os.release().toLowerCase().indexOf('microsoft') !== -1
  ) {
    platform = 'win32'
  }

  let command
  switch (platform) {
    case 'win32': {
      command = 'cmd.exe'
      if (tool) {
        args.unshift(tool)
      }
      break
    }
    case 'darwin': {
      command = 'open'
      if (tool) {
        args.unshift(tool)
        args.unshift('-a')
      }
      break
    }
    default: {
      command = tool || 'xdg-open'
      break
    }
  }

  if (platform === 'win32') {
    args = args.map(value => String(value).replace(/&/g, '^&'))
    args = ['/c', 'start', '""'].concat(args)
  }

  return childProcess.spawn(command, args, {
    shell: false,
    detached: true
  })
}

module.exports = opener
