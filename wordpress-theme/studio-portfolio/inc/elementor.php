<?php
/**
 * Elementor compatibility
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Set content width for Elementor.
 */
if ( ! isset( $content_width ) ) {
	$content_width = 1200;
}

/**
 * Register Elementor theme locations (Header, Footer, Single, Archive).
 *
 * @param ElementorPro\Modules\ThemeBuilder\Classes\Locations_Manager $elementor_theme_manager Manager.
 */
function studio_register_elementor_locations( $elementor_theme_manager ) {
	if ( method_exists( $elementor_theme_manager, 'register_all_core_location' ) ) {
		$elementor_theme_manager->register_all_core_location();
	}
}
add_action( 'elementor/theme/register_locations', 'studio_register_elementor_locations' );

/**
 * Register Studio Portfolio widget category in Elementor.
 *
 * @param Elementor\Elements_Manager $elements_manager Elements manager.
 */
function studio_register_elementor_category( $elements_manager ) {
	$elements_manager->add_category(
		'studio-portfolio',
		array(
			'title' => __( 'Studio Portfolio', 'studio-portfolio' ),
			'icon'  => 'fa fa-briefcase',
		)
	);
}
add_action( 'elementor/elements/categories_registered', 'studio_register_elementor_category' );

/**
 * Check if a page is built with Elementor.
 *
 * @param int|null $post_id Post ID.
 * @return bool
 */
function studio_is_elementor_page( $post_id = null ) {
	if ( ! did_action( 'elementor/loaded' ) ) {
		return false;
	}
	if ( null === $post_id ) {
		$post_id = get_the_ID();
	}
	if ( ! $post_id ) {
		return false;
	}
	return (bool) \Elementor\Plugin::$instance->db->is_built_with_elementor( $post_id );
}

/**
 * Load Elementor widgets (registration inside widgets.php).
 */
function studio_load_elementor_integration() {
	if ( ! did_action( 'elementor/loaded' ) ) {
		return;
	}
	require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/widgets.php';
}
add_action( 'elementor/loaded', 'studio_load_elementor_integration' );

/**
 * Enqueue Elementor-compatible theme styles on Elementor pages.
 */
function studio_elementor_enqueue_styles() {
	if ( ! studio_is_elementor_page() && ! is_front_page() ) {
		return;
	}
	wp_enqueue_style(
		'studio-elementor',
		STUDIO_PORTFOLIO_URI . '/assets/css/elementor.css',
		array( 'studio-portfolio-light' ),
		STUDIO_PORTFOLIO_VERSION
	);
}
add_action( 'elementor/frontend/after_enqueue_styles', 'studio_elementor_enqueue_styles' );
add_action( 'wp_enqueue_scripts', 'studio_elementor_enqueue_styles', 25 );

/**
 * Add Elementor support notice in admin.
 */
function studio_elementor_plugin_notice() {
	if ( did_action( 'elementor/loaded' ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( ! $screen || 'themes' !== $screen->id ) {
		return;
	}
	?>
	<div class="notice notice-info">
		<p>
			<?php
			printf(
				/* translators: %s: Elementor plugin link */
				esc_html__( 'Studio Portfolio supports %s — edit any page visually and use Studio Portfolio blocks in the widget panel.', 'studio-portfolio' ),
				'<a href="' . esc_url( admin_url( 'plugin-install.php?s=elementor&tab=search&type=term' ) ) . '">Elementor</a>'
			);
			?>
		</p>
	</div>
	<?php
}
add_action( 'admin_notices', 'studio_elementor_plugin_notice' );

/**
 * Add body class when page uses Elementor.
 *
 * @param array $classes Body classes.
 * @return array
 */
function studio_elementor_body_class( $classes ) {
	if ( studio_is_elementor_page() ) {
		$classes[] = 'studio-elementor-page';
	}
	return $classes;
}
add_filter( 'body_class', 'studio_elementor_body_class' );

/**
 * Keep About / How I Work on theme templates even if Elementor Theme Builder is active.
 *
 * @param bool   $need     Whether to override.
 * @param string $location Location name.
 * @return bool
 */
function studio_elementor_keep_locked_pages( $need, $location = '' ) {
	if ( ! is_page() ) {
		return $need;
	}
	$role = studio_detect_page_role( get_queried_object_id() );
	if ( in_array( $role, array( 'about', 'how-i-work' ), true ) ) {
		return false;
	}
	return $need;
}
add_filter( 'elementor/theme/need_override_location', 'studio_elementor_keep_locked_pages', 999, 2 );
