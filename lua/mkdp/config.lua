-- Configuration: Lua-native defaults, a normalizer, and a mirror to the
-- `g:mkdp_*` variables that the node server reads back through the neovim API.
local M = {}

---@class mkdp.PreviewOptions
---@field mkit table markdown-it options
---@field katex table KaTeX options
---@field uml table plantuml options
---@field maid table mermaid options
---@field disable_sync_scroll boolean
---@field sync_scroll_type 'middle'|'top'|'relative'
---@field hide_yaml_meta boolean
---@field sequence_diagrams table
---@field flowchart_diagrams table
---@field content_editable boolean
---@field disable_filename boolean
---@field toc table

---@class mkdp.Config
---@field auto_start boolean
---@field auto_close boolean
---@field refresh_slow boolean
---@field command_for_global boolean
---@field filetypes string[]
---@field open_to_the_world boolean
---@field open_ip string
---@field port integer|nil
---@field browser string
---@field browserfunc fun(url: string)|string|nil
---@field echo_preview_url boolean
---@field page_title string
---@field theme string
---@field markdown_css string|nil
---@field highlight_css string|nil
---@field images_path string|nil
---@field combine_preview boolean
---@field combine_preview_auto_refresh boolean
---@field preview_options mkdp.PreviewOptions

local defaults = {
  auto_start = false,
  auto_close = true,
  refresh_slow = false,
  command_for_global = false,
  filetypes = { 'markdown' },
  open_to_the_world = false,
  open_ip = '',
  port = nil,
  browser = '',
  browserfunc = nil,
  echo_preview_url = false,
  page_title = '「${name}」',
  theme = '',
  markdown_css = nil,
  highlight_css = nil,
  images_path = nil,
  combine_preview = false,
  combine_preview_auto_refresh = true,
  preview_options = {
    mkit = {},
    katex = {},
    uml = {},
    maid = {},
    disable_sync_scroll = false,
    sync_scroll_type = 'middle',
    hide_yaml_meta = true,
    sequence_diagrams = {},
    flowchart_diagrams = {},
    content_editable = false,
    disable_filename = false,
    toc = {},
  },
}

local config = vim.deepcopy(defaults)

-- The frontend reads these with strict integer checks (`=== 1`), so normalize
-- the booleans to 0/1 before handing them to the node server.
local BOOL_FIELDS = {
  'disable_sync_scroll',
  'hide_yaml_meta',
  'content_editable',
  'disable_filename',
}
local TABLE_FIELDS = {
  'mkit',
  'katex',
  'uml',
  'maid',
  'sequence_diagrams',
  'flowchart_diagrams',
  'toc',
}

local function normalize_preview(opts)
  local out = vim.deepcopy(opts or {})
  for _, key in ipairs(BOOL_FIELDS) do
    if out[key] == nil then
      out[key] = defaults.preview_options[key]
    end
    out[key] = out[key] and 1 or 0
  end
  for _, key in ipairs(TABLE_FIELDS) do
    if type(out[key]) ~= 'table' then
      out[key] = {}
    end
  end
  if type(out.sync_scroll_type) ~= 'string' then
    out.sync_scroll_type = defaults.preview_options.sync_scroll_type
  end
  return out
end

--- Mirror the config into `vim.g` so the node server can read it with `getVar`.
---@param cfg mkdp.Config
function M.mirror(cfg)
  vim.g.mkdp_preview_options = cfg.preview_options
  vim.g.mkdp_page_title = cfg.page_title
  vim.g.mkdp_theme = cfg.theme
  vim.g.mkdp_markdown_css = cfg.markdown_css or ''
  vim.g.mkdp_highlight_css = cfg.highlight_css or ''
  vim.g.mkdp_images_path = cfg.images_path or ''
  vim.g.mkdp_open_to_the_world = cfg.open_to_the_world and 1 or 0
  vim.g.mkdp_port = cfg.port or ''
  vim.g.mkdp_open_ip = cfg.open_ip or ''
  vim.g.mkdp_browser = cfg.browser or ''
  vim.g.mkdp_echo_preview_url = cfg.echo_preview_url and 1 or 0
  vim.g.mkdp_combine_preview = cfg.combine_preview and 1 or 0
  vim.g.mkdp_browserfunc = cfg.browserfunc and 'lua' or ''
  vim.g.mkdp_clients_active = 0
end

---@param opts mkdp.Config|nil
---@return mkdp.Config
function M.setup(opts)
  opts = opts or {}
  config = vim.tbl_extend('force', vim.deepcopy(defaults), opts)
  config.preview_options = normalize_preview(
    vim.tbl_deep_extend(
      'force',
      vim.deepcopy(defaults.preview_options),
      opts.preview_options or {}
    )
  )
  M.mirror(config)
  return config
end

---@return mkdp.Config
function M.get()
  return config
end

---@return mkdp.Config
function M.defaults()
  return vim.deepcopy(defaults)
end

return M
