import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import llmstxt from 'vitepress-plugin-llms';
import { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms';

const REPO = 'state-sync';
const IS_GH_ACTIONS = process.env.GITHUB_ACTIONS === 'true';

export default withMermaid(
  defineConfig({
    lang: 'en-US',
    title: 'state-sync',
    description: 'Reliable state synchronization between windows/processes using revision + snapshot',

    // For GitHub Pages you typically set base to "/<repo>/".
    // Keep "/" by default; adjust if you deploy under a subpath.
    base: IS_GH_ACTIONS ? `/${REPO}/` : '/',

    cleanUrls: true,
    lastUpdated: true,

    vite: {
      plugins: [llmstxt()],
    },

    markdown: {
      config(md) {
        md.use(copyOrDownloadAsMarkdownButtons);
      },
    },

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
            { text: '@statesync/core', link: '/packages/core' },
            { text: '@statesync/persistence', link: '/packages/persistence' },
            { text: '@statesync/pinia', link: '/packages/pinia' },
            { text: '@statesync/zustand', link: '/packages/zustand' },
            { text: '@statesync/valtio', link: '/packages/valtio' },
            { text: '@statesync/svelte', link: '/packages/svelte' },
            { text: '@statesync/vue', link: '/packages/vue' },
            { text: '@statesync/tauri', link: '/packages/tauri' },
          ],
        },
        { text: 'Architecture', link: '/architecture' },
        { text: 'Examples', link: '/examples/' },
        { text: 'API', link: '/api/' },
        {
          text: 'Reference',
          items: [
            { text: 'Comparison', link: '/comparison' },
            { text: 'Lifecycle', link: '/lifecycle' },
            { text: 'Troubleshooting', link: '/troubleshooting' },
            { text: 'Compatibility', link: '/compatibility' },
          ],
        },
      ],

      sidebar: {
        '/api/': [
          {
            text: 'API Reference',
            items: [
              { text: 'Overview', link: '/api/' },
              { text: '@statesync/core', link: '/api/core/' },
              { text: '@statesync/persistence', link: '/api/persistence/' },
              { text: '@statesync/pinia', link: '/api/pinia/' },
              { text: '@statesync/zustand', link: '/api/zustand/' },
              { text: '@statesync/valtio', link: '/api/valtio/' },
              { text: '@statesync/svelte', link: '/api/svelte/' },
              { text: '@statesync/vue', link: '/api/vue/' },
              { text: '@statesync/tauri', link: '/api/tauri/' },
            ],
          },
        ],
        '/guide/': [
          {
            text: 'Getting Started',
            items: [
              { text: 'Quickstart', link: '/guide/quickstart' },
              { text: 'Protocol (mental model)', link: '/guide/protocol' },
            ],
          },
          {
            text: 'Guides',
            items: [
              { text: 'Writing state', link: '/guide/writing-state' },
              { text: 'Custom transports', link: '/guide/custom-transports' },
              { text: 'Multi-window patterns', link: '/guide/multi-window' },
            ],
          },
        ],
        '/packages/': [
          {
            text: 'Core',
            items: [
              { text: 'Overview', link: '/packages/' },
              { text: '@statesync/core', link: '/packages/core' },
              { text: '@statesync/persistence', link: '/packages/persistence' },
            ],
          },
          {
            text: 'Framework Adapters',
            items: [
              { text: '@statesync/pinia', link: '/packages/pinia' },
              { text: '@statesync/zustand', link: '/packages/zustand' },
              { text: '@statesync/valtio', link: '/packages/valtio' },
              { text: '@statesync/svelte', link: '/packages/svelte' },
              { text: '@statesync/vue', link: '/packages/vue' },
            ],
          },
          {
            text: 'Transport Adapters',
            items: [{ text: '@statesync/tauri', link: '/packages/tauri' }],
          },
        ],
        '/examples/': [
          {
            text: 'Framework Examples',
            items: [
              { text: 'Overview', link: '/examples/' },
              { text: 'React + Zustand', link: '/examples/react-zustand' },
              { text: 'Vue + Pinia + Tauri', link: '/examples/vue-pinia-tauri' },
            ],
          },
          {
            text: 'Core Patterns',
            items: [
              { text: 'Source of truth', link: '/examples/source-of-truth' },
              { text: 'Throttling & coalescing', link: '/examples/throttling' },
              { text: 'toState mapping', link: '/examples/tostate-mapping' },
              { text: 'Persistence stack', link: '/examples/persistence-stack' },
              { text: 'Structured logging', link: '/examples/structured-logging' },
              { text: 'Error handling & retry', link: '/examples/error-handling' },
              { text: 'Persistence with migrations', link: '/examples/persistence-migration' },
            ],
          },
        ],
        '/': [
          {
            text: 'Start Here',
            items: [
              { text: 'Quickstart', link: '/guide/quickstart' },
              { text: 'Architecture', link: '/architecture' },
              { text: 'Comparison', link: '/comparison' },
            ],
          },
          {
            text: 'Reference',
            items: [
              { text: 'Lifecycle', link: '/lifecycle' },
              { text: 'Troubleshooting', link: '/troubleshooting' },
              { text: 'Compatibility', link: '/compatibility' },
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
  }),
);
