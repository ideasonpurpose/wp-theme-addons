<?php

/**
 * This file is part of the WordPress Theme Addons.
 * @link https://github.com/ideasonpurpose/wp-theme-addons
 */

namespace IdeasOnPurpose\WP\Theme\Addons\Block\Variation\Group\Carousel;

class Carousel
{
    public $namespace = 'ideasonpurpose/carousel';

    public function __construct()
    {
        add_filter('render_block', [$this, 'add_data_attributes'], 10, 2);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_styles']);
    }

    /**
     * Copy carousel settings onto data attributes at render time.
     *
     * The saved markup stays the core/group HTML. Unset attributes are
     * omitted and the front end uses its own defaults.
     *
     * @param string $content
     * @param array $block
     * @return string
     */
    public function add_data_attributes($content, $block)
    {
        if (($block['blockName'] ?? '') !== 'core/group') {
            return $content;
        }

        $attrs = $block['attrs'] ?? [];
        if (($attrs['namespace'] ?? '') !== $this->namespace) {
            return $content;
        }

        if (!is_string($content) || $content === '') {
            return $content;
        }

        $tags = new \WP_HTML_Tag_Processor($content);
        if (!$tags->next_tag()) {
            return $content;
        }

        foreach (
            [
                'carouselAutoplay' => 'data-autoplay',
                'carouselArrows' => 'data-arrows',
                'carouselDots' => 'data-dots',
                'carouselPause' => 'data-pause',
                'carouselLoop' => 'data-loop',
            ]
            as $key => $attribute
        ) {
            if (!array_key_exists($key, $attrs)) {
                continue;
            }
            $tags->set_attribute($attribute, $attrs[$key] ? 'true' : 'false');
        }

        if (isset($attrs['carouselDuration']) && is_numeric($attrs['carouselDuration'])) {
            $seconds = (float) $attrs['carouselDuration'];
            if ($seconds > 0) {
                $tags->set_attribute('data-duration', (string) $seconds);
            }
        }

        if (isset($attrs['carouselRandom']) && is_numeric($attrs['carouselRandom'])) {
            $count = (int) $attrs['carouselRandom'];
            if ($count > 0) {
                $tags->set_attribute('data-random', (string) $count);
            }
        }

        return $tags->get_updated_html();
    }

    /**
     * Inline the same CSS the editor script imports.
     */
    public function enqueue_styles()
    {
        static $done = false;
        if ($done) {
            return;
        }
        $done = true;

        $css = file_get_contents(__DIR__ . '/carousel.css');
        if (!$css) {
            return;
        }

        wp_register_style('iop-carousel', false);
        wp_add_inline_style('iop-carousel', $css);
        wp_enqueue_style('iop-carousel');
    }
}
