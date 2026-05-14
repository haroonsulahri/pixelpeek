const DEFAULT_SETTINGS = {
  enabled: true,
  showNatural: true,
  showRendered: true,
  showBackgrounds: false
};

const controls = {};

document.addEventListener("DOMContentLoaded", () => {
  Object.keys(DEFAULT_SETTINGS).forEach((key) => {
    controls[key] = document.getElementById(key);
  });

  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    Object.entries(settings).forEach(([key, value]) => {
      if (controls[key]) {
        controls[key].checked = Boolean(value);
      }
    });
  });

  Object.entries(controls).forEach(([key, control]) => {
    control.addEventListener("change", () => {
      chrome.storage.sync.set({
        [key]: control.checked
      });
    });
  });
});
