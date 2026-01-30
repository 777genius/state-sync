import { defineConfig } from 'vitepress';

const REPO = 'state-sync';
const IS_GH_ACTIONS = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  lang: 'ru-RU',
  title: 'state-sync',
  description: 'Надёжная синхронизация состояния между окнами/процессами через revision + snapshot',

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
      {
        text: 'Packages',
        items: [
          { text: 'Overview', link: '/packages/' },
          { text: 'Core (state-sync)', link: '/packages/core' },
          { text: 'Pinia (state-sync-pinia)', link: '/packages/pinia' },
          { text: 'Tauri (state-sync-tauri)', link: '/packages/tauri' },
        ],
      },
      { text: 'Examples', link: '/examples/' },
      {
        text: 'Design',
        items: [
          { text: 'Iteration 0001', link: '/iterations/0001-bootstrap-and-core-protocol' },
          { text: 'Iteration 0002', link: '/iterations/0002-production-readiness' },
          {
            text: 'Iteration 0003',
            link: '/iterations/0003-dx-observability-and-contract-hardening',
          },
        ],
      },
      { text: 'Lifecycle', link: '/lifecycle' },
      { text: 'Troubleshooting', link: '/troubleshooting' },
    ],

    sidebar: {
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
            { text: 'Core (state-sync)', link: '/packages/core' },
            { text: 'Pinia (state-sync-pinia)', link: '/packages/pinia' },
            { text: 'Tauri (state-sync-tauri)', link: '/packages/tauri' },
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
      '/iterations/': [
        {
          text: 'Design docs',
          items: [
            {
              text: '0001 — Bootstrap + Core Protocol',
              link: '/iterations/0001-bootstrap-and-core-protocol',
            },
            { text: '0002 — Production Readiness', link: '/iterations/0002-production-readiness' },
            {
              text: '0003 — DX/Observability/Contracts',
              link: '/iterations/0003-dx-observability-and-contract-hardening',
            },
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
