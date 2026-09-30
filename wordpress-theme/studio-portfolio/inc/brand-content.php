<?php
/**
 * Brand-builder default copy — Home, About, Process, Proof
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * How I Work — 6-step creative process (not portfolio).
 *
 * @return array
 */
function studio_get_hiw_defaults() {
	return array(
		'discover'    => array( 'Discover', '01', 'Understanding Your Business', 'I start by understanding your business, audience, goals, competitors, and what you want your brand to communicate.' ),
		'strategize'  => array( 'Strategize', '02', 'Building the Creative Direction', 'I define the visual direction based on your business objectives, audience, positioning, and market.' ),
		'explore'     => array( 'Explore', '03', 'Turning Ideas Into Concepts', 'I explore different creative directions, ideas, references, typography, colors, layouts, and visual possibilities.' ),
		'design'      => array( 'Design', '04', 'Creating the Visual Identity', 'I develop the selected concept into a refined and consistent visual system that represents your brand professionally.' ),
		'refine'      => array( 'Refine', '05', 'Perfecting Every Detail', 'Design is refined through feedback and careful attention to typography, spacing, composition, consistency, and usability.' ),
		'deliver'     => array( 'Deliver', '06', 'Ready to Build Your Brand', 'You receive the final design assets prepared for real-world use across digital, print, packaging, advertising, and other brand applications.' ),
	);
}

/**
 * Why work with me points.
 *
 * @return array
 */
function studio_get_why_points() {
	$default = "Strategy before decoration\nComplete brand systems, not one-off files\nPrint, packaging, digital and signage that stay consistent\nA clear process from discovery to delivery\nBuilt for real businesses, not just portfolios";
	$lines   = studio_get_lines( 'why_points', $default );
	return $lines;
}

/**
 * Journey timeline lines.
 *
 * @return array
 */
function studio_get_journey_steps() {
	$default = "Started graphic design with a focus on visual storytelling\nWorked with local businesses to solve real branding problems\nExpanded into brand identity and corporate design\nFounded and led creative businesses\nWorked across food, retail, corporate and digital industries\nNow building brands through design and strategy";
	return studio_get_lines( 'about_journey', $default );
}

/**
 * Testimonials (pipe-separated: quote|name|company).
 *
 * @return array
 */
function studio_get_testimonials() {
	$raw = studio_get_option(
		'testimonials',
		"The new branding completely changed how our business looks and feels. Abdullah understood what we needed and transformed the brand into something we are proud to represent.|Restaurant Owner|Fireway Pizza\nHe didn't just design a logo — he built a system we can use everywhere, from packaging to signage.|Marketing Lead|GreenLeaf Organics\nProfessional, strategic, and easy to work with. Our company profile and stationery finally feel like one brand.|Director|Urban Coffee Co."
	);
	$items = array();
	foreach ( preg_split( '/\r\n|\r|\n/', $raw ) as $line ) {
		$line = trim( $line );
		if ( '' === $line ) {
			continue;
		}
		$parts = array_map( 'trim', explode( '|', $line ) );
		$items[] = array(
			'quote'   => $parts[0] ?? '',
			'name'    => $parts[1] ?? '',
			'company' => $parts[2] ?? '',
		);
	}
	return $items;
}

/**
 * Client / brand list (pipe: name|industry|note).
 *
 * @return array
 */
function studio_get_clients() {
	$raw = studio_get_option(
		'clients_list',
		"Fireway Pizza|Food & QSR|Brand transformation\nGreenLeaf Organics|FMCG|Packaging & identity\nUrban Coffee Co.|Hospitality|Cafe branding\nStyleHub|Fashion|Campaign & social\nMeridian Analytics|Tech|Corporate identity\nNova Tech|SaaS|Logo & digital"
	);
	$items = array();
	foreach ( preg_split( '/\r\n|\r|\n/', $raw ) as $line ) {
		$line = trim( $line );
		if ( '' === $line ) {
			continue;
		}
		$parts = array_map( 'trim', explode( '|', $line ) );
		$items[] = array(
			'name'     => $parts[0] ?? '',
			'industry' => $parts[1] ?? '',
			'note'     => $parts[2] ?? '',
		);
	}
	return $items;
}

/**
 * Contact / inquiry project types.
 *
 * @return array
 */
function studio_get_project_types() {
	return studio_get_lines(
		'contact_project_types',
		"Brand Identity\nGraphic Design\nPackaging Design\nPrint Design\nSocial Media Design\nCorporate Branding\nSignage & Advertising\nDigital Design\nUI / Website Design\nOther"
	);
}

/**
 * Case-study section labels keyed by meta suffix.
 *
 * @return array
 */
function studio_get_case_study_fields() {
	return array(
		'challenge'      => __( 'The Challenge', 'studio-portfolio' ),
		'approach'       => __( 'The Approach', 'studio-portfolio' ),
		'design'         => __( 'The Design', 'studio-portfolio' ),
		'transformation' => __( 'The Transformation', 'studio-portfolio' ),
		'result'         => __( 'The Result', 'studio-portfolio' ),
	);
}
