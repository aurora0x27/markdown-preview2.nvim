-- `:checkhealth mkdp`
local util = require('mkdp.util')

local M = {}

function M.check()
  vim.health.start('mkdp')

  local root = util.root()
  vim.health.info('plugin root: ' .. root)
  vim.health.info('platform: ' .. util.get_platform())

  if vim.fn.executable('node') == 1 then
    vim.health.ok('node: ' .. vim.trim(vim.fn.system('node --version')))
  else
    vim.health.error('`node` executable not found', {
      'install node.js, it is required to run the preview server',
    })
  end

  local bundle = util.server_bundle()
  if vim.fn.filereadable(bundle) == 1 then
    vim.health.ok('server bundle: ' .. bundle)
  else
    vim.health.error('server bundle missing: ' .. bundle, {
      'run `require("mkdp").install()` (requires node + npm)',
    })
  end

  local cfg = require('mkdp.config').get()
  vim.health.info('filetypes: ' .. table.concat(cfg.filetypes, ', '))
  vim.health.info(
    'preview theme: ' .. (cfg.theme ~= '' and cfg.theme or '(auto)')
  )
end

return M
