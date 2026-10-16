-- Shared helpers: plugin root discovery, message echoing and platform info.
local M = {}

--- Absolute path of the plugin root directory (parent of `lua/`).
function M.root()
  local src = debug.getinfo(1, 'S').source
  src = src:sub(1, 1) == '@' and src:sub(2) or src
  return vim.fn.fnamemodify(src, ':h:h:h')
end

--- Path to the bundled node server.
function M.server_bundle()
  return M.root() .. '/app/dist/mkdp-server.cjs'
end

--- Echo a list of messages with a highlight group (like `echohl` + `echom`).
---@param hl string highlight group, e.g. 'Error' / 'Type'
---@param msgs string|string[]
function M.echo_messages(hl, msgs)
  if not msgs then
    return
  end
  if type(msgs) == 'string' then
    msgs = { msgs }
  end
  local chunks = {}
  for _, msg in ipairs(msgs) do
    if msg ~= '' then
      chunks[#chunks + 1] = { tostring(msg) .. '\n', hl }
    end
  end
  if #chunks == 0 then
    return
  end
  vim.api.nvim_echo(chunks, true, {})
end

function M.echo_url(url)
  M.echo_messages('Type', 'Preview page: ' .. tostring(url))
end

--- Platform tag, kept close to the original for path/health reporting.
function M.get_platform()
  local os = jit and jit.os or ''
  if os == 'Windows' then
    return 'win'
  elseif os == 'OSX' then
    if vim.fn.system('uname -m'):match('arm64') then
      return 'macos-arm64'
    end
    return 'macos'
  end
  return 'linux'
end

return M
