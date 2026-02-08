import { defineConfig } from 'vitepress';
import { transformerNotationDiff, transformerNotationFocus, transformerNotationHighlight, transformerNotationErrorLevel } from '@shikijs/transformers';
import llmstxt, { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { generateApiSidebar } from './apiSidebar';

const REPO = 'state-sync';
const IS_GH_ACTIONS = process.env.GITHUB_ACTIONS === 'true';

const SITE_URL = 'https://777genius.github.io/state-sync/';
const SITE_TITLE = 'state-sync';
const SITE_DESCRIPTION =
  'Reliable state synchronization between windows/processes using revision + snapshot';

export default withMermaid(
  defineConfig({
    lang: 'en-US',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,

    // For GitHub Pages you typically set base to "/<repo>/".
    // Keep "/" by default; adjust if you deploy under a subpath.
    base: IS_GH_ACTIONS ? `/${REPO}/` : '/',

    head: [
      ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: SITE_TITLE }],
      ['meta', { property: 'og:description', content: SITE_DESCRIPTION }],
      ['meta', { property: 'og:url', content: SITE_URL }],
      ['meta', { name: 'twitter:card', content: 'summary' }],
      ['meta', { name: 'twitter:title', content: SITE_TITLE }],
      ['meta', { name: 'twitter:description', content: SITE_DESCRIPTION }],
    ],

    cleanUrls: true,
    lastUpdated: true,

    sitemap: {
      hostname: 'https://777genius.github.io/state-sync/',
    },

    vite: {
      plugins: [llmstxt()],
      optimizeDeps: {
        include: ['dayjs', 'mermaid', 'cytoscape', 'cytoscape-cose-bilkent', '@braintree/sanitize-url', 'debug'],
      },
    },

    markdown: {
      codeTransformers: [
        transformerNotationDiff(),
        transformerNotationFocus(),
        transformerNotationHighlight(),
        transformerNotationErrorLevel(),
      ],
      config(md) {
        md.use(copyOrDownloadAsMarkdownButtons);
      },
    },

    themeConfig: {
      logo: '/logo.png',
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
        '/api/': generateApiSidebar(),
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
