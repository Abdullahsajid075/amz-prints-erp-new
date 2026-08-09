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
 * Shared secret so WordPress can prove it already verified Google
 * (Apps Script then does not need UrlFetchApp / external_request).
 */
function amz_prints_customer_portal_key() {
	$key = trim( (string) amz_prints_mod( 'amz_customer_portal_key', '' ) );
	if ( strlen( $key ) >= 24 ) {
		return $key;
	}
	try {
		$key = bin2hex( random_bytes( 24 ) );
	} catch ( Exception $e ) {
		$key = wp_generate_password( 48, false, false );
	}
	set_theme_mod( 'amz_customer_portal_key', $key );
	return $key;
}

/**
 * Verify Google ID token on WordPress (avoids Apps Script UrlFetchApp permission error).
 *
 * @param string $id_token Google credential / ID token
 * @return array|WP_Error { email, name, aud }
 */
function amz_prints_verify_google_id_token( $id_token ) {
	$token = trim( (string) $id_token );
	if ( ! $token ) {
		return new WP_Error( 'amz_google_token', __( 'Google ID token required.', 'amz-prints' ) );
	}

	$url  = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode( $token );
	$res  = wp_remote_get( $url, array( 'timeout' => 15 ) );
	if ( is_wp_error( $res ) ) {
		return new WP_Error( 'amz_google_http', __( 'Could not reach Google to verify sign-in. Try again.', 'amz-prints' ) );
	}
	$code = (int) wp_remote_retrieve_response_code( $res );
	$body = json_decode( (string) wp_remote_retrieve_body( $res ), true );
	if ( 200 !== $code || ! is_array( $body ) ) {
		return new WP_Error( 'amz_google_verify', __( 'Google verification failed. Sign in again.', 'amz-prints' ) );
	}

	$email    = strtolower( trim( (string) ( $body['email'] ?? '' ) ) );
	$verified = ! empty( $body['email_verified'] ) && ( true === $body['email_verified'] || 'true' === (string) $body['email_verified'] );
	if ( ! $email || ! $verified ) {
		return new WP_Error( 'amz_google_email', __( 'Google email is not verified.', 'amz-prints' ) );
	}

	$expected_aud = trim( (string) amz_prints_mod( 'amz_google_client_id', '' ) );
	$aud          = (string) ( $body['aud'] ?? '' );
	if ( $expected_aud && $aud && $aud !== $expected_aud ) {
		return new WP_Error( 'amz_google_aud', __( 'Google Client ID mismatch. Check Customizer → Customer Portal.', 'amz-prints' ) );
	}

	return array(
		'email' => $email,
		'name'  => (string) ( $body['name'] ?? '' ),
		'aud'   => $aud,
	);
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
	$redirect = isset( $_POST['redirect'] ) ? esc_url_raw( wp_unslash( $_POST['redirect'] ) ) : '';
	$redirect = $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();
	wp_send_json_success( array(
		'customer'  => isset( $result['customer'] ) ? $result['customer'] : array(),
		'redirect'  => $redirect,
	) );
}
add_action( 'wp_ajax_amz_prints_customer_login', 'amz_prints_ajax_customer_login' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_login', 'amz_prints_ajax_customer_login' );

/**
 * AJAX: Google verify login / password reset
 * Google token is verified in WordPress; ERP receives email + portalKey (no UrlFetchApp).
 */
function amz_prints_ajax_customer_google() {
	check_ajax_referer( 'amz_prints_customer', 'nonce' );
	$id_token     = isset( $_POST['id_token'] ) ? (string) wp_unslash( $_POST['id_token'] ) : '';
	$new_password = isset( $_POST['new_password'] ) ? (string) wp_unslash( $_POST['new_password'] ) : '';

	$google = amz_prints_verify_google_id_token( $id_token );
	if ( is_wp_error( $google ) ) {
		wp_send_json_error( array( 'message' => $google->get_error_message() ), 400 );
	}

	$body = array(
		'googleVerified' => true,
		'email'          => $google['email'],
		'portalKey'      => amz_prints_customer_portal_key(),
	);
	if ( $new_password ) {
		$body['newPassword'] = $new_password;
	}

	$result = amz_prints_customer_api( '/public/customer/google', $body );
	if ( is_wp_error( $result ) ) {
		$err = $result->get_error_message();
		if ( false !== stripos( $err, 'script.external_request' ) || false !== stripos( $err, 'UrlFetchApp' ) ) {
			$err = __( 'ERP still needs the latest Code.gs redeploy (New version). WordPress now verifies Google itself — redeploy Apps Script and try again.', 'amz-prints' );
		} elseif ( 'Not found' === $err || false !== stripos( $err, 'not found' ) ) {
			$err = __( 'ERP customer login API not found. Redeploy latest Code.gs (New version) in Apps Script, then try again. Also ensure this Gmail exists on an ERP Customer record.', 'amz-prints' );
		} elseif ( false !== stripos( $err, 'No customer account' ) ) {
			$err = sprintf(
				/* translators: %s: customer email */
				__( 'No ERP customer found for %s. Add this email on the Customers sheet first.', 'amz-prints' ),
				$google['email']
			);
		}
		wp_send_json_error( array( 'message' => $err ), 400 );
	}
	if ( empty( $result['token'] ) ) {
		wp_send_json_error( array( 'message' => __( 'Google verification failed.', 'amz-prints' ) ), 400 );
	}
	amz_prints_customer_set_token( $result['token'] );
	$redirect = isset( $_POST['redirect'] ) ? esc_url_raw( wp_unslash( $_POST['redirect'] ) ) : '';
	$redirect = $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();
	wp_send_json_success( array(
		'customer'        => isset( $result['customer'] ) ? $result['customer'] : array(),
		'passwordUpdated' => ! empty( $result['passwordUpdated'] ),
		'redirect'        => $redirect,
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
