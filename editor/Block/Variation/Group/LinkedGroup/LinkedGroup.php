<?php

/**
 * This file is part of the WordPress JS Packages.
 * @link https://github.com/ideasonpurpose/wp-js-packages
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
