import fs from 'node:fs';
import path from 'node:path';

interface SidebarItem {
  text: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
}

const PACKAGE_ORDER = [
  'core',
  'persistence',
  'pinia',
  'zustand',
  'valtio',
  'svelte',
  'vue',
  'tauri',
];

const SUBCATEGORY_LABELS: Record<string, string> = {
  functions: 'Functions',
  interfaces: 'Interfaces',
  'type-aliases': 'Type Aliases',
  variables: 'Variables',
};

const SUBCATEGORY_ORDER = ['functions', 'interfaces', 'type-aliases', 'variables'];

function readSymbols(dir: string, basePath: string): SidebarItem[] {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b))
    .map((f) => ({
      text: f.replace(/\.md$/, ''),
      link: `${basePath}/${f.replace(/\.md$/, '')}`,
    }));
}

export function generateApiSidebar(): SidebarItem[] {
  const apiDir = path.resolve(__dirname, '../api');

  const packageItems: SidebarItem[] = PACKAGE_ORDER.filter((pkg) =>
    fs.existsSync(path.join(apiDir, pkg)),
  ).map((pkg) => {
    const pkgDir = path.join(apiDir, pkg);
    const basePath = `/api/${pkg}`;

    const subcategories: SidebarItem[] = SUBCATEGORY_ORDER.filter((sub) =>
      fs.existsSync(path.join(pkgDir, sub)),
    )
      .map((sub) => {
        const symbols = readSymbols(path.join(pkgDir, sub), `${basePath}/${sub}`);
        if (symbols.length === 0) return null;
        return {
          text: SUBCATEGORY_LABELS[sub],
          collapsed: true,
          items: symbols,
        };
      })
      .filter((item): item is SidebarItem => item !== null);

    return {
      text: `@statesync/${pkg}`,
      collapsed: true,
      items: [{ text: 'Overview', link: `${basePath}/` }, ...subcategories],
    };
  });

  return [
    {
      text: 'API Reference',
      items: [{ text: 'Overview', link: '/api/' }, ...packageItems],
    },
  ];
}
