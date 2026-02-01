import { defineConfig } from 'vitepress';

const REPO = 'state-sync';
const IS_GH_ACTIONS = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  lang: 'en-US',
  title: 'state-sync',
  description: 'Reliable state synchronization between windows/processes using revision + snapshot',

  // For GitHub Pages you typically set base to "/<repo>/".
  // Keep "/" by default; adjust if you deploy under a subpath.
  base: IS_GH_ACTIONS ? `/${REPO}/` : '/',

  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    outline: 'deep',
    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Guide', link: '/guide/quickstart' },
      { text: 'API', link: '/api/' },
      {
        text: 'Packages',
        items: [
          { text: 'Overview', link: '/packages/' },
          { text: 'Core (@statesync/core)', link: '/packages/core' },
          { text: 'Pinia (@statesync/pinia)', link: '/packages/pinia' },
          { text: 'Tauri (@statesync/tauri)', link: '/packages/tauri' },
        ],
      },
      { text: 'Examples', link: '/examples/' },
      { text: 'Lifecycle', link: '/lifecycle' },
      { text: 'Troubleshooting', link: '/troubleshooting' },
    ],

    sidebar: {
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Core (@statesync/core)', link: '/api/core/' },
            { text: 'Pinia (@statesync/pinia)', link: '/api/pinia/' },
            { text: 'Tauri (@statesync/tauri)', link: '/api/tauri/' },
          ],
        },
      ],
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Quickstart', link: '/guide/quickstart' },
            { text: 'Protocol (mental model)', link: '/guide/protocol' },
            { text: 'Multi-window patterns', link: '/guide/multi-window' },
          ],
        },
      ],
      '/packages/': [
        {
          text: 'Packages',
          items: [
            { text: 'Overview', link: '/packages/' },
            { text: 'Core (@statesync/core)', link: '/packages/core' },
            { text: 'Pinia (@statesync/pinia)', link: '/packages/pinia' },
            { text: 'Tauri (@statesync/tauri)', link: '/packages/tauri' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Source of truth (in-memory)', link: '/examples/source-of-truth' },
            { text: 'Structured logging', link: '/examples/structured-logging' },
          ],
        },
      ],
      '/': [
        {
          text: 'Reference',
          items: [
            { text: 'Compatibility', link: '/compatibility' },
            { text: 'Lifecycle', link: '/lifecycle' },
            { text: 'Troubleshooting', link: '/troubleshooting' },
            { text: 'Release checklist', link: '/release-checklist' },
            { text: 'Adapter authoring', link: '/adapters/adapter-authoring' },
            { text: 'Pinia adapter notes', link: '/adapters/pinia' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/777genius/state-sync' }],

    editLink: {
      pattern: 'https://github.com/777genius/state-sync/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 777genius',
    },
  },
});
