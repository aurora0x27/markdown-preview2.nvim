'use strict'

// Node 26 warns about `url.parse()` in socket.io v2 internals; keep stderr
// clean so the editor only ever sees real errors.
process.noDeprecation = true

require('./server').run()
