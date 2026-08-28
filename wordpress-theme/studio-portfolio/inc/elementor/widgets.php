<?php
/**
 * Elementor widgets for theme sections
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Base widget helper.
 */
abstract class Studio_Portfolio_Elementor_Widget_Base extends \Elementor\Widget_Base {

	public function get_categories() {
		return array( 'studio-portfolio' );
	}

	/**
	 * Render a template part with optional overrides.
	 *
	 * @param string $slug Template part slug.
	 * @param array  $args Optional template arguments.
	 */
	protected function render_template_part( $slug, $args = array() ) {
		get_template_part( 'template-parts/' . $slug, null, $args );
	}

	/**
	 * Parse textarea lines into a trimmed array.
	 *
	 * @param string $value Multiline string.
	 * @return array
	 */
	protected function parse_textarea_lines( $value ) {
		if ( empty( $value ) ) {
			return array();
		}
		return array_values( array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', $value ) ) ) );
	}

	/**
	 * Get URL from Elementor URL control value.
	 *
	 * @param array|string $setting URL control value.
	 * @return string
	 */
	protected function get_url_from_setting( $setting ) {
		if ( is_array( $setting ) && ! empty( $setting['url'] ) ) {
			return $setting['url'];
		}
		return is_string( $setting ) ? $setting : '#';
	}
}

require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-hero-widget.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-marquee-widget.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-portfolio-widget.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-about-widget.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-contact-widget.php';

/**
 * Register widgets with Elementor.
 *
 * @param \Elementor\Widgets_Manager $widgets_manager Widgets manager.
 */
function studio_register_elementor_widgets( $widgets_manager ) {
	$widgets_manager->register( new Studio_Hero_Widget() );
	$widgets_manager->register( new Studio_Marquee_Widget() );
	$widgets_manager->register( new Studio_Portfolio_Widget() );
	$widgets_manager->register( new Studio_About_Widget() );
	$widgets_manager->register( new Studio_Contact_Widget() );
}
add_action( 'elementor/widgets/register', 'studio_register_elementor_widgets' );
