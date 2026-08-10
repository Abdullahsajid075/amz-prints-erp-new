<?php
/**
 * Theme Customizer — everything editable
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function amz_prints_customize_register( $wp_customize ) {

	/* ── Colors ── */
	$wp_customize->add_section( 'amz_colors', array(
		'title'    => __( 'AMZ Brand Colors', 'amz-prints' ),
		'priority' => 30,
	) );

	foreach ( array(
		'amz_primary_color'   => array( 'label' => 'Primary Color', 'default' => '#F26522' ),
		'amz_secondary_color' => array( 'label' => 'Secondary Color', 'default' => '#1A1A1A' ),
		'amz_accent_color'    => array( 'label' => 'Accent Color', 'default' => '#10B981' ),
	) as $id => $args ) {
		$wp_customize->add_setting( $id, array(
			'default'           => $args['default'],
			'sanitize_callback' => 'sanitize_hex_color',
			'transport'         => 'refresh',
		) );
		$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, $id, array(
			'label'   => __( $args['label'], 'amz-prints' ),
			'section' => 'amz_colors',
		) ) );
	}

	/* ── Company info ── */
	$wp_customize->add_section( 'amz_company', array(
		'title'    => __( 'Company Info', 'amz-prints' ),
		'priority' => 31,
	) );

	$company_fields = array(
		'amz_company_name'    => array( 'Company Name', 'AMZ Prints' ),
		'amz_legal_name'      => array( 'Legal / Full Company Name', 'Amazon Printings (Pvt) Ltd' ),
		'amz_company_tagline' => array( 'Tagline', 'Professional Printing & Advertising Services' ),
		'amz_phone'           => array( 'Phone', '+1 (555) 123-4567' ),
		'amz_email'           => array( 'Email', 'hello@amzprints.com' ),
		'amz_address'         => array( 'Address', '123 Print Avenue, Suite 100' ),
		'amz_hours'           => array( 'Business Hours', 'Mon–Sat · 9am – 6pm' ),
		'amz_whatsapp'        => array( 'WhatsApp Number', '' ),
	);

	foreach ( $company_fields as $id => $meta ) {
		$wp_customize->add_setting( $id, array(
			'default'           => $meta[1],
			'sanitize_callback' => 'sanitize_text_field',
		) );
		$wp_customize->add_control( $id, array(
			'label'   => __( $meta[0], 'amz-prints' ),
			'section' => 'amz_company',
			'type'    => 'text',
		) );
	}

	/* ── Hero ── */
	$wp_customize->add_section( 'amz_hero', array(
		'title'    => __( 'Homepage Hero', 'amz-prints' ),
		'priority' => 32,
	) );

	$wp_customize->add_setting( 'amz_hero_headline', array(
		'default'           => 'Print that moves brands forward.',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'amz_hero_headline', array(
		'label'   => __( 'Headline', 'amz-prints' ),
		'section' => 'amz_hero',
		'type'    => 'text',
	) );

	$wp_customize->add_setting( 'amz_hero_sub', array(
		'default'           => 'Offset, digital, large format, and packaging — crafted with color precision and on-time delivery.',
		'sanitize_callback' => 'sanitize_textarea_field',
	) );
	$wp_customize->add_control( 'amz_hero_sub', array(
		'label'   => __( 'Supporting sentence', 'amz-prints' ),
		'section' => 'amz_hero',
		'type'    => 'textarea',
	) );

	$wp_customize->add_setting( 'amz_hero_cta_primary', array(
		'default'           => 'Get a Quote',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'amz_hero_cta_primary', array(
		'label'   => __( 'Primary CTA text', 'amz-prints' ),
		'section' => 'amz_hero',
		'type'    => 'text',
	) );

	$wp_customize->add_setting( 'amz_hero_cta_primary_url', array(
		'default'           => '/quote/',
		'sanitize_callback' => 'esc_url_raw',
	) );
	$wp_customize->add_control( 'amz_hero_cta_primary_url', array(
		'label'   => __( 'Primary CTA URL', 'amz-prints' ),
		'section' => 'amz_hero',
		'type'    => 'url',
	) );

	$wp_customize->add_setting( 'amz_hero_cta_secondary', array(
		'default'           => 'View Services',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'amz_hero_cta_secondary', array(
		'label'   => __( 'Secondary CTA text', 'amz-prints' ),
		'section' => 'amz_hero',
		'type'    => 'text',
	) );

	$wp_customize->add_setting( 'amz_hero_cta_secondary_url', array(
		'default'           => '/services/',
		'sanitize_callback' => 'esc_url_raw',
	) );
	$wp_customize->add_control( 'amz_hero_cta_secondary_url', array(
		'label'   => __( 'Secondary CTA URL', 'amz-prints' ),
		'section' => 'amz_hero',
		'type'    => 'url',
	) );

	$wp_customize->add_setting( 'amz_hero_layout', array(
		'default'           => 'mosaic',
		'sanitize_callback' => function( $v ) {
			return in_array( $v, array( 'mosaic', 'slider' ), true ) ? $v : 'mosaic';
		},
	) );
	$wp_customize->add_control( 'amz_hero_layout', array(
		'label'       => __( 'Hero layout', 'amz-prints' ),
		'description' => __( 'Mosaic = 1 large + 5 supporting images. Slider = classic rotating slides.', 'amz-prints' ),
		'section'     => 'amz_hero',
		'type'        => 'select',
		'choices'     => array(
			'mosaic' => __( 'Image mosaic (1 + 5)', 'amz-prints' ),
			'slider' => __( 'Full-bleed slider', 'amz-prints' ),
		),
	) );

	$wp_customize->add_setting( 'amz_hero_image', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'amz_hero_image', array(
		'label'       => __( 'Main hero image (large)', 'amz-prints' ),
		'section'     => 'amz_hero',
		'mime_type'   => 'image',
		'description' => __( 'Primary large image for the mosaic / slide 1.', 'amz-prints' ),
	) ) );

	foreach ( array(
		'amz_hero_support_1' => 'Supporting image 1',
		'amz_hero_support_2' => 'Supporting image 2',
		'amz_hero_support_3' => 'Supporting image 3',
		'amz_hero_support_4' => 'Supporting image 4',
		'amz_hero_support_5' => 'Supporting image 5',
	) as $sid => $slabel ) {
		$wp_customize->add_setting( $sid, array(
			'default'           => '',
			'sanitize_callback' => 'absint',
		) );
		$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, $sid, array(
			'label'     => __( $slabel, 'amz-prints' ),
			'section'   => 'amz_hero',
			'mime_type' => 'image',
		) ) );
	}

	$wp_customize->add_setting( 'amz_hero_image_2', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'amz_hero_image_2', array(
		'label'       => __( 'Slider image 2 (legacy)', 'amz-prints' ),
		'section'     => 'amz_hero',
		'mime_type'   => 'image',
		'description' => __( 'Used only when Hero layout = Full-bleed slider.', 'amz-prints' ),
	) ) );

	$wp_customize->add_setting( 'amz_hero_image_3', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'amz_hero_image_3', array(
		'label'     => __( 'Slider image 3 (legacy)', 'amz-prints' ),
		'section'   => 'amz_hero',
		'mime_type' => 'image',
	) ) );

	/* ── Sections visibility / copy ── */
	$wp_customize->add_section( 'amz_sections', array(
		'title'    => __( 'Homepage Sections', 'amz-prints' ),
		'priority' => 33,
	) );

	$section_fields = array(
		'amz_services_title'  => array( 'Services section title', 'What we print' ),
		'amz_services_sub'    => array( 'Services section subtitle', 'End-to-end print production for brands that refuse to look ordinary.' ),
		'amz_products_title'  => array( 'Products section title', 'Popular products' ),
		'amz_products_sub'    => array( 'Products section subtitle', 'Ready to order — customize finishes, quantities, and turnaround.' ),
		'amz_process_title'   => array( 'Process section title', 'How it works' ),
		'amz_process_sub'     => array( 'Process section subtitle', 'A clear path from brief to finished print.' ),
		'amz_cta_title'       => array( 'Bottom CTA title', 'Ready to print something great?' ),
		'amz_cta_sub'         => array( 'Bottom CTA subtitle', 'Tell us what you need. We’ll quote fast and keep you in the loop.' ),
		'amz_about_blurb'     => array( 'About blurb (home)', 'AMZ Prints is a full-service print house built for speed, color fidelity, and finishes that feel premium.' ),
	);

	foreach ( $section_fields as $id => $meta ) {
		$wp_customize->add_setting( $id, array(
			'default'           => $meta[1],
			'sanitize_callback' => 'sanitize_text_field',
		) );
		$wp_customize->add_control( $id, array(
			'label'   => __( $meta[0], 'amz-prints' ),
			'section' => 'amz_sections',
			'type'    => ( strpos( $id, '_sub' ) !== false || strpos( $id, 'blurb' ) !== false ) ? 'textarea' : 'text',
		) );
	}

	foreach ( array( 'amz_show_services', 'amz_show_products', 'amz_show_process', 'amz_show_cta', 'amz_show_clients', 'amz_show_projects' ) as $toggle ) {
		$wp_customize->add_setting( $toggle, array(
			'default'           => true,
			'sanitize_callback' => function( $v ) { return (bool) $v; },
		) );
		$wp_customize->add_control( $toggle, array(
			'label'   => ucwords( str_replace( array( 'amz_show_', '_' ), array( 'Show ', ' ' ), $toggle ) ),
			'section' => 'amz_sections',
			'type'    => 'checkbox',
		) );
	}

	$wp_customize->add_setting( 'amz_clients_title', array(
		'default'           => 'Our Clients',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'amz_clients_title', array(
		'label'   => __( 'Clients section title', 'amz-prints' ),
		'section' => 'amz_sections',
		'type'    => 'text',
	) );
	$wp_customize->add_setting( 'amz_clients_sub', array(
		'default'           => 'Brands that trust AMZ Prints for color-true production and on-time delivery.',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'amz_clients_sub', array(
		'label'   => __( 'Clients section subtitle', 'amz-prints' ),
		'section' => 'amz_sections',
		'type'    => 'textarea',
	) );
	$wp_customize->add_setting( 'amz_clients_list', array(
		'default'           => "Honda Atlas\nPepsiCo\nEngro\nJazz\nUnilever\nNestlé\nTelenor\nPackages Ltd",
		'sanitize_callback' => 'sanitize_textarea_field',
	) );
	$wp_customize->add_control( 'amz_clients_list', array(
		'label'       => __( 'Clients list (one per line)', 'amz-prints' ),
		'section'     => 'amz_sections',
		'type'        => 'textarea',
		'description' => __( 'Each line becomes one client name chip.', 'amz-prints' ),
	) );

	$wp_customize->add_setting( 'amz_projects_title', array(
		'default'           => 'Successful Projects',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'amz_projects_title', array(
		'label'   => __( 'Projects section title', 'amz-prints' ),
		'section' => 'amz_sections',
		'type'    => 'text',
	) );
	$wp_customize->add_setting( 'amz_projects_sub', array(
		'default'           => 'Selected work across packaging, large format, branding, and public services.',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'amz_projects_sub', array(
		'label'   => __( 'Projects section subtitle', 'amz-prints' ),
		'section' => 'amz_sections',
		'type'    => 'textarea',
	) );
	$wp_customize->add_setting( 'amz_projects_list', array(
		'default'           => "Brand Launch Kit|Packaging|2025\nRetail Campaign Banners|Large Format|2025\nCorporate Identity Suite|Offset|2024\nNADRA Desk Rollout|Public Service|2024\nProduct Catalog Series|Digital|2025\nEvent Branding System|Advertising|2024",
		'sanitize_callback' => 'sanitize_textarea_field',
	) );
	$wp_customize->add_control( 'amz_projects_list', array(
		'label'       => __( 'Projects list', 'amz-prints' ),
		'section'     => 'amz_sections',
		'type'        => 'textarea',
		'description' => __( 'One project per line: Title|Category|Year', 'amz-prints' ),
	) );

	/* ── NADRA ── */
	$wp_customize->add_section( 'amz_nadra', array(
		'title'    => __( 'NADRA E-Services', 'amz-prints' ),
		'priority' => 34,
	) );

	$wp_customize->add_setting( 'amz_nadra_lead', array(
		'default'           => 'Official NADRA e-services facilitation — trusted, authorized, and customer-friendly.',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'amz_nadra_lead', array(
		'label'   => __( 'Page lead text', 'amz-prints' ),
		'section' => 'amz_nadra',
		'type'    => 'textarea',
	) );

	$wp_customize->add_setting( 'amz_nadra_blurb', array(
		'default'           => 'AMZ Prints is an authorized partner for NADRA e-services. Citizens can visit our counter for guided support on identity and registration services — with clear process, trained staff, and professional document handling.',
		'sanitize_callback' => 'sanitize_textarea_field',
	) );
	$wp_customize->add_control( 'amz_nadra_blurb', array(
		'label'   => __( 'Partner description', 'amz-prints' ),
		'section' => 'amz_nadra',
		'type'    => 'textarea',
	) );

	$wp_customize->add_setting( 'amz_nadra_cert_image', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'amz_nadra_cert_image', array(
		'label'     => __( 'Partner certificate image', 'amz-prints' ),
		'section'   => 'amz_nadra',
		'mime_type' => 'image',
	) ) );

	$wp_customize->add_setting( 'amz_show_nadra_home', array(
		'default'           => true,
		'sanitize_callback' => function( $v ) { return (bool) $v; },
	) );
	$wp_customize->add_control( 'amz_show_nadra_home', array(
		'label'   => __( 'Show NADRA block on homepage', 'amz-prints' ),
		'section' => 'amz_nadra',
		'type'    => 'checkbox',
	) );

	/* ── WhatsApp Flow ── */
	$wp_customize->add_section( 'amz_whatsapp_flow', array(
		'title'    => __( 'WhatsApp Flow Button', 'amz-prints' ),
		'priority' => 36,
	) );

	$wp_customize->add_setting( 'amz_wa_enabled', array(
		'default'           => true,
		'sanitize_callback' => function( $v ) { return (bool) $v; },
	) );
	$wp_customize->add_control( 'amz_wa_enabled', array(
		'label'   => __( 'Show WhatsApp button', 'amz-prints' ),
		'section' => 'amz_whatsapp_flow',
		'type'    => 'checkbox',
	) );

	$wp_customize->add_setting( 'amz_wa_button_label', array(
		'default'           => 'Chat on WhatsApp',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'amz_wa_button_label', array(
		'label'   => __( 'Button / panel title', 'amz-prints' ),
		'section' => 'amz_whatsapp_flow',
		'type'    => 'text',
	) );

	$wp_customize->add_setting( 'amz_wa_message', array(
		'default'           => 'Hello AMZ Prints, I need help with a printing service.',
		'sanitize_callback' => 'sanitize_textarea_field',
	) );
	$wp_customize->add_control( 'amz_wa_message', array(
		'label'   => __( 'Default chat message', 'amz-prints' ),
		'section' => 'amz_whatsapp_flow',
		'type'    => 'textarea',
	) );

	$wp_customize->add_setting( 'amz_wa_flow_url', array(
		'default'           => '',
		'sanitize_callback' => 'esc_url_raw',
	) );
	$wp_customize->add_control( 'amz_wa_flow_url', array(
		'label'       => __( 'WhatsApp Flow / Business link (optional)', 'amz-prints' ),
		'description' => __( 'Paste your WhatsApp Business Flow URL or wa.me catalog/link. If empty, normal chat opens.', 'amz-prints' ),
		'section'     => 'amz_whatsapp_flow',
		'type'        => 'url',
	) );

	/* ── AI Chat ── */
	$wp_customize->add_section( 'amz_ai_chat', array(
		'title'    => __( 'AI Chatbot', 'amz-prints' ),
		'priority' => 37,
	) );

	$wp_customize->add_setting( 'amz_ai_enabled', array(
		'default'           => true,
		'sanitize_callback' => function( $v ) { return (bool) $v; },
	) );
	$wp_customize->add_control( 'amz_ai_enabled', array(
		'label'   => __( 'Show AI chatbot', 'amz-prints' ),
		'section' => 'amz_ai_chat',
		'type'    => 'checkbox',
	) );

	$wp_customize->add_setting( 'amz_ai_webhook', array(
		'default'           => '',
		'sanitize_callback' => 'esc_url_raw',
	) );
	$wp_customize->add_control( 'amz_ai_webhook', array(
		'label'       => __( 'AI webhook URL (optional)', 'amz-prints' ),
		'description' => __( 'POST endpoint that returns JSON { "reply": "..." }. Leave empty to use built-in smart replies.', 'amz-prints' ),
		'section'     => 'amz_ai_chat',
		'type'        => 'url',
	) );

	/* ── ERP Track Order ── */
	$wp_customize->add_section( 'amz_erp_track', array(
		'title'       => __( 'ERP Order Tracking', 'amz-prints' ),
		'description' => __( 'Live Track Order data from erp.amzprints.com (public API).', 'amz-prints' ),
		'priority'    => 37.5,
	) );

	$wp_customize->add_setting( 'amz_erp_api_url', array(
		'default'           => 'https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec',
		'sanitize_callback' => 'esc_url_raw',
	) );
	$wp_customize->add_control( 'amz_erp_api_url', array(
		'label'       => __( 'ERP API URL', 'amz-prints' ),
		'description' => __( 'Same backend URL used by the ERP frontend (GAS / Hostinger).', 'amz-prints' ),
		'section'     => 'amz_erp_track',
		'type'        => 'url',
	) );

	$wp_customize->add_setting( 'amz_erp_track_url', array(
		'default'           => 'https://erp.amzprints.com/track',
		'sanitize_callback' => 'esc_url_raw',
	) );
	$wp_customize->add_control( 'amz_erp_track_url', array(
		'label'       => __( 'ERP Track page URL', 'amz-prints' ),
		'description' => __( 'Public track page link shown to customers.', 'amz-prints' ),
		'section'     => 'amz_erp_track',
		'type'        => 'url',
	) );

	/* ── Customer Portal ── */
	$wp_customize->add_section( 'amz_customer_portal', array(
		'title'       => __( 'Customer Portal', 'amz-prints' ),
		'description' => __( 'Google Sign-In Client ID for customer password reset / verification. Create an OAuth Client ID (Web) in Google Cloud Console.', 'amz-prints' ),
		'priority'    => 37.7,
	) );

	$wp_customize->add_setting( 'amz_google_client_id', array(
		'default'           => '',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'amz_google_client_id', array(
		'label'       => __( 'Google OAuth Client ID', 'amz-prints' ),
		'description' => __( 'Used on Customer Login for Google verification / password reset. Authorized JS origin: your website domain.', 'amz-prints' ),
		'section'     => 'amz_customer_portal',
		'type'        => 'text',
	) );

	$wp_customize->add_setting( 'amz_customer_portal_key', array(
		'default'           => '',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'amz_customer_portal_key', array(
		'label'       => __( 'Customer Portal Key', 'amz-prints' ),
		'description' => __( 'Secret shared with Apps Script so Google login works without UrlFetchApp. Auto-created on first Google login; keep it private. Optional: paste the same value into Apps Script → Project Settings → Script properties as CUSTOMER_PORTAL_KEY.', 'amz-prints' ),
		'section'     => 'amz_customer_portal',
		'type'        => 'text',
	) );

	/* ── Promo Popup ── */
	$wp_customize->add_section( 'amz_popup', array(
		'title'       => __( 'Promo Popup', 'amz-prints' ),
		'description' => __( 'Promotional image popup with multiple styles. Uses a cookie so it does not reappear every page view.', 'amz-prints' ),
		'priority'    => 37.8,
	) );

	$wp_customize->add_setting( 'amz_popup_enabled', array(
		'default'           => true,
		'sanitize_callback' => function( $v ) { return (bool) $v; },
	) );
	$wp_customize->add_control( 'amz_popup_enabled', array(
		'label'       => __( 'Enable promo popup', 'amz-prints' ),
		'description' => __( 'Shows on the Home Page when loading (default). Upload an image below.', 'amz-prints' ),
		'section'     => 'amz_popup',
		'type'        => 'checkbox',
	) );

	$wp_customize->add_setting( 'amz_popup_image', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'amz_popup_image', array(
		'label'       => __( 'Popup image', 'amz-prints' ),
		'description' => __( 'Upload/select the promotional image shown in the popup.', 'amz-prints' ),
		'section'     => 'amz_popup',
		'mime_type'   => 'image',
	) ) );

	$wp_customize->add_setting( 'amz_popup_image_url', array(
		'default'           => '',
		'sanitize_callback' => 'esc_url_raw',
	) );
	$wp_customize->add_control( 'amz_popup_image_url', array(
		'label'       => __( 'Popup image URL (optional)', 'amz-prints' ),
		'description' => __( 'If media upload fails, paste a direct image URL here.', 'amz-prints' ),
		'section'     => 'amz_popup',
		'type'        => 'url',
	) );

	$wp_customize->add_setting( 'amz_popup_style', array(
		'default'           => 'centered',
		'sanitize_callback' => function( $v ) {
			$ok = array( 'centered', 'banner', 'corner', 'fullscreen', 'card' );
			return in_array( $v, $ok, true ) ? $v : 'centered';
		},
	) );
	$wp_customize->add_control( 'amz_popup_style', array(
		'label'   => __( 'Popup style', 'amz-prints' ),
		'section' => 'amz_popup',
		'type'    => 'select',
		'choices' => array(
			'centered'   => __( 'Centered modal', 'amz-prints' ),
			'banner'     => __( 'Top banner', 'amz-prints' ),
			'corner'     => __( 'Corner toast', 'amz-prints' ),
			'fullscreen' => __( 'Fullscreen cover', 'amz-prints' ),
			'card'       => __( 'Floating card', 'amz-prints' ),
		),
	) );

	foreach ( array(
		'amz_popup_page_home'     => array( 'Show on Home Page', true ),
		'amz_popup_page_products' => array( 'Show on Products', false ),
		'amz_popup_page_services' => array( 'Show on Services', false ),
		'amz_popup_page_all'      => array( 'Show on all pages', false ),
	) as $pid => $meta ) {
		$wp_customize->add_setting( $pid, array(
			'default'           => $meta[1],
			'sanitize_callback' => function( $v ) { return (bool) $v; },
		) );
		$wp_customize->add_control( $pid, array(
			'label'   => __( $meta[0], 'amz-prints' ),
			'section' => 'amz_popup',
			'type'    => 'checkbox',
		) );
	}

	$wp_customize->add_setting( 'amz_popup_show_close', array(
		'default'           => true,
		'sanitize_callback' => function( $v ) { return (bool) $v; },
	) );
	$wp_customize->add_control( 'amz_popup_show_close', array(
		'label'   => __( 'Show close button', 'amz-prints' ),
		'section' => 'amz_popup',
		'type'    => 'checkbox',
	) );

	$wp_customize->add_setting( 'amz_popup_link', array(
		'default'           => '',
		'sanitize_callback' => 'esc_url_raw',
	) );
	$wp_customize->add_control( 'amz_popup_link', array(
		'label'   => __( 'Popup click URL (optional)', 'amz-prints' ),
		'section' => 'amz_popup',
		'type'    => 'url',
	) );

	$wp_customize->add_setting( 'amz_popup_delay', array(
		'default'           => 800,
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( 'amz_popup_delay', array(
		'label'   => __( 'Show delay (ms)', 'amz-prints' ),
		'section' => 'amz_popup',
		'type'    => 'number',
	) );

	$wp_customize->add_setting( 'amz_popup_cookie_days', array(
		'default'           => 1,
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( 'amz_popup_cookie_days', array(
		'label'       => __( 'Hide for N days after close', 'amz-prints' ),
		'section'     => 'amz_popup',
		'type'        => 'number',
		'description' => __( 'Also hidden for the rest of the browser session. Test anytime with /?show_popup=1', 'amz-prints' ),
	) );

	/* ── Store / Checkout ── */
	$wp_customize->add_section( 'amz_store', array(
		'title'       => __( 'Store & Checkout', 'amz-prints' ),
		'description' => __( 'Delivery charges, optional cart discount, and order processing policy shown at checkout.', 'amz-prints' ),
		'priority'    => 37.9,
	) );

	$wp_customize->add_setting( 'amz_delivery_charge', array(
		'default'           => 0,
		'sanitize_callback' => function( $v ) { return max( 0, floatval( $v ) ); },
	) );
	$wp_customize->add_control( 'amz_delivery_charge', array(
		'label'   => __( 'Delivery charge (Rs.)', 'amz-prints' ),
		'section' => 'amz_store',
		'type'    => 'number',
	) );

	$wp_customize->add_setting( 'amz_free_delivery_over', array(
		'default'           => 0,
		'sanitize_callback' => function( $v ) { return max( 0, floatval( $v ) ); },
	) );
	$wp_customize->add_control( 'amz_free_delivery_over', array(
		'label'       => __( 'Free delivery over (Rs., 0 = off)', 'amz-prints' ),
		'section'     => 'amz_store',
		'type'        => 'number',
	) );

	$wp_customize->add_setting( 'amz_cart_discount_percent', array(
		'default'           => 0,
		'sanitize_callback' => function( $v ) { return max( 0, min( 100, floatval( $v ) ) ); },
	) );
	$wp_customize->add_control( 'amz_cart_discount_percent', array(
		'label'   => __( 'Cart discount percent (optional)', 'amz-prints' ),
		'section' => 'amz_store',
		'type'    => 'number',
	) );

	$wp_customize->add_setting( 'amz_order_policy', array(
		'default'           => 'Your order will begin processing after payment confirmation. Please complete the required payment according to the selected payment method. Order processing will start once payment has been verified.',
		'sanitize_callback' => 'sanitize_textarea_field',
	) );
	$wp_customize->add_control( 'amz_order_policy', array(
		'label'   => __( 'Order Processing Policy', 'amz-prints' ),
		'section' => 'amz_store',
		'type'    => 'textarea',
	) );

	/* ── Social ── */
	$wp_customize->add_section( 'amz_social', array(
		'title'    => __( 'Social Links', 'amz-prints' ),
		'priority' => 38,
	) );

	foreach ( array( 'facebook', 'instagram', 'linkedin', 'youtube', 'tiktok' ) as $network ) {
		$id = 'amz_social_' . $network;
		$wp_customize->add_setting( $id, array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
		) );
		$wp_customize->add_control( $id, array(
			'label'   => ucfirst( $network ),
			'section' => 'amz_social',
			'type'    => 'url',
		) );
	}
}
add_action( 'customize_register', 'amz_prints_customize_register' );
