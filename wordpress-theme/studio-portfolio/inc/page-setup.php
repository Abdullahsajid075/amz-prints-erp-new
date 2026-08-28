<?php
/**
 * Multi-page setup — Work, About, Contact pages
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get permalink for a theme-assigned page.
 *
 * @param string $key Theme mod key without studio_ prefix (e.g. work_page_id).
 * @param string $fallback Fallback URL.
 * @return string
 */
function studio_get_page_url( $key, $fallback = '#' ) {
	$page_id = (int) studio_get_option( $key, 0 );
	if ( $page_id && 'publish' === get_post_status( $page_id ) ) {
		return get_permalink( $page_id );
	}
	return $fallback;
}

/**
 * Create default pages on theme activation.
 */
function studio_create_default_pages() {
	$pages = array(
		'work'    => array(
			'title'    => __( 'Work', 'studio-portfolio' ),
			'template' => 'page-templates/page-work.php',
		),
		'about'   => array(
			'title'    => __( 'About', 'studio-portfolio' ),
			'template' => 'page-templates/page-about.php',
		),
		'contact' => array(
			'title'    => __( 'Contact', 'studio-portfolio' ),
			'template' => 'page-templates/page-contact.php',
		),
	);

	foreach ( $pages as $slug => $data ) {
		$mod_key = $slug . '_page_id';
		$existing = (int) studio_get_option( $mod_key, 0 );

		if ( $existing && get_post( $existing ) ) {
			continue;
		}

		$page_id = wp_insert_post(
			array(
				'post_title'   => $data['title'],
				'post_status'  => 'publish',
				'post_type'    => 'page',
				'post_content' => '',
			),
			true
		);

		if ( is_wp_error( $page_id ) ) {
			continue;
		}

		update_post_meta( $page_id, '_wp_page_template', $data['template'] );
		set_theme_mod( 'studio_' . $mod_key, $page_id );
	}
}
add_action( 'after_switch_theme', 'studio_create_default_pages', 20 );

/**
 * Build portfolio query args from template/Elementor args.
 *
 * @param array $args Template arguments.
 * @return array
 */
function studio_get_portfolio_query_args( $args = array() ) {
	$query_args = array(
		'post_type'      => 'portfolio',
		'posts_per_page' => (int) studio_template_arg( $args, 'posts_per_page', 'home_portfolio_count', 6 ),
		'orderby'        => studio_template_arg( $args, 'orderby', '', 'menu_order' ),
		'order'          => studio_template_arg( $args, 'order', '', 'ASC' ),
	);

	$mode = studio_template_arg( $args, 'mode', '', 'home' );
	if ( 'home' === $mode || ! empty( $args['featured_only'] ) ) {
		$query_args['meta_query'] = array(
			array(
				'key'   => '_portfolio_featured_home',
				'value' => '1',
			),
		);
	}

	$category = studio_template_arg( $args, 'category', '', '' );
	if ( $category ) {
		$query_args['tax_query'] = array(
			array(
				'taxonomy' => 'portfolio_category',
				'field'    => 'slug',
				'terms'    => sanitize_title( $category ),
			),
		);
	}

	return apply_filters( 'studio_portfolio_query_args', $query_args, $args );
}
