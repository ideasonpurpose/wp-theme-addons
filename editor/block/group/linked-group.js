import { BlockControls, LinkControl } from "@wordpress/block-editor";
import { registerBlockVariation, createBlock } from "@wordpress/blocks";
import { ToolbarGroup, ToolbarButton, Popover } from "@wordpress/components";
import { createHigherOrderComponent } from "@wordpress/compose";
import { useState } from "@wordpress/element";
import { addFilter } from "@wordpress/hooks";
import { SVG, Path } from "@wordpress/primitives";

export default {};

/**
 * Include the SVG icons so we don't need the heavy @wordpress/icons dependency
 */
const icon_link = (
  <SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <Path d="M10 17.389H8.444A5.194 5.194 0 1 1 8.444 7H10v1.5H8.444a3.694 3.694 0 0 0 0 7.389H10v1.5ZM14 7h1.556a5.194 5.194 0 0 1 0 10.39H14v-1.5h1.556a3.694 3.694 0 0 0 0-7.39H14V7Zm-4.5 6h5v-1.5h-5V13Z" />
  </SVG>
);

const icon_linkOff = (
  <SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <Path d="M17.031 4.703 15.576 4l-1.56 3H14v.03l-2.324 4.47H9.5V13h1.396l-1.502 2.889h-.95a3.694 3.694 0 0 1 0-7.389H10V7H8.444a5.194 5.194 0 1 0 0 10.389h.17L7.5 19.53l1.416.719L15.049 8.5h.507a3.694 3.694 0 0 1 0 7.39H14v1.5h1.556a5.194 5.194 0 0 0 .273-10.383l1.202-2.304Z" />
  </SVG>
);

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
// const generateUniqueId = () => Math.random().toString(36).slice(2, 10);

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

    const [isLinkOpen, setIsLinkOpen] = useState(false);
    const [popoverAnchor, setPopoverAnchor] = useState(null);

    const newProps = { ...props };

    return (
      <>
        <BlockEdit {...newProps} />

        <BlockControls group="block">
          <ToolbarGroup>
            <ToolbarButton
              name="link"
              icon={!url ? icon_link : icon_linkOff}
              onClick={() => setIsLinkOpen(!isLinkOpen)}
              isActive={!url}
              title={!url ? "Link" : "Unlink"}
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
              onChange={(val) =>
                setAttributes({
                  url: val.url,
                  opensInNewTab: val.opensInNewTab,
                })
              }
              onRemove={() => setAttributes({ url: "" })}
              showInitialSuggestions={true}
            />
          </Popover>
        )}
      </>
    );
  };
}, "withInspectorControl");

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

  const { url, opensInNewTab } = attributes;

  // TODO: Only replace the group if there's a url set
  if (!url) {
    return element;
  }

  const link = (
    <a
      href={url}
      className={"linked-group__link iop-linked-group__link"}
      target={opensInNewTab ? "_blank" : undefined}
    ></a>
  );

  // append a link to the block's children toi avoid :first-child issues
  const originalChildren = element.props.children;
  const newChildren = Array.isArray(originalChildren)
    ? [...originalChildren, link]
    : [originalChildren, link];

  attributes.className = "iop-linked-group";
  return { ...element, props: { ...element.props, children: newChildren } };
};

const linkedGroupTransformTo = {
  type: "block",
  blocks: ["core/group"],
  transform: (attributes, innerBlocks) => {
    console.log(attributes);

    return createBlock(
      "core/group",
      {
        ...attributes,
        className: "iop-linked-group transformedadoobeedooobeedoooo",
        url: "",
        namespace: "ideasonpurpose/group-linked",
      },
      innerBlocks,
    );
  },
};

// TODO: this isn't working
const linkedGroupTransformFrom = {
  type: "block",
  blocks: ["core/group"],
  transform: (attributes, innerBlocks) => {
    const newAttributes = { ...attributes };

    delete newAttributes.url;
    delete newAttributes.opensInNewTab;
    delete newAttributes.namespace;
    return createBlock("core/group", { ...newAttributes }, innerBlocks);
  },
};

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
      namespace: { type: "string", default: "" },
    },
  };

  if (!newSettings.hasLinkedGroupTransform) {
    newSettings.hasLinkedGroupTransform = true;

    if (!newSettings.transforms.to) {
      newSettings.transforms.to = [linkedGroupTransformTo];
    }
  }

  return newSettings;
};
