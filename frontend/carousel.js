// @ts-check

import EmblaCarousel from "embla-carousel";
import Accessibility from "embla-carousel-accessibility";
import Autoplay from "embla-carousel-autoplay";
import ClassNames from "embla-carousel-class-names";
import { CAROUSEL_DEFAULTS } from "../lib/carousel-defaults.js";

const SCROLL_DURATION = 25;

/**
 * @param {string | undefined} value
 * @param {boolean} fallback
 */
function booleanAttr(value, fallback) {
  if (value === "false") return false;
  if (value === "true") return true;
  return fallback;
}

/**
 * @param {HTMLElement} wrapper
 */
export function readCarouselOptions(wrapper) {
  const data = wrapper.dataset;
  const duration = Number(data.duration);
  const random = Number(data.random);

  return {
    autoplay: booleanAttr(data.autoplay, CAROUSEL_DEFAULTS.autoplay),
    duration:
      Number.isFinite(duration) && duration > 0
        ? duration
        : CAROUSEL_DEFAULTS.duration,
    arrows: booleanAttr(data.arrows, CAROUSEL_DEFAULTS.arrows),
    dots: booleanAttr(data.dots, CAROUSEL_DEFAULTS.dots),
    pause: booleanAttr(data.pause, CAROUSEL_DEFAULTS.pause),
    loop: booleanAttr(data.loop, CAROUSEL_DEFAULTS.loop),
    random:
      Number.isFinite(random) && random > 0
        ? Math.floor(random)
        : CAROUSEL_DEFAULTS.random,
  };
}

/**
 * Pick `count` items in random order. A count of 0, or a count that covers
 * every item, returns the original list in its original order.
 *
 * @template T
 * @param {ArrayLike<T>} slides
 * @param {number} count
 * @param {() => number} [random]
 * @returns {T[]}
 */
export function selectRandomSlides(slides, count, random = Math.random) {
  const list = Array.from(slides);
  const n = Math.floor(count);
  if (!n || n >= list.length) return list;

  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, n);
}

/**
 * @param {HTMLElement} slide
 * @param {number} fallbackSeconds
 */
export function slideDelayMs(slide, fallbackSeconds) {
  const seconds = Number(slide.dataset.slideDuration);
  const value =
    Number.isFinite(seconds) && seconds > 0 ? seconds : fallbackSeconds;
  return value * 1000;
}

/**
 * @param {EventTarget | null} target
 */
function isTypingTarget(target) {
  if (
    !target ||
    !("closest" in target) ||
    typeof target.closest !== "function"
  ) {
    return false;
  }
  const element = /** @type {HTMLElement} */ (target);
  if (element.isContentEditable) return true;
  return Boolean(element.closest("input, textarea, select"));
}

/**
 * @param {string} className
 * @param {string} label
 */
function createButton(className, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  return button;
}

/**
 * @param {ParentNode} [root]
 */
export function initCarousels(root = document) {
  const doc = root?.nodeType === 9 ? root : root?.ownerDocument;
  if (doc && root === doc && doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", () => initCarousels(doc), {
      once: true,
    });
    return;
  }

  /** @type {HTMLElement[]} */
  const nodes = [];
  if (
    root?.nodeType === 1 &&
    "matches" in root &&
    root.matches(".iop-carousel")
  ) {
    nodes.push(/** @type {HTMLElement} */ (root));
  }
  if (root?.querySelectorAll) {
    nodes.push(
      .../** @type {HTMLElement[]} */ ([
        ...root.querySelectorAll(".iop-carousel"),
      ]),
    );
  }

  for (const wrapper of nodes) mountCarousel(wrapper);
}

/**
 * @param {HTMLElement} wrapper
 */
function mountCarousel(wrapper) {
  if (wrapper.dataset.carouselInit === "true") return;

  const viewport = wrapper.querySelector(".iop-carousel__viewport");
  const container = viewport?.querySelector(".iop-carousel__container");
  if (viewport?.nodeType !== 1 || container?.nodeType !== 1) return;

  wrapper.dataset.carouselInit = "true";

  const options = readCarouselOptions(wrapper);
  const view = wrapper.ownerDocument.defaultView || window;

  if (options.random) {
    const kept = selectRandomSlides(container.children, options.random);
    const keep = new Set(kept);
    for (const slide of [...container.children]) {
      if (!keep.has(slide)) slide.remove();
    }
    for (const slide of kept) container.appendChild(slide);
  }

  for (const slide of container.children) {
    slide.classList.add("iop-carousel__slide");
  }

  const slides = [...container.children];
  if (slides.length < 2) {
    wrapper.classList.add("is-ready");
    return;
  }

  const motion = view.matchMedia?.("(prefers-reduced-motion: reduce)");
  let reduceMotion = Boolean(motion?.matches);
  let userPaused = false;
  let hovered = false;
  let onScreen = true;

  /** @type {HTMLButtonElement | null} */
  let pauseButton = null;
  /** @type {HTMLElement | null} */
  let dotsNode = null;

  const plugins = [
    Accessibility({
      announceChanges: true,
      rootNode: (emblaRoot) => emblaRoot.parentElement,
    }),
    ClassNames(),
  ];

  if (options.autoplay) {
    plugins.push(
      Autoplay({
        delay: (_snaps, api) =>
          api
            .slideNodes()
            .map((slide) => slideDelayMs(slide, options.duration)),
        // Play and pause are owned here so dots, arrows, and the pause
        // button follow one rule. The plugin's default stops on pointerdown.
        defaultInteraction: false,
      }),
    );
  }

  const api = EmblaCarousel(
    viewport,
    {
      loop: options.loop,
      // Full-width slides should sit flush. Center alignment can show a sliver of the next slide.
      align: "start",
      duration: reduceMotion ? 0 : SCROLL_DURATION,
      container,
    },
    plugins,
  );

  const autoplay = () => api.plugins()?.autoplay;

  const shouldPlay = () =>
    options.autoplay && !reduceMotion && !userPaused && !hovered && onScreen;

  const sync = () => {
    const player = autoplay();
    // The autoplay plugin leaves its timer unset when there is a single snap.
    if (player && api.snapList().length > 1) {
      if (shouldPlay()) player.play();
      else if (player.isPlaying()) player.pause();
    }
    if (!pauseButton) return;
    const show = options.autoplay && !reduceMotion;
    pauseButton.hidden = !show;
    pauseButton.classList.toggle("is-paused", userPaused);
    pauseButton.setAttribute("aria-pressed", userPaused ? "true" : "false");
    pauseButton.setAttribute(
      "aria-label",
      userPaused ? "Play automatic slides" : "Pause automatic slides",
    );
  };

  /**
   * @param {"prev" | "next" | number} target
   */
  const go = (target) => {
    if (target === "prev") api.goToPrev();
    else if (target === "next") api.goToNext();
    else api.goTo(target);
    autoplay()?.reset();
    sync();
  };

  if (options.arrows) {
    const arrows = document.createElement("div");
    arrows.className = "iop-carousel-arrows";
    const prev = createButton(
      "iop-carousel-arrow iop-carousel-arrow--prev",
      "Previous slide",
    );
    const next = createButton(
      "iop-carousel-arrow iop-carousel-arrow--next",
      "Next slide",
    );
    prev.addEventListener("click", () => go("prev"));
    next.addEventListener("click", () => go("next"));
    arrows.append(prev, next);
    wrapper.append(arrows);
    api.plugins()?.accessibility?.setupPrevAndNextButtons(prev, next);
  }

  if (options.autoplay && options.pause) {
    pauseButton = createButton("iop-carousel-pause", "Pause automatic slides");
    pauseButton.setAttribute("aria-pressed", "false");
    pauseButton.addEventListener("click", () => {
      userPaused = !userPaused;
      if (!userPaused) hovered = false;
      sync();
    });
    wrapper.append(pauseButton);
  }

  const updateDots = () => {
    if (!dotsNode) return;
    const selected = api.selectedSnap();
    for (const [index, button] of [...dotsNode.children].entries()) {
      button.classList.toggle("is-active", index === selected);
    }
  };

  if (options.dots) {
    dotsNode = document.createElement("div");
    dotsNode.className = "iop-carousel-dotnav";
    dotsNode.setAttribute("role", "group");
    dotsNode.setAttribute("aria-label", "Choose slide");
    for (const [index] of api.snapList().entries()) {
      const dot = createButton(
        "iop-carousel-dotnav__dot",
        `Go to slide ${index + 1}`,
      );
      dot.addEventListener("click", () => go(index));
      dotsNode.append(dot);
    }
    const controls = document.createElement("div");
    controls.className = "iop-carousel-controls";
    controls.append(dotsNode);
    wrapper.append(controls);
    api.plugins()?.accessibility?.setupDotButtons(dotsNode);
    updateDots();
  }

  const live = document.createElement("div");
  live.className = "iop-carousel__live";
  wrapper.append(live);
  api.plugins()?.accessibility?.setupLiveRegion(live);

  wrapper.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    if (isTypingTarget(event.target)) return;
    event.preventDefault();
    go(event.key === "ArrowLeft" ? "prev" : "next");
  });

  wrapper.addEventListener("mouseenter", () => {
    hovered = true;
    sync();
  });
  wrapper.addEventListener("mouseleave", () => {
    hovered = false;
    sync();
  });

  const Observer = view.IntersectionObserver;
  if (typeof Observer === "function") {
    const observer = new Observer((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      sync();
    });
    observer.observe(wrapper);
  }

  motion?.addEventListener?.("change", () => {
    reduceMotion = Boolean(motion.matches);
    sync();
  });

  api.on("select", updateDots);
  api.on("reinit", () => {
    sync();
  });

  sync();
  wrapper.classList.add("is-ready");
}
