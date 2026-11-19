import "./carousel.css";
import { InspectorControls } from "@wordpress/block-editor";
import {
  getBlockType,
  getBlockTypes,
  registerBlockVariation,
} from "@wordpress/blocks";
import {
  PanelBody,
  RangeControl,
  ToggleControl,
  __experimentalNumberControl as NumberControl,
} from "@wordpress/components";
import { createHigherOrderComponent } from "@wordpress/compose";
import { useSelect } from "@wordpress/data";
import { addFilter } from "@wordpress/hooks";
import { __ } from "@wordpress/i18n";
import { Path, SVG } from "@wordpress/primitives";
import { CAROUSEL_DEFAULTS as DEFAULTS } from "../../../../../lib/carousel-defaults.js";

const NAMESPACE = "ideasonpurpose/carousel";
const VIEWPORT = "ideasonpurpose/carousel-viewport";
const CONTAINER = "ideasonpurpose/carousel-container";

const GROUP_ATTRIBUTES = {
  namespace: { type: "string", default: "" },
  carouselAutoplay: { type: "boolean", default: DEFAULTS.autoplay },
  carouselDuration: { type: "number", default: DEFAULTS.duration },
  carouselArrows: { type: "boolean", default: DEFAULTS.arrows },
  carouselDots: { type: "boolean", default: DEFAULTS.dots },
  carouselLoop: { type: "boolean", default: DEFAULTS.loop },
  carouselRandom: { type: "number", default: DEFAULTS.random },
};

const icon = (
  <SVG xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48">
    <Path d="M18.75 14.11h10.5v11.334h-10.5V14.11Z" />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M29.906 12H18.094a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h11.812a2 2 0 0 0 2-2V14a2 2 0 0 0-2-2Zm-11.812-2a4 4 0 0 0-4 4v20a4 4 0 0 0 4 4h11.812a4 4 0 0 0 4-4V14a4 4 0 0 0-4-4H18.094Z"
    />
    <Path d="M18.75 27.476h10.5v2h-10.5zM18.75 31.263h8.406v2H18.75zM35.906 26.622h2v2h-2z" />
    <Path d="M33.906 30.263h6.041a2 2 0 0 0 2-2v-9.636a2 2 0 0 0-2-2h-6.04v-2h6.04a4 4 0 0 1 4 4v9.636a4 4 0 0 1-4 4h-6.04v-2Z" />
    <Path d="M39.906 18.622v6h-4v-6h4ZM12.116 26.622h-4v2h4v-2Z" />
    <Path d="M14.094 30.263H8.053a2 2 0 0 1-2-2v-9.636a2 2 0 0 1 2-2h6.04v-2h-6.04a4 4 0 0 0-4 4v9.636a4 4 0 0 0 4 4h6.04v-2Z" />
    <Path d="M8.094 18.622v6h4v-6h-4Z" />
  </SVG>
);

const partIcon = (
  <SVG xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48">
    <Path
      clipRule="evenodd"
      fillRule="evenodd"
      d="M29.906 14H18.094a2 2 0 0 0-2 2v15.563a2 2 0 0 0 2 2h11.812a2 2 0 0 0 2-2V16a2 2 0 0 0-2-2Zm-11.812-2a4 4 0 0 0-4 4v15.563a4 4 0 0 0 4 4h11.812a4 4 0 0 0 4-4V16a4 4 0 0 0-4-4H18.094Z"
    />
    <Path d="M33.906 29.827h5.205a2 2 0 0 0 2-2v-7.654a2 2 0 0 0-2-2h-5.205v-2h5.205a4 4 0 0 1 4 4v7.654a4 4 0 0 1-4 4h-5.205v-2ZM14.44 18.173H9.235a2 2 0 0 0-2 2v7.654a2 2 0 0 0 2 2h5.205v2H9.235a4 4 0 0 1-4-4v-7.654a4 4 0 0 1 4-4h5.205v2ZM26.787 27.188a5.314 5.314 0 0 0 1.137-.954l1.195.69 1.088-1.885-1.193-.689a5.25 5.25 0 0 0 .258-1.463l1.357-.239-.378-2.143-1.357.239a5.277 5.277 0 0 0-.744-1.285l.887-1.057-1.667-1.399-.887 1.056a5.242 5.242 0 0 0-1.395-.51v-1.376h-2.176v1.377a5.242 5.242 0 0 0-1.396.51l-.886-1.057-1.667 1.4.887 1.056c-.305.388-.557.82-.744 1.285l-1.357-.24-.378 2.144 1.357.24c.017.508.106 1 .258 1.462l-1.193.689 1.088 1.885 1.195-.69c.332.369.714.69 1.137.954l-.472 1.297 2.045.744.471-1.294a5.308 5.308 0 0 0 1.486 0l.471 1.294 2.045-.745-.472-1.296ZM24 25.491a2.782 2.782 0 0 1-2.78-2.78A2.783 2.783 0 0 1 24 19.934a2.783 2.783 0 0 1 2.78 2.779 2.782 2.782 0 0 1-2.78 2.78Z" />
  </SVG>
);

const groupMargin = { spacing: { margin: { top: "0", bottom: "0" } } };

function slideTemplate() {
  return [
    "core/group",
    { className: "iop-carousel__slide", style: groupMargin },
    [["core/paragraph", { placeholder: __("Slide") }]],
  ];
}

function addAttributes(settings, name) {
  const attributes = { ...settings.attributes };
  if (!attributes.slideDuration) {
    attributes.slideDuration = { type: "number" };
  }
  if (name === "core/group") {
    for (const [key, value] of Object.entries(GROUP_ATTRIBUTES)) {
      if (!attributes[key]) attributes[key] = value;
    }
  }
  return { ...settings, attributes };
}

function patchRegisteredBlocks() {
  for (const block of getBlockTypes()) {
    if (!block.attributes.slideDuration) {
      block.attributes.slideDuration = { type: "number" };
    }
  }
  const group = getBlockType("core/group");
  if (!group) return;
  for (const [key, value] of Object.entries(GROUP_ATTRIBUTES)) {
    if (!group.attributes[key]) group.attributes[key] = value;
  }
}

let started = false;

export function initCarouselBlock() {
  if (started) return;
  started = true;

  addFilter(
    "blocks.registerBlockType",
    "ideasonpurpose/carousel/attributes",
    addAttributes,
  );
  patchRegisteredBlocks();

  registerBlockVariation("core/group", {
    name: "carousel",
    title: __("Carousel"),
    description: __(
      "Slideshow of any blocks. Each direct child of the container is a slide.",
    ),
    keywords: ["slider", "slideshow"],
    icon,
    isActive: ["namespace"],
    attributes: {
      tagName: "section",
      className: "iop-carousel",
      namespace: NAMESPACE,
      carouselAutoplay: DEFAULTS.autoplay,
      carouselDuration: DEFAULTS.duration,
      carouselArrows: DEFAULTS.arrows,
      carouselDots: DEFAULTS.dots,
      carouselLoop: DEFAULTS.loop,
      carouselRandom: DEFAULTS.random,
    },
    innerBlocks: [
      [
        "core/group",
        {
          className: "iop-carousel__viewport",
          namespace: VIEWPORT,
          style: groupMargin,
        },
        [
          [
            "core/group",
            {
              className: "iop-carousel__container",
              namespace: CONTAINER,
              style: groupMargin,
            },
            [slideTemplate(), slideTemplate()],
          ],
        ],
      ],
    ],
  });

  registerBlockVariation("core/group", {
    name: "carousel-viewport",
    title: __("Carousel Viewport"),
    description: __("Visible window of a carousel. Not inserted on its own."),
    icon: partIcon,
    isActive: ["namespace"],
    scope: [],
    attributes: {
      className: "iop-carousel__viewport",
      namespace: VIEWPORT,
    },
  });

  registerBlockVariation("core/group", {
    name: "carousel-container",
    title: __("Carousel Container"),
    description: __("Slide track. Each direct child is one slide."),
    icon: partIcon,
    isActive: ["namespace"],
    scope: [],
    attributes: {
      className: "iop-carousel__container",
      namespace: CONTAINER,
    },
  });

  addFilter(
    "editor.BlockEdit",
    "ideasonpurpose/carousel/controls",
    withCarouselControls,
  );

  addFilter(
    "blocks.getSaveContent.extraProps",
    "ideasonpurpose/carousel/slide-duration",
    (extraProps, _blockType, attributes) => {
      const seconds = Number(attributes?.slideDuration);
      if (!Number.isFinite(seconds) || seconds <= 0) return extraProps;
      extraProps["data-slide-duration"] = attributes.slideDuration;
      return extraProps;
    },
  );
}

const withCarouselControls = createHigherOrderComponent((BlockEdit) => {
  return (props) => {
    const { attributes, setAttributes, clientId } = props;
    const className = attributes?.className || "";
    const slideMarked = className.includes("iop-carousel__slide");
    const isCarousel =
      props.name === "core/group" && attributes?.namespace === NAMESPACE;

    const { isSlide, duration } = useSelect(
      (select) => {
        const store = select("core/block-editor");
        const fallback = {
          isSlide: slideMarked,
          duration: DEFAULTS.duration,
        };
        if (!clientId || !store?.getBlockRootClientId) return fallback;

        const parentId = store.getBlockRootClientId(clientId);
        const parent = parentId ? store.getBlock(parentId) : null;
        const isDirectSlide = parent?.attributes?.namespace === CONTAINER;
        if (!isDirectSlide && !slideMarked) return fallback;

        let id = parentId;
        let carouselDuration = DEFAULTS.duration;
        while (id) {
          const block = store.getBlock(id);
          if (block?.attributes?.namespace === NAMESPACE) {
            carouselDuration =
              block.attributes.carouselDuration || DEFAULTS.duration;
            break;
          }
          id = store.getBlockRootClientId(id);
        }
        return { isSlide: true, duration: carouselDuration };
      },
      [clientId, slideMarked],
    );

    if (!isCarousel && !isSlide) return <BlockEdit {...props} />;

    const autoplay = attributes.carouselAutoplay !== false;

    return (
      <>
        <BlockEdit {...props} />
        {isCarousel && (
          <InspectorControls>
            <PanelBody title={__("Carousel")}>
              <ToggleControl
                label={__("Autoplay")}
                checked={autoplay}
                onChange={(value) => setAttributes({ carouselAutoplay: value })}
                __nextHasNoMarginBottom
              />
              {autoplay && (
                <RangeControl
                  label={__("Slide duration (seconds)")}
                  value={attributes.carouselDuration || DEFAULTS.duration}
                  onChange={(value) =>
                    setAttributes({ carouselDuration: value })
                  }
                  min={1}
                  max={20}
                  step={1}
                  __nextHasNoMarginBottom
                  __next40pxDefaultSize
                />
              )}
              <ToggleControl
                label={__("Arrows")}
                checked={attributes.carouselArrows !== false}
                onChange={(value) => setAttributes({ carouselArrows: value })}
                __nextHasNoMarginBottom
              />
              <ToggleControl
                label={__("Pagination")}
                checked={attributes.carouselDots !== false}
                onChange={(value) => setAttributes({ carouselDots: value })}
                __nextHasNoMarginBottom
              />
              <ToggleControl
                label={__("Loop")}
                checked={attributes.carouselLoop !== false}
                onChange={(value) => setAttributes({ carouselLoop: value })}
                __nextHasNoMarginBottom
              />
              <NumberControl
                label={__("Random slides")}
                help={__(
                  "Keep this many slides, chosen at random on each visit. 0 keeps all of them.",
                )}
                value={attributes.carouselRandom || 0}
                min={0}
                step={1}
                onChange={(value) => {
                  const count = Number(value);
                  setAttributes({
                    carouselRandom:
                      Number.isFinite(count) && count > 0
                        ? Math.floor(count)
                        : 0,
                  });
                }}
                __next40pxDefaultSize
              />
            </PanelBody>
          </InspectorControls>
        )}
        {isSlide && (
          <InspectorControls>
            <PanelBody title={__("Carousel slide")}>
              <NumberControl
                label={__("Slide duration (seconds)")}
                help={__(
                  "Overrides the carousel duration for this slide. Blank uses the carousel setting.",
                )}
                placeholder={String(duration)}
                value={attributes.slideDuration ?? ""}
                min={0.25}
                max={30}
                step={0.25}
                onChange={(value) => {
                  const seconds = Number(value);
                  setAttributes({
                    slideDuration:
                      Number.isFinite(seconds) && seconds > 0
                        ? seconds
                        : undefined,
                  });
                }}
                __next40pxDefaultSize
              />
            </PanelBody>
          </InspectorControls>
        )}
      </>
    );
  };
}, "withCarouselControls");
