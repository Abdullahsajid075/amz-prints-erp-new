<?php
/**
 * Multi-page site setup — v2.0
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get permalink for a theme-assigned page.
 *
 * @param string $key     Theme mod key without studio_ prefix.
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
		'portfolio' => array(
			'title'    => __( 'Portfolio', 'studio-portfolio' ),
			'template' => 'page-templates/page-portfolio.php',
			'mod'      => 'portfolio_page_id',
		),
		'about'     => array(
			'title'    => __( 'About Me', 'studio-portfolio' ),
			'template' => 'page-templates/page-about.php',
			'mod'      => 'about_page_id',
		),
		'how_i_work' => array(
			'title'    => __( 'How I Work', 'studio-portfolio' ),
			'template' => 'page-templates/page-how-i-work.php',
			'mod'      => 'how_i_work_page_id',
		),
		'schedule'  => array(
			'title'    => __( 'Schedule Meeting', 'studio-portfolio' ),
			'template' => 'page-templates/page-schedule-meeting.php',
			'mod'      => 'schedule_page_id',
		),
	);

	foreach ( $pages as $data ) {
		$existing = (int) studio_get_option( $data['mod'], 0 );
		if ( $existing && get_post( $existing ) ) {
			continue;
		}

		$page_id = wp_insert_post(
			array(
				'post_title'  => $data['title'],
				'post_status' => 'publish',
				'post_type'   => 'page',
			),
			true
		);

		if ( is_wp_error( $page_id ) ) {
			continue;
		}

		update_post_meta( $page_id, '_wp_page_template', $data['template'] );
		set_theme_mod( 'studio_' . $data['mod'], $page_id );
	}

	// Legacy alias: portfolio page also stored as work_page_id.
	$portfolio_id = (int) studio_get_option( 'portfolio_page_id', 0 );
	if ( $portfolio_id ) {
		set_theme_mod( 'studio_work_page_id', $portfolio_id );
	}

	// Set static front page if not configured.
	if ( 'page' !== get_option( 'show_on_front' ) ) {
		$home = get_page_by_title( 'Home' );
		if ( ! $home ) {
			$home_id = wp_insert_post(
				array(
					'post_title'  => 'Home',
					'post_status' => 'publish',
					'post_type'   => 'page',
				),
				true
			);
			if ( ! is_wp_error( $home_id ) ) {
				update_option( 'page_on_front', $home_id );
				update_option( 'show_on_front', 'page' );
			}
		}
	}
}
add_action( 'after_switch_theme', 'studio_create_default_pages', 20 );

/**
 * Build portfolio query args.
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

	if ( 'portfolio' === $mode || 'work' === $mode ) {
		$query_args['posts_per_page'] = -1;
		unset( $query_args['meta_query'] );
	}

	$category = studio_template_arg( $args, 'category', '', '' );
	if ( $category && 'all' !== $category ) {
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

/**
 * Get How I Work process blocks.
 *
 * @return array
 */
function studio_get_how_i_work_blocks() {
	$keys = array( 'software', 'create', 'innovation', 'redesign', 'client_mind', 'presentation' );
	$blocks = array();

	foreach ( $keys as $key ) {
		$content = studio_get_option( "hiw_{$key}_content", '' );
		if ( ! $content ) {
			continue;
		}
		$blocks[] = array(
			'icon'    => studio_get_option( "hiw_{$key}_icon", '📝' ),
			'title'   => studio_get_option( "hiw_{$key}_title", '' ),
			'content' => $content,
		);
	}
	return $blocks;
}

/**
 * Get meeting platform options.
 *
 * @return array
 */
function studio_get_meeting_platforms() {
	$default = "Zoom\nGoogle Meet\nWhatsApp Call\nPhone Call\nIn Person";
	return studio_get_lines( 'schedule_platforms', $default );
}

/**
 * Get about awards as array.
 *
 * @return array
 */
function studio_get_about_awards() {
	return studio_get_lines(
		'about_awards',
		"Best Brand Design — Design Awards 2024\nUI/UX Excellence — Creative Summit 2023\nFeatured Designer — Behance 2022"
	);
}
