import { store as coreStore } from "@wordpress/core-data";
import { useMemo } from "@wordpress/element";
import { useSelect } from "@wordpress/data";

/**
 * Call this to initialize the data-store so a plain select('core').getTaxonomy has data to pull from
 *
 * Lifted directly from the undocumented and not exported usePublicTaxonomies here:
 * @link https://github.com/WordPress/gutenberg/blob/d913ca150ba2c616e16134447d6e61e7704a7962/packages/edit-site/src/components/add-new-template/utils.js#L115-L125
 */
export function usePublicTaxonomies() {
  const taxonomies = useSelect(
    (select) => select(coreStore).getTaxonomies({ per_page: -1 }),
    [],
  );
  return useMemo(() => {
    return taxonomies?.filter(
      ({ visibility }) => visibility?.publicly_queryable,
    );
  }, [taxonomies]);
}
