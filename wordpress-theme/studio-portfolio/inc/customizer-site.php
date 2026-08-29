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
		'description' => __( 'Optional photo shown beside the About preview on homepage.', 'studio-portfolio' ),
		'section'     => $section,
		'mime_type'   => 'image',
	) ) );

	studio_add_checkbox( $wp_customize, $section, 'show_marquee_home', __( 'Show Marquee Banner on Home', 'studio-portfolio' ), true );

	studio_add_text( $wp_customize, $section, 'home_services_label', __( 'Services — Label', 'studio-portfolio' ), 'What I Offer' );
	studio_add_text( $wp_customize, $section, 'home_services_title', __( 'Services — Title', 'studio-portfolio' ), 'Premium design services' );

	$home_defaults = studio_get_default_home_services();
	for ( $i = 1; $i <= 8; $i++ ) {
		$default = $home_defaults[ $i - 1 ] ?? array( 'icon' => '✨', 'title' => '', 'desc' => '' );
		studio_add_text( $wp_customize, $section, "home_service_{$i}_icon", sprintf( __( 'Home Service %d — Icon', 'studio-portfolio' ), $i ), $default['icon'] );
		studio_add_text( $wp_customize, $section, "home_service_{$i}_title", sprintf( __( 'Home Service %d — Title', 'studio-portfolio' ), $i ), $default['title'] );
		studio_add_text( $wp_customize, $section, "home_service_{$i}_desc", sprintf( __( 'Home Service %d — Short Description', 'studio-portfolio' ), $i ), $default['desc'], 'textarea' );
	}

	studio_add_text( $wp_customize, $section, 'home_portfolio_label', __( 'Portfolio Preview — Label', 'studio-portfolio' ), 'Selected Work' );
	studio_add_text( $wp_customize, $section, 'home_portfolio_title', __( 'Portfolio Preview — Title', 'studio-portfolio' ), 'Recent projects' );
	studio_add_text( $wp_customize, $section, 'home_portfolio_btn', __( 'Portfolio Preview — Button', 'studio-portfolio' ), 'View Full Portfolio →' );

	studio_add_text( $wp_customize, $section, 'home_cta_label', __( 'CTA Band — Label', 'studio-portfolio' ), 'Let\'s Work Together' );
	studio_add_text( $wp_customize, $section, 'home_cta_title', __( 'CTA Band — Title', 'studio-portfolio' ), 'Have a brand that needs a better identity?' );
	studio_add_text( $wp_customize, $section, 'home_cta_text', __( 'CTA Band — Text', 'studio-portfolio' ), 'Let\'s talk about your next project.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'home_cta_btn', __( 'CTA Band — Primary Button', 'studio-portfolio' ), 'Start a Project →' );
	studio_add_text( $wp_customize, $section, 'home_cta_btn2', __( 'CTA Band — Secondary Button', 'studio-portfolio' ), 'View Portfolio' );

	studio_add_text( $wp_customize, $section, 'approach_label', __( 'Design Approach — Label', 'studio-portfolio' ), 'My Creative Process' );
	studio_add_text( $wp_customize, $section, 'approach_title', __( 'Design Approach — Title', 'studio-portfolio' ), 'How I build brands' );
	studio_add_text( $wp_customize, $section, 'approach_text', __( 'Design Approach — Text', 'studio-portfolio' ), 'A thoughtful process. A strategic approach. A brand designed to make an impact.', 'textarea' );

	studio_add_text( $wp_customize, $section, 'why_label', __( 'Why Work With Me — Label', 'studio-portfolio' ), 'Why Work With Me' );
	studio_add_text( $wp_customize, $section, 'why_title', __( 'Why Work With Me — Title', 'studio-portfolio' ), 'Strategy, systems, and real-world brand applications' );
	studio_add_text( $wp_customize, $section, 'why_points', __( 'Why Work With Me — Points (one per line)', 'studio-portfolio' ), "Strategy before decoration\nComplete brand systems, not one-off files\nPrint, packaging, digital and signage that stay consistent\nA clear process from discovery to delivery\nBuilt for real businesses, not just portfolios", 'textarea' );

	studio_add_text( $wp_customize, $section, 'clients_label', __( 'Clients — Label', 'studio-portfolio' ), 'Brands I\'ve Helped Build' );
	studio_add_text( $wp_customize, $section, 'clients_title', __( 'Clients — Title', 'studio-portfolio' ), 'Selected clients & industries' );
	studio_add_text( $wp_customize, $section, 'clients_list', __( 'Clients (Name|Industry|Note, one per line)', 'studio-portfolio' ), "Fireway Pizza|Food & QSR|Brand transformation\nGreenLeaf Organics|FMCG|Packaging & identity\nUrban Coffee Co.|Hospitality|Cafe branding\nStyleHub|Fashion|Campaign & social\nMeridian Analytics|Tech|Corporate identity\nNova Tech|SaaS|Logo & digital", 'textarea' );

	studio_add_text( $wp_customize, $section, 'testimonials_label', __( 'Testimonials — Label', 'studio-portfolio' ), 'What Clients Say' );
	studio_add_text( $wp_customize, $section, 'testimonials_title', __( 'Testimonials — Title', 'studio-portfolio' ), 'Proof from real businesses' );
	studio_add_text( $wp_customize, $section, 'testimonials', __( 'Testimonials (Quote|Name|Company, one per line)', 'studio-portfolio' ), "The new branding completely changed how our business looks and feels. Abdullah understood what we needed and transformed the brand into something we are proud to represent.|Restaurant Owner|Fireway Pizza\nHe didn't just design a logo — he built a system we can use everywhere, from packaging to signage.|Marketing Lead|GreenLeaf Organics\nProfessional, strategic, and easy to work with. Our company profile and stationery finally feel like one brand.|Director|Urban Coffee Co.", 'textarea' );
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

	studio_add_text( $wp_customize, $section, 'portfolio_page_label', __( 'Page Label', 'studio-portfolio' ), 'My Work' );
	studio_add_text( $wp_customize, $section, 'portfolio_page_title', __( 'Page Title', 'studio-portfolio' ), 'Selected brand work' );
	studio_add_text( $wp_customize, $section, 'portfolio_page_description', __( 'Page Description', 'studio-portfolio' ), 'Browse by category. Each project is a case study — challenge, approach, design, and result.', 'textarea' );
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
	studio_add_text( $wp_customize, $section, 'about_page_title', __( 'Page Title', 'studio-portfolio' ), 'More Than a Designer. A Brand Builder.' );
	studio_add_text( $wp_customize, $section, 'about_page_intro', __( 'Introduction', 'studio-portfolio' ), 'This is my story — who I am, how I work, and why I build brands rather than just designing files.', 'textarea' );

	studio_add_text( $wp_customize, $section, 'about_awards_title', __( 'Awards — Title', 'studio-portfolio' ), 'Key Achievements' );
	studio_add_text( $wp_customize, $section, 'about_awards', __( 'Awards — Content (one per line)', 'studio-portfolio' ), "Complete brand systems for food, retail, and corporate clients\nPrint, packaging, and signage that stay consistent with the identity\nFounded and led creative businesses\nWorked with businesses across multiple industries", 'textarea' );
	studio_add_text( $wp_customize, $section, 'about_journey', __( 'Creative Journey (one step per line)', 'studio-portfolio' ), "Started graphic design with a focus on visual storytelling\nWorked with local businesses to solve real branding problems\nExpanded into brand identity and corporate design\nFounded and led creative businesses\nWorked across food, retail, corporate and digital industries\nNow building brands through design and strategy", 'textarea' );

	$wp_customize->add_setting( 'studio_about_page_photo', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
		'transport'         => 'refresh',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'studio_about_page_photo', array(
		'label'       => __( 'About Page Photo', 'studio-portfolio' ),
		'description' => __( 'Large photo at the top of the About Me page.', 'studio-portfolio' ),
		'section'     => $section,
		'mime_type'   => 'image',
	) ) );

	studio_add_text( $wp_customize, $section, 'detailed_services_label', __( 'Detailed Services — Label', 'studio-portfolio' ), 'My Services' );
	studio_add_text( $wp_customize, $section, 'detailed_services_title', __( 'Detailed Services — Title', 'studio-portfolio' ), 'Everything I design for your brand' );

	$defaults = studio_get_default_detailed_services();
	for ( $i = 1; $i <= 8; $i++ ) {
		$default = $defaults[ $i - 1 ] ?? array( 'icon' => '✨', 'title' => '', 'items' => array() );
		studio_add_text( $wp_customize, $section, "detailed_service_{$i}_icon", sprintf( __( 'Service %d — Icon', 'studio-portfolio' ), $i ), $default['icon'] );
		studio_add_text( $wp_customize, $section, "detailed_service_{$i}_title", sprintf( __( 'Service %d — Title', 'studio-portfolio' ), $i ), $default['title'] );
		studio_add_text( $wp_customize, $section, "detailed_service_{$i}_items", sprintf( __( 'Service %d — Items (one per line)', 'studio-portfolio' ), $i ), implode( "\n", $default['items'] ), 'textarea' );
	}
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

	studio_add_text( $wp_customize, $section, 'hiw_label', __( 'Page Label', 'studio-portfolio' ), 'My Creative Process' );
	studio_add_text( $wp_customize, $section, 'hiw_title', __( 'Page Title', 'studio-portfolio' ), 'How I Work' );
	studio_add_text( $wp_customize, $section, 'hiw_description', __( 'Page Description', 'studio-portfolio' ), 'A thoughtful process. A strategic approach. A brand designed to make an impact.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'hiw_flow', __( 'Process Flow Line', 'studio-portfolio' ), 'DISCOVER → STRATEGIZE → EXPLORE → DESIGN → REFINE → DELIVER' );

	$blocks = studio_get_hiw_defaults();

	foreach ( $blocks as $key => $data ) {
		studio_add_text( $wp_customize, $section, "hiw_{$key}_title", sprintf( __( 'Step %s — Title', 'studio-portfolio' ), $data[1] ), $data[0] );
		studio_add_text( $wp_customize, $section, "hiw_{$key}_subtitle", sprintf( __( 'Step %s — Subtitle', 'studio-portfolio' ), $data[1] ), $data[2] );
		studio_add_text( $wp_customize, $section, "hiw_{$key}_content", sprintf( __( 'Step %s — Content', 'studio-portfolio' ), $data[1] ), $data[3], 'textarea' );
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

	studio_add_text( $wp_customize, $section, 'nav_schedule', __( 'Header Button Text', 'studio-portfolio' ), 'Start a Project' );
	studio_add_text( $wp_customize, $section, 'schedule_page_label', __( 'Page Label', 'studio-portfolio' ), 'Book a Call' );
	studio_add_text( $wp_customize, $section, 'schedule_page_title', __( 'Page Title', 'studio-portfolio' ), 'Schedule a meeting with me' );
	studio_add_text( $wp_customize, $section, 'schedule_page_description', __( 'Page Description', 'studio-portfolio' ), 'Fill in your details and preferred time — I will confirm via WhatsApp.', 'textarea' );
	studio_add_text( $wp_customize, $section, 'schedule_whatsapp', __( 'WhatsApp Number (digits only)', 'studio-portfolio' ), '923471136415' );
	studio_add_text( $wp_customize, $section, 'schedule_platforms', __( 'Meeting Platforms (one per line)', 'studio-portfolio' ), "Zoom\nGoogle Meet\nWhatsApp Call\nPhone Call\nIn Person", 'textarea' );
	studio_add_text( $wp_customize, $section, 'schedule_submit_text', __( 'Submit Button Text', 'studio-portfolio' ), 'Send via WhatsApp →' );
	studio_add_text( $wp_customize, $section, 'schedule_success_text', __( 'Success Message', 'studio-portfolio' ), 'Opening WhatsApp — send the message to confirm your meeting!' );
}
