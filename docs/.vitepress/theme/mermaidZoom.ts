import { nextTick, onMounted, watch, type Ref } from 'vue';

let backdrop: HTMLElement | null = null;
let activeDiagram: HTMLElement | null = null;
let placeholder: HTMLElement | null = null;

function createBackdrop() {
  if (backdrop) return backdrop;

  backdrop = document.createElement('div');
  backdrop.className = 'mermaid-zoom-backdrop';

  backdrop.addEventListener('click', close);
  document.body.appendChild(backdrop);
  return backdrop;
}

function close() {
  if (!activeDiagram || !backdrop) return;

  activeDiagram.classList.remove('mermaid-zoomed');
  backdrop.classList.remove('active');
  document.body.style.overflow = '';

  // Move diagram back to its original position
  if (placeholder?.parentNode) {
    placeholder.parentNode.replaceChild(activeDiagram, placeholder);
  }

  activeDiagram = null;
  placeholder = null;
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

function setupMermaidZoom() {
  const diagrams = document.querySelectorAll<HTMLElement>('.mermaid');

  for (const diagram of diagrams) {
    if (diagram.dataset.zoomable !== undefined) continue;
    diagram.dataset.zoomable = 'true';
    diagram.style.cursor = 'zoom-in';

    const hint = document.createElement('div');
    hint.className = 'mermaid-zoom-hint';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    const polyline1 = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'polyline',
    );
    polyline1.setAttribute('points', '15 3 21 3 21 9');
    const line1 = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line',
    );
    line1.setAttribute('x1', '14');
    line1.setAttribute('y1', '10');
    line1.setAttribute('x2', '21');
    line1.setAttribute('y2', '3');

    const polyline2 = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'polyline',
    );
    polyline2.setAttribute('points', '9 21 3 21 3 15');
    const line2 = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line',
    );
    line2.setAttribute('x1', '10');
    line2.setAttribute('y1', '14');
    line2.setAttribute('x2', '3');
    line2.setAttribute('y2', '21');

    svg.append(polyline1, line1, polyline2, line2);
    hint.appendChild(svg);
    diagram.style.position = 'relative';
    diagram.appendChild(hint);

    diagram.addEventListener('click', () => {
      if (activeDiagram) return;

      // Ensure SVG has viewBox so it can scale
      const svgEl = diagram.querySelector<SVGSVGElement>(':scope > svg');
      if (svgEl && !svgEl.getAttribute('viewBox')) {
        const w = svgEl.getAttribute('width') || String(svgEl.getBoundingClientRect().width);
        const h = svgEl.getAttribute('height') || String(svgEl.getBoundingClientRect().height);
        svgEl.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
      }

      const bg = createBackdrop();
      activeDiagram = diagram;

      // Leave a placeholder so we can put it back
      placeholder = document.createElement('div');
      placeholder.style.height = `${diagram.offsetHeight}px`;
      diagram.parentNode?.replaceChild(placeholder, diagram);

      // Move diagram into backdrop
      bg.appendChild(diagram);

      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        bg.classList.add('active');
        diagram.classList.add('mermaid-zoomed');
      });
    });
  }
}

export function useMermaidZoom(pagePath: Ref<string>) {
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
    nextTick(setupMermaidZoom);
  });
  watch(pagePath, () => nextTick(setupMermaidZoom));
}
