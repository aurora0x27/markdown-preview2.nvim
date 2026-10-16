# mkdp — Markdown Preview for Neovim

A modern, pure-Lua rewrite of [`iamcco/markdown-preview.nvim`](https://github.com/iamcco/markdown-preview.nvim).
Preview Markdown in your browser with synchronised scrolling, KaTeX, Mermaid,
PlantUML, charts, diagrams, local images and more.

- Pure Lua plugin (no `plugin/` directory, no vimscript).
- Configured through `require('mkdp').setup { ... }`.
- The rendering frontend and the Node HTTP/WebSocket server are kept, and are
  bridged to the Lua plugin over a single msgpack-rpc channel.
- The server is pre-bundled, so **only `node` is required at runtime** — no
  `npm install` needed.

## Requirements

- Neovim **0.10+**
- `node` in `PATH` (to run the preview server)

## Installation

With [lazy.nvim](https://github.com/folke/lazy.nvim):

```lua
{
  'aurora0x27/markdown-preview2.nvim',
  build = 'cd app && yarn install',
  cmd = { 'MarkdownPreview', 'MarkdownPreviewStop', 'MarkdownPreviewToggle' },
  ft = { 'markdown' },
  opts = { auto_close = true }, -- theme = 'dark' | 'light' | '' (OS default)
}
```

Or manually: add the repository to `runtimepath` and call `setup`:

```lua
require('mkdp').setup {
  auto_close = true,
  browser = '',
  theme = '',
  -- ...
}
```

## Commands

| Command | Description |
| --- | --- |
| `:MarkdownPreview` | Open the preview |
| `:MarkdownPreviewStop` | Stop the preview |
| `:MarkdownPreviewToggle` | Toggle the preview |

By default the commands only work in files whose `filetype` is listed in
`filetypes` (`markdown`). Set `command_for_global = true` to make them
available everywhere.

## Mappings

```vim
nmap <C-s> <Plug>MarkdownPreview
nmap <M-s> <Plug>MarkdownPreviewStop
nmap <C-p> <Plug>MarkdownPreviewToggle
```

## Lua API

```lua
local mkdp = require('mkdp')
mkdp.setup(opts)
mkdp.open()    -- start the server if needed and open the browser
mkdp.close()   -- stop the server and close all preview pages
mkdp.toggle()
mkdp.status()  -- true when the server is running
mkdp.install() -- (re)build the bundled server; requires node + npm
```

## Configuration

```lua
require('mkdp').setup {
  -- open the preview automatically after entering a markdown buffer
  auto_start = false,
  -- close the preview when leaving the markdown buffer
  auto_close = true,
  -- only refresh on save / insert-leave instead of on every cursor move
  refresh_slow = false,
  -- make the commands available for every filetype
  command_for_global = false,
  -- filetypes that get the commands
  filetypes = { 'markdown' },

  -- server
  open_to_the_world = false, -- listen on 0.0.0.0 instead of 127.0.0.1
  open_ip = '',              -- custom ip used to build the preview url
  port = nil,                -- custom port, nil for a random one
  browser = '',              -- browser command, '' for the system default
  browserfunc = nil,         -- fun(url) to open the url yourself
  echo_preview_url = false,  -- echo the preview url in the command line

  -- rendering
  page_title = '「${name}」', -- ${name} is replaced with the file name
  theme = '',                -- 'dark' / 'light', '' follows the OS
  markdown_css = nil,        -- absolute path to a custom markdown css
  highlight_css = nil,       -- absolute path to a custom highlight css
  images_path = nil,         -- custom directory for local images

  -- combine several previews into a single browser window
  combine_preview = false,
  combine_preview_auto_refresh = true,

  preview_options = {
    mkit = {},                 -- markdown-it options
    katex = {},                -- KaTeX options
    uml = {},                  -- plantuml options
    maid = {},                 -- mermaid options
    disable_sync_scroll = false,
    sync_scroll_type = 'middle', -- 'middle' | 'top' | 'relative'
    hide_yaml_meta = true,
    sequence_diagrams = {},
    flowchart_diagrams = {},
    content_editable = false,
    disable_filename = false,
    toc = {},
  },
}
```

## Architecture

```
Neovim (Lua)                         Node server                     Browser
  │  jobstart(rpc = true)                │                              │
  │ ── rpcnotify/rpcrequest ──────────►  │  HTTP (static + images)      │
  │      refresh_content / close_page    │  socket.io ────────────────► │
  │      open_browser / close_all_pages  │  refresh_content / close_page│
  │ ◄──── luaeval `mkdp._rpc` ─────────  │                              │
  │      echo / echo_url / browserfunc   │                              │
  │      open_browser                    │                              │
```

- `lua/mkdp/init.lua` — public API and the `_rpc` dispatch entry point.
- `lua/mkdp/rpc.lua` — node process lifecycle and the rpc bridge.
- `lua/mkdp/config.lua` — defaults, normalization and the `g:mkdp_*` mirror.
- `lua/mkdp/command.lua` / `autocmd.lua` — commands, `<Plug>` maps, autocmds.
- `app/` — the node server and the prebuilt frontend (`app/out`, `app/_static`).

### Rebuilding the server

The bundle at `app/dist/mkdp-server.cjs` is committed. To rebuild it after
changing anything under `app/`:

```sh
cd app && npm install && npm run build
```

or from Neovim:

```vim
:lua require('mkdp').install()
```

See `:checkhealth mkdp` for diagnostics.

## Development

Lua code is formatted with [StyLua](https://github.com/JohnnyMorganz/StyLua)
using the committed `stylua.toml`. Formatting is enforced by
[pre-commit](https://pre-commit.com); install the git hooks once per clone:

```sh
pre-commit install
```

The `stylua` hook formats staged `*.lua` files. It calls the `stylua` binary
from `PATH` (equivalent to StyLua's official `stylua-system` hook); see
`.pre-commit-config.yaml` for how to vendor StyLua through the official
repository instead. The first run after an edit rewrites the files and fails —
re-add them and run again (or just `git commit` a second time). Bypass with
`git commit --no-verify`.

Run it manually over every tracked file with:

```sh
pre-commit run --all-files
```

## Differences from the original

- Pure Lua modules; configured with `require('mkdp').setup{}` only.
- No `g:mkdp_*` configuration variables (they are still *written* internally
  so the node server can read them, but they are not the public interface).
- The server reads the config from the mirrored `g:mkdp_*` variables.
- `browserfunc` is a Lua function `function(url) ... end` rather than the name
  of a Vimscript function.
- Neovim only (no Vim support).

## License

MIT — see [LICENSE](./LICENSE).
