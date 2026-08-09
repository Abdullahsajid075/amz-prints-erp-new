<?php
/**
 * Template Name: Track Order
 *
 * Requires customer login — only shows orders for the logged-in account.
 *
 * @package AMZ_Prints
 */

if ( ! function_exists( 'amz_prints_customer_is_logged_in' ) || ! amz_prints_customer_is_logged_in() ) {
	wp_safe_redirect( amz_prints_customer_login_url( home_url( '/track-order/' ) ) );
	exit;
}

wp_safe_redirect( home_url( '/my-account/#track' ) );
exit;
