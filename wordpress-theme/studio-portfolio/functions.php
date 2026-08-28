<?php
/**
 * Studio Portfolio Theme Functions
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'STUDIO_PORTFOLIO_VERSION', '2.0.0' );
define( 'STUDIO_PORTFOLIO_DIR', get_template_directory() );
define( 'STUDIO_PORTFOLIO_URI', get_template_directory_uri() );

require_once STUDIO_PORTFOLIO_DIR . '/inc/helpers.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/customizer.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/customizer-site.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/portfolio-cpt.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/portfolio-meta.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/contact-form.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/shortcodes.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/page-setup.php';

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
	add_theme_support( 'customize-selective-refresh-widgets' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'editor-styles' );

	add_image_size( 'portfolio-card', 1000, 750, true );
	add_image_size( 'portfolio-card-large', 1200, 900, true );
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
		'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'studio-portfolio-style',
		get_stylesheet_uri(),
		array( 'studio-portfolio-fonts' ),
		STUDIO_PORTFOLIO_VERSION
	);

	wp_enqueue_style(
		'studio-portfolio-light',
		STUDIO_PORTFOLIO_URI . '/assets/css/light-minimal.css',
		array( 'studio-portfolio-style' ),
		STUDIO_PORTFOLIO_VERSION
	);

	wp_enqueue_style(
		'studio-portfolio-portfolio',
		STUDIO_PORTFOLIO_URI . '/assets/css/portfolio.css',
		array( 'studio-portfolio-light' ),
		STUDIO_PORTFOLIO_VERSION
	);

	wp_enqueue_style(
		'studio-portfolio-premium',
		STUDIO_PORTFOLIO_URI . '/assets/css/premium.css',
		array( 'studio-portfolio-portfolio' ),
		STUDIO_PORTFOLIO_VERSION
	);

	wp_enqueue_script(
		'studio-portfolio-main',
		STUDIO_PORTFOLIO_URI . '/assets/js/main.js',
		array(),
		STUDIO_PORTFOLIO_VERSION,
		true
	);

	wp_enqueue_script(
		'studio-portfolio-meeting',
		STUDIO_PORTFOLIO_URI . '/assets/js/meeting.js',
		array(),
		STUDIO_PORTFOLIO_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'studio_portfolio_scripts' );

/**
 * Admin notice after theme activation.
 */
function studio_portfolio_activation_notice() {
	if ( get_transient( 'studio_portfolio_activated' ) ) {
		delete_transient( 'studio_portfolio_activated' );
		?>
		<div class="notice notice-success is-dismissible">
			<p>
				<strong><?php esc_html_e( 'Studio Portfolio activated!', 'studio-portfolio' ); ?></strong>
				<?php
				printf(
					/* translators: 1: customizer url, 2: portfolio url */
					esc_html__( 'Edit your homepage content in %1$s or add projects under %2$s.', 'studio-portfolio' ),
					'<a href="' . esc_url( admin_url( 'customize.php' ) ) . '">' . esc_html__( 'Appearance → Customize → Studio Portfolio', 'studio-portfolio' ) . '</a>',
					'<a href="' . esc_url( admin_url( 'edit.php?post_type=portfolio' ) ) . '">' . esc_html__( 'Portfolio', 'studio-portfolio' ) . '</a>'
				);
				?>
			</p>
		</div>
		<?php
	}
}
add_action( 'admin_notices', 'studio_portfolio_activation_notice' );

function studio_portfolio_set_activation_transient() {
	set_transient( 'studio_portfolio_activated', true, 30 );
}
add_action( 'after_switch_theme', 'studio_portfolio_set_activation_transient' );
