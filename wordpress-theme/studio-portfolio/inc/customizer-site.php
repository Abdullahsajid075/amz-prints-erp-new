<?php
/**
 * Site-wide Customizer — Home, Portfolio, About, How I Work, Schedule Meeting
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register v2 site customizer sections.
 *
 * @param WP_Customize_Manager $wp_customize Customizer.
 */
function studio_customizer_register_site_sections( $wp_customize ) {
	studio_customizer_home_page( $wp_customize );
	studio_customizer_portfolio_page_v2( $wp_customize );
	studio_customizer_about_page_v2( $wp_customize );
	studio_customizer_how_i_work( $wp_customize );
	studio_customizer_schedule_meeting( $wp_customize );
}
add_action( 'customize_register', 'studio_customizer_register_site_sections', 20 );

/**
 * Home page overview sections.
 */
function studio_customizer_home_page( $wp_customize ) {
	$section = 'studio_home_page';
	$wp_customize->add_section( $section, array(
		'title'       => __( 'Home Page', 'studio-portfolio' ),
		'description' => __( 'Overview sections: About preview, Services, Portfolio preview.', 'studio-portfolio' ),
		'panel'       => 'studio_portfolio_panel',
		'priority'    => 15,
	) );

	studio_add_text( $wp_customize, $section, 'home_about_label', __( 'About Preview — Label', 'studio-portfolio' ), 'About Me' );
	studio_add_text( $wp_customize, $section, 'home_about_title', __( 'About Preview — Title', 'studio-portfolio' ), 'Designer building meaningful brands' );
	studio_add_text( $wp_customize, $section, 'home_about_text', __( 'About Preview — Text', 'studio-portfolio' ), 'I help businesses stand out with thoughtful design — from brand identity to digital experiences.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'home_about_btn', __( 'About Preview — Button Text', 'studio-portfolio' ), 'Read My Full Story →' );

	$wp_customize->add_setting( 'studio_home_about_photo', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
		'transport'         => 'refresh',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'studio_home_about_photo', array(
		'label'       => __( 'About Section Photo (Home Page)', 'studio-portfolio' ),
		'description' => __( 'Separate from Hero photo — shown in the About preview on homepage.', 'studio-portfolio' ),
		'section'     => $section,
		'mime_type'   => 'image',
	) ) );

	studio_add_checkbox( $wp_customize, $section, 'show_marquee_home', __( 'Show Marquee Banner on Home', 'studio-portfolio' ), true );

	studio_add_text( $wp_customize, $section, 'home_services_label', __( 'Services — Label', 'studio-portfolio' ), 'What I Offer' );
	studio_add_text( $wp_customize, $section, 'home_services_title', __( 'Services — Title', 'studio-portfolio' ), 'Premium design services' );

	studio_add_text( $wp_customize, $section, 'home_portfolio_label', __( 'Portfolio Preview — Label', 'studio-portfolio' ), 'Selected Work' );
	studio_add_text( $wp_customize, $section, 'home_portfolio_title', __( 'Portfolio Preview — Title', 'studio-portfolio' ), 'Recent projects' );
	studio_add_text( $wp_customize, $section, 'home_portfolio_btn', __( 'Portfolio Preview — Button', 'studio-portfolio' ), 'View Full Portfolio →' );

	studio_add_text( $wp_customize, $section, 'home_cta_label', __( 'CTA Band — Label', 'studio-portfolio' ), 'Let\'s Work Together' );
	studio_add_text( $wp_customize, $section, 'home_cta_title', __( 'CTA Band — Title', 'studio-portfolio' ), 'Ready to start your next project?' );
	studio_add_text( $wp_customize, $section, 'home_cta_text', __( 'CTA Band — Text', 'studio-portfolio' ), 'Book a free consultation — I\'ll reply on WhatsApp within 24 hours.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'home_cta_btn', __( 'CTA Band — Primary Button', 'studio-portfolio' ), 'Schedule Meeting →' );
	studio_add_text( $wp_customize, $section, 'home_cta_btn2', __( 'CTA Band — Secondary Button', 'studio-portfolio' ), 'View Portfolio' );
}

/**
 * Portfolio page (category tabs + gallery).
 */
function studio_customizer_portfolio_page_v2( $wp_customize ) {
	$section = 'studio_portfolio_page';
	$wp_customize->add_section( $section, array(
		'title'       => __( 'Portfolio Page', 'studio-portfolio' ),
		'description' => __( 'Full portfolio page with category filters and hover auto-scroll.', 'studio-portfolio' ),
		'panel'       => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'portfolio_page_label', __( 'Page Label', 'studio-portfolio' ), 'Portfolio' );
	studio_add_text( $wp_customize, $section, 'portfolio_page_title', __( 'Page Title', 'studio-portfolio' ), 'Design work across every category' );
	studio_add_text( $wp_customize, $section, 'portfolio_page_description', __( 'Page Description', 'studio-portfolio' ), 'Select a category above — projects appear below. Hover the gallery to auto-scroll. PDF projects show a preview thumbnail on hover.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'portfolio_page_hint', __( 'Scroll Hint', 'studio-portfolio' ), 'Hover to auto-scroll · Click PDF to view' );
	studio_add_text( $wp_customize, $section, 'portfolio_premium_badge', __( 'Premium Badge Text', 'studio-portfolio' ), 'Premium' );
}

/**
 * About page — Experience, Education, Goals, Awards.
 */
function studio_customizer_about_page_v2( $wp_customize ) {
	$section = 'studio_about_page_v2';
	$wp_customize->add_section( $section, array(
		'title'       => __( 'About Me Page', 'studio-portfolio' ),
		'description' => __( 'Full about page content.', 'studio-portfolio' ),
		'panel'       => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'about_page_label', __( 'Page Label', 'studio-portfolio' ), 'About Me' );
	studio_add_text( $wp_customize, $section, 'about_page_title', __( 'Page Title', 'studio-portfolio' ), 'Everything about me' );
	studio_add_text( $wp_customize, $section, 'about_page_intro', __( 'Introduction', 'studio-portfolio' ), 'Welcome to my world — here is my story, experience, and what drives me as a designer.', 'textarea' );

	studio_add_text( $wp_customize, $section, 'about_awards_title', __( 'Awards — Title', 'studio-portfolio' ), 'My Awards & Achievements' );
	studio_add_text( $wp_customize, $section, 'about_awards', __( 'Awards — Content (one per line)', 'studio-portfolio' ), "Best Brand Design — Design Awards 2024\nUI/UX Excellence — Creative Summit 2023\nFeatured Designer — Behance 2022", 'textarea' );
}

/**
 * How I Work page — 6 process sections.
 */
function studio_customizer_how_i_work( $wp_customize ) {
	$section = 'studio_how_i_work';
	$wp_customize->add_section( $section, array(
		'title'       => __( 'How I Work Page', 'studio-portfolio' ),
		'description' => __( 'Your design process — fully editable.', 'studio-portfolio' ),
		'panel'       => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'hiw_label', __( 'Page Label', 'studio-portfolio' ), 'Process' );
	studio_add_text( $wp_customize, $section, 'hiw_title', __( 'Page Title', 'studio-portfolio' ), 'How I Work' );
	studio_add_text( $wp_customize, $section, 'hiw_description', __( 'Page Description', 'studio-portfolio' ), 'A transparent look at my creative process — from software to client collaboration.', 'textarea' );

	$blocks = array(
		'software'    => array( 'Software I Use', '🖥️', 'Adobe Illustrator, Photoshop, Figma, InDesign, After Effects — and AI tools for rapid prototyping.' ),
		'create'      => array( 'How I Create Design', '✏️', 'I start with research and mood boards, sketch concepts, then refine in digital tools until every detail feels intentional.' ),
		'innovation'  => array( 'How I Build Innovation', '💡', 'I push beyond templates — combining trends with timeless principles to create designs that feel fresh and ownable.' ),
		'redesign'    => array( 'How I Redesign Old Design', '🔄', 'I audit what works, preserve brand equity, and modernize typography, color, and layout without losing recognition.' ),
		'client_mind' => array( "How I Read My Client's Mind", '🧠', 'Deep discovery calls, questionnaires, and iterative feedback loops help me translate vision into visuals before the first draft.' ),
		'presentation'=> array( 'Design & Presentation Setup', '📊', 'Every deliverable is packaged professionally — mockups, brand guidelines, and presentation decks ready for stakeholders.' ),
	);

	foreach ( $blocks as $key => $data ) {
		studio_add_text( $wp_customize, $section, "hiw_{$key}_title", sprintf( __( '%s — Title', 'studio-portfolio' ), $data[0] ), $data[0] );
		studio_add_text( $wp_customize, $section, "hiw_{$key}_icon", sprintf( __( '%s — Icon', 'studio-portfolio' ), $data[0] ), $data[1] );
		studio_add_text( $wp_customize, $section, "hiw_{$key}_content", sprintf( __( '%s — Content', 'studio-portfolio' ), $data[0] ), $data[2], 'textarea' );
	}
}

/**
 * Schedule Meeting — WhatsApp booking form.
 */
function studio_customizer_schedule_meeting( $wp_customize ) {
	$section = 'studio_schedule_meeting';
	$wp_customize->add_section( $section, array(
		'title'       => __( 'Schedule Meeting', 'studio-portfolio' ),
		'description' => __( 'Meeting form sends details to WhatsApp after submission.', 'studio-portfolio' ),
		'panel'       => 'studio_portfolio_panel',
	) );

	studio_add_text( $wp_customize, $section, 'nav_schedule', __( 'Menu Button Text', 'studio-portfolio' ), 'Schedule Meeting' );
	studio_add_text( $wp_customize, $section, 'schedule_page_label', __( 'Page Label', 'studio-portfolio' ), 'Book a Call' );
	studio_add_text( $wp_customize, $section, 'schedule_page_title', __( 'Page Title', 'studio-portfolio' ), 'Schedule a meeting with me' );
	studio_add_text( $wp_customize, $section, 'schedule_page_description', __( 'Page Description', 'studio-portfolio' ), 'Fill in your details and preferred time — I will confirm via WhatsApp.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'schedule_whatsapp', __( 'WhatsApp Number (digits only)', 'studio-portfolio' ), '923471136415' );
	studio_add_text( $wp_customize, $section, 'schedule_platforms', __( 'Meeting Platforms (one per line)', 'studio-portfolio' ), "Zoom\nGoogle Meet\nWhatsApp Call\nPhone Call\nIn Person", 'textarea' );
	studio_add_text( $wp_customize, $section, 'schedule_submit_text', __( 'Submit Button Text', 'studio-portfolio' ), 'Send via WhatsApp →' );
	studio_add_text( $wp_customize, $section, 'schedule_success_text', __( 'Success Message', 'studio-portfolio' ), 'Opening WhatsApp — send the message to confirm your meeting!' );
}
