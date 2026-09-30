<?php
/**
 * Theme shortcodes for Elementor Shortcode widget
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register shortcodes.
 */
function studio_register_shortcodes() {
	$parts = array(
		'studio_hero'              => 'hero',
		'studio_marquee'           => 'marquee',
		'studio_portfolio'         => 'portfolio',
		'studio_about'             => 'about',
		'studio_how_i_work'        => 'how-i-work',
		'studio_contact'           => 'contact',
		'studio_design_system'     => 'design-system',
		'studio_floating_contact'  => 'floating-contact',
	);

	foreach ( $parts as $tag => $part ) {
		add_shortcode(
			$tag,
			function () use ( $part ) {
				ob_start();
				get_template_part( 'template-parts/' . $part );
				return ob_get_clean();
			}
		);
	}
}
add_action( 'init', 'studio_register_shortcodes' );

/**
 * Register shortcodes list for admin reference.
 */
function studio_shortcode_help() {
	$screen = get_current_screen();
	if ( ! $screen || ! in_array( $screen->id, array( 'page', 'edit-page' ), true ) ) {
		return;
	}
	?>
	<div class="notice notice-info is-dismissible">
		<p><strong><?php esc_html_e( 'Studio Portfolio Shortcodes (for Elementor Shortcode widget):', 'studio-portfolio' ); ?></strong></p>
		<p><code>[studio_hero]</code> · <code>[studio_marquee]</code> · <code>[studio_portfolio]</code> · <code>[studio_about]</code> · <code>[studio_how_i_work]</code> · <code>[studio_contact]</code></p>
	</div>
	<?php
}
add_action( 'admin_notices', 'studio_shortcode_help' );
