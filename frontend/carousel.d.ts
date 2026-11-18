export interface CarouselOptions {
  autoplay: boolean;
  duration: number;
  arrows: boolean;
  dots: boolean;
  loop: boolean;
  random: number;
}

export function initCarousels(root?: ParentNode): void;

export function readCarouselOptions(wrapper: HTMLElement): CarouselOptions;

export function selectRandomSlides<T>(
  slides: ArrayLike<T>,
  count: number,
  random?: () => number,
): T[];

export function slideDelayMs(
  slide: HTMLElement,
  fallbackSeconds: number,
): number;
