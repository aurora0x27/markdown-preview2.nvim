-- User commands and <Plug> mappings.
local config = require('mkdp.config')

local M = {}

local function allowed()
  local cfg = config.get()
  if cfg.command_for_global then
    return true
  end
  return vim.tbl_contains(cfg.filetypes, vim.bo.filetype)
end

local function guard(fn)
  return function()
    if not allowed() then
      vim.notify(
        '[markdown-preview] command is only available for filetypes: '
          .. table.concat(config.get().filetypes, ', '),
        vim.log.levels.WARN
      )
      return
    end
    fn()
  end
end

function M.create()
  for _, name in ipairs({
    'MarkdownPreview',
    'MarkdownPreviewStop',
    'MarkdownPreviewToggle',
  }) do
    pcall(vim.api.nvim_del_user_command, name)
  end

  vim.api.nvim_create_user_command(
    'MarkdownPreview',
    guard(function()
      require('mkdp').open()
    end),
    { desc = 'Start markdown preview' }
  )

  vim.api.nvim_create_user_command(
    'MarkdownPreviewStop',
    guard(function()
      require('mkdp').close()
    end),
    { desc = 'Stop markdown preview' }
  )

  vim.api.nvim_create_user_command(
    'MarkdownPreviewToggle',
    guard(function()
      require('mkdp').toggle()
    end),
    { desc = 'Toggle markdown preview' }
  )

  vim.keymap.set('n', '<Plug>MarkdownPreview', ':MarkdownPreview<CR>', {
    silent = true,
  })
  vim.keymap.set('i', '<Plug>MarkdownPreview', '<Esc>:MarkdownPreview<CR>a', {
    silent = true,
  })
  vim.keymap.set('n', '<Plug>MarkdownPreviewStop', ':MarkdownPreviewStop<CR>', {
    silent = true,
  })
  vim.keymap.set(
    'i',
    '<Plug>MarkdownPreviewStop',
    '<Esc>:MarkdownPreviewStop<CR>a',
    { silent = true }
  )
  vim.keymap.set(
    'n',
    '<Plug>MarkdownPreviewToggle',
    ':MarkdownPreviewToggle<CR>',
    { silent = true }
  )
  vim.keymap.set(
    'i',
    '<Plug>MarkdownPreviewToggle',
    '<Esc>:MarkdownPreviewToggle<CR>a',
    { silent = true }
  )
end

return M
