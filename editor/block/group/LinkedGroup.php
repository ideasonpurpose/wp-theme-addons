<?php

namespace IdeasOnPurpose\WP\Block\Variation;

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
            // Record existing callback
            $this->original_callback = $args['render_callback'];
            $args['render_callback'] = [$this, 'wrapped_render_callback'];
        }
        return $args;
    }

    public function wrapped_render_callback($attributes, $content, $block)
    {
        $blockHTML = call_user_func($this->original_callback, $attributes, $content, $block);

        if (!isset($attributes['namespace']) || $attributes['namespace'] !== $this->variationNamespace) {
            return $blockHTML;
        }


        // DEBUG SNIPPET START
        \Kint::$mode_default = 'c';

        error_log("\n" .@d($attributes, $content));

        \Kint::$mode_default = 'r';
        // DEBUG SNIPPET END


        // $prefix = sprintf('<span>%s</span>', $attributes['prefix']);
        $newHTML = preg_replace('/#__LINKED_GROUP_PLACEHOLDER__/i', "#PERMALINK", $blockHTML);

        return $newHTML;
    }
}
