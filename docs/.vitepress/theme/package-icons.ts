function toDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export interface PackageIcon {
  light: string;
  dark?: string;
}

export interface PackageEntry {
  name: string;
  slug: string;
  link: string;
  color: string;
  icon: PackageIcon;
}

const defs: Record<string, { name: string; color: string; svg: string; darkSvg?: string }> = {
  core: {
    name: 'Core',
    color: '#3178c6',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3178c6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  },
  persistence: {
    name: 'Persistence',
    color: '#6b7280',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  },
  redux: {
    name: 'Redux',
    color: '#764abc',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.5" fill="#764abc"/><ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="#764abc" stroke-width="1.3"/><ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="#764abc" stroke-width="1.3" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="#764abc" stroke-width="1.3" transform="rotate(120 12 12)"/></svg>`,
  },
  zustand: {
    name: 'Zustand',
    color: '#433e38',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="7" cy="6" r="2.5" fill="#433e38"/><circle cx="17" cy="6" r="2.5" fill="#433e38"/><circle cx="4" cy="12" r="2" fill="#433e38"/><circle cx="20" cy="12" r="2" fill="#433e38"/><ellipse cx="12" cy="14" rx="6" ry="7" fill="#433e38"/><ellipse cx="9.5" cy="13" rx="1.5" ry="2" fill="white" opacity="0.3"/><ellipse cx="14.5" cy="13" rx="1.5" ry="2" fill="white" opacity="0.3"/></svg>`,
    darkSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="7" cy="6" r="2.5" fill="#a08b6e"/><circle cx="17" cy="6" r="2.5" fill="#a08b6e"/><circle cx="4" cy="12" r="2" fill="#a08b6e"/><circle cx="20" cy="12" r="2" fill="#a08b6e"/><ellipse cx="12" cy="14" rx="6" ry="7" fill="#a08b6e"/><ellipse cx="9.5" cy="13" rx="1.5" ry="2" fill="white" opacity="0.3"/><ellipse cx="14.5" cy="13" rx="1.5" ry="2" fill="white" opacity="0.3"/></svg>`,
  },
  jotai: {
    name: 'Jotai',
    color: '#000000',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="#000"/><ellipse cx="12" cy="12" rx="10" ry="4.5" fill="none" stroke="#000" stroke-width="1.2"/><ellipse cx="12" cy="12" rx="10" ry="4.5" fill="none" stroke="#000" stroke-width="1.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" fill="none" stroke="#000" stroke-width="1.2" transform="rotate(-60 12 12)"/></svg>`,
    darkSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="#e5e5e5"/><ellipse cx="12" cy="12" rx="10" ry="4.5" fill="none" stroke="#e5e5e5" stroke-width="1.2"/><ellipse cx="12" cy="12" rx="10" ry="4.5" fill="none" stroke="#e5e5e5" stroke-width="1.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" fill="none" stroke="#e5e5e5" stroke-width="1.2" transform="rotate(-60 12 12)"/></svg>`,
  },
  mobx: {
    name: 'MobX',
    color: '#e05415',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="5" r="3" fill="#e05415"/><circle cx="5" cy="18" r="3" fill="#e05415"/><circle cx="19" cy="18" r="3" fill="#e05415"/><line x1="12" y1="8" x2="5" y2="15" stroke="#e05415" stroke-width="1.5"/><line x1="12" y1="8" x2="19" y2="15" stroke="#e05415" stroke-width="1.5"/></svg>`,
  },
  pinia: {
    name: 'Pinia',
    color: '#ffd859',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 3C9.5 3 7.5 5 7.5 7.5V8C6 8 5 9.5 5 11.5C5 14 6.5 16 8 17.5C9.5 19 11 20 12 21C13 20 14.5 19 16 17.5C17.5 16 19 14 19 11.5C19 9.5 18 8 16.5 8V7.5C16.5 5 14.5 3 12 3Z" fill="#42b883"/><path d="M12 3C10.5 3 9 4 8.5 5.5C9.5 4.5 10.7 4 12 4C13.3 4 14.5 4.5 15.5 5.5C15 4 13.5 3 12 3Z" fill="#35495e"/><path d="M10 1.5C10.5 0.5 11 0 12 0C13 0 13.5 0.5 14 1.5L13 3H11L10 1.5Z" fill="#42b883" opacity="0.7"/></svg>`,
  },
  valtio: {
    name: 'Valtio',
    color: '#764abc',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#764abc" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="none" stroke="#764abc" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="#764abc"/><line x1="12" y1="2" x2="12" y2="6" stroke="#764abc" stroke-width="1.5"/><line x1="12" y1="18" x2="12" y2="22" stroke="#764abc" stroke-width="1.5"/><line x1="2" y1="12" x2="6" y2="12" stroke="#764abc" stroke-width="1.5"/><line x1="18" y1="12" x2="22" y2="12" stroke="#764abc" stroke-width="1.5"/></svg>`,
  },
  svelte: {
    name: 'Svelte',
    color: '#ff3e00',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.68 3.17a6.33 6.33 0 0 0-8.7-1.67L7.24 4.72a5.21 5.21 0 0 0-2.36 3.5 5.44 5.44 0 0 0 .53 3.59 5.2 5.2 0 0 0-.78 1.94 5.55 5.55 0 0 0 .95 4.22 6.33 6.33 0 0 0 8.7 1.67l4.74-3.22a5.21 5.21 0 0 0 2.36-3.5 5.44 5.44 0 0 0-.53-3.59 5.2 5.2 0 0 0 .78-1.94 5.55 5.55 0 0 0-.95-4.22z" fill="#ff3e00"/><path d="M10.07 19.61a3.88 3.88 0 0 1-4.16-1.53 3.39 3.39 0 0 1-.58-2.58 3.3 3.3 0 0 1 .13-.53l.12-.33.3.22a6.13 6.13 0 0 0 1.85 1l.18.05-.02.18a1.03 1.03 0 0 0 .2.72 1.19 1.19 0 0 0 1.28.47 1.1 1.1 0 0 0 .31-.13l4.74-3.22a1 1 0 0 0 .46-.68 1.04 1.04 0 0 0-.18-.79 1.19 1.19 0 0 0-1.28-.47 1.1 1.1 0 0 0-.31.13l-1.81 1.23a3.6 3.6 0 0 1-1 .42 3.88 3.88 0 0 1-4.16-1.53 3.39 3.39 0 0 1-.58-2.58 3.27 3.27 0 0 1 1.49-2.21l4.74-3.22a3.6 3.6 0 0 1 1-.42 3.88 3.88 0 0 1 4.16 1.53 3.39 3.39 0 0 1 .58 2.58 3.3 3.3 0 0 1-.13.53l-.12.33-.3-.22a6.13 6.13 0 0 0-1.85-1l-.18-.05.02-.18a1.03 1.03 0 0 0-.2-.72 1.19 1.19 0 0 0-1.28-.47 1.1 1.1 0 0 0-.31.13L9.43 9.48a1 1 0 0 0-.46.68 1.04 1.04 0 0 0 .18.79 1.19 1.19 0 0 0 1.28.47 1.1 1.1 0 0 0 .31-.13l1.81-1.23a3.6 3.6 0 0 1 1-.42 3.88 3.88 0 0 1 4.16 1.53 3.39 3.39 0 0 1 .58 2.58 3.27 3.27 0 0 1-1.49 2.21l-4.74 3.22a3.6 3.6 0 0 1-1 .42z" fill="white"/></svg>`,
  },
  vue: {
    name: 'Vue',
    color: '#42b883',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 3h4l6 10.1L18 3h4L12 21.5z" fill="#42b883"/><path d="M6.8 3h4.4L12 4.8 12.8 3h4.4L12 13.2z" fill="#35495e"/></svg>`,
  },
  tauri: {
    name: 'Tauri',
    color: '#ffc131',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="15" cy="7.5" r="5.5" fill="none" stroke="#ffc131" stroke-width="2"/><circle cx="9" cy="16.5" r="5.5" fill="none" stroke="#ffc131" stroke-width="2"/><circle cx="15" cy="7.5" r="2" fill="#ffc131"/><circle cx="9" cy="16.5" r="2" fill="#ffc131"/></svg>`,
  },
  electron: {
    name: 'Electron',
    color: '#47848f',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.5" fill="#47848f"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#47848f" stroke-width="1.2"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#47848f" stroke-width="1.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#47848f" stroke-width="1.2" transform="rotate(120 12 12)"/></svg>`,
  },
};

export const packageIcons: Record<string, PackageIcon> = Object.fromEntries(
  Object.entries(defs).map(([slug, d]) => [
    slug,
    {
      light: toDataUri(d.svg),
      dark: d.darkSvg ? toDataUri(d.darkSvg) : undefined,
    },
  ]),
);

function toEntry(slug: string): PackageEntry {
  const d = defs[slug];
  return {
    name: d.name,
    slug,
    link: `/packages/${slug}`,
    color: d.color,
    icon: packageIcons[slug],
  };
}

export const stateAdapters: PackageEntry[] = [
  'redux',
  'zustand',
  'jotai',
  'mobx',
  'pinia',
  'valtio',
  'svelte',
  'vue',
].map(toEntry);

export const runtimeAdapters: PackageEntry[] = ['tauri', 'electron'].map(toEntry);
