import { store as coreStore } from "@wordpress/core-data";
import { useMemo } from "@wordpress/element";
import { useSelect } from "@wordpress/data";

/**
 * Call this to initialize the data-store so a plain select('core').getPostType has data to pull from
 *
 * Lifted directly from the undocumented and not exported usePublicPostTypes() here:
 * @link https://github.com/WordPress/gutenberg/blob/d913ca150ba2c616e16134447d6e61e7704a7962/packages/edit-site/src/components/add-new-template/utils.js#L91-L113
 *
 * NOTE: Importing usePostTypes from @wordpress/block-library/src/query/utils silently broke the whole block variation.
 *       Don't use this:
 *       @link https://github.com/WordPress/gutenberg/blob/28847b04ce121fd333ee364a6525d2ca7f969e10/packages/block-library/src/query/utils.js#L93-L128
 */
export function usePublicPostTypes() {
  const postTypes = useSelect(
    (select) => select(coreStore).getPostTypes({ per_page: -1 }),
    [],
  );
  return useMemo(() => {
    const excludedPostTypes = ["attachment"];
    return postTypes
      ?.filter(
        ({ viewable, slug }) => viewable && !excludedPostTypes.includes(slug),
      )
      .sort((a, b) => {
        // Sort post types alphabetically by name,
        // but exclude the built-in 'post' type from sorting.
        if (a.slug === "post" || b.slug === "post") {
          return 0;
        }

        return a.name.localeCompare(b.name);
      });
  }, [postTypes]);
}
