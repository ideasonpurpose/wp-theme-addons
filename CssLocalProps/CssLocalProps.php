<?php

/**
 * This file is part of the WordPress Theme Addons.
 * @link https://github.com/ideasonpurpose/wp-theme-addons
 */

namespace IdeasOnPurpose\WP\Theme\Addons\CssLocalProps;

/**
 * Applies --local-* CSS properties (text, bg, border colors) to allowed blocks
 * during `render_block` (frontend) and localizes the filtered block list for editor JS.
 */
class CssLocalProps
{
    public function __construct()
    {
        add_filter('render_block', [$this, 'addCSSLocalPropsToBlock'], 10, 2);
        add_action('enqueue_block_editor_assets', [$this, 'localizeToEditor']);
    }

    /**
     * Adds CSS local properties to the block content for allowed blocks.
     *
     * This function processes core/button blocks and adds custom CSS properties
     * for text color, background color, and border color based on the block's attributes.
     *
     * @param string $block_content The HTML content of the block.
     * @param array  $block         The block data array containing attributes and block name.
     * @return string The modified block content with added CSS properties.
     */
    public function addCSSLocalPropsToBlock($block_content, $block)
    {
        $allowedBlocks = $this->getAddToBlocks();

        if (!in_array($block['blockName'], $allowedBlocks)) {
            return $block_content;
        }

        $attrs = $block['attrs'] ?? [];

        $varWpColorTemplate = 'var(--wp--preset--color--%s)';

        $textColor =
            $attrs['textColor'] ?? null
                ? sprintf($varWpColorTemplate, $attrs['textColor'])
                : $attrs['style']['color']['text'] ?? null;

        $bgColor =
            $attrs['backgroundColor'] ?? null
                ? sprintf($varWpColorTemplate, $attrs['backgroundColor'])
                : $attrs['style']['color']['background'] ?? null;

        $borderColor =
            $attrs['borderColor'] ?? null
                ? sprintf($varWpColorTemplate, $attrs['borderColor'])
                : $attrs['style']['border']['color'] ?? null;

        $styleProps = array_filter([
            $textColor ? "--local-text-color:{$textColor}" : null,
            $bgColor ? "--local-bg-color:{$bgColor}" : null,
            $borderColor ? "--local-border-color:{$borderColor}" : null,
        ]);

        if (empty($styleProps)) {
            return $block_content;
        }

        $propsString = implode(';', $styleProps) . ';';

        $tags = new \WP_HTML_Tag_Processor($block_content);

        // Target ONLY the first (outer wrapper) tag.
        // Use while ($tags->next_tag()) if you intentionally want to apply to ALL tags inside the block.
        if ($tags->next_tag()) {
            $existing_style = $tags->get_attribute('style');
            $existing_style = is_string($existing_style) ? $existing_style : '';

            // Not completely sure whether prepending or appending is the right choice here,
            // or if it actually matters at all.
            // $new_style = $propsString . $existing_style; //prepend
            $new_style = $existing_style . $propsString; //append

            $tags->set_attribute('style', $new_style);
        }

        return $tags->get_updated_html();
    }

    protected function getAddToBlocks()
    {
        return apply_filters('iop/add_css_local_props_allowed_blocks', ['core/button']);
    }

    public function localizeToEditor()
    {
        $themeSlug = get_stylesheet();
        wp_localize_script("{$themeSlug}-editor", 'iopLocalProps', [
            'addToBlocks' => $this->getAddToBlocks(),
        ]);
    }
}
