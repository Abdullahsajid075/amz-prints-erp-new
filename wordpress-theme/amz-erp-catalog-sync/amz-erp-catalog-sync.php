<?php
/**
 * Plugin Name: AMZ ERP Catalog Sync
 * Description: Website catalog follows the live ERP. Products without a real photo stay hidden — old or new, same rule. ERP changes appear on the website.
 * Version: 1.0.0
 * Author: AMZ Prints
 *
 * Drop-in for the live Hostinger theme (Press Atelier 3.12.0).
 * Do not replace that theme with the older 2.3.x copy in this repo.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AMZ_ERP_LIVE_API', 'https://amz-prints-api.vercel.app/api' );

/**
 * Live WordPress still calls the old Google Apps Script URL.
 * Send those requests to the ERP/Vercel catalog instead.
 */
function amz_erp_catalog_reroute_gas( $preempt, $args, $url ) {
	if ( false !== $preempt ) {
		return $preempt;
	}
	if ( ! is_string( $url ) || ( stripos( $url, 'script.google.com' ) === false && stripos( $url, 'script.googleusercontent.com' ) === false ) ) {
		return $preempt;
	}

	$query = wp_parse_url( $url, PHP_URL_QUERY );
	$qs    = array();
	if ( $query ) {
		parse_str( $query, $qs );
	}
	$path = isset( $qs['path'] ) ? $qs['path'] : '/public/products';
	$dest = add_query_arg( 'path', $path, AMZ_ERP_LIVE_API );
	if ( ! empty( $qs['_method'] ) ) {
		$dest = add_query_arg( '_method', $qs['_method'], $dest );
	}

	$method = strtoupper( (string) ( $args['method'] ?? 'GET' ) );
	if ( ! empty( $args['body'] ) && 'GET' === $method ) {
		$method = 'POST';
	}

	$out               = is_array( $args ) ? $args : array();
	$out['method']     = $method;
	$out['timeout']    = isset( $out['timeout'] ) ? $out['timeout'] : 30;
	$out['redirection'] = 3;
	if ( empty( $out['headers'] ) || ! is_array( $out['headers'] ) ) {
		$out['headers'] = array();
	}
	$out['headers']['Accept'] = 'application/json';

	return wp_remote_request( $dest, $out );
}
add_filter( 'pre_http_request', 'amz_erp_catalog_reroute_gas', 5, 3 );

/**
 * After the 3.12.0 theme paints shop-cards, hide anything the live ERP catalog rejects.
 */
function amz_erp_catalog_enqueue_sync() {
	wp_enqueue_script(
		'amz-erp-catalog-sync',
		AMZ_ERP_LIVE_API . '?path=/public/catalog.js',
		array(),
		(string) time(),
		true
	);
}
add_action( 'wp_enqueue_scripts', 'amz_erp_catalog_enqueue_sync', 99 );
