-- Buffer-local autocmds for content refresh / auto close, plus the global
-- VimLeavePre cleanup and the optional auto-start / combine-preview hooks.
local rpc = require('mkdp.rpc')
local config = require('mkdp.config')

local M = {}

local group = vim.api.nvim_create_augroup('mkdp', { clear = true })

-- bufnr -> list of autocmd ids
local buf_aus = {}

function M.clear_refresh(bufnr)
  for _, id in ipairs(buf_aus[bufnr] or {}) do
    pcall(vim.api.nvim_del_autocmd, id)
  end
  buf_aus[bufnr] = nil
end

function M.clear_all()
  for bufnr in pairs(buf_aus) do
    M.clear_refresh(bufnr)
  end
end

--- Register the refresh / auto-close autocmds for a buffer that is previewed.
function M.init_refresh(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()
  if not vim.api.nvim_buf_is_valid(bufnr) then
    return
  end
  M.clear_refresh(bufnr)

  local cfg = config.get()
  local events
  if cfg.refresh_slow then
    events = { 'CursorHold', 'BufWrite', 'InsertLeave' }
  else
    events = { 'CursorHold', 'CursorHoldI', 'CursorMoved', 'CursorMovedI' }
  end

  local aus = {}
  aus[#aus + 1] = vim.api.nvim_create_autocmd(events, {
    group = group,
    buffer = bufnr,
    callback = function()
      rpc.refresh(bufnr)
    end,
  })

  if cfg.auto_close then
    aus[#aus + 1] = vim.api.nvim_create_autocmd('BufHidden', {
      group = group,
      buffer = bufnr,
      callback = function()
        rpc.close_page(bufnr)
        M.clear_refresh(bufnr)
        pcall(function()
          require('mkdp')._mark_closed(bufnr)
        end)
      end,
    })
  end
  buf_aus[bufnr] = aus
end

--- Global autocmds. Safe to call again: the group is cleared first.
function M.setup()
  vim.api.nvim_clear_autocmds({ group = group })
  buf_aus = {}

  vim.api.nvim_create_autocmd('VimLeavePre', {
    group = group,
    callback = function()
      rpc.stop()
    end,
  })

  local cfg = config.get()

  if cfg.auto_start then
    vim.api.nvim_create_autocmd('FileType', {
      group = group,
      pattern = cfg.filetypes,
      callback = function()
        require('mkdp').open()
      end,
    })
  end

  if cfg.combine_preview and cfg.combine_preview_auto_refresh then
    vim.api.nvim_create_autocmd('BufEnter', {
      group = group,
      pattern = '*',
      callback = function()
        if
          vim.tbl_contains(cfg.filetypes, vim.bo.filetype)
          and vim.g.mkdp_clients_active == 1
          and not cfg.auto_start
        then
          rpc.open_browser(vim.api.nvim_get_current_buf())
        end
      end,
    })
  end
end

return M
