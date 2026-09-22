# Temu Media Importer

BrewCart includes a local Playwright-based importer for public Temu product media.

It collects image and video resources that the product page exposes during a normal browser load. It does not include CAPTCHA bypass, authentication bypass, anti-bot evasion, proxy rotation, or undocumented private Temu APIs.

## Windows

Double-click:

`TEMU-IMPORT.bat`

Paste a Temu product URL.

Files are saved under:

`data/imports/<TEMU_PRODUCT_ID>/`

Each import contains:

- `images/`
- `videos/`
- `manifest.json`

The manifest records the original supplier URL, product ID, page title, media source URLs, and local filenames.

## Command line

```bat
npm run import:temu -- "TEMU_URL"
```

You can also pass several URLs:

```bat
npm run import:temu -- "URL_1" "URL_2" "URL_3"
```

"All media" means all usable public image/video resources exposed during the normal browser session. Temu can change its page structure, lazy-loading behavior, region behavior, or media delivery.

Before reusing supplier media commercially, confirm you have permission and comply with applicable platform and supplier terms.
