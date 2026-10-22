/* eslint-disable no-empty */
// DARK MODE (shared by every page)
// Follows the OS setting until the visitor presses #darkBtn, then remembers the
// choice in localStorage ('1' = dark, '0' = light).
// Dark styles live in dark.css, linked with data-dark. This file is loaded in
// <head> without defer, right after that link, so the saved theme is applied
// before the page paints (no flash of the wrong theme).
(function () {
  const STORAGE_KEY = 'dark';
  const osDark = matchMedia('(prefers-color-scheme: dark)');

  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {}
  let dark = saved === null ? osDark.matches : saved === '1';

  function apply() {
    document.querySelectorAll('link[data-dark]').forEach((link) => {
      link.media = dark ? 'screen' : 'not all';
    });
    const meta = document.querySelector('meta[name=color-scheme]');
    if (meta) meta.content = dark ? 'dark' : 'light';
    // Status bar colour follows the chosen theme, not just the OS (values: html background in css.css / dark.css)
    document.querySelectorAll('meta[name=theme-color]').forEach((m) => {
      m.content = dark ? '#222' : '#fefefe';
    });
    const button = document.querySelector('#darkBtn');
    if (button) button.setAttribute('aria-pressed', String(dark));
  }

  // Switching after first paint would start every colour transition on the
  // page at once, so the switch happens with transitions off for that frame
  // (css.css / w-css.css: html[data-theme-switching]).
  function applyInstantly() {
    const root = document.documentElement;
    root.setAttribute('data-theme-switching', '');
    apply();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.removeAttribute('data-theme-switching'));
    });
  }

  // Until the visitor picks a theme, follow OS changes live
  osDark.addEventListener('change', (e) => {
    if (saved !== null) return;
    dark = e.matches;
    applyInstantly();
  });

  apply();

  document.addEventListener('DOMContentLoaded', () => {
    apply();
    const button = document.querySelector('#darkBtn');
    if (!button) return;
    button.addEventListener('click', () => {
      dark = !dark;
      saved = dark ? '1' : '0';
      try {
        localStorage.setItem(STORAGE_KEY, saved);
      } catch (e) {}
      applyInstantly();
    });
  });
})();
