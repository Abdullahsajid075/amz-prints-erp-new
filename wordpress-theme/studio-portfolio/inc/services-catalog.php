<?php
/**
 * Services catalog — detailed (About page) and short cards (Home)
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Default detailed service categories for About page.
 *
 * @return array
 */
function studio_get_default_detailed_services() {
	return array(
		array(
			'icon'  => '🎨',
			'title' => 'Brand Identity Design',
			'items' => array( 'Logo Design', 'Brand Guidelines', 'Color & Typography Systems', 'Brand Kits', 'Visual Identity' ),
		),
		array(
			'icon'  => '✏️',
			'title' => 'Graphic Design',
			'items' => array( 'Marketing Materials', 'Brochures & Flyers', 'Posters & Banners', 'Social Media Designs', 'Presentations & Corporate Profiles' ),
		),
		array(
			'icon'  => '🖨️',
			'title' => 'Print Design',
			'items' => array( 'Business Cards', 'Letterheads & Envelopes', 'Packaging & Labels', 'Catalogues & Magazines', 'Promotional Materials' ),
		),
		array(
			'icon'  => '📦',
			'title' => 'Packaging Design',
			'items' => array( 'Product Packaging', 'Boxes & Pouches', 'Labels & Stickers', 'Product Mockups', 'Packaging Branding' ),
		),
		array(
			'icon'  => '📱',
			'title' => 'Social Media Design',
			'items' => array( 'Social Media Posts', 'Campaign Creatives', 'Ad Designs', 'Cover & Banner Designs', 'Promotional Graphics' ),
		),
		array(
			'icon'  => '💻',
			'title' => 'Digital Design',
			'items' => array( 'Website UI Design', 'Landing Page Design', 'App UI Design', 'Email Templates', 'Digital Ads & Web Banners' ),
		),
		array(
			'icon'  => '🏢',
			'title' => 'Corporate Branding',
			'items' => array( 'Company Profiles', 'Corporate Stationery', 'Marketing Collateral', 'Event & Exhibition Materials', 'Business Presentations' ),
		),
		array(
			'icon'  => '🪧',
			'title' => 'Signage & Large-Format Design',
			'items' => array( 'Sign Boards', 'Shop Branding', 'Vehicle Graphics', 'Outdoor Advertising', 'Exhibition Displays' ),
		),
	);
}

/**
 * Default short service cards for homepage.
 *
 * @return array
 */
function studio_get_default_home_services() {
	return array(
		array( 'icon' => '🎨', 'title' => 'Brand Identity', 'desc' => 'Logo, visual identity, brand guidelines, brand kits' ),
		array( 'icon' => '✏️', 'title' => 'Graphic Design', 'desc' => 'Marketing materials, posters, brochures, presentations' ),
		array( 'icon' => '📦', 'title' => 'Packaging Design', 'desc' => 'Boxes, labels, pouches, product packaging' ),
		array( 'icon' => '🖨️', 'title' => 'Print Design', 'desc' => 'Business cards, stationery, catalogues, flyers' ),
		array( 'icon' => '📱', 'title' => 'Social Media Design', 'desc' => 'Campaigns, posts, advertisements, banners' ),
		array( 'icon' => '🏢', 'title' => 'Corporate Branding', 'desc' => 'Company profiles, corporate stationery, marketing collateral' ),
		array( 'icon' => '🪧', 'title' => 'Signage & Advertising', 'desc' => 'Sign boards, vehicle branding, large-format graphics' ),
		array( 'icon' => '💻', 'title' => 'Digital Design', 'desc' => 'Website UI, landing pages, digital banners, email designs' ),
	);
}

/**
 * Detailed services for About page (Customizer editable).
 *
 * @return array
 */
function studio_get_detailed_services() {
	$defaults = studio_get_default_detailed_services();
	$services = array();

	for ( $i = 1; $i <= 8; $i++ ) {
		$default = $defaults[ $i - 1 ] ?? array( 'icon' => '✨', 'title' => '', 'items' => array() );
		$title   = studio_get_option( "detailed_service_{$i}_title", $default['title'] );
		$icon    = studio_get_option( "detailed_service_{$i}_icon", $default['icon'] );
		$items   = studio_get_lines( "detailed_service_{$i}_items", implode( "\n", $default['items'] ) );

		if ( $title || ! empty( $items ) ) {
			$services[] = array(
				'icon'  => $icon,
				'title' => $title,
				'items' => $items,
			);
		}
	}

	if ( empty( $services ) ) {
		return $defaults;
	}

	return $services;
}

/**
 * Short service cards for homepage.
 *
 * @return array
 */
function studio_get_home_services() {
	$defaults = studio_get_default_home_services();
	$services = array();

	for ( $i = 1; $i <= 8; $i++ ) {
		$default = $defaults[ $i - 1 ] ?? array( 'icon' => '✨', 'title' => '', 'desc' => '' );
		$title   = studio_get_option( "home_service_{$i}_title", $default['title'] );
		$desc    = studio_get_option( "home_service_{$i}_desc", $default['desc'] );
		$icon    = studio_get_option( "home_service_{$i}_icon", $default['icon'] );

		if ( $title || $desc ) {
			$services[] = array(
				'icon'  => $icon,
				'title' => $title,
				'desc'  => $desc,
			);
		}
	}

	if ( empty( $services ) ) {
		return $defaults;
	}

	return $services;
}

/**
 * Footer service links (short list).
 *
 * @return array
 */
function studio_get_footer_services() {
	$lines = studio_get_lines(
		'footer_services',
		"Brand Identity\nGraphic Design\nPrint Design\nPackaging Design\nSocial Media Design\nDigital Design\nCorporate Branding\nSignage & Advertising"
	);

	if ( empty( $lines ) ) {
		return wp_list_pluck( studio_get_default_home_services(), 'title' );
	}

	return $lines;
}
