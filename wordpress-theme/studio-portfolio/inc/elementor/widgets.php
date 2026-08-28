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

	protected function render_template_part( $slug ) {
		get_template_part( 'template-parts/' . $slug );
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
