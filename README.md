# portfolio

Personal site for Songya (Sophia) Zhang: an intro, project cards and a live design-token panel.

Plain HTML and CSS, no framework and no build step.

- **Tokens.** `styles.css` starts with primitive values (colors, type, spacing), then semantic tokens (`--color-bg`, `--color-surface`, `--color-text`…). Components use only semantic tokens; the dark theme redefines them.
- **Themes.** Follows the system setting until the visitor uses the toggle; the choice is kept in `localStorage`. A tiny inline script sets the theme before first paint.
- **Accessibility.** Landmarks, a skip link, visible focus, AA contrast in both themes, 44 px touch targets, reduced-motion support.

## Run locally

```bash
npx serve .
```

Live at https://sophiazhangio.github.io, served by GitHub Pages from `main`. Fonts are self-hosted under the SIL Open Font License (`fonts/LICENSE-OFL.txt`); icons are from Phosphor (MIT).
