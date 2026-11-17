import { defineConfig } from 'wxt'

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: 'Giraffe mood refresh',
    description:
      'A little mood-refreshing giraffe for the current page. Reading help, a screenshot snapshot, and a local mood toy — all stored on this device.',
    permissions: ['activeTab', 'storage', 'scripting'],
    action: { default_title: 'Open the giraffe' },
    icons: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
    browser_specific_settings: {
      gecko: {
        id: 'giraffe-mood-refresh@bachcha001.github.io',
        strict_min_version: '115.0',
        data_collection_permissions: { required: ['none'] },
      },
    },
  },
})
