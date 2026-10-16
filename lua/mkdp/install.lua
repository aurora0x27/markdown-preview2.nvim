-- Build the bundled node server (`app/dist/mkdp-server.cjs`).
-- The bundle is committed, so this is only needed when developing or when the
-- bundle is missing. Requires `node` and `npm` in PATH.
local util = require('mkdp.util')

local M = {}

local function app_dir()
  return util.root() .. '/app'
end

local function run_cmd(cmd, cwd)
  local out = {}
  local job = vim.fn.jobstart(cmd, {
    cwd = cwd,
    on_stdout = function(_, data)
      for _, line in ipairs(data or {}) do
        if line ~= '' then
          out[#out + 1] = line
        end
      end
    end,
    on_stderr = function(_, data)
      for _, line in ipairs(data or {}) do
        if line ~= '' then
          out[#out + 1] = line
        end
      end
    end,
  })
  if job <= 0 then
    return -1, out
  end
  local code = vim.fn.jobwait({ job })[1]
  return code, out
end

---@return boolean
function M.is_installed()
  return vim.fn.filereadable(util.server_bundle()) == 1
    and vim.fn.executable('node') == 1
end

---@param _sync boolean|nil
function M.run(_sync)
  if vim.fn.executable('node') ~= 1 or vim.fn.executable('npm') ~= 1 then
    util.echo_messages('Error', {
      '[markdown-preview.nvim]: `node` and `npm` are required to build the server',
    })
    return
  end

  local cwd = app_dir()
  vim.notify(
    '[markdown-preview] installing server dependencies...',
    vim.log.levels.INFO
  )
  local install_code =
    run_cmd({ 'npm', 'install', '--no-audit', '--no-fund' }, cwd)
  if install_code ~= 0 then
    util.echo_messages('Error', {
      '[markdown-preview.nvim]: `npm install` failed (exit '
        .. install_code
        .. ')',
    })
    return
  end

  vim.notify(
    '[markdown-preview] building server bundle...',
    vim.log.levels.INFO
  )
  local build_code = run_cmd({ 'npm', 'run', 'build' }, cwd)
  if build_code ~= 0 then
    util.echo_messages('Error', {
      '[markdown-preview.nvim]: server build failed (exit '
        .. build_code
        .. ')',
    })
    return
  end

  util.echo_messages('Type', '[markdown-preview.nvim]: server build completed')
end

return M
