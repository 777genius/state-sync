import { nextTick, onMounted, type Ref, watch } from 'vue';

const MAX_HEIGHT = 380;

function collapseCodeblocks() {
  const blocks = document.querySelectorAll<HTMLElement>('.vp-doc div[class*="language-"]');

  for (const block of blocks) {
    if (block.dataset.collapsed !== undefined) continue;

    const pre = block.querySelector('pre');
    if (!pre || pre.scrollHeight <= MAX_HEIGHT) continue;

    block.dataset.collapsed = 'true';
    pre.style.maxHeight = `${MAX_HEIGHT}px`;
    pre.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.className = 'code-collapse-overlay';

    const btn = document.createElement('button');
    btn.className = 'code-collapse-btn';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '6 9 12 15 18 9');
    svg.appendChild(polyline);
    btn.appendChild(svg);

    btn.addEventListener('click', () => {
      const isCollapsed = block.dataset.collapsed === 'true';
      if (isCollapsed) {
        pre.style.maxHeight = 'none';
        pre.style.overflow = 'auto';
        block.dataset.collapsed = 'false';
        overlay.classList.add('expanded');
        btn.classList.add('expanded');
      } else {
        const oldTop = btn.getBoundingClientRect().top;
        pre.style.maxHeight = `${MAX_HEIGHT}px`;
        pre.style.overflow = 'hidden';
        pre.scrollTo(0, 0);
        block.dataset.collapsed = 'true';
        overlay.classList.remove('expanded');
        btn.classList.remove('expanded');
        window.scrollTo(0, btn.getBoundingClientRect().top + window.scrollY - oldTop);
      }
    });

    const toggle = () => btn.click();
    overlay.addEventListener('click', (e) => {
      if (e.target !== btn && !btn.contains(e.target as Node)) toggle();
    });

    overlay.appendChild(btn);
    block.style.position = 'relative';
    block.appendChild(overlay);
  }
}

export function useCodeblockCollapse(pagePath: Ref<string>) {
  onMounted(() => nextTick(collapseCodeblocks));
  watch(pagePath, () => nextTick(collapseCodeblocks));
}
