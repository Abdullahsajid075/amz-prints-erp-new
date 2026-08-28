<?php
/**
 * Admin shortcuts — open theme Customizer quickly
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Customizer URL focused on the theme panel.
 *
 * @return string
 */
function studio_get_customize_url() {
	return add_query_arg(
		array(
			'autofocus' => array( 'panel' => 'studio_portfolio_panel' ),
		),
		admin_url( 'customize.php' )
	);
}

/**
 * Add top-level admin menu.
 */
function studio_admin_customize_menu() {
	add_menu_page(
		__( 'Studio Portfolio', 'studio-portfolio' ),
		__( 'Studio Portfolio', 'studio-portfolio' ),
		'edit_theme_options',
		'studio-portfolio',
		'studio_admin_customize_redirect',
		'dashicons-admin-customizer',
		58
	);

	add_submenu_page(
		'studio-portfolio',
		__( 'Customize Theme', 'studio-portfolio' ),
		__( 'Customize Theme', 'studio-portfolio' ),
		'edit_theme_options',
		'studio-portfolio-customize',
		'studio_admin_customize_redirect'
	);

	add_submenu_page(
		'studio-portfolio',
		__( 'Portfolio Items', 'studio-portfolio' ),
		__( 'Portfolio Items', 'studio-portfolio' ),
		'edit_posts',
		'edit.php?post_type=portfolio'
	);

	add_submenu_page(
		'studio-portfolio',
		__( 'Pages Setup', 'studio-portfolio' ),
		__( 'Pages Setup', 'studio-portfolio' ),
		'edit_theme_options',
		'studio-portfolio-pages',
		function () {
			wp_safe_redirect( add_query_arg( 'autofocus[section]', 'studio_pages', admin_url( 'customize.php' ) ) );
			exit;
		}
	);
}
add_action( 'admin_menu', 'studio_admin_customize_menu' );

/**
 * Redirect menu page to Customizer.
 */
function studio_admin_customize_redirect() {
	wp_safe_redirect( studio_get_customize_url() );
	exit;
}

/**
 * Admin bar "Customize Theme" link on the front end.
 *
 * @param WP_Admin_Bar $bar Admin bar.
 */
function studio_admin_bar_customize( $bar ) {
	if ( ! current_user_can( 'edit_theme_options' ) ) {
		return;
	}

	$bar->add_node(
		array(
			'id'    => 'studio-customize-theme',
			'title' => __( 'Customize Theme', 'studio-portfolio' ),
			'href'  => studio_get_customize_url(),
			'meta'  => array( 'class' => 'studio-customize-link' ),
		)
	);
}
add_action( 'admin_bar_menu', 'studio_admin_bar_customize', 80 );

/**
 * Dashboard widget with customize quick links.
 */
function studio_dashboard_customize_widget() {
	wp_add_dashboard_widget(
		'studio_portfolio_customize',
		__( 'Studio Portfolio — Customize Your Site', 'studio-portfolio' ),
		'studio_dashboard_customize_widget_render'
	);
}
add_action( 'wp_dashboard_setup', 'studio_dashboard_customize_widget' );

/**
 * Dashboard widget content.
 */
function studio_dashboard_customize_widget_render() {
	$sections = array(
		array( 'label' => __( 'Colors & Hero', 'studio-portfolio' ), 'section' => 'studio_colors' ),
		array( 'label' => __( 'Home Page', 'studio-portfolio' ), 'section' => 'studio_home_page' ),
		array( 'label' => __( 'Portfolio Page', 'studio-portfolio' ), 'section' => 'studio_portfolio_page' ),
		array( 'label' => __( 'About Me Page', 'studio-portfolio' ), 'section' => 'studio_about_page_v2' ),
		array( 'label' => __( 'How I Work Page', 'studio-portfolio' ), 'section' => 'studio_how_i_work' ),
		array( 'label' => __( 'Schedule Meeting', 'studio-portfolio' ), 'section' => 'studio_schedule_meeting' ),
		array( 'label' => __( 'Pages Setup', 'studio-portfolio' ), 'section' => 'studio_pages' ),
	);

	echo '<p>' . esc_html__( 'Click a section to customize your site:', 'studio-portfolio' ) . '</p>';
	echo '<ul style="margin:0;padding-left:1.2em;">';
	foreach ( $sections as $item ) {
		$url = add_query_arg( 'autofocus[section]', $item['section'], admin_url( 'customize.php' ) );
		printf(
			'<li style="margin-bottom:6px;"><a href="%s"><strong>%s</strong></a></li>',
			esc_url( $url ),
			esc_html( $item['label'] )
		);
	}
	echo '</ul>';
	printf(
		'<p style="margin-top:12px;"><a class="button button-primary" href="%s">%s</a></p>',
		esc_url( studio_get_customize_url() ),
		esc_html__( 'Open Full Customizer →', 'studio-portfolio' )
	);
}
