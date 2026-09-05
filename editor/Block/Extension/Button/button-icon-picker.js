// @ts-check

import "./button-icon-picker.scss";
import { InspectorControls } from "@wordpress/block-editor";
import { PanelBody, SelectControl } from "@wordpress/components";
import { createHigherOrderComponent } from "@wordpress/compose";
import { addFilter } from "@wordpress/hooks";

/** @type {{ label?: string; value: string }[]} */
let _icons = [];

/**
 * @param {{ label?: string; value: string }[]} [icons]
 * @param {string} [defaultIcon]
 */
export function initButtonIconPicker(icons = [], defaultIcon = "") {
  // No icons, do nothing
  if (icons.length === 0) return;

  _icons = [{ label: "None", value: "" }, ...icons];

  /**
   * Add attributes to core/button
   */
  addFilter(
    "blocks.registerBlockType",
    "ideasonpurpose.buttonIconPicker",
    (/** @type {any} */ settings, /** @type {string} */ name) => {
      if (name !== "core/button") return settings;
      const newSettings = { ...settings };
      newSettings.attributes = {
        ...newSettings.attributes,
        buttonIcon: { type: "string", default: defaultIcon },
      };
      return newSettings;
    },
  );
}

const buttonIconPickerInterface = createHigherOrderComponent(
  (/** @type {any} */ BlockEdit) => {
    return (/** @type {any} */ props) => {
      if (props.name !== "core/button") {
        return <BlockEdit {...props} />;
      }

      const { attributes, setAttributes } = props;
      const { buttonIcon } = attributes;

      return (
        <>
          <BlockEdit {...props} />
          <InspectorControls group="styles">
            <PanelBody title="IOP Button Icon" initialOpen={true}>
              <SelectControl
                label="Select an icon"
                value={buttonIcon}
                __next40pxDefaultSize={true}
                options={_icons}
                onChange={(/** @type {any} */ value) =>
                  setAttributes({ buttonIcon: value })
                }
              />
            </PanelBody>
          </InspectorControls>
        </>
      );
    };
  },
  "buttonIconPickerInterface",
);

addFilter(
  "editor.BlockEdit",
  "ideasonpurpose.buttonIconPicker.BlockEdit",
  buttonIconPickerInterface,
);

/**
 * Add icon class to the button wrapper for both save and editor preview
 */
addFilter(
  "blocks.getSaveContent.extraProps",
  "ideasonpurpose.buttonIconPicker.extraProps",
  (
    /** @type {any} */ extraProps,
    /** @type {any} */ blockType,
    /** @type {any} */ attributes,
  ) => {
    if (blockType.name !== "core/button") return extraProps;
    const { buttonIcon } = attributes;
    if (buttonIcon) {
      extraProps.className = [
        extraProps.className,
        "iop-button-icon",
        `icon-${buttonIcon}`,
      ]
        .filter(Boolean)
        .join(" ");
    }
    return extraProps;
  },
);

const buttonIconClass = createHigherOrderComponent(
  (/** @type {any} */ BlockListBlock) => {
    return (/** @type {any} */ props) => {
      if (props.name !== "core/button") {
        return <BlockListBlock {...props} />;
      }
      const { attributes, className } = props;
      const { buttonIcon } = attributes;
      const iconClass = buttonIcon ? `iop-button-icon icon-${buttonIcon}` : "";
      const newClassName = [className, iconClass].filter(Boolean).join(" ");
      return <BlockListBlock {...props} className={newClassName} />;
    };
  },
  "buttonIconClass",
);

addFilter(
  "editor.BlockListBlock",
  "ideasonpurpose.buttonIconPicker.BlockListBlock",
  buttonIconClass,
);
