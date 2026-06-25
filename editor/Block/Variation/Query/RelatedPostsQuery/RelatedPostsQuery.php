<?php

/**
 * This file is part of the WordPress JS Packages.
 * @link https://github.com/ideasonpurpose/wp-js-packages
 */

namespace IdeasOnPurpose\WP\Theme\Addons\Block\Variation\Query\RelatedPostsQuery;

use IdeasOnPurpose\WP\RelatedPosts;

class RelatedPostsQuery
{
    public $namespace = 'ideasonpurpose/query-related-posts';

    public function __construct()
    {
        /**
         * rest_{post_type}_query filters need to be added for each post_type.
         * If the filter is assigned before the init hook, custom post_types
         * don't exist yet and the filter doesn't seem to work.
         */
        add_action('init', [$this, 'init'], 50);

        add_filter('pre_render_block', [$this, 'pre_render_block_filter'], 10, 3);
    }

    /**
     * Add rest{post_type}_query filters for all public post_types except attachments
     *
     * This has to be done late in the init hook, after all custom post_types have
     * been defined.
     * ;@link https://developer.wordpress.org/reference/hooks/rest_this-post_type_query/
     */
    public function init()
    {
        $post_types = get_post_types(['public' => true]);
        unset($post_types['attachment']);

        foreach ($post_types as $post_type) {
            add_filter("rest_{$post_type}_query", [$this, 'editor_intercept_query_filter'], 10, 2);
        }
    }

    /**
     * This filter adds an additional `query_loop_block_query_vars` filter if the block's namespace attribute matches.
     */
    public function pre_render_block_filter($pre_render, $parsed_block, $parent_block)
    {
        $blockName = $parsed_block['blockName'];
        $namespace = $parsed_block['attrs']['namespace'] ?? null;
        if ($blockName === 'core/query' && $namespace == $this->namespace) {
            add_filter('query_loop_block_query_vars', [$this, 'front_end_query_filter'], 10, 3);
        }

        return $pre_render;
    }

    // NOTE: $request  is a monster WP_REST_Request object which isn't particularly useful.
    /**
     * Called from the `query_loop_block_query_vars` filter (added from the `pre_render_block` filter above)
     * @link https://developer.wordpress.org/reference/hooks/query_loop_block_query_vars/
     *
     * $request is a WP_REST_Request
     * @link https://developer.wordpress.org/reference/classes/wp_rest_request/
     *
     * @param mixed $args
     * @param mixed $request WP_REST_Request
     * @param mixed $more
     * @return mixed
     */
    public function editor_intercept_query_filter($args, $request)
    {
        global $post;
        $postTypes = $request->get_param('postTypes') ?? [];
        $weights = $request->get_param('weights') ?? [];
        $relatedPost = $request->get_param('relatedPost') ?? ($post->ID ?? 0);

        if ($weights) {
            $rpArgs = [
                'post' => $relatedPost,
                'post_types' => $postTypes,
                'weights' => $weights,

                'posts_per_page' => $args['posts_per_page'],
                'offset' => $args['offset'],
            ];

            $rp = new RelatedPosts();
            $posts = $rp->get($rpArgs);

            $ids = wp_list_pluck($posts, 'ID');
            $post_types = array_unique(wp_list_pluck($posts, 'post_type'));

            $newArgs = [
                'post__in' => $ids,
                'post_type' => $post_types,
                'ignore_sticky_posts' => true,
                'orderby' => 'post__in',
                'posts_per_page' => count($ids),
            ];

            return $newArgs;
        }

        return $args;
    }

    /**
     * The query for the visitor-facing front-end block will be replaced with a new query
     * derived from Posts collected by RelatedPosts. A `post__in` list of the related IDs
     * will be returned as is, with order determined by the RelatedPosts library.
     *
     * NOTE: The $query property is a set of arguments to be passed to a new WP_Query()
     * call in PHP.
     *
     * The $block->context->query property is the query used by the Query Loop block in
     * a JavaScript/React context. THEY. ARE. NOT. THE. SAME. Also not interchangeable.
     *
     * Called from the query_loop_block_query_vars hook
     * @link https://developer.wordpress.org/reference/hooks/query_loop_block_query_vars/
     *
     * @param Array $query - Query args for WP_Query
     * @param mixed $block - A block, likely include attributes and context
     * @param Integer $page - the page of content for paginated lists
     * @return array
     */
    public function front_end_query_filter($query, $block, $page)
    {
        $rpQuery = $block->context['query'];

        if (!isset($rpQuery['weights']) || empty((array) $rpQuery['weights'])) {
            error_log('no related content, returning early');
            return $query;
        }

        $rpArgs = [
            'post' => $rpQuery['relatedPost'],
            'post_types' => $rpQuery['postTypes'],
            'weights' => $rpQuery['weights'],

            'posts_per_page' => $rpQuery['perPage'],
            'offset' => $rpQuery['offset'] ?? 0,
        ];

        /**
         * Call RelatedPosts::get to fetch a set of IDs, then replace the
         * returned query with those IDs and associated post_types
         *
         * TODO: This instantiation is too late to register the JSON-API routes
         */
        $rp = new RelatedPosts();
        $posts = $rp->get($rpArgs);

        $ids = wp_list_pluck($posts, 'ID');
        $post_types = array_unique(wp_list_pluck($posts, 'post_type'));

        $newArgs = [
            'post__in' => $ids,
            'post_type' => $post_types,
            'ignore_sticky_posts' => true,
            'orderby' => 'post__in',
            'posts_per_page' => -1,
        ];

        return $newArgs;
    }
}
