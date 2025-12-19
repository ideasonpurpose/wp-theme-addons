import { BlockControls, LinkControl } from "@wordpress/block-editor";
import { registerBlockVariation, createBlock } from "@wordpress/blocks";
import { ToolbarGroup, ToolbarButton, Popover } from "@wordpress/components";
import { createHigherOrderComponent } from "@wordpress/compose";
import { useEffect, useState, RawHTML } from "@wordpress/element";
import { addFilter } from "@wordpress/hooks";
import { link } from "@wordpress/icons";
import { SVG, Path } from "@wordpress/primitives";

export default {};

const icon = (
  <SVG xmlns="" fill="currentColor" viewBox="0 0 48 48">
    <Path d="M39.335 5.246H22.384c-2.2 0-4 1.8-4 4v1h3v-1c0-.6.4-1 1-1h16.951c.6 0 1 .4 1 1v23.137c0 .6-.4 1-1 1H22.384c-.6 0-1-.4-1-1v-1h-3v1c0 2.2 1.8 4 4 4h16.951c2.2 0 4-1.8 4-4V9.246c0-2.2-1.8-4-4-4" />
    <Path d="M9.665 18.383v3h-1c-.6 0-1 .4-1 1v16.37c0 .6.4 1 1 1h17.71c.6 0 1-.4 1-1v-7.37h3v7.37c0 2.2-1.8 4-4 4H8.665c-2.2 0-4-1.8-4-4v-16.37c0-2.2 1.8-4 4-4zM27.438 25.383h2c2.8 0 5-2.2 5-5s-2.2-5-5-5h-2v-3h2c4.4 0 8 3.6 8 8s-3.6 8-8 8h-2z" />
    <Path d="M21.438 25.383v3h-2c-4.4 0-8-3.6-8-8s3.6-8 8-8h2v3h-2c-2.8 0-5 2.2-5 5s2.2 5 5 5z" />
    <Path d="M29.438 21.983h-10v-3h10z" />
  </SVG>
);

/**
 * Generate a unique ID
 * @returns {string} A unique identifier string
 * NOTE: toString(36) starts with '0.', so slice from 22 for a valid ID
 */
const generateUniqueId = () => Math.random().toString(36).slice(2, 10);

export function initLinkedGroupBlock() {
    registerBlockVariation("core/group", {
      name: "group-linked",
      title: "Linked Group",
      description: "Group block with link support",
      attributes: {
        namespace: "ideasonpurpose/group-linked",
        url: "",
        opensInNewTab: false,
      },
      icon,
      isActive: ["namespace"],
  });

  addFilter(
    "editor.BlockEdit",
    "ideasonpurpose/group-linked/add-controls",
    controls,
  );

  addFilter(
    "blocks.getSaveElement",
    "ideasonpurpose/group-linked/save-element",
    makeSaveElement,
  );

  addFilter(
    "blocks.registerBlockType",
    "ideasonpurpose/group-linked/define-attributes",
    defineAttributes,
  );
}

/**
 * Add controls to the Block Editor sidebar
 */
const controls = createHigherOrderComponent((BlockEdit) => {
  return (props) => {
    const { name, attributes, setAttributes } = props;
    const { url, opensInNewTab } = attributes;

    if (
      name !== "core/group" ||
      attributes?.namespace !== "ideasonpurpose/group-linked"
    ) {
      return <BlockEdit {...props} />;
    }

    useEffect(() => {
      if (!attributes.uniqueId) {
        setAttributes({ uniqueId: generateUniqueId() });
      }
    }, [attributes.uniqueId, setAttributes]);

    const [isLinkOpen, setIsLinkOpen] = useState(false);
    const [popoverAnchor, setPopoverAnchor] = useState(null);

    const newProps = {
      ...props,
      className: `${props.className} linked-group ideasonpurpose`,
    };

    return (
      <>
        <BlockEdit {...newProps} />

        <BlockControls>
          <ToolbarGroup>
            <ToolbarButton
              icon={link}
              label={"Edit Link"}
              onClick={() => setIsLinkOpen(!isLinkOpen)}
              isActive={!!url}
              isPressed={isLinkOpen}
              ref={(el) => setPopoverAnchor(el)}
            />
          </ToolbarGroup>
        </BlockControls>

        {isLinkOpen && (
          <Popover
            placement="bottom"
            offset={16}
            onClose={() => setIsLinkOpen(false)}
            anchor={popoverAnchor}
            __unstableSlotName={"__unstable-block-tools-after"}
            shift
          >
            <LinkControl
              value={{ url, opensInNewTab }}
              onChange={(value) => setAttributes({ ...value })}
              onRemove={() => setAttributes({ url: "" })}
              showInitialSuggestions={true}
            />
          </Popover>
        )}
      </>
    );
  };
}, "withInspectorControl");

// addFilter(
//   "editor.BlockEdit",
//   "ideasonpurpose/group-link/add-controls",
//   controls,
// );

/**
 * This changes the size of the block editor representation of the block
 * We use this to set the height of the outermost container
 *
 * NOTE: Similar to the `edit` method when creating a block from scratch?
 */
const makeEditorElement = createHigherOrderComponent((BlockListBlock) => {
  return (props) => {
    const { name, attributes } = props;
    if (
      name === "core/group" &&
      attributes?.providerNameSlug === "group-linked"
    ) {
      // TODO: Strip all links in here?
    }
    return <BlockListBlock {...props} />;
  };
}, "makeEditorElement");

// TODO: unnecessary?
// addFilter(
//   "editor.BlockListBlock",
//   "ideasonpurpose/group-link/make-editor-element",
//   makeEditorElement,
// );

/**
 * Mostly from Grok, need to scrub all links from children to prevent invalid nested A tags
 */
function deepSanitizeLinks(element) {
  if (!element) return element;

  // Case A: RawHTML string — sanitize it
  if (element.type === RawHTML && typeof element.props.children === "string") {
    console.log("case A - RawHTML string");
    const dirty = element.props.children;
    const temp = document.createElement("div");
    temp.innerHTML = dirty;

    const links = temp.querySelectorAll("a[href]");
    if (links.length === 0) return element;

    links.forEach((a) => {
      const span = document.createElement("span");
      span.innerHTML = a.innerHTML;
      // Copy safe attrs
      for (const attr of a.attributes) {
        if (
          ![
            "href",
            "target",
            "rel",
            "ping",
            "referrerpolicy",
            "download",
          ].includes(attr.name)
        ) {
          span.setAttribute(attr.name, attr.value);
        }
        if (attr.name === "href") {
          span.setAttribute("data-original-href", attr.value);
        }
        if (attr.name === "title") {
          span.setAttribute("data-original-title", attr.value);
        }
      }
      a.replaceWith(span);
    });

    return <RawHTML>{temp.innerHTML}</RawHTML>;
  }

  // Case B: Array of children (most common with InnerBlocks)
  if (Array.isArray(element)) {
    console.log("case B - Array of children");
    return element.map((child) => deepSanitizeLinks(child));
  }

  // Case C: React element with props.children
  if (element.props?.children != null) {
    console.log("case C - React element with props.children");
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];

    const sanitizedChildren = children.map((child) =>
      typeof child === "string" || child === null
        ? child
        : deepSanitizeLinks(child),
    );

    // Avoid unnecessary cloning
    if (sanitizedChildren.every((c, i) => c === children[i])) {
      return element;
    }

    return {
      ...element,
      props: {
        ...element.props,
        children:
          sanitizedChildren.length === 1
            ? sanitizedChildren[0]
            : sanitizedChildren,
      },
    };
  }

  return element;
}

/**
 * This updates components in the Save representation of the block.
 * This affects what will appear on the public-facing display of the page
 *
 * NOTE: Similar to the `save` method when creating a block from scratch?
 */
const makeSaveElement = (element, blockType, attributes) => {
  if (!element) {
    return;
  }

  if (
    blockType.name !== "core/group" ||
    attributes?.namespace !== "ideasonpurpose/group-linked"
  ) {
    return element;
  }

  const { uniqueId, url, opensInNewTab } = attributes;

  // TODO: Only replace this if there's a url to use.
  if (!url) {
    return element;
  }

  const cleanedElement = deepSanitizeLinks(element);

  return (
    <a
      href={url}
      className={"linked-group iop-linked-group"}
      title={opensInNewTab ? "_blank" : undefined}
      id={`group-linked-${uniqueId}`}
    >
      {cleanedElement}
    </a>
  );
};

// addFilter(
//   "blocks.getSaveElement",
//   "ideasonpurpose/group-link/save-element",
//   makeSaveElement,
// );

/**
 * In order to save values from the injected controls, we need to declare
 * the attributes so WordPress knows where to store the data.
 * @link https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/#blocks-registerblocktype
 */
const defineAttributes = (settings, name) => {
  // TODO: When this runs, variations haven't been defined yet, only add attributes to core/embed,
  //       More specific checks are performed by other filters
  if (name !== "core/group") {
    return settings;
  }

  const newSettings = {
    ...settings,
    attributes: {
      ...settings.attributes,
      url: { type: "string", default: "" },
      opensInNewTab: { type: "boolean", default: false },
      uniqueId: { type: "string", default: "" },
      namespace: { type: "string", default: "" },
    },
  };

  return newSettings;
};

// addFilter(
//   "blocks.registerBlockType",
//   "ideasonpurpose/group-link/define-attributes",
//   defineAttributes,
// );
