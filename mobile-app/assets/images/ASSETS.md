This folder contains source images for the Expo app.

Files:
- icon.png or icon-512x512.png - primary square app icon source used to generate variants
- splash-icon.png - optional splash artwork (centered)
- android-icon-foreground.png / android-icon-background.png - adaptive icon parts
- favicon.png - web favicon

Generated outputs (tools/generate-icons.js):
- generated/icon-<size>x<size>.png (48..1024)
- generated/ios-icon-<base>x<base>@3x.png
- generated/splash-2732x2732.png (or fallback splash-from-icon-1200x1200.png)

Usage:
1. Install dependencies:

```bash
cd mobile-app
pnpm install
```

2. Generate assets (requires `sharp`):

```bash
pnpm run generate:assets
```

3. Review `assets/images/generated/` and copy required files into platform-specific locations or update `app.json` to point to generated files.

Notes:
- The script requires `sharp` and Node 16+.
- The script resizes `icon.png`; for best results, provide a high-resolution square PNG (at least 2048x2048).
