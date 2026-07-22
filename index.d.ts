declare module "@ideasonpurpose/wp-theme-addons" {
  interface WP_Post_Type {
    slug: string;
    name: string;
    viewable: boolean;
    taxonomies: string[];
    [key: string]: unknown;
  }

  interface WP_Taxonomy {
    slug: string;
    name: string;
    visibility: {
      publicly_queryable: boolean;
      [key: string]: unknown;
    };
    labels: {
      singular_name: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  export function usePublicPostTypes(): WP_Post_Type[] | undefined;
  export function usePublicTaxonomies(): WP_Taxonomy[] | undefined;

  export function initLinkedGroupBlock(): void;
  export function initRelatedPostsQueryBlock(): void;
  export function initCssLocalProps(blockNames?: string[]): void;
}