(() => {
  const DEFAULT_SETTINGS = {
    enabled: true,
    showNatural: true,
    showRendered: true,
    showBackgrounds: false
  };

  const MIN_VISIBLE_SIZE = 12;
  const BACKGROUND_CACHE_LIMIT = 120;

  let settings = { ...DEFAULT_SETTINGS };
  let activeTarget = null;
  let activeInfo = null;
  let hoverBadge = null;
  let shadowRoot = null;
  const backgroundSizeCache = new Map();

  init();

  function init() {
    loadSettings();
    createOverlay();

    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    window.addEventListener("scroll", updateOverlayPosition, true);
    window.addEventListener("resize", updateOverlayPosition, true);

    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "sync") {
          return;
        }

        settings = {
          ...settings,
          ...Object.fromEntries(
            Object.entries(changes).map(([key, value]) => [key, value.newValue])
          )
        };

        if (!settings.enabled) {
          hideOverlay();
        } else if (activeTarget) {
          updateOverlay(activeTarget);
        }
      });
    }
  }

  function loadSettings() {
    if (!chrome?.storage?.sync) {
      return;
    }

    chrome.storage.sync.get(DEFAULT_SETTINGS, (savedSettings) => {
      settings = {
        ...DEFAULT_SETTINGS,
        ...savedSettings
      };
    });
  }

  function createOverlay() {
    if (hoverBadge) {
      return;
    }

    const host = document.createElement("div");
    host.id = "pixelpeek-root";
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.pointerEvents = "none";
    host.style.zIndex = "2147483647";

    shadowRoot = host.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = `
      .pixelpeek-badge {
        position: fixed;
        display: none;
        max-width: min(260px, calc(100vw - 16px));
        box-sizing: border-box;
        padding: 5px 7px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 6px;
        background: rgba(17, 24, 39, 0.94);
        color: #ffffff;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.22);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 11px;
        font-weight: 600;
        line-height: 1.35;
        letter-spacing: 0;
        text-align: right;
        white-space: nowrap;
        pointer-events: none;
        user-select: none;
        backdrop-filter: blur(10px);
      }

      .pixelpeek-badge__line {
        display: block;
      }

      .pixelpeek-badge__muted {
        color: rgba(255, 255, 255, 0.72);
        font-weight: 500;
      }
    `;

    hoverBadge = document.createElement("div");
    hoverBadge.className = "pixelpeek-badge";

    shadowRoot.append(style, hoverBadge);
    document.documentElement.appendChild(host);
  }

  function handleMouseOver(event) {
    if (!settings.enabled) {
      return;
    }

    const target = findImageTarget(event.target);

    if (!target) {
      return;
    }

    activeTarget = target;
    updateOverlay(target);
  }

  function handleMouseMove(event) {
    if (!settings.enabled || !activeTarget) {
      return;
    }

    if (!activeTarget.contains(event.target) && activeTarget !== event.target) {
      return;
    }

    updateOverlayPosition();
  }

  function handleMouseOut(event) {
    if (!activeTarget) {
      return;
    }

    const nextElement = event.relatedTarget;

    if (nextElement && activeTarget.contains(nextElement)) {
      return;
    }

    hideOverlay();
  }

  function findImageTarget(node) {
    if (!(node instanceof Element)) {
      return null;
    }

    const directImage = node.closest("img, input[type='image'], image");

    if (directImage && isUsableTarget(directImage)) {
      return directImage;
    }

    if (!settings.showBackgrounds) {
      return null;
    }

    const backgroundElement = findBackgroundImageElement(node);

    if (backgroundElement && isUsableTarget(backgroundElement)) {
      return backgroundElement;
    }

    return null;
  }

  function findBackgroundImageElement(node) {
    let current = node;

    while (current && current !== document.documentElement) {
      const backgroundImage = getComputedStyle(current).backgroundImage;

      if (extractBackgroundUrl(backgroundImage)) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  function isUsableTarget(element) {
    const rect = element.getBoundingClientRect();

    return rect.width >= MIN_VISIBLE_SIZE && rect.height >= MIN_VISIBLE_SIZE;
  }

  function updateOverlay(target) {
    if (!hoverBadge) {
      return;
    }

    const info = getImageInfo(target);

    if (!info) {
      hideOverlay();
      return;
    }

    activeInfo = info;
    hoverBadge.innerHTML = formatBadge(info);
    hoverBadge.style.display = "block";
    updateOverlayPosition();
  }

  function updateOverlayPosition() {
    if (!activeTarget || !hoverBadge || hoverBadge.style.display === "none") {
      return;
    }

    const rect = activeTarget.getBoundingClientRect();

    if (rect.width < MIN_VISIBLE_SIZE || rect.height < MIN_VISIBLE_SIZE) {
      hideOverlay();
      return;
    }

    const margin = 6;
    const badgeWidth = hoverBadge.offsetWidth || 90;
    const left = clamp(rect.right - badgeWidth - margin, 8, window.innerWidth - badgeWidth - 8);
    const top = clamp(rect.top + margin, 8, window.innerHeight - 24);

    hoverBadge.style.left = `${Math.round(left)}px`;
    hoverBadge.style.top = `${Math.round(top)}px`;
  }

  function hideOverlay() {
    if (hoverBadge) {
      hoverBadge.style.display = "none";
      hoverBadge.textContent = "";
    }

    activeTarget = null;
    activeInfo = null;
  }

  function getImageInfo(target) {
    const renderedWidth = Math.round(target.getBoundingClientRect().width);
    const renderedHeight = Math.round(target.getBoundingClientRect().height);

    if (target instanceof HTMLImageElement || target instanceof HTMLInputElement) {
      return {
        naturalWidth: Number(target.naturalWidth || target.width || 0),
        naturalHeight: Number(target.naturalHeight || target.height || 0),
        renderedWidth,
        renderedHeight,
        type: "image"
      };
    }

    if (target instanceof SVGImageElement) {
      return {
        naturalWidth: Number(target.width?.baseVal?.value || 0),
        naturalHeight: Number(target.height?.baseVal?.value || 0),
        renderedWidth,
        renderedHeight,
        type: "svg-image"
      };
    }

    const backgroundUrl = extractBackgroundUrl(getComputedStyle(target).backgroundImage);

    if (!backgroundUrl) {
      return null;
    }

    const cachedSize = backgroundSizeCache.get(backgroundUrl);

    if (!cachedSize) {
      loadBackgroundSize(backgroundUrl, target);
    }

    return {
      naturalWidth: cachedSize?.width || 0,
      naturalHeight: cachedSize?.height || 0,
      renderedWidth,
      renderedHeight,
      type: "background"
    };
  }

  function formatBadge(info) {
    const lines = [];
    const hasNatural = info.naturalWidth > 0 && info.naturalHeight > 0;
    const hasRendered = info.renderedWidth > 0 && info.renderedHeight > 0;

    if (settings.showNatural && hasNatural) {
      lines.push(`<span class="pixelpeek-badge__line">${info.naturalWidth} x ${info.naturalHeight} px</span>`);
    }

    if (settings.showRendered && hasRendered) {
      const label = settings.showNatural && hasNatural ? "Rendered " : "";
      lines.push(`<span class="pixelpeek-badge__line pixelpeek-badge__muted">${label}${info.renderedWidth} x ${info.renderedHeight} px</span>`);
    }

    if (!lines.length) {
      lines.push(`<span class="pixelpeek-badge__line pixelpeek-badge__muted">Loading size</span>`);
    }

    if (info.type === "background") {
      lines.push(`<span class="pixelpeek-badge__line pixelpeek-badge__muted">Background</span>`);
    }

    return lines.join("");
  }

  function loadBackgroundSize(url, target) {
    const image = new Image();

    image.onload = () => {
      cacheBackgroundSize(url, {
        width: image.naturalWidth,
        height: image.naturalHeight
      });

      if (activeTarget === target) {
        updateOverlay(target);
      }
    };

    image.onerror = () => {
      cacheBackgroundSize(url, {
        width: 0,
        height: 0
      });
    };

    image.src = url;
  }

  function cacheBackgroundSize(url, size) {
    if (backgroundSizeCache.size >= BACKGROUND_CACHE_LIMIT) {
      const oldestKey = backgroundSizeCache.keys().next().value;
      backgroundSizeCache.delete(oldestKey);
    }

    backgroundSizeCache.set(url, size);
  }

  function extractBackgroundUrl(backgroundImage) {
    if (!backgroundImage || backgroundImage === "none") {
      return "";
    }

    const match = backgroundImage.match(/url\((["']?)(.*?)\1\)/);
    return match?.[2] || "";
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();
