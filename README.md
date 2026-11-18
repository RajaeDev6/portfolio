# Rajae Givans - Portfolio

My portfolio has two versions. The **normal site** (`/site/`) is a plain portfolio page. The root is an **interactive version**: a capture-the-flag game where most of the portfolio is encrypted and each flag decrypts more of it.

The interactive version is a live coding environment. A narrow Vim-style editor on the left holds the site's source, written in **rg**, a small language I made for it. The large pane on the right is a browser-style preview of what the rg interpreter renders. Each section (about, experience, projects, security, skills, education, contact) is a buffer.

Live: [rajaedev.space](https://rajaedev.space)

---

## How it works

- **Buffers as sections.** Click a tab, press `1`–`7`, use `gt` / `gT`, or type `:e projects`. Links in the preview open other buffers too. Each buffer has its own URL (`/#projects`).
- **Code that writes itself.** The first time a buffer opens, its source types out in insert mode and the preview builds up as each property is written. Click the code, press `Esc` or hit "skip typing" to jump to the end. Visitors who prefer reduced motion get the finished code straight away.
- **Edit it yourself.** Click the code and type: the preview re-renders as you go, even while a block is half-written. Edits stay in the tab; `:e!` or "undo my edits" restores the original.
- **Code and preview are linked.** Hover anything in the preview to highlight the lines that produce it; click it to jump the editor there. Moving the cursor in the code outlines the matching block in the preview.
- **Interactive preview.** Project cards open into the full write-up, and screenshots open full size.
- **Layout.** Drag the divider to resize the code pane, or hide the code entirely. Both are remembered.
- **Safe to edit.** Edits only change what you see in your own tab and reset on reload. While the code is edited, links in the preview are switched off. Every string is HTML-escaped, only `https://` links that appear in the original source can ever become working links, and screenshot names, icons and buffer targets are checked against fixed lists.
- **A capture-the-flag that walks through the portfolio.** Each file hides a flag (an rg comment) right next to a detail worth knowing, and each question points at that detail:
  1. `about.rg`: what I do
  2. `experience.rg`: where I interned
  3. `projects.rg`: which app finds the cheapest groceries
  4. `security.rg`: which project trains security analysts

  Find a flag by clicking the detail in the preview (which jumps the editor to its code) or by searching with `/flag` (`n` for the next match), then submit it with `:flag rg{...}` or the CTF dialog. Each flag opens the next file; the last one opens skills, education and contact and shows my email, GitHub and LinkedIn. Locked files show scrambled code and a link to the same section on the normal site. A strip above the preview always shows the current question, and the detail it's about is marked in the preview. Flags are checked against SHA-256 hashes.
- **Normal site.** `/site/` has the same content as a plain portfolio page, linked from the editor's tab bar, the first-visit note and the help.
- **A real interpreter.** `assets/rg.js` tokenizes, parses and renders rg. It never throws on half-typed code, which is what lets the preview update while the code is still being written.
- **Vim touches.** Line numbers, cursor line, `~` past the end of the file, a mode indicator, a status line and a command line (`:e`, `:e!`, `:b 3`, `:bn`, `:ls`, `:w`, `:help`, `:12`) and search (`/pattern`, `n`, `N`). `j`/`k`, `gg`/`G` and `Ctrl-d`/`Ctrl-u` move the cursor.
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
3. If you changed `assets/styles.css` (editor) or `assets/site.css` (normal site), run `python3 tools/inline-css.py`. It inlines each stylesheet into its pages and updates the CSP hashes in `_headers`.

The normal site's pages (`site/index.html`, `site/projects.html`) are plain HTML; edit them directly.

## Tech

- Hand-written HTML, CSS and JavaScript modules. No frameworks, no bundler.
- JetBrains Mono for the editor and Nunito Sans for the preview, both self-hosted.
- Hugeicons as an inline SVG sprite.
- `_headers` sets a strict Content-Security-Policy (scripts from this site only, inline CSS allowed by hash), HSTS, `nosniff`, a referrer policy, a permissions policy and frame blocking.
- The email address is assembled in JavaScript, so it never appears whole in the page source.

## Contact

- LinkedIn: https://linkedin.com/in/rajae-g
- GitHub: https://github.com/RajaeDev6
