import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import {
  initCarousels,
  readCarouselOptions,
  selectRandomSlides,
  slideDelayMs,
} from "../frontend/carousel.js";

const SLIDE_WIDTH = 400;

function installBrowser(reducedMotion = false) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.matchMedia = (query) => ({
    matches: reducedMotion && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  // Embla's scroll animation and autoplay timer would keep the test
  // process alive. Snap changes are synchronous, so the callbacks can no-op.
  window.setTimeout = () => 0;
  window.clearTimeout = () => {};
  window.requestAnimationFrame = () => 0;
  window.cancelAnimationFrame = () => {};

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Element = window.Element;
  globalThis.Node = window.Node;
  globalThis.MutationObserver = window.MutationObserver;
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;

  return window;
}

function box(element, width, height, left) {
  const read = (value) => (typeof value === "function" ? value : () => value);
  const props = {
    offsetWidth: read(width),
    offsetHeight: read(height),
    clientWidth: read(width),
    clientHeight: read(height),
    offsetLeft: read(left),
    offsetTop: () => 0,
  };
  for (const [name, get] of Object.entries(props)) {
    Object.defineProperty(element, name, { configurable: true, get });
  }
}

/**
 * @param {Window} window
 * @param {string[]} labels
 * @param {Record<string, string>} [data]
 */
function carouselFixture(window, labels, data = {}) {
  const { document } = window;
  const wrapper = document.createElement("section");
  wrapper.className = "wp-block-group iop-carousel";
  for (const [key, value] of Object.entries(data)) {
    wrapper.setAttribute(key, value);
  }

  const viewport = document.createElement("div");
  viewport.className = "iop-carousel__viewport";
  const container = document.createElement("div");
  container.className = "iop-carousel__container";

  for (const label of labels) {
    const slide = document.createElement("div");
    slide.textContent = label;
    container.append(slide);
  }

  viewport.append(container);
  wrapper.append(viewport);
  document.body.append(wrapper);

  // Embla treats the container's offsetWidth as the viewport. Slides keep
  // their own positions so each one is a snap.
  box(viewport, SLIDE_WIDTH, 200, 0);
  box(container, SLIDE_WIDTH, 200, 0);
  for (const slide of container.children) {
    box(
      slide,
      SLIDE_WIDTH,
      200,
      () => [...container.children].indexOf(slide) * SLIDE_WIDTH,
    );
  }

  return wrapper;
}

describe("readCarouselOptions", () => {
  /** @type {Window} */
  let window;
  before(() => {
    window = installBrowser();
  });

  it("uses the shared defaults when the markup has no settings", () => {
    const wrapper = window.document.createElement("section");
    assert.deepEqual(readCarouselOptions(wrapper), {
      autoplay: true,
      duration: 6,
      arrows: true,
      dots: true,
      pause: false,
      loop: true,
      random: 0,
    });
  });

  it("reads explicit data attributes", () => {
    const wrapper = window.document.createElement("section");
    wrapper.dataset.autoplay = "false";
    wrapper.dataset.duration = "4.5";
    wrapper.dataset.arrows = "false";
    wrapper.dataset.dots = "true";
    wrapper.dataset.pause = "true";
    wrapper.dataset.loop = "false";
    wrapper.dataset.random = "3.8";
    assert.deepEqual(readCarouselOptions(wrapper), {
      autoplay: false,
      duration: 4.5,
      arrows: false,
      dots: true,
      pause: true,
      loop: false,
      random: 3,
    });
  });

  it("ignores zero or negative timing", () => {
    const wrapper = window.document.createElement("section");
    wrapper.dataset.duration = "0";
    wrapper.dataset.random = "-2";
    const options = readCarouselOptions(wrapper);
    assert.equal(options.duration, 6);
    assert.equal(options.random, 0);
  });
});

describe("selectRandomSlides", () => {
  it("keeps the original order when every slide is used", () => {
    const slides = ["a", "b", "c"];
    assert.deepEqual(selectRandomSlides(slides, 0), slides);
    assert.deepEqual(selectRandomSlides(slides, 3), ["a", "b", "c"]);
    assert.deepEqual(slides, ["a", "b", "c"]);
  });

  it("returns a subset without shuffling when random never swaps", () => {
    const picked = selectRandomSlides(["a", "b", "c", "d"], 2, () => 0.999);
    assert.deepEqual(picked, ["a", "b"]);
  });

  it("uses the injected random function and does not mutate the source", () => {
    const source = ["a", "b", "c", "d"];
    const picked = selectRandomSlides(source, 2, () => 0);
    assert.equal(picked.length, 2);
    for (const item of picked) assert.ok(source.includes(item));
    assert.deepEqual(source, ["a", "b", "c", "d"]);
    assert.equal(new Set(picked).size, 2);
  });
});

describe("slideDelayMs", () => {
  /** @type {Window} */
  let window;
  before(() => {
    window = installBrowser();
  });

  it("prefers a positive per-slide duration", () => {
    const slide = window.document.createElement("div");
    slide.dataset.slideDuration = "2.5";
    assert.equal(slideDelayMs(slide, 6), 2500);
  });

  it("falls back when the slide duration is missing or invalid", () => {
    const slide = window.document.createElement("div");
    assert.equal(slideDelayMs(slide, 6), 6000);
    slide.dataset.slideDuration = "0";
    assert.equal(slideDelayMs(slide, 4), 4000);
  });
});

describe("initCarousels", () => {
  /** @type {Window} */
  let window;

  afterEach(() => {
    window?.document.body.replaceChildren();
  });

  it("treats every direct child as a slide and builds controls", () => {
    window = installBrowser();
    const wrapper = carouselFixture(window, ["One", "Two", "Three"]);
    initCarousels(window.document);

    const slides = wrapper.querySelectorAll(".iop-carousel__container > *");
    assert.equal(slides.length, 3);
    for (const slide of slides) {
      assert.ok(slide.classList.contains("iop-carousel__slide"));
    }
    assert.equal(
      wrapper.querySelectorAll(".iop-carousel-dotnav__dot").length,
      3,
    );
    assert.ok(wrapper.querySelector(".iop-carousel-arrow--prev"));
    assert.ok(wrapper.querySelector(".iop-carousel-arrow--next"));
    assert.equal(wrapper.querySelector(".iop-carousel-pause"), null);
    assert.ok(wrapper.querySelector(".iop-carousel__live"));
    assert.ok(wrapper.classList.contains("is-ready"));
    assert.equal(
      wrapper
        .querySelector(".iop-carousel-dotnav__dot")
        ?.classList.contains("is-active"),
      true,
    );
  });

  it("advances from arrows, dots, and keys inside the carousel only", () => {
    window = installBrowser();
    const first = carouselFixture(window, ["One", "Two", "Three"]);
    const second = carouselFixture(window, ["A", "B"]);
    initCarousels(window.document);

    const active = () =>
      [...first.querySelectorAll(".iop-carousel-dotnav__dot")].findIndex(
        (dot) => dot.classList.contains("is-active"),
      );
    const secondActive = () =>
      [...second.querySelectorAll(".iop-carousel-dotnav__dot")].findIndex(
        (dot) => dot.classList.contains("is-active"),
      );

    first
      .querySelector(".iop-carousel-arrow--next")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    assert.equal(active(), 1);
    assert.equal(secondActive(), 0);

    first
      .querySelectorAll(".iop-carousel-dotnav__dot")[2]
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    assert.equal(active(), 2);

    const outside = window.document.createElement("button");
    window.document.body.append(outside);
    const outsideEvent = new window.KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    outside.dispatchEvent(outsideEvent);
    assert.equal(outsideEvent.defaultPrevented, false);
    assert.equal(active(), 2);

    const insideEvent = new window.KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
      cancelable: true,
    });
    first
      .querySelector(".iop-carousel-arrow--next")
      ?.dispatchEvent(insideEvent);
    assert.equal(insideEvent.defaultPrevented, true);
    assert.equal(active(), 1);
    assert.equal(secondActive(), 0);

    const field = window.document.createElement("input");
    first.querySelector(".iop-carousel__slide")?.append(field);
    const typing = new window.KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    field.dispatchEvent(typing);
    assert.equal(typing.defaultPrevented, false);
    assert.equal(active(), 1);
  });

  it("keeps autoplay running after both arrow and dot clicks until pause", () => {
    window = installBrowser();
    const wrapper = carouselFixture(window, ["One", "Two", "Three"], {
      "data-pause": "true",
    });
    const calls = [];
    const originalLog = console.log;
    console.log = (...args) => calls.push(args);
    initCarousels(window.document);
    console.log = originalLog;
    assert.equal(calls.length, 0);

    const pause = wrapper.querySelector(".iop-carousel-pause");
    assert.equal(pause?.hidden, false);
    assert.equal(pause?.parentElement, wrapper);
    assert.equal(pause?.getAttribute("aria-pressed"), "false");

    wrapper
      .querySelector(".iop-carousel-arrow--next")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    wrapper
      .querySelector(".iop-carousel-dotnav__dot")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    assert.equal(pause?.getAttribute("aria-pressed"), "false");

    pause?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    assert.equal(pause?.getAttribute("aria-pressed"), "true");
    assert.equal(pause?.classList.contains("is-paused"), true);
    assert.equal(pause?.getAttribute("aria-label"), "Play automatic slides");

    pause?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    assert.equal(pause?.getAttribute("aria-pressed"), "false");
  });

  it("does not autoplay or show pause when reduced motion is set", () => {
    window = installBrowser(true);
    const wrapper = carouselFixture(window, ["One", "Two"], {
      "data-pause": "true",
    });
    initCarousels(window.document);
    const pause = wrapper.querySelector(".iop-carousel-pause");
    assert.equal(pause?.hidden, true);
  });

  it("keeps the pause button when pagination is off", () => {
    window = installBrowser();
    const wrapper = carouselFixture(window, ["One", "Two"], {
      "data-dots": "false",
      "data-pause": "true",
    });
    initCarousels(window.document);
    assert.equal(wrapper.querySelector(".iop-carousel-controls"), null);
    assert.ok(wrapper.querySelector(".iop-carousel-pause"));
  });

  it("omits arrows and dots when those settings are off", () => {
    window = installBrowser();
    const wrapper = carouselFixture(window, ["One", "Two"], {
      "data-arrows": "false",
      "data-dots": "false",
      "data-autoplay": "false",
    });
    initCarousels(window.document);
    assert.equal(wrapper.querySelector(".iop-carousel-arrow"), null);
    assert.equal(wrapper.querySelector(".iop-carousel-dotnav"), null);
    assert.equal(wrapper.querySelector(".iop-carousel-pause"), null);
    assert.ok(wrapper.classList.contains("is-ready"));
  });

  it("keeps a random subset and drops the rest before startup", () => {
    window = installBrowser();
    const wrapper = carouselFixture(window, ["a", "b", "c", "d", "e"], {
      "data-random": "2",
    });
    const random = () => 0.999;
    const original = Math.random;
    Math.random = random;
    initCarousels(window.document);
    Math.random = original;

    const labels = [...wrapper.querySelectorAll(".iop-carousel__slide")].map(
      (slide) => slide.textContent,
    );
    assert.deepEqual(labels, ["a", "b"]);
  });

  it("leaves a single slide in place without controls", () => {
    window = installBrowser();
    const wrapper = carouselFixture(window, ["Only"]);
    initCarousels(window.document);
    assert.equal(wrapper.querySelector(".iop-carousel-arrow"), null);
    assert.equal(wrapper.querySelector(".iop-carousel-dotnav"), null);
    assert.ok(wrapper.classList.contains("is-ready"));
    assert.equal(
      wrapper.querySelector(".iop-carousel__slide")?.textContent,
      "Only",
    );
  });

  it("does not build a second set of controls when called twice", () => {
    window = installBrowser();
    const wrapper = carouselFixture(window, ["One", "Two"], {
      "data-pause": "true",
    });
    initCarousels(window.document);
    initCarousels(window.document);
    assert.equal(wrapper.querySelectorAll(".iop-carousel-arrow").length, 2);
    assert.equal(wrapper.querySelectorAll(".iop-carousel-pause").length, 1);
  });
});
