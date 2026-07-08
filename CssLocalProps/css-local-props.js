// @ts-check

import { addFilter } from "@wordpress/hooks";
import { createHigherOrderComponent } from "@wordpress/compose";

/**
 * Helper function to convert theme.json named colors to CSS variables.
 * @param {string} color
 */
const varWpColor = (color) => `var(--wp--preset--color--${color})`;

/** @type {string[]} */
let _blockNames = [];

const addCSSLocalPropsToBlock = createHigherOrderComponent((BlockListBlock) => {
  return (props) => {
    if (!_blockNames.includes(props.name)) {
      return <BlockListBlock {...props} />;
    }

    const { attributes } = props;
    const blockStyle = attributes.style || {};

    const textColor = attributes.textColor
      ? varWpColor(attributes.textColor)
      : (blockStyle.color?.text ?? null);

    const bgColor = attributes.backgroundColor
      ? varWpColor(attributes.backgroundColor)
      : (blockStyle.color?.background ?? null);

    const borderColor = attributes.borderColor
      ? varWpColor(attributes.borderColor)
      : (blockStyle.border?.color ?? null);

    const styleProps = {};
    if (textColor) styleProps["--local-text-color"] = textColor;
    if (bgColor) styleProps["--local-bg-color"] = bgColor;
    if (borderColor) styleProps["--local-border-color"] = borderColor;

    // Return early if no custom variables
    if (!Object.keys(styleProps).length) {
      return <BlockListBlock {...props} />;
    }

    // If any custom variables exist, inject them
    const newProps = {
      ...props,
      wrapperProps: {
        ...props.wrapperProps,
        style: { ...props.wrapperProps?.style, ...styleProps },
      },
    };

    console.log(
      `Injecting local color variables: ${JSON.stringify(styleProps)} into ${props.name} block ${props.clientId}`,
    );

    return <BlockListBlock {...newProps} />;
  };
}, "addCSSLocalPropsToBlock");

/**
 * @param {string[]} [newBlockNames] Omit to use PHP-localized list (or `core/button`).
 */
export function initCssLocalProps(newBlockNames) {
  if (newBlockNames === undefined) {
    const fromPhp =
      /** @type {{ iopLocalProps?: { addToBlocks?: string[] } }} */ (globalThis)
        .iopLocalProps?.addToBlocks;
    newBlockNames = Array.isArray(fromPhp) ? fromPhp : ["core/button"];
  }
  _blockNames = newBlockNames;
  addFilter(
    "editor.BlockListBlock",
    "iop/add-css-local-props-to-block",
    addCSSLocalPropsToBlock,
  );
}
