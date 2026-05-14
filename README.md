# PixelPeek

PixelPeek is a lightweight Chrome extension that shows image dimensions when you hover over images on any webpage.

It is built for developers, designers, SEO specialists, and eCommerce teams who need to quickly inspect image sizes without opening DevTools.

## Features

- Shows a compact image size badge on hover
- Displays natural/original image dimensions
- Displays rendered dimensions on the page
- Optional CSS background image detection
- Simple toolbar popup with enable/disable controls
- Manifest V3 Chrome extension
- No tracking, no analytics, no external dependencies

## Preview

When hovering over an image, PixelPeek shows a small badge in the top-right corner:

```text
1200 x 800 px
Rendered 600 x 400 px
```

## Install Locally

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the PixelPeek folder.
6. Open any normal webpage and hover over an image.

Chrome blocks extensions on internal pages like `chrome://extensions`, `chrome://settings`, and the Chrome Web Store.

## Project Structure

```text
pixelpeek/
icons/
  icon-16.png
  icon-32.png
  icon-48.png
  icon-128.png
  icon-source.svg
content.js
manifest.json
popup.css
popup.html
popup.js
CHANGELOG.md
LICENSE
PRIVACY.md
README.md
```

## Development

No build step is required.

After editing files:

1. Go to `chrome://extensions`.
2. Click the reload icon on PixelPeek.
3. Refresh the webpage you are testing.
4. Hover over an image again.

## Verification

Run these checks from the project parent folder:

```powershell
node --check .\pixelpeek\content.js
node --check .\pixelpeek\popup.js
node -e "JSON.parse(require('fs').readFileSync('.\\pixelpeek\\manifest.json','utf8')); console.log('manifest ok')"
```

## Privacy

PixelPeek does not collect, store, sell, or transmit user data. Settings are stored only through Chrome extension storage. See [PRIVACY.md](PRIVACY.md).

## License

MIT License. See [LICENSE](LICENSE).
