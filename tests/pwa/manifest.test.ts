import { expect, test } from 'vitest';
import { pwaOptions } from '../../vite.config';

test('manifest is landscape fullscreen and has icons', () => {
  expect(pwaOptions.manifest).toMatchObject({
    name: 'Piano Stars',
    short_name: 'Piano Stars',
    display: 'fullscreen',
    orientation: 'landscape',
    theme_color: '#43A047',
  });
  const icons = (pwaOptions.manifest as { icons: { sizes: string }[] }).icons;
  expect(icons.map((i) => i.sizes)).toEqual(['192x192', '512x512']);
});

test('service worker auto-updates and precaches build assets', () => {
  expect(pwaOptions.registerType).toBe('autoUpdate');
  expect(pwaOptions.workbox?.globPatterns).toEqual(['**/*.{js,css,html,png,svg,woff2}']);
});
