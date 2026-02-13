import { useData } from 'vitepress';
import { onMounted, onUnmounted, watchEffect } from 'vue';
import { packageIcons } from './package-icons';

const SLUG = '{slug}';

const targets = [
  `.VPMenu a[href$="/packages/${SLUG}"]::before`,
  `.VPNavScreenMenuGroupLink a[href$="/packages/${SLUG}"]::before`,
  `.VPSidebarItem a.link[href$="/packages/${SLUG}"]::before`,
  `.VPSidebarItem a.link[href$="/api/${SLUG}/"]::before`,
];

function sel(slug: string) {
  return targets.map((t) => t.replaceAll(SLUG, slug)).join(',\n');
}

function baseSelectors() {
  return Object.keys(packageIcons)
    .flatMap((slug) => targets.map((t) => t.replaceAll(SLUG, slug)))
    .join(',\n');
}

export function useNavIcons() {
  const { isDark } = useData();
  let styleEl: HTMLStyleElement | null = null;

  onMounted(() => {
    styleEl = document.createElement('style');
    styleEl.id = 'nav-package-icons';
    document.head.appendChild(styleEl);

    watchEffect(() => {
      const dark = isDark.value;

      let css = `${baseSelectors()} {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  vertical-align: middle;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
}`;

      for (const [slug, icon] of Object.entries(packageIcons)) {
        const url = dark && icon.dark ? icon.dark : icon.light;
        css += `\n${sel(slug)} { background-image: url("${url}"); }`;
      }

      if (styleEl) {
        styleEl.textContent = css;
      }
    });
  });

  onUnmounted(() => {
    styleEl?.remove();
  });
}
