# GitHub Publishing Guide

Use this guide to publish PixelPeek as a public GitHub repository.

## Pre-Publish Checklist

- Confirm `manifest.json` version is correct.
- Confirm all extension icons exist in `icons/`.
- Load the extension locally in Chrome.
- Test image hover badges on at least 3 normal websites.
- Test the popup toggles.
- Confirm `README.md`, `PRIVACY.md`, `LICENSE`, and `CHANGELOG.md` are included.

## Validate Files

Run from the parent folder:

```powershell
node --check .\pixelpeek\content.js
node --check .\pixelpeek\popup.js
node -e "JSON.parse(require('fs').readFileSync('.\\pixelpeek\\manifest.json','utf8')); console.log('manifest ok')"
```

## Create GitHub Repository

1. Go to GitHub.
2. Create a new public repository named `pixelpeek`.
3. Do not initialize it with a README, license, or gitignore because this project already includes them.

## Push From Local

Run from the PixelPeek folder:

```powershell
cd "E:\Haroon Chats\pixelpeek"
git init
git add .
git commit -m "Initial PixelPeek Chrome extension"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/pixelpeek.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your real GitHub username.

## Create A Release Zip

Run from the PixelPeek folder:

```powershell
$version = (Get-Content .\manifest.json | ConvertFrom-Json).version
$zipPath = "..\pixelpeek-v$version.zip"
Compress-Archive -Path .\manifest.json, .\content.js, .\popup.html, .\popup.css, .\popup.js, .\icons -DestinationPath $zipPath -Force
Write-Host "Created $zipPath"
```

Attach the generated zip file to a GitHub release.

## Suggested GitHub Repository Description

```text
Minimal Chrome extension that shows image dimensions on hover.
```

## Suggested Topics

```text
chrome-extension
manifest-v3
image-tools
web-development
seo
frontend
developer-tools
```

## Chrome Web Store Notes

For Chrome Web Store publishing, prepare:

- extension zip file
- 128x128 extension icon
- short description
- full description
- screenshots
- privacy policy

The included `PRIVACY.md` can be used as the base privacy policy text.
