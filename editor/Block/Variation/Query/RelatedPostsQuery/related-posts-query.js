import { registerBlockVariation } from "@wordpress/blocks";
import { addFilter } from "@wordpress/hooks";
import { SVG, Path } from "@wordpress/primitives";

import { usePublicPostTypes } from "../../../lib/use-public-post-types.js";
import { usePublicTaxonomies } from "../../../lib/use-public-taxonomies.js";

import { createHigherOrderComponent } from "@wordpress/compose";

import { store as coreStore } from "@wordpress/core-data";
import { store as editorStore } from "@wordpress/editor";

import { InspectorControls } from "@wordpress/block-editor";
import { select } from "@wordpress/data";
import {
  RangeControl,
  SelectControl,
  Spinner,
  Tip,
  PanelBody,
} from "@wordpress/components";

const icon = (
  <SVG
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
  >
    <Path d="M160-120q-33 0-56.5-23.5T80-200v-280h80v280h360v80H160Zm160-160q-33 0-56.5-23.5T240-360v-280h80v280h360v80H320Zm160-160q-33 0-56.5-23.5T400-520v-240q0-33 23.5-56.5T480-840h320q33 0 56.5 23.5T880-760v240q0 33-23.5 56.5T800-440H480Zm0-80h320v-160H480v160Z" />
  </SVG>
);

export function initRelatedPostsQueryBlock() {
  registerBlockVariation("core/query", {
    name: "query-related-posts",
    title: "Related Posts Query",
    description: "Display Related Posts",
    attributes: {
      namespace: "ideasonpurpose/query-related-posts",
      query: {
        inherit: false, // required for initial results
        postType: "post", // required for initial results, no way of knowing the exact post_type at this point
        perPage: 3, // required for initial results
        postTypes: [],
        weights: { post_type: 3, tag: 1, category: 4 },
        relatedPost: 0,
      },
    },
    // To expose the native perPage controls allow ["pagination", "offset", "perPage"]
    // allowedControls: ["pagination", "offset", "perPage"],
    allowedControls: [],
    icon,
    isActive: ["namespace"],
    scope: ["inserter"],
  });

  addFilter(
    "editor.BlockEdit",
    "ideasonpurpose/group-linked/add-controls",
    wrappedEdit,
  );
}

/**
 * Reference for core-data methods:
 * @link https://developer.wordpress.org/block-editor/reference-guides/data/data-core/
 */
const wrappedEdit = createHigherOrderComponent((BlockEdit) => {
  return (props) => {
    const { name, attributes, setAttributes } = props;

    if (
      name !== "core/query" ||
      attributes?.namespace !== "ideasonpurpose/query-related-posts"
    ) {
      return <BlockEdit {...props} />;
    }

    const postId = select(editorStore).getCurrentPostId();
    const currentPostType = select(editorStore).getCurrentPostType();

    const { query } = attributes;

    if (!query.postTypes.length) {
      query.postType = currentPostType;
      query.postTypes.push(currentPostType);
      query.relatedPost = postId;
    }

    let availableTaxonomies = [];
    const selectedPostTypes = [];
    const allPostTypes = usePublicPostTypes() || [];
    const allTaxonomies = usePublicTaxonomies() || [];

    for (const type of allPostTypes) {
      if (query.postTypes.includes(type.slug)) {
        selectedPostTypes.push(type);
        availableTaxonomies = [...availableTaxonomies, ...type.taxonomies];
      }
    }

    const selectedTaxonomies = [...new Set(availableTaxonomies)];

    /**
     * Set weights based on weighting slider values. Ensure that only visible options are stored.
     */
    const setWeights = (singleWeightVal) => {
      const newWeights = {};
      for (const taxSlug of selectedTaxonomies) {
        newWeights[taxSlug] = query.weights[taxSlug] ?? 2;
      }

      if (query.postTypes?.length > 1) {
        newWeights.postType = query.weights.postType ?? 2;
      }

      console.log(newWeights);
      setAttributes({
        query: { ...query, weights: { ...newWeights, ...singleWeightVal } },
      });
    };

    const setPostTypes = (val) => {
      console.log({ setPostTypes1: val });
      val = val.length ? val : [currentPostType];

      setAttributes({
        query: { ...query, postTypes: [...val], postType: val[0] },
        // relatedContent: { ...relatedContent, postTypes: [...val] },
      });
    };

    const weightsSliders = selectedTaxonomies
      .map((taxSlug) => select(coreStore).getTaxonomy(taxSlug))
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((tax) => tax !== undefined)
      .map((tax) => (
        <RangeControl
          key={tax.slug}
          label={tax.labels.singular_name}
          value={query.weights[tax.slug] ?? 2}
          onChange={(n) => setWeights({ [tax.slug]: n })}
          min={0}
          max={7}
          marks
          __nextHasNoMarginBottom
          __next40pxDefaultSize
        />
      ));

    if (query.postTypes?.length > 1) {
      weightsSliders.push(
        <RangeControl
          key="post_type"
          label="Post Type"
          value={query.weights.postType ?? 2}
          onChange={(n) => setWeights({ postType: n })}
          min={0}
          max={7}
          marks
          __nextHasNoMarginBottom
          __next40pxDefaultSize
        />,
      );
    }

    if (weightsSliders.length < 1) {
      weightsSliders.push(
        <Tip key="no-taxonomy-warning">
          No Taxonomies are associated with this post type.
        </Tip>,
      );
    }

    /**
     * perPage is stored in the native query attribute
     * query.inherit must be set to false or perPage will inherit the global perPage value
     */
    const perPageSlider = (
      <RangeControl
        key="perPage"
        label="Number of Items"
        value={query.perPage ?? 3}
        onChange={(n) => setAttributes({ query: { ...query, perPage: n } })}
        min={1}
        max={12}
        __nextHasNoMarginBottom
        __next40pxDefaultSize
      />
    );

    /**
     * perPage is stored in the native query attribute
     * query.inherit must be set to false or perPage will inherit the global perPage value
     */
    const offsetSlider = (
      <RangeControl
        key="offset"
        label="Offset"
        value={query.offset ?? 0}
        onChange={(n) => setAttributes({ query: { ...query, offset: n } })}
        min={0}
        max={12}
        __nextHasNoMarginBottom
        __next40pxDefaultSize
        help="Offset the returned items by this amount."
      />
    );

    /**
     * Set up postTypes for the selectControl input
     */
    const postTypeOptions = allPostTypes.map((pt) => ({
      value: pt.slug,
      label: pt.name,
    }));

    return (
      <>
        <BlockEdit key="edit" {...props} />
        {props.attributes.namespace === "ideasonpurpose/query-related-posts" &&
          props.isSelected && (
            <>
              <InspectorControls>
                <PanelBody title="Display">{perPageSlider}</PanelBody>
                <PanelBody title="Related Item Weighting">
                  <SelectControl
                    label="Post Types"
                    multiple={true}
                    value={query.postTypes}
                    options={postTypeOptions}
                    onChange={setPostTypes}
                    __nextHasNoMarginBottom
                    __next40pxDefaultSize
                    help="Show Related Content from these post types."
                  />
                  {weightsSliders || Spinner}
                </PanelBody>
              </InspectorControls>

              <InspectorControls group="advanced">
                {offsetSlider}
              </InspectorControls>
            </>
          )}
      </>
    );
  };
}, "blockEditInterface");
