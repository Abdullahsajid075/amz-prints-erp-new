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

	$wp_customize->add_setting( 'amz_hero_image', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'amz_hero_image', array(
		'label'     => __( 'Hero image 1', 'amz-prints' ),
		'section'   => 'amz_hero',
		'mime_type' => 'image',
	) ) );

	$wp_customize->add_setting( 'amz_hero_image_2', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'amz_hero_image_2', array(
		'label'     => __( 'Hero image 2', 'amz-prints' ),
		'section'   => 'amz_hero',
		'mime_type' => 'image',
	) ) );

	$wp_customize->add_setting( 'amz_hero_image_3', array(
		'default'           => '',
		'sanitize_callback' => 'absint',
	) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'amz_hero_image_3', array(
		'label'       => __( 'Hero image 3', 'amz-prints' ),
		'section'     => 'amz_hero',
		'mime_type'   => 'image',
		'description' => __( 'Slides change every 3 seconds with animation.', 'amz-prints' ),
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

	foreach ( array( 'amz_show_services', 'amz_show_products', 'amz_show_process', 'amz_show_cta' ) as $toggle ) {
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
