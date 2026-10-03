export async function transitionView(
  oldView: HTMLElement | null,
  newView: HTMLElement,
  parent: HTMLElement
): Promise<void> {
  if (oldView) {
    oldView.classList.add('view-leave');
    await sleep(150);
    oldView.remove();
  }

  newView.classList.add('view-enter');
  parent.appendChild(newView);

  requestAnimationFrame(() => {
    newView.classList.add('view-enter-active');
  });

  await sleep(250);
  newView.classList.remove('view-enter', 'view-enter-active');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function staggerChildren(parent: HTMLElement, selector: string, delayMs: number = 50): void {
  const children = parent.querySelectorAll(selector);
  children.forEach((child, index) => {
    (child as HTMLElement).style.animationDelay = `${index * delayMs}ms`;
  });
}
