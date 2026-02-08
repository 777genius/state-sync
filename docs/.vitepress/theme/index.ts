import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import CopyOrDownloadAsMarkdownButtons from 'vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue';
import InstallBlock from './InstallBlock.vue';
import Layout from './Layout.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('CopyOrDownloadAsMarkdownButtons', CopyOrDownloadAsMarkdownButtons);
    app.component('InstallBlock', InstallBlock);
  },
} satisfies Theme;
