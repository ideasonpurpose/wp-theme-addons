<?php

/**
 * This file is part of the WordPress Theme Addons.
 * @link https://github.com/ideasonpurpose/wp-theme-addons
 */

namespace IdeasOnPurpose\WP\Theme\Addons\Block\Variation\Group\LinkedGroup;

class LinkedGroup
{
    public $original_callback;

    public $src_block_name = 'core/group';
    public $variationNamespace = 'ideasonpurpose/group-linked';

    public function __construct()
    {
        /**
         * Callbacks are per block, and cannot be specific to a single variation
         */
        add_filter('register_block_type_args', [$this, 'wrap_render_callback'], 10, 2);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_styles']);
    }

    public function enqueue_styles()
    {
        $css_file = __DIR__ . '/linked-group-front-end.css';
        $css_url = home_url(str_replace(wp_normalize_path(ABSPATH), '', wp_normalize_path($css_file)));
        wp_enqueue_style('iop-linked-group', $css_url, [], filemtime($css_file));
    }

    public function wrap_render_callback($args, $block_type)
    {
        if ($block_type === $this->src_block_name) {
            // Store existing callback
            $this->original_callback = $args['render_callback'];
            $args['render_callback'] = [$this, 'wrapped_render_callback'];
        }
        return $args;
    }

    public function wrapped_render_callback($attributes, $content, $block)
    {
        global $post;
        $blockHTML = $content;

        if (($attributes['namespace'] ?? null) !== $this->variationNamespace) {
            return $blockHTML;
        }

        if (!isset($attributes['linkToSelf']) && !isset($attributes['url'])) {
            return $blockHTML;
        }

        $href =
            isset($attributes['linkToSelf']) && $attributes['linkToSelf']
                ? get_permalink($post)
                : $attributes['url'];

        $target = isset($attributes['linkTarget'])
            ? ' target="' . esc_attr($attributes['linkTarget']) . '"'
            : '';
        $rel = isset($attributes['rel']) ? ' rel="' . esc_attr($attributes['rel']) . '"' : '';

        $linkHTML = sprintf(
            '<a href="%s" class="iop-linked-group__link"%s%s></a>',
            esc_attr($href),
            $target,
            $rel,
        );

        $blockHTML = preg_replace('/<\/div>$/', $linkHTML . '</div>', $blockHTML);

        return $blockHTML;
    }
}
