# Walking Quests

A small daily walking-quest app built with React, Vite, and Tailwind CSS. Pick a quest, mark it complete, and revisit completed adventures from the calendar.

## Getting started

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Publish with Surge

Publish the production build to Surge with:

```bash
npm run publish
```

This deploys to `walkingquests.surge.sh`.

### If you fork this project

Before publishing your fork, change `walkingquests.surge.sh` in the `publish` script in `package.json` to a Surge domain you control. Surge domains are shared globally, so a fork needs its own unique domain.

## Editing quests

The quest pool is in [src/content/mini-quests.md](src/content/mini-quests.md). Add or edit one quest per line using this format:

```md
- 🧭 | Pick a cardinal direction and walk that way for 15 minutes.
```

The app reads this file during its Vite build, so no code changes are needed to update the available quests.

## How it works

- Use the recycle button to choose a different quest before completing it.
- Complete a quest to add its stamp to the calendar.
- Hover, focus, or tap a historical stamp to see its quest and completion date/time.
- Completion and quest-selection data is stored locally in the browser.

## Project structure

- `src/App.tsx` — application UI and interaction logic
- `src/index.css` — global styles and calendar/stamp effects
- `src/content/mini-quests.md` — editable quest catalog
- `public/favicon.svg` — question-mark favicon
- `.figma/make/site.json` — page title and site metadata
