<?php
/**
 * WordPress Customizer — fully editable theme options
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register all customizer settings.
 *
 * @param WP_Customize_Manager $wp_customize Customizer object.
 */
function studio_portfolio_customize_register( $wp_customize ) {
	$wp_customize->add_panel( 'studio_portfolio_panel', array(
		'title'       => __( 'Studio Portfolio', 'studio-portfolio' ),
		'description' => __( 'Edit all homepage content, colors, and sections.', 'studio-portfolio' ),
		'priority'    => 10,
	) );

	studio_customizer_section_colors( $wp_customize );
	studio_customizer_section_header( $wp_customize );
	studio_customizer_section_hero( $wp_customize );
	studio_customizer_section_marquee( $wp_customize );
	studio_customizer_section_portfolio( $wp_customize );
	studio_customizer_section_about( $wp_customize );
	studio_customizer_section_design_system( $wp_customize );
	studio_customizer_section_contact( $wp_customize );
	studio_customizer_section_footer( $wp_customize );
	studio_customizer_section_visibility( $wp_customize );
}
add_action( 'customize_register', 'studio_portfolio_customize_register' );

/**
 * Add a text setting + control.
 */
function studio_add_text( $wp_customize, $section, $id, $label, $default = '', $type = 'text' ) {
	$wp_customize->add_setting( 'studio_' . $id, array(
		'default'           => $default,
		'sanitize_callback' => ( 'textarea' === $type ) ? 'sanitize_textarea_field' : 'sanitize_text_field',
		'transport'         => 'refresh',
	) );
	$wp_customize->add_control( 'studio_' . $id, array(
		'label'   => $label,
		'section' => $section,
		'type'    => $type,
	) );
}

/**
 * Add checkbox setting.
 */
function studio_add_checkbox( $wp_customize, $section, $id, $label, $default = true ) {
	$wp_customize->add_setting( 'studio_' . $id, array(
		'default'           => $default,
		'sanitize_callback' => 'studio_sanitize_checkbox',
		'transport'         => 'refresh',
	) );
	$wp_customize->add_control( 'studio_' . $id, array(
		'label'   => $label,
		'section' => $section,
		'type'    => 'checkbox',
	) );
}

/**
 * Colors section.
 */
function studio_customizer_section_colors( $wp_customize ) {
	$section = 'studio_colors';
	$wp_customize->add_section( $section, array(
		'title' => __( 'Colors', 'studio-portfolio' ),
		'panel' => 'studio_portfolio_panel',
	) );

	$colors = array(
		'color_black' => array( 'label' => __( 'Background (Black)', 'studio-portfolio' ), 'default' => '#0A0A0F' ),
		'color_blue'  => array( 'label' => __( 'Primary (Blue)', 'studio-portfolio' ), 'default' => '#2563EB' ),
		'color_gold'  => array( 'label' => __( 'Accent (Gold)', 'studio-portfolio' ), 'default' => '#D4AF37' ),
		'color_white' => array( 'label' => __( 'Text (White)', 'studio-portfolio' ), 'default' => '#FFFFFF' ),
	);

	foreach ( $colors as $id => $data ) {
		$wp_customize->add_setting( 'studio_' . $id, array(
			'default'           => $data['default'],
			'sanitize_callback' => 'sanitize_hex_color',
			'transport'         => 'refresh',
		) );
		$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'studio_' . $id, array(
			'label'   => $data['label'],
			'section' => $section,
		) ) );
	}
}

/**
 * Header section.
 */
function studio_customizer_section_header( $wp_customize ) {
	$section = 'studio_header';
	$wp_customize->add_section( $section, array(
		'title' => __( 'Header & Navigation', 'studio-portfolio' ),
		'panel' => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'logo_letter', __( 'Logo Letter (if no logo image)', 'studio-portfolio' ), 'S' );
	studio_add_text( $wp_customize, $section, 'header_cta_text', __( 'Header Button Text', 'studio-portfolio' ), "Let's Talk" );
	studio_add_text( $wp_customize, $section, 'header_cta_url', __( 'Header Button URL', 'studio-portfolio' ), '#contact' );
	studio_add_text( $wp_customize, $section, 'nav_work', __( 'Nav: Work Label', 'studio-portfolio' ), 'Work' );
	studio_add_text( $wp_customize, $section, 'nav_about', __( 'Nav: About Label', 'studio-portfolio' ), 'About' );
	studio_add_text( $wp_customize, $section, 'nav_system', __( 'Nav: System Label', 'studio-portfolio' ), 'System' );
	studio_add_text( $wp_customize, $section, 'nav_contact', __( 'Nav: Contact Label', 'studio-portfolio' ), 'Contact' );
}

/**
 * Hero section.
 */
function studio_customizer_section_hero( $wp_customize ) {
	$section = 'studio_hero';
	$wp_customize->add_section( $section, array(
		'title' => __( 'Hero Section', 'studio-portfolio' ),
		'panel' => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'hero_status', __( 'Status Badge Text', 'studio-portfolio' ), 'Available for projects' );
	studio_add_text( $wp_customize, $section, 'hero_title_line1', __( 'Title Line 1', 'studio-portfolio' ), 'Designing' );
	studio_add_text( $wp_customize, $section, 'hero_title_line2', __( 'Title Line 2 (gradient)', 'studio-portfolio' ), 'experiences' );
	studio_add_text( $wp_customize, $section, 'hero_title_line3', __( 'Title Line 3', 'studio-portfolio' ), 'that inspire' );
	studio_add_text( $wp_customize, $section, 'hero_description', __( 'Description', 'studio-portfolio' ), "I'm a multidisciplinary designer crafting bold brand identities, intuitive interfaces, and visual systems that leave lasting impressions.", 'textarea' );
	studio_add_text( $wp_customize, $section, 'hero_btn1_text', __( 'Primary Button Text', 'studio-portfolio' ), 'View My Work' );
	studio_add_text( $wp_customize, $section, 'hero_btn1_url', __( 'Primary Button URL', 'studio-portfolio' ), '#work' );
	studio_add_text( $wp_customize, $section, 'hero_btn2_text', __( 'Secondary Button Text', 'studio-portfolio' ), 'Get in Touch' );
	studio_add_text( $wp_customize, $section, 'hero_btn2_url', __( 'Secondary Button URL', 'studio-portfolio' ), '#contact' );
	studio_add_text( $wp_customize, $section, 'hero_card_label', __( 'Featured Card Label', 'studio-portfolio' ), 'Latest Project' );
	studio_add_checkbox( $wp_customize, $section, 'hero_show_card', __( 'Show Featured Project Card', 'studio-portfolio' ), true );

	$wp_customize->add_setting( 'studio_hero_card_image', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'studio_hero_card_image', array(
		'label'     => __( 'Featured Card Image (optional override)', 'studio-portfolio' ),
		'section'   => $section,
		'mime_type' => 'image',
	) ) );
}

/**
 * Marquee section.
 */
function studio_customizer_section_marquee( $wp_customize ) {
	$section = 'studio_marquee';
	$wp_customize->add_section( $section, array(
		'title' => __( 'Marquee Banner', 'studio-portfolio' ),
		'panel' => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'marquee_items', __( 'Marquee Items (one per line)', 'studio-portfolio' ), "Brand Identity\nUI/UX Design\nDesign Systems\nPackaging\nArt Direction\nMotion Design\nTypography\nVisual Identity", 'textarea' );
}

/**
 * Portfolio section labels.
 */
function studio_customizer_section_portfolio( $wp_customize ) {
	$section = 'studio_portfolio_section';
	$wp_customize->add_section( $section, array(
		'title' => __( 'Portfolio Section', 'studio-portfolio' ),
		'panel' => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'work_label', __( 'Section Label', 'studio-portfolio' ), 'Selected Work' );
	studio_add_text( $wp_customize, $section, 'work_title', __( 'Section Title', 'studio-portfolio' ), 'Projects that speak louder than words' );
	studio_add_text( $wp_customize, $section, 'work_description', __( 'Section Description', 'studio-portfolio' ), 'Hover over the gallery to auto-scroll through my portfolio.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'work_hint', __( 'Scroll Hint Text', 'studio-portfolio' ), 'Hover to auto-scroll · Drag to explore' );
}

/**
 * About section.
 */
function studio_customizer_section_about( $wp_customize ) {
	$section = 'studio_about';
	$wp_customize->add_section( $section, array(
		'title' => __( 'About Section', 'studio-portfolio' ),
		'panel' => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'about_label', __( 'Section Label', 'studio-portfolio' ), 'About Me' );
	studio_add_text( $wp_customize, $section, 'about_title', __( 'Title', 'studio-portfolio' ), 'Design is my language' );
	studio_add_text( $wp_customize, $section, 'about_text', __( 'Lead Paragraph', 'studio-portfolio' ), 'With over 5 years of experience in visual design, I help startups and established brands create identities that resonate and interfaces that convert.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'about_text2', __( 'Second Paragraph', 'studio-portfolio' ), 'My approach blends strategic thinking with bold aesthetics. I believe great design is not just about looking good — it is about solving problems, telling stories, and creating emotional connections.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'services_label', __( 'Services Label', 'studio-portfolio' ), 'What I Do' );
	studio_add_text( $wp_customize, $section, 'services_title', __( 'Services Title', 'studio-portfolio' ), 'Services tailored to your vision' );

	studio_add_text( $wp_customize, $section, 'stat_projects', __( 'Stat 1 Value', 'studio-portfolio' ), '50+' );
	studio_add_text( $wp_customize, $section, 'stat_projects_label', __( 'Stat 1 Label', 'studio-portfolio' ), 'Projects Delivered' );
	studio_add_text( $wp_customize, $section, 'stat_clients', __( 'Stat 2 Value', 'studio-portfolio' ), '30+' );
	studio_add_text( $wp_customize, $section, 'stat_clients_label', __( 'Stat 2 Label', 'studio-portfolio' ), 'Happy Clients' );
	studio_add_text( $wp_customize, $section, 'stat_experience', __( 'Stat 3 Value', 'studio-portfolio' ), '5' );
	studio_add_text( $wp_customize, $section, 'stat_experience_label', __( 'Stat 3 Label', 'studio-portfolio' ), 'Years Experience' );
	studio_add_text( $wp_customize, $section, 'stat_awards', __( 'Stat 4 Value', 'studio-portfolio' ), '12' );
	studio_add_text( $wp_customize, $section, 'stat_awards_label', __( 'Stat 4 Label', 'studio-portfolio' ), 'Awards Won' );

	for ( $i = 1; $i <= 4; $i++ ) {
		studio_add_text( $wp_customize, $section, "service_{$i}_icon", sprintf( __( 'Service %d Icon (emoji)', 'studio-portfolio' ), $i ), '🎨' );
		studio_add_text( $wp_customize, $section, "service_{$i}_title", sprintf( __( 'Service %d Title', 'studio-portfolio' ), $i ), '' );
		studio_add_text( $wp_customize, $section, "service_{$i}_desc", sprintf( __( 'Service %d Description', 'studio-portfolio' ), $i ), '', 'textarea' );
	}
}

/**
 * Design system section.
 */
function studio_customizer_section_design_system( $wp_customize ) {
	$section = 'studio_design_system';
	$wp_customize->add_section( $section, array(
		'title' => __( 'Design System Section', 'studio-portfolio' ),
		'panel' => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'ds_label', __( 'Section Label', 'studio-portfolio' ), 'Design System' );
	studio_add_text( $wp_customize, $section, 'ds_title', __( 'Section Title', 'studio-portfolio' ), 'Built with intention' );
	studio_add_text( $wp_customize, $section, 'ds_description', __( 'Section Description', 'studio-portfolio' ), 'Blue, black, white, and gold — a token-based system for consistency and craft.', 'textarea' );
}

/**
 * Contact section.
 */
function studio_customizer_section_contact( $wp_customize ) {
	$section = 'studio_contact';
	$wp_customize->add_section( $section, array(
		'title' => __( 'Contact Section', 'studio-portfolio' ),
		'panel' => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'contact_label', __( 'Section Label', 'studio-portfolio' ), 'Get in Touch' );
	studio_add_text( $wp_customize, $section, 'contact_title', __( 'Section Title', 'studio-portfolio' ), "Let's create something amazing together" );
	studio_add_text( $wp_customize, $section, 'contact_description', __( 'Section Description', 'studio-portfolio' ), 'Have a project in mind? Drop me a message and let us start a conversation.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'contact_email', __( 'Email Address', 'studio-portfolio' ), 'hello@studio.design' );
	studio_add_text( $wp_customize, $section, 'contact_location', __( 'Location Text', 'studio-portfolio' ), 'Available Worldwide · Remote' );
	studio_add_text( $wp_customize, $section, 'contact_btn_text', __( 'Submit Button Text', 'studio-portfolio' ), 'Send Message' );
	studio_add_text( $wp_customize, $section, 'contact_success', __( 'Success Message', 'studio-portfolio' ), 'Thank you! Your message has been sent.' );

	for ( $i = 1; $i <= 4; $i++ ) {
		studio_add_text( $wp_customize, $section, "social_{$i}_label", sprintf( __( 'Social Link %d Label', 'studio-portfolio' ), $i ), '' );
		studio_add_text( $wp_customize, $section, "social_{$i}_url", sprintf( __( 'Social Link %d URL', 'studio-portfolio' ), $i ), '' );
	}
}

/**
 * Footer section.
 */
function studio_customizer_section_footer( $wp_customize ) {
	$section = 'studio_footer';
	$wp_customize->add_section( $section, array(
		'title' => __( 'Footer', 'studio-portfolio' ),
		'panel' => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'footer_tagline', __( 'Footer Tagline', 'studio-portfolio' ), 'Crafted with passion.' );
}

/**
 * Section visibility toggles.
 */
function studio_customizer_section_visibility( $wp_customize ) {
	$section = 'studio_visibility';
	$wp_customize->add_section( $section, array(
		'title' => __( 'Show / Hide Sections', 'studio-portfolio' ),
		'panel' => 'studio_portfolio_panel',
	) );

	studio_add_checkbox( $wp_customize, $section, 'show_marquee', __( 'Show Marquee Banner', 'studio-portfolio' ), true );
	studio_add_checkbox( $wp_customize, $section, 'show_portfolio', __( 'Show Portfolio Section', 'studio-portfolio' ), true );
	studio_add_checkbox( $wp_customize, $section, 'show_about', __( 'Show About Section', 'studio-portfolio' ), true );
	studio_add_checkbox( $wp_customize, $section, 'show_design_system', __( 'Show Design System Section', 'studio-portfolio' ), true );
	studio_add_checkbox( $wp_customize, $section, 'show_contact', __( 'Show Contact Section', 'studio-portfolio' ), true );
}

/**
 * Sanitize checkbox values.
 *
 * @param mixed $value Raw value.
 * @return bool
 */
function studio_sanitize_checkbox( $value ) {
	return (bool) $value;
}

/**
 * Output customizer colors as CSS variables.
 */
function studio_portfolio_custom_css() {
	$black = studio_get_option( 'color_black', '#0A0A0F' );
	$blue  = studio_get_option( 'color_blue', '#2563EB' );
	$gold  = studio_get_option( 'color_gold', '#D4AF37' );
	$white = studio_get_option( 'color_white', '#FFFFFF' );

	$css = ":root {
		--color-black: {$black};
		--color-black-elevated: " . studio_adjust_brightness( $black, 8 ) . ";
		--color-blue: {$blue};
		--color-blue-light: " . studio_adjust_brightness( $blue, 20 ) . ";
		--color-blue-dark: " . studio_adjust_brightness( $blue, -30 ) . ";
		--color-gold: {$gold};
		--color-gold-light: " . studio_adjust_brightness( $gold, 15 ) . ";
		--color-gold-dark: " . studio_adjust_brightness( $gold, -20 ) . ";
		--color-white: {$white};
	}";

	wp_add_inline_style( 'studio-portfolio-style', $css );
}
add_action( 'wp_enqueue_scripts', 'studio_portfolio_custom_css', 20 );

/**
 * Adjust hex color brightness.
 *
 * @param string $hex   Hex color.
 * @param int    $steps Brightness steps (-255 to 255).
 * @return string
 */
function studio_adjust_brightness( $hex, $steps ) {
	$hex = ltrim( $hex, '#' );
	if ( 3 === strlen( $hex ) ) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}
	$r = max( 0, min( 255, hexdec( substr( $hex, 0, 2 ) ) + $steps ) );
	$g = max( 0, min( 255, hexdec( substr( $hex, 2, 2 ) ) + $steps ) );
	$b = max( 0, min( 255, hexdec( substr( $hex, 4, 2 ) ) + $steps ) );
	return sprintf( '#%02x%02x%02x', $r, $g, $b );
}

/**
 * Customizer live preview script.
 */
function studio_customizer_preview_js() {
	wp_enqueue_script(
		'studio-customizer-preview',
		STUDIO_PORTFOLIO_URI . '/assets/js/customizer-preview.js',
		array( 'customize-preview' ),
		STUDIO_PORTFOLIO_VERSION,
		true
	);
}
add_action( 'customize_preview_init', 'studio_customizer_preview_js' );
