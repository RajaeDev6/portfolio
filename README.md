# Rajae Givans - Portfolio

My portfolio is a live coding environment. A narrow Vim-style editor on the left holds the site's source, written in **rg**, a small language I made for it. The large pane on the right is a browser-style preview of what the rg interpreter renders. Each section (about, experience, projects, security, skills, education, contact) is a buffer.

Live: [rajaedev.space](https://rajaedev.space)

---

## How it works

- **Buffers as sections.** Click a tab, press `1`–`7`, use `gt` / `gT`, or type `:e projects`. Links in the preview open other buffers too. Each buffer has its own URL (`/#projects`).
- **Code that writes itself.** The first time a buffer opens, its source types out in insert mode and the preview builds up as each property is written. Click the code, press `Esc` or hit "skip typing" to jump to the end. Visitors who prefer reduced motion get the finished code straight away.
- **Edit it yourself.** Click the code and type: the preview re-renders as you go, even while a block is half-written. Edits stay in the tab; `:e!` or "undo my edits" restores the original.
- **Code and preview are linked.** Hover anything in the preview to highlight the lines that produce it; click it to jump the editor there. Moving the cursor in the code outlines the matching block in the preview.
- **Interactive preview.** Project cards open into the full write-up, and screenshots open full size.
- **Layout.** Drag the divider to resize the code pane, or hide the code entirely. Both are remembered.
- **A real interpreter.** `assets/rg.js` tokenizes, parses and renders rg. It never throws on half-typed code, which is what lets the preview update while the code is still being written.
- **Vim touches.** Line numbers, cursor line, `~` past the end of the file, a mode indicator, a status line and a command line (`:e`, `:e!`, `:b 3`, `:bn`, `:ls`, `:w`, `:help`, `:12`). `j`/`k`, `gg`/`G` and `Ctrl-d`/`Ctrl-u` move the cursor.
- **Phones.** One pane at a time with a Preview / Code switch; the preview shows first.
- **No JavaScript.** Every section is prerendered into `index.html`, so search engines and visitors without JavaScript get the full content as a plain page.

## The rg language

```
-- comment
module projects
title "Projects"                 section heading
heading "More projects"          sub-heading

project shop_weh {               block: <kind> <name> {
  name    "Shop Weh"             property: <key> <args...>
  text    "Add your grocery list and Shop Weh shows"
       .. "which store has it cheapest"     .. continues the last string
  stack   [Next.js, Firebase]    list
  button  "Email me" -> mail     arrow points at a target (mail, :e buffer, or a URL)
  link    "GitHub"               a line starting with a string adds an argument
          "https://github.com/RajaeDev6"
}
```

Block kinds: `profile`, `job`, `project`, `item`, `skills`, `entry`, `contact`.

## Editing content

1. Edit the files in `src/*.rg`.
2. Run `node tools/build.mjs`. It writes `assets/sources.js` (what the editor loads) and prerenders every section into `index.html`.
3. If you changed `assets/styles.css`, run `python3 tools/inline-css.py`. It inlines the CSS into `index.html` and updates the CSP hash in `_headers`.

## Tech

- Hand-written HTML, CSS and JavaScript modules. No frameworks, no bundler.
- JetBrains Mono for the editor and Nunito Sans for the preview, both self-hosted.
- Hugeicons as an inline SVG sprite.
- `_headers` sets a strict Content-Security-Policy (scripts from this site only, inline CSS allowed by hash), HSTS, `nosniff`, a referrer policy, a permissions policy and frame blocking.
- The email address is assembled in JavaScript, so it never appears whole in the page source.

## Contact

- LinkedIn: https://linkedin.com/in/rajae-g
- GitHub: https://github.com/RajaeDev6
