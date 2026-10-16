-- Public entry point. Use:
--
--   require('mkdp').setup { ... }
--   require('mkdp').open()   / .close() / .toggle()
local config = require('mkdp.config')
local rpc = require('mkdp.rpc')
local autocmd = require('mkdp.autocmd')
local command = require('mkdp.command')

local M = {}

-- bufnr -> true when the preview is considered "on" for that buffer
local toggled = {}

---@param opts mkdp.Config|nil
function M.setup(opts)
  config.setup(opts)
  command.create()
  autocmd.setup()
  return M
end

--- Start the preview server (if needed) and open the browser for `bufnr`.
---@param bufnr integer|nil
function M.open(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()
  if rpc.is_running() then
    rpc.open_browser(bufnr)
  elseif rpc.start() then
    -- The server calls `open_browser` back once it is listening, which opens
    -- the browser for the current buffer.
  else
    return
  end
  autocmd.init_refresh(bufnr)
  toggled[bufnr] = true
end

--- Stop the preview server and close every preview page.
function M.close()
  rpc.stop()
  autocmd.clear_all()
  toggled = {}
  vim.g.mkdp_clients_active = 0
end

function M.toggle()
  local bufnr = vim.api.nvim_get_current_buf()
  if toggled[bufnr] then
    M.close()
  else
    M.open(bufnr)
  end
end

--- Internal: called when a buffer's preview page is closed by auto-close.
---@param bufnr integer
function M._mark_closed(bufnr)
  toggled[bufnr] = nil
end

---@return boolean
function M.status()
  return rpc.is_running()
end

--- Build the bundled node server. Requires node + npm.
---@param sync boolean|nil unused, kept for interface parity
function M.install(sync)
  require('mkdp.install').run(sync)
end

--- Internal: callback dispatcher used by the node server (`luaeval`).
---@param method string
---@param args any
function M._rpc(method, args)
  local ok, err = pcall(rpc.dispatch, method, args)
  if not ok then
    require('mkdp.util').echo_messages('Error', tostring(err))
  end
end

return M
