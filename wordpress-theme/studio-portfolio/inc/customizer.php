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
		'title'       => __( 'Personal Brand Portfolio', 'studio-portfolio' ),
		'description' => __( 'Edit your photo, story, colors, contact buttons, and all homepage content.', 'studio-portfolio' ),
		'priority'    => 10,
	) );

	studio_customizer_section_colors( $wp_customize );
	studio_customizer_section_pages( $wp_customize );
	studio_customizer_section_header( $wp_customize );
	studio_customizer_section_hero( $wp_customize );
	studio_customizer_section_marquee( $wp_customize );
	studio_customizer_section_portfolio( $wp_customize );
	studio_customizer_section_work_page( $wp_customize );
	studio_customizer_section_about( $wp_customize );
	studio_customizer_section_about_page( $wp_customize );
	studio_customizer_section_design_system( $wp_customize );
	studio_customizer_section_contact( $wp_customize );
	studio_customizer_section_contact_page( $wp_customize );
	studio_customizer_section_floating( $wp_customize );
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
		'color_black' => array( 'label' => __( 'Text (Dark)', 'studio-portfolio' ), 'default' => '#1A1A1A' ),
		'color_green' => array( 'label' => __( 'Primary (Green)', 'studio-portfolio' ), 'default' => '#059669' ),
		'color_light' => array( 'label' => __( 'Background (Light)', 'studio-portfolio' ), 'default' => '#F7FAF7' ),
		'color_white' => array( 'label' => __( 'Background (White)', 'studio-portfolio' ), 'default' => '#FFFFFF' ),
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
 * Pages — assign Work, About, Contact pages.
 */
function studio_customizer_section_pages( $wp_customize ) {
	$section = 'studio_pages';
	$wp_customize->add_section( $section, array(
		'title'       => __( 'Pages Setup', 'studio-portfolio' ),
		'description' => __( 'Assign separate pages for Work, About, and Contact. Pages are auto-created on theme activation.', 'studio-portfolio' ),
		'panel'       => 'studio_portfolio_panel',
		'priority'    => 12,
	) );

	$page_controls = array(
		'work_page_id'    => __( 'Work Page', 'studio-portfolio' ),
		'about_page_id'   => __( 'About Page', 'studio-portfolio' ),
		'contact_page_id' => __( 'Contact Page', 'studio-portfolio' ),
	);

	foreach ( $page_controls as $id => $label ) {
		$wp_customize->add_setting( 'studio_' . $id, array(
			'default'           => 0,
			'sanitize_callback' => 'absint',
			'transport'         => 'refresh',
		) );
		$wp_customize->add_control( 'studio_' . $id, array(
			'label'   => $label,
			'section' => $section,
			'type'    => 'dropdown-pages',
		) );
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
	studio_add_text( $wp_customize, $section, 'hero_name', __( 'Your Name', 'studio-portfolio' ), '' );
	studio_add_text( $wp_customize, $section, 'hero_role', __( 'Your Role / Title', 'studio-portfolio' ), 'Designer & Creative' );
	studio_add_text( $wp_customize, $section, 'hero_title_line1', __( 'Title Line 1', 'studio-portfolio' ), 'Hi, I am' );
	studio_add_text( $wp_customize, $section, 'hero_title_line2', __( 'Title Line 2 (gradient)', 'studio-portfolio' ), 'a Designer' );
	studio_add_text( $wp_customize, $section, 'hero_title_line3', __( 'Title Line 3', 'studio-portfolio' ), 'building my brand' );
	studio_add_text( $wp_customize, $section, 'hero_description', __( 'Introduction Text', 'studio-portfolio' ), 'Welcome to my personal portfolio. Here I share my work, my story, and everything about my creative journey.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'hero_photo_caption', __( 'Photo Caption', 'studio-portfolio' ), 'Nice to meet you!' );
	studio_add_text( $wp_customize, $section, 'hero_btn1_text', __( 'Primary Button Text', 'studio-portfolio' ), 'View My Work' );
	studio_add_text( $wp_customize, $section, 'hero_btn1_url', __( 'Primary Button URL', 'studio-portfolio' ), '#work' );
	studio_add_text( $wp_customize, $section, 'hero_btn2_text', __( 'Secondary Button Text', 'studio-portfolio' ), 'About Me' );
	studio_add_text( $wp_customize, $section, 'hero_btn2_url', __( 'Secondary Button URL', 'studio-portfolio' ), '#about' );

	$wp_customize->add_setting( 'studio_hero_personal_photo', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'studio_hero_personal_photo', array(
		'label'       => __( 'Your Personal Photo (Hero)', 'studio-portfolio' ),
		'description' => __( 'Upload a PNG with transparent background for best results. Displayed openly — no box or frame.', 'studio-portfolio' ),
		'section'     => $section,
		'mime_type'   => 'image',
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

	$marquee_colors = array(
		'marquee_text_color' => array(
			'label'   => __( 'Marquee Text Color', 'studio-portfolio' ),
			'default' => '#B8B8B8',
		),
		'marquee_sep_color'  => array(
			'label'   => __( 'Marquee Separator (✦) Color', 'studio-portfolio' ),
			'default' => '#059669',
		),
		'marquee_bg_color'   => array(
			'label'   => __( 'Marquee Background Color', 'studio-portfolio' ),
			'default' => '#F7FAF7',
		),
	);

	foreach ( $marquee_colors as $id => $data ) {
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
 * Portfolio section labels.
 */
function studio_customizer_section_portfolio( $wp_customize ) {
	$section = 'studio_portfolio_section';
	$wp_customize->add_section( $section, array(
		'title'       => __( 'Homepage — Featured Portfolio', 'studio-portfolio' ),
		'description' => __( 'Shows featured projects on the homepage. Mark items in Portfolio → Edit → "Show on Homepage".', 'studio-portfolio' ),
		'panel'       => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'work_label', __( 'Section Label', 'studio-portfolio' ), 'Selected Work' );
	studio_add_text( $wp_customize, $section, 'work_title', __( 'Section Title', 'studio-portfolio' ), 'Featured projects' );
	studio_add_text( $wp_customize, $section, 'work_description', __( 'Section Description', 'studio-portfolio' ), 'A selection of my best work — hover to auto-scroll through projects.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'work_hint', __( 'Scroll Hint Text', 'studio-portfolio' ), 'Hover to auto-scroll · Drag to explore' );
	studio_add_text( $wp_customize, $section, 'home_view_all_text', __( 'View All Button Text', 'studio-portfolio' ), 'View All Work →' );

	$wp_customize->add_setting( 'studio_home_portfolio_count', array(
		'default'           => 6,
		'sanitize_callback' => 'absint',
		'transport'         => 'refresh',
	) );
	$wp_customize->add_control( 'studio_home_portfolio_count', array(
		'label'       => __( 'Max Featured Projects on Homepage', 'studio-portfolio' ),
		'section'     => $section,
		'type'        => 'number',
		'input_attrs' => array( 'min' => 1, 'max' => 20 ),
	) );

	studio_add_checkbox( $wp_customize, $section, 'home_show_view_all', __( 'Show "View All Work" Button', 'studio-portfolio' ), true );
}

/**
 * Work page section.
 */
function studio_customizer_section_work_page( $wp_customize ) {
	$section = 'studio_work_page';
	$wp_customize->add_section( $section, array(
		'title'       => __( 'Work Page', 'studio-portfolio' ),
		'description' => __( 'Content for the separate Work page (assign under Pages Setup).', 'studio-portfolio' ),
		'panel'       => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'work_page_label', __( 'Section Label', 'studio-portfolio' ), 'All Work' );
	studio_add_text( $wp_customize, $section, 'work_page_title', __( 'Section Title', 'studio-portfolio' ), 'Full portfolio' );
	studio_add_text( $wp_customize, $section, 'work_page_description', __( 'Section Description', 'studio-portfolio' ), 'Browse every project by category.', 'textarea' );
	studio_add_checkbox( $wp_customize, $section, 'work_page_show_categories', __( 'Show Category Filter Buttons', 'studio-portfolio' ), true );
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
	studio_add_text( $wp_customize, $section, 'about_title', __( 'Title', 'studio-portfolio' ), 'Everything about me' );
	studio_add_text( $wp_customize, $section, 'about_text', __( 'Introduction Paragraph', 'studio-portfolio' ), 'This is my personal brand portfolio — a space where I share who I am, what I have done, and where I am heading.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'about_text2', __( 'Closing Paragraph', 'studio-portfolio' ), '', 'textarea' );

	studio_add_text( $wp_customize, $section, 'about_experience_title', __( 'Experience — Title', 'studio-portfolio' ), 'Experience' );
	studio_add_text( $wp_customize, $section, 'about_experience', __( 'Experience — Content', 'studio-portfolio' ), '', 'textarea' );
	studio_add_text( $wp_customize, $section, 'about_education_title', __( 'Education — Title', 'studio-portfolio' ), 'Education' );
	studio_add_text( $wp_customize, $section, 'about_education', __( 'Education — Content', 'studio-portfolio' ), '', 'textarea' );
	studio_add_text( $wp_customize, $section, 'about_companies_title', __( 'Companies — Title', 'studio-portfolio' ), 'Companies & Brands' );
	studio_add_text( $wp_customize, $section, 'about_companies', __( 'Companies — Content', 'studio-portfolio' ), '', 'textarea' );
	studio_add_text( $wp_customize, $section, 'about_goal_title', __( 'Goal — Title', 'studio-portfolio' ), 'My Goal' );
	studio_add_text( $wp_customize, $section, 'about_goal', __( 'Goal — Content', 'studio-portfolio' ), '', 'textarea' );
	studio_add_text( $wp_customize, $section, 'about_struggles_title', __( 'Struggles — Title', 'studio-portfolio' ), 'My Journey & Struggles' );
	studio_add_text( $wp_customize, $section, 'about_struggles', __( 'Struggles — Content', 'studio-portfolio' ), '', 'textarea' );

	studio_add_text( $wp_customize, $section, 'services_label', __( 'Services Label', 'studio-portfolio' ), 'What I Do' );
	studio_add_text( $wp_customize, $section, 'services_title', __( 'Services Title', 'studio-portfolio' ), 'My Skills & Services' );

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
 * About page — optional override title (uses same content as About section).
 */
function studio_customizer_section_about_page( $wp_customize ) {
	$section = 'studio_about_page';
	$wp_customize->add_section( $section, array(
		'title'       => __( 'About Page', 'studio-portfolio' ),
		'description' => __( 'The About page uses content from the About Section settings above.', 'studio-portfolio' ),
		'panel'       => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'about_page_intro', __( 'Extra Page Intro (optional)', 'studio-portfolio' ), '', 'textarea' );
}

/**
 * Contact page section.
 */
function studio_customizer_section_contact_page( $wp_customize ) {
	$section = 'studio_contact_page';
	$wp_customize->add_section( $section, array(
		'title'       => __( 'Contact Page', 'studio-portfolio' ),
		'description' => __( 'The Contact page uses content from the Contact Section settings.', 'studio-portfolio' ),
		'panel'       => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'contact_page_intro', __( 'Extra Page Intro (optional)', 'studio-portfolio' ), '', 'textarea' );
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
	studio_add_text( $wp_customize, $section, 'ds_description', __( 'Section Description', 'studio-portfolio' ), 'Green, black, white, and light — my personal brand design system.', 'textarea' );
}

/**
 * Floating contact buttons.
 */
function studio_customizer_section_floating( $wp_customize ) {
	$section = 'studio_floating';
	$wp_customize->add_section( $section, array(
		'title' => __( 'Floating Contact Buttons', 'studio-portfolio' ),
		'panel' => 'studio_portfolio_panel',
	) );

	studio_add_checkbox( $wp_customize, $section, 'show_float_buttons', __( 'Show Email & WhatsApp floating buttons', 'studio-portfolio' ), true );
	studio_add_text( $wp_customize, $section, 'whatsapp_number', __( 'WhatsApp Number (with country code, digits only)', 'studio-portfolio' ), '923001234567' );
	studio_add_text( $wp_customize, $section, 'whatsapp_message', __( 'WhatsApp Pre-filled Message', 'studio-portfolio' ), 'Hello! I found your portfolio and would like to connect.', 'textarea' );
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

	studio_add_checkbox( $wp_customize, $section, 'show_marquee', __( 'Show Marquee Banner on Homepage', 'studio-portfolio' ), true );
	studio_add_checkbox( $wp_customize, $section, 'show_portfolio', __( 'Show Featured Portfolio on Homepage', 'studio-portfolio' ), true );
	studio_add_checkbox( $wp_customize, $section, 'show_about', __( 'Show About Section on Homepage', 'studio-portfolio' ), false );
	studio_add_checkbox( $wp_customize, $section, 'show_design_system', __( 'Show Design System on Homepage', 'studio-portfolio' ), false );
	studio_add_checkbox( $wp_customize, $section, 'show_contact', __( 'Show Contact Section on Homepage', 'studio-portfolio' ), false );
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
	$text  = studio_get_option( 'color_black', '#1A1A1A' );
	$green = studio_get_option( 'color_green', '#059669' );
	$light = studio_get_option( 'color_light', '#F7FAF7' );
	$white = studio_get_option( 'color_white', '#FFFFFF' );

	$marquee_text = studio_get_option( 'marquee_text_color', '#B8B8B8' );
	$marquee_sep  = studio_get_option( 'marquee_sep_color', '#059669' );
	$marquee_bg   = studio_get_option( 'marquee_bg_color', '#F7FAF7' );

	$css = ":root {
		--color-text: {$text};
		--color-black: {$text};
		--color-bg: {$white};
		--color-bg-soft: {$light};
		--color-bg-muted: " . studio_adjust_brightness( $light, -4 ) . ";
		--color-green: {$green};
		--color-green-light: " . studio_adjust_brightness( $green, 20 ) . ";
		--color-green-dark: " . studio_adjust_brightness( $green, -20 ) . ";
		--color-light: {$light};
		--color-white: {$white};
		--color-blue: {$green};
		--color-blue-light: " . studio_adjust_brightness( $green, 20 ) . ";
		--color-blue-dark: " . studio_adjust_brightness( $green, -20 ) . ";
		--color-gold: {$green};
		--color-gold-light: " . studio_adjust_brightness( $green, 25 ) . ";
		--color-gold-dark: " . studio_adjust_brightness( $green, -20 ) . ";
		--color-gold-soft: " . studio_hex_to_rgba( $green, 0.1 ) . ";
		--color-black-elevated: {$light};
		--color-black-overlay: " . studio_adjust_brightness( $light, -6 ) . ";
		--color-white-muted: #5C5C5C;
		--color-white-subtle: #8A8A8A;
		--marquee-text-color: {$marquee_text};
		--marquee-sep-color: {$marquee_sep};
		--marquee-bg-color: {$marquee_bg};
	}
	body { background: {$white}; color: {$text}; }
	.marquee-section { background: {$marquee_bg}; }
	.marquee-item { color: {$marquee_text}; }
	.marquee-sep { color: {$marquee_sep}; }";

	wp_add_inline_style( 'studio-portfolio-light', $css );
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
 * Convert hex to rgba string.
 *
 * @param string $hex   Hex color.
 * @param float  $alpha Alpha 0-1.
 * @return string
 */
function studio_hex_to_rgba( $hex, $alpha = 1 ) {
	$hex = ltrim( $hex, '#' );
	if ( 3 === strlen( $hex ) ) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}
	$r = hexdec( substr( $hex, 0, 2 ) );
	$g = hexdec( substr( $hex, 2, 2 ) );
	$b = hexdec( substr( $hex, 4, 2 ) );
	return "rgba({$r}, {$g}, {$b}, {$alpha})";
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
