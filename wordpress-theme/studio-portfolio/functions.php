<?php
/**
 * Studio Portfolio Theme Functions
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'STUDIO_PORTFOLIO_VERSION', '1.0.0' );
define( 'STUDIO_PORTFOLIO_DIR', get_template_directory() );
define( 'STUDIO_PORTFOLIO_URI', get_template_directory_uri() );

/**
 * Theme setup.
 */
function studio_portfolio_setup() {
	load_theme_textdomain( 'studio-portfolio', STUDIO_PORTFOLIO_DIR . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'custom-logo', array(
		'height'      => 80,
		'width'       => 240,
		'flex-height' => true,
		'flex-width'  => true,
	) );

	add_image_size( 'portfolio-card', 840, 630, true );
	add_image_size( 'portfolio-hero', 1200, 800, true );
	add_image_size( 'portfolio-gallery', 600, 450, true );

	register_nav_menus( array(
		'primary' => __( 'Primary Menu', 'studio-portfolio' ),
	) );
}
add_action( 'after_setup_theme', 'studio_portfolio_setup' );

/**
 * Enqueue scripts and styles.
 */
function studio_portfolio_scripts() {
	wp_enqueue_style(
		'studio-portfolio-fonts',
		'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'studio-portfolio-style',
		get_stylesheet_uri(),
		array( 'studio-portfolio-fonts' ),
		STUDIO_PORTFOLIO_VERSION
	);

	wp_enqueue_script(
		'studio-portfolio-main',
		STUDIO_PORTFOLIO_URI . '/assets/js/main.js',
		array(),
		STUDIO_PORTFOLIO_VERSION,
		true
	);

	wp_localize_script( 'studio-portfolio-main', 'studioPortfolio', array(
		'ajaxUrl' => admin_url( 'admin-ajax.php' ),
		'homeUrl' => home_url( '/' ),
	) );
}
add_action( 'wp_enqueue_scripts', 'studio_portfolio_scripts' );

/**
 * Theme Customizer settings.
 */
function studio_portfolio_customize_register( $wp_customize ) {
	$wp_customize->add_section( 'studio_portfolio_options', array(
		'title'    => __( 'Portfolio Settings', 'studio-portfolio' ),
		'priority' => 30,
	) );

	$fields = array(
		'hero_status'       => array( 'label' => __( 'Hero Status Text', 'studio-portfolio' ), 'default' => 'Available for projects' ),
		'hero_title_line1'  => array( 'label' => __( 'Hero Title Line 1', 'studio-portfolio' ), 'default' => 'Designing' ),
		'hero_title_line2'  => array( 'label' => __( 'Hero Title Line 2 (gradient)', 'studio-portfolio' ), 'default' => 'experiences' ),
		'hero_title_line3'  => array( 'label' => __( 'Hero Title Line 3', 'studio-portfolio' ), 'default' => 'that inspire' ),
		'hero_description'  => array( 'label' => __( 'Hero Description', 'studio-portfolio' ), 'default' => "I'm a multidisciplinary designer crafting bold brand identities, intuitive interfaces, and visual systems that leave lasting impressions." ),
		'about_title'       => array( 'label' => __( 'About Title', 'studio-portfolio' ), 'default' => 'Design is my language' ),
		'about_text'        => array( 'label' => __( 'About Text', 'studio-portfolio' ), 'default' => 'With over 5 years of experience in visual design, I help startups and established brands create identities that resonate and interfaces that convert.' ),
		'contact_email'     => array( 'label' => __( 'Contact Email', 'studio-portfolio' ), 'default' => 'hello@studio.design' ),
		'contact_location'  => array( 'label' => __( 'Contact Location', 'studio-portfolio' ), 'default' => 'Available Worldwide · Remote' ),
		'stat_projects'     => array( 'label' => __( 'Stat: Projects', 'studio-portfolio' ), 'default' => '50+' ),
		'stat_clients'      => array( 'label' => __( 'Stat: Clients', 'studio-portfolio' ), 'default' => '30+' ),
		'stat_experience'   => array( 'label' => __( 'Stat: Years', 'studio-portfolio' ), 'default' => '5' ),
		'stat_awards'       => array( 'label' => __( 'Stat: Awards', 'studio-portfolio' ), 'default' => '12' ),
	);

	foreach ( $fields as $id => $field ) {
		$wp_customize->add_setting( 'studio_' . $id, array(
			'default'           => $field['default'],
			'sanitize_callback' => 'sanitize_text_field',
		) );

		$wp_customize->add_control( 'studio_' . $id, array(
			'label'   => $field['label'],
			'section' => 'studio_portfolio_options',
			'type'    => 'text',
		) );
	}
}
add_action( 'customize_register', 'studio_portfolio_customize_register' );

/**
 * Helper: get theme mod with default.
 */
function studio_get_option( $key, $default = '' ) {
	return get_theme_mod( 'studio_' . $key, $default );
}

/**
 * Include portfolio custom post type and admin.
 */
require_once STUDIO_PORTFOLIO_DIR . '/inc/portfolio-cpt.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/portfolio-meta.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/contact-form.php';
