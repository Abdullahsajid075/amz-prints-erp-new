<?php
/**
 * English-only helpers (Urdu removed)
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function amz_prints_lang() {
	return 'en';
}

function amz_prints_is_rtl() {
	return false;
}

function amz_t( $key, $fallback = '' ) {
	$map = array(
		'skip'         => 'Skip to content',
		'services'     => 'Services',
		'products'     => 'Products',
		'how_we_work'  => 'How We Work',
		'nadra'        => 'NADRA',
		'track_order'  => 'Track Order',
		'gallery'      => 'Gallery',
		'about'        => 'About',
		'contact'      => 'Contact',
		'quote'        => 'Get a Quote',
		'home'         => 'Home',
		'view_all'     => 'View all services',
		'whats_we_print'=> 'What we print',
		'explore'      => 'Explore',
		'chat_title'   => 'AMZ Assistant',
		'chat_hello'   => 'Hi! Ask about printing, branding, packaging, NADRA, or tracking.',
		'chat_placeholder' => 'Type your question…',
		'chat_send'    => 'Send',
		'wa_chat'      => 'Chat on WhatsApp',
		'hero_headline'=> 'Print that moves brands forward.',
		'hero_sub'     => 'Offset, digital, large format, and packaging — crafted with color precision and on-time delivery.',
		'view_services'=> 'View Services',
		'our_services' => 'Our Services',
		'services_lead'=> 'Complete print, branding, digital and IT solutions under one roof.',
		'request_quote'=> 'Request a Quote',
		'learn_more'   => 'Learn more',
		'mega_cta'     => 'Need help choosing?',
		'mega_cta_sub' => 'Talk to our team for the best print solution.',
	);
	if ( isset( $map[ $key ] ) ) {
		return $map[ $key ];
	}
	return $fallback ? $fallback : $key;
}

function amz_prints_lang_url( $lang ) {
	return home_url( '/' );
}
