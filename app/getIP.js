'use strict'

const os = require('os')

function getIP() {
  const interfaces = os.networkInterfaces()
  let IP = ''
  Object.keys(interfaces).some(devName => {
    const iface = interfaces[devName] || []
    for (const alias of iface) {
      if (
        alias.family === 'IPv4' &&
        alias.address !== '127.0.0.1' &&
        !alias.internal
      ) {
        IP = alias.address
        return true
      }
    }
    return false
  })
  return IP
}

module.exports = { getIP }
