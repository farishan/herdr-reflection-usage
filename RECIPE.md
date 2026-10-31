# RECIPE: reflection-usage mod for Herdr

Build a Herdr mod that shows Reflection AI rate-limit/usage status.

## Goal

Display remaining Reflection requests/tokens/output/uncached input and
reset timers in a Herdr sidebar panel, refreshed every 60 seconds.

## Files to create (empty folder -> working mod)

```
mods/reflection-usage/
  mod.json
  main.js
reflection-usage          # helper script (on PATH)
preview.png               # screenshot
RECIPE.md
```

## mod.json

```json
{ "place": "none", "title": "Reflection usage" }
```

## main.js

- Import `View, div` from `gpui-kit`, `h_flex, v_flex` from `gpui-base`, and `exec, theme` from `herdr`.
- View class with `init(_props, cx)`:
  - state: `data`, `error`
  - `cx.spawn` loop: `refresh`, `cx.notify`, `cx.sleep(60000)`
- `refresh`: run `exec("reflection-usage", [])`; parse JSON on success, else store error.
- `fmt`, `secs` helpers.
- `row(label, remaining, limit, reset)` rendering.
- `render`: title, last-checked time, error (if any), six usage rows.

No `layouts/` folder; users add the mod to their own layout.

## Helper script `reflection-usage`

- Resolve API key from `REFLECTION_API_KEY` or `~/.config/reflection-usage/api_key`.
- `curl` Reflection `/openai/v1/chat/completions` with `max_tokens: 1`.
- Parse `x-ratelimit-*` headers into JSON with Python.
- Print JSON to stdout.

## Install

1. Copy `reflection-usage` to `~/.local/bin` (chmod +x).
2. Create `~/.config/reflection-usage/api_key` with the Reflection JWT.
3. Copy `mods/reflection-usage` to `~/.config/herdr-app/mods/reflection-usage`.
4. `herdr-app check ~/.config/herdr-app/mods/reflection-usage`
5. Open via `herdr-app do tab.new --mod reflection-usage --name "Reflection usage"`.

## Notes

- Polling uses one minimal request per minute.
- Mod calls the script by name, so it must be on Herdr's PATH.