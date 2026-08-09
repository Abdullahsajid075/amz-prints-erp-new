<?php
/**
 * Customer portal — email login, Google verify reset, read-only account.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const AMZ_PRINTS_CUSTOMER_COOKIE = 'amz_customer_token';

/**
 * Start session early for portal flash messages.
 */
function amz_prints_customer_boot() {
	if ( ! session_id() && ! headers_sent() ) {
		session_start( array(
			'cookie_httponly' => true,
			'cookie_samesite' => 'Lax',
		) );
	}
}
add_action( 'init', 'amz_prints_customer_boot', 1 );

function amz_prints_customer_token() {
	if ( ! empty( $_COOKIE[ AMZ_PRINTS_CUSTOMER_COOKIE ] ) ) {
		return sanitize_text_field( wp_unslash( $_COOKIE[ AMZ_PRINTS_CUSTOMER_COOKIE ] ) );
	}
	return '';
}

function amz_prints_customer_is_logged_in() {
	return (bool) amz_prints_customer_token();
}

function amz_prints_customer_set_token( $token ) {
	$token = (string) $token;
	$expire = time() + WEEK_IN_SECONDS;
	setcookie( AMZ_PRINTS_CUSTOMER_COOKIE, $token, array(
		'expires'  => $expire,
		'path'     => COOKIEPATH ? COOKIEPATH : '/',
		'domain'   => COOKIE_DOMAIN,
		'secure'   => is_ssl(),
		'httponly' => true,
		'samesite' => 'Lax',
	) );
	$_COOKIE[ AMZ_PRINTS_CUSTOMER_COOKIE ] = $token;
}

function amz_prints_customer_clear_token() {
	setcookie( AMZ_PRINTS_CUSTOMER_COOKIE, '', array(
		'expires'  => time() - HOUR_IN_SECONDS,
		'path'     => COOKIEPATH ? COOKIEPATH : '/',
		'domain'   => COOKIE_DOMAIN,
		'secure'   => is_ssl(),
		'httponly' => true,
		'samesite' => 'Lax',
	) );
	unset( $_COOKIE[ AMZ_PRINTS_CUSTOMER_COOKIE ] );
}

function amz_prints_customer_login_url( $redirect = '' ) {
	$url = home_url( '/customer-login/' );
	if ( $redirect ) {
		$url = add_query_arg( 'redirect', rawurlencode( $redirect ), $url );
	}
	return $url;
}

function amz_prints_customer_account_url() {
	return home_url( '/my-account/' );
}

/**
 * Call ERP customer portal endpoints.
 *
 * @param string $path API path
 * @param array  $body JSON body
 * @return array|WP_Error
 */
function amz_prints_customer_api( $path, $body = array() ) {
	if ( ! function_exists( 'amz_prints_erp_request' ) ) {
		return new WP_Error( 'amz_erp_missing', __( 'ERP API helper missing.', 'amz-prints' ) );
	}
	return amz_prints_erp_request( 'POST', $path, $body );
}

function amz_prints_customer_fetch_session() {
	$token = amz_prints_customer_token();
	if ( ! $token ) {
		return new WP_Error( 'amz_customer_auth', __( 'Please log in.', 'amz-prints' ) );
	}
	$result = amz_prints_customer_api( '/public/customer/session', array( 'token' => $token ) );
	if ( is_wp_error( $result ) ) {
		amz_prints_customer_clear_token();
		return $result;
	}
	return $result;
}

/**
 * AJAX: email/password login
 */
function amz_prints_ajax_customer_login() {
	check_ajax_referer( 'amz_prints_customer', 'nonce' );
	$email    = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$password = isset( $_POST['password'] ) ? (string) wp_unslash( $_POST['password'] ) : '';

	$result = amz_prints_customer_api( '/public/customer/login', array(
		'email'    => $email,
		'password' => $password,
	) );
	if ( is_wp_error( $result ) ) {
		$err = $result->get_error_message();
		if ( 'Not found' === $err || false !== stripos( $err, 'not found' ) ) {
			$err = __( 'ERP customer login API not found. Redeploy latest Code.gs in Apps Script (Deploy → Manage deployments → New version).', 'amz-prints' );
		}
		wp_send_json_error( array( 'message' => $err ), 400 );
	}
	if ( empty( $result['token'] ) ) {
		wp_send_json_error( array( 'message' => __( 'Login failed.', 'amz-prints' ) ), 400 );
	}
	amz_prints_customer_set_token( $result['token'] );
	wp_send_json_success( array(
		'customer'  => isset( $result['customer'] ) ? $result['customer'] : array(),
		'redirect'  => amz_prints_customer_account_url(),
	) );
}
add_action( 'wp_ajax_amz_prints_customer_login', 'amz_prints_ajax_customer_login' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_login', 'amz_prints_ajax_customer_login' );

/**
 * AJAX: Google verify login / password reset
 */
function amz_prints_ajax_customer_google() {
	check_ajax_referer( 'amz_prints_customer', 'nonce' );
	$id_token    = isset( $_POST['id_token'] ) ? (string) wp_unslash( $_POST['id_token'] ) : '';
	$new_password = isset( $_POST['new_password'] ) ? (string) wp_unslash( $_POST['new_password'] ) : '';

	$body = array( 'idToken' => $id_token );
	if ( $new_password ) {
		$body['newPassword'] = $new_password;
	}

	$result = amz_prints_customer_api( '/public/customer/google', $body );
	if ( is_wp_error( $result ) ) {
		$err = $result->get_error_message();
		if ( 'Not found' === $err || false !== stripos( $err, 'not found' ) ) {
			$err = __( 'ERP customer login API not found. Redeploy latest Code.gs (New version) in Apps Script, then try again. Also ensure this Gmail exists on an ERP Customer record.', 'amz-prints' );
		}
		wp_send_json_error( array( 'message' => $err ), 400 );
	}
	if ( empty( $result['token'] ) ) {
		wp_send_json_error( array( 'message' => __( 'Google verification failed.', 'amz-prints' ) ), 400 );
	}
	amz_prints_customer_set_token( $result['token'] );
	wp_send_json_success( array(
		'customer'        => isset( $result['customer'] ) ? $result['customer'] : array(),
		'passwordUpdated' => ! empty( $result['passwordUpdated'] ),
		'redirect'        => amz_prints_customer_account_url(),
	) );
}
add_action( 'wp_ajax_amz_prints_customer_google', 'amz_prints_ajax_customer_google' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_google', 'amz_prints_ajax_customer_google' );

/**
 * AJAX: logout
 */
function amz_prints_ajax_customer_logout() {
	check_ajax_referer( 'amz_prints_customer', 'nonce' );
	amz_prints_customer_clear_token();
	wp_send_json_success( array( 'redirect' => amz_prints_customer_login_url() ) );
}
add_action( 'wp_ajax_amz_prints_customer_logout', 'amz_prints_ajax_customer_logout' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_logout', 'amz_prints_ajax_customer_logout' );

/**
 * AJAX: track order for logged-in customer only
 */
function amz_prints_ajax_customer_track() {
	check_ajax_referer( 'amz_prints_customer', 'nonce' );
	$token = amz_prints_customer_token();
	if ( ! $token ) {
		wp_send_json_error( array( 'message' => __( 'Please log in to track orders.', 'amz-prints' ) ), 401 );
	}
	$code = isset( $_POST['code'] ) ? sanitize_text_field( wp_unslash( $_POST['code'] ) ) : '';
	$result = amz_prints_customer_api( '/public/customer/track', array(
		'token' => $token,
		'code'  => $code,
	) );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( array( 'message' => $result->get_error_message() ), 400 );
	}
	wp_send_json_success( $result );
}
add_action( 'wp_ajax_amz_prints_customer_track', 'amz_prints_ajax_customer_track' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_track', 'amz_prints_ajax_customer_track' );
