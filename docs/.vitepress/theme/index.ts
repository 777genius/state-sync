import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import CopyOrDownloadAsMarkdownButtons from 'vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue';
import ApiPackageList from './ApiPackageList.vue';
import ExploreGrid from './ExploreGrid.vue';
import FrameworkGrid from './FrameworkGrid.vue';
import InstallBlock from './InstallBlock.vue';
import Layout from './Layout.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router }) {
    app.component('ApiPackageList', ApiPackageList);
    app.component('CopyOrDownloadAsMarkdownButtons', CopyOrDownloadAsMarkdownButtons);
    app.component('ExploreGrid', ExploreGrid);
    app.component('FrameworkGrid', FrameworkGrid);
    app.component('InstallBlock', InstallBlock);

    if (typeof window !== 'undefined') {
      window.addEventListener('vite:preloadError', () => {
        window.location.reload();
      });
    }
  },
} satisfies Theme;
