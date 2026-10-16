-- Node server lifecycle and the rpc bridge.
--
-- Neovim spawns the bundled node server as an rpc job channel, so we talk to
-- it with `vim.rpcnotify` / `vim.rpcrequest`. The server talks back through
-- `require('mkdp')._rpc(method, args)` (see `dispatch` below).
local util = require('mkdp.util')
local config = require('mkdp.config')

local M = {}

local state = { chan = nil }

function M.is_running()
  local chan = state.chan
  return chan ~= nil and chan > 0
end

function M.channel()
  return state.chan
end

local function server_cmd()
  local bundle = util.server_bundle()
  if vim.fn.filereadable(bundle) ~= 1 then
    util.echo_messages('Error', {
      '[markdown-preview.nvim]: server bundle missing: ' .. bundle,
      'run `require("mkdp").install()` (requires node + npm) to build it',
    })
    return nil
  end
  if vim.fn.executable('node') ~= 1 then
    util.echo_messages('Error', {
      '[markdown-preview.nvim]: `node` is required but was not found in PATH',
    })
    return nil
  end
  return { 'node', bundle }
end

function M.start()
  if M.is_running() then
    return true
  end
  local cmd = server_cmd()
  if not cmd then
    return false
  end
  local chan = vim.fn.jobstart(cmd, {
    rpc = true,
    on_stderr = function(_, data)
      if not data then
        return
      end
      local msgs = {}
      for _, line in ipairs(data) do
        if line ~= '' then
          msgs[#msgs + 1] = line
        end
      end
      if #msgs > 0 then
        util.echo_messages('Error', msgs)
      end
    end,
    on_exit = function()
      state.chan = nil
    end,
  })
  if chan <= 0 then
    util.echo_messages('Error', {
      '[markdown-preview.nvim]: failed to start server (jobstart returned '
        .. chan
        .. ')',
    })
    return false
  end
  state.chan = chan
  return true
end

function M.notify(method, args)
  if M.is_running() then
    vim.rpcnotify(state.chan, method, args)
  end
end

function M.request(method, args)
  if not M.is_running() then
    return nil
  end
  local ok, res = pcall(vim.rpcrequest, state.chan, method, args)
  return ok and res or nil
end

function M.stop()
  if M.is_running() then
    pcall(vim.rpcrequest, state.chan, 'close_all_pages')
    pcall(vim.fn.jobstop, state.chan)
  end
  state.chan = nil
end

function M.open_browser(bufnr)
  M.notify('open_browser', { bufnr = bufnr or vim.api.nvim_get_current_buf() })
end

function M.refresh(bufnr)
  M.notify('refresh_content', {
    bufnr = bufnr or vim.api.nvim_get_current_buf(),
  })
end

function M.close_page(bufnr)
  M.notify('close_page', { bufnr = bufnr or vim.api.nvim_get_current_buf() })
end

--- Handle a callback coming from the node server.
---@param method string
---@param args any
function M.dispatch(method, args)
  if method == 'echo' then
    if type(args) == 'table' then
      util.echo_messages(args.hl or 'Error', args.msgs)
    end
  elseif method == 'echo_url' then
    if args then
      util.echo_url(args)
    end
  elseif method == 'browserfunc' then
    local fn = config.get().browserfunc
    if type(fn) == 'function' then
      local ok, err = pcall(fn, args)
      if not ok then
        util.echo_messages('Error', tostring(err))
      end
    elseif type(fn) == 'string' and fn ~= '' then
      pcall(vim.cmd, 'silent! call ' .. fn .. '(' .. vim.fn.string(args) .. ')')
    end
  elseif method == 'open_browser' then
    M.open_browser(vim.api.nvim_get_current_buf())
  end
end

return M
