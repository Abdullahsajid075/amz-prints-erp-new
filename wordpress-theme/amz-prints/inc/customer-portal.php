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

function amz_prints_local_customers() {
	$all = get_option( 'amz_prints_local_customers', array() );
	return is_array( $all ) ? $all : array();
}

function amz_prints_local_customer_save( $email, $row ) {
	$all = amz_prints_local_customers();
	$all[ strtolower( $email ) ] = $row;
	update_option( 'amz_prints_local_customers', $all, false );
}

function amz_prints_local_customer_get( $email ) {
	$all = amz_prints_local_customers();
	$key = strtolower( trim( (string) $email ) );
	return isset( $all[ $key ] ) && is_array( $all[ $key ] ) ? $all[ $key ] : null;
}

function amz_prints_customer_redirect_from_post() {
	$redirect = isset( $_POST['redirect'] ) ? esc_url_raw( wp_unslash( $_POST['redirect'] ) ) : '';
	return $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();
}

/**
 * Website session that does not depend on the ERP Google or session routes.
 */
function amz_prints_customer_sign_in_local( $email, $profile, $password = '' ) {
	$email   = strtolower( trim( (string) $email ) );
	$profile = is_array( $profile ) ? $profile : array();
	$row     = amz_prints_local_customer_get( $email );
	$row     = is_array( $row ) ? $row : array();
	$row['name']     = (string) ( $profile['name'] ?? ( $row['name'] ?? '' ) );
	$row['email']    = $email;
	$row['phone']    = (string) ( $profile['phone'] ?? ( $row['phone'] ?? '' ) );
	$row['address']  = (string) ( $profile['address'] ?? ( $row['address'] ?? '' ) );
	$row['verified'] = true;
	if ( strlen( (string) $password ) >= 6 ) {
		$row['password'] = wp_hash_password( $password );
	}
	amz_prints_local_customer_save( $email, $row );
	$token = amz_prints_local_issue_token( $email );
	amz_prints_customer_set_token( $token );
	amz_prints_remember_portal_session( $token, array(
		'name'  => $row['name'],
		'email' => $email,
		'phone' => $row['phone'],
	) );
	return $token;
}

function amz_prints_local_issue_token( $email ) {
	$token = 'amzlocal.' . wp_generate_password( 32, false, false );
	$sessions = get_option( 'amz_prints_local_sessions', array() );
	if ( ! is_array( $sessions ) ) {
		$sessions = array();
	}
	$sessions[ $token ] = array(
		'email' => strtolower( $email ),
		'exp'   => time() + WEEK_IN_SECONDS,
	);
	update_option( 'amz_prints_local_sessions', $sessions, false );
	return $token;
}

function amz_prints_local_session_customer( $token ) {
	if ( 0 !== strpos( (string) $token, 'amzlocal.' ) ) {
		return null;
	}
	$sessions = get_option( 'amz_prints_local_sessions', array() );
	$row      = ( is_array( $sessions ) && isset( $sessions[ $token ] ) ) ? $sessions[ $token ] : null;
	if ( ! is_array( $row ) || (int) ( $row['exp'] ?? 0 ) < time() ) {
		return null;
	}
	$customer = amz_prints_local_customer_get( $row['email'] ?? '' );
	if ( ! $customer || empty( $customer['verified'] ) ) {
		return null;
	}
	return array(
		'customer' => array(
			'name'    => (string) ( $customer['name'] ?? '' ),
			'email'   => (string) ( $customer['email'] ?? '' ),
			'phone'   => (string) ( $customer['phone'] ?? '' ),
			'address' => (string) ( $customer['address'] ?? '' ),
		),
		'ledger'  => array(),
		'pending' => array(),
	);
}

function amz_prints_send_verify_email( $email, $name, $token ) {
	$link = add_query_arg( 'amz_verify', rawurlencode( $token ), home_url( '/customer-login/' ) );
	$body = sprintf(
		"Hello %s,\n\nConfirm your AMZ Prints account by opening this link:\n\n%s\n\nIf you did not create this account, ignore this email.\n",
		$name ? $name : 'there',
		$link
	);
	return wp_mail( $email, 'Confirm your AMZ Prints account', $body );
}

function amz_prints_customer_verify_from_request() {
	if ( empty( $_GET['amz_verify'] ) ) {
		return;
	}
	$token = sanitize_text_field( wp_unslash( $_GET['amz_verify'] ) );
	$all   = amz_prints_local_customers();
	foreach ( $all as $email => $row ) {
		if ( ! is_array( $row ) || empty( $row['verify_token'] ) || ! hash_equals( (string) $row['verify_token'], $token ) ) {
			continue;
		}
		$row['verified']    = true;
		$row['verify_token'] = '';
		amz_prints_local_customer_save( $email, $row );
		amz_prints_customer_set_token( amz_prints_local_issue_token( $email ) );
		wp_safe_redirect( amz_prints_customer_account_url() );
		exit;
	}
	wp_safe_redirect( add_query_arg( 'verify', 'invalid', home_url( '/customer-login/' ) ) );
	exit;
}
add_action( 'template_redirect', 'amz_prints_customer_verify_from_request', 1 );

function amz_prints_remember_portal_session( $token, $customer ) {
	$token = (string) $token;
	if ( ! $token ) {
		return;
	}
	$all = get_option( 'amz_prints_portal_sessions', array() );
	if ( ! is_array( $all ) ) {
		$all = array();
	}
	$all[ $token ] = array(
		'customer' => is_array( $customer ) ? $customer : array(),
		'exp'      => time() + WEEK_IN_SECONDS,
	);
	if ( count( $all ) > 40 ) {
		$all = array_slice( $all, -40, null, true );
	}
	update_option( 'amz_prints_portal_sessions', $all, false );
}

function amz_prints_portal_snapshot( $token ) {
	$all = get_option( 'amz_prints_portal_sessions', array() );
	$row = ( is_array( $all ) && isset( $all[ $token ] ) ) ? $all[ $token ] : null;
	if ( ! is_array( $row ) || (int) ( $row['exp'] ?? 0 ) < time() ) {
		return null;
	}
	return array(
		'customer'        => isset( $row['customer'] ) && is_array( $row['customer'] ) ? $row['customer'] : array(),
		'orders'          => array(),
		'invoices'        => array(),
		'discounts'       => array(),
		'ledger'          => array(),
		'pendingPayments' => array(),
	);
}

function amz_prints_customer_fetch_session() {
	$token = amz_prints_customer_token();
	if ( ! $token ) {
		return new WP_Error( 'amz_customer_auth', __( 'Please log in.', 'amz-prints' ) );
	}
	$local = amz_prints_local_session_customer( $token );
	if ( $local ) {
		return $local;
	}
	$result = amz_prints_customer_api( '/public/customer/session', array( 'token' => $token ) );
	if ( is_wp_error( $result ) ) {
		$snap = amz_prints_portal_snapshot( $token );
		$msg  = $result->get_error_message();
		if ( $snap && ( false !== stripos( $msg, 'not found' ) || false !== stripos( $msg, 'session' ) ) ) {
			return $snap;
		}
		amz_prints_customer_clear_token();
		return $result;
	}
	if ( ! empty( $result['customer'] ) && is_array( $result['customer'] ) ) {
		amz_prints_remember_portal_session( $token, $result['customer'] );
	}
	return $result;
}

/**
 * AJAX: does this email already have a customer account?
 */
function amz_prints_ajax_customer_lookup() {
	check_ajax_referer( 'amz_prints_customer', 'nonce' );
	$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	if ( ! $email || ! is_email( $email ) ) {
		wp_send_json_error( array( 'message' => __( 'Enter a valid email address.', 'amz-prints' ) ), 400 );
	}
	$result = amz_prints_customer_api( '/public/customer/lookup', array( 'email' => $email ) );
	if ( is_wp_error( $result ) ) {
		$err = $result->get_error_message();
		if ( 'Not found' === $err || false !== stripos( $err, 'not found' ) ) {
			$err = __( 'Account check is not on the ERP yet. Redeploy latest Code.gs (New version), then try again.', 'amz-prints' );
		}
		wp_send_json_error( array( 'message' => $err ), 400 );
	}
	wp_send_json_success( array(
		'exists'      => ! empty( $result['exists'] ),
		'hasPassword' => ! empty( $result['hasPassword'] ),
	) );
}
add_action( 'wp_ajax_amz_prints_customer_lookup', 'amz_prints_ajax_customer_lookup' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_lookup', 'amz_prints_ajax_customer_lookup' );

/**
 * AJAX: create new customer account
 */
function amz_prints_ajax_customer_register() {
	check_ajax_referer( 'amz_prints_customer', 'nonce' );
	$name     = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	$email    = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$phone    = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '';
	$password = isset( $_POST['password'] ) ? (string) wp_unslash( $_POST['password'] ) : '';
	$address  = isset( $_POST['address'] ) ? sanitize_textarea_field( wp_unslash( $_POST['address'] ) ) : '';

	if ( ! $name || ! $email || ! $phone ) {
		wp_send_json_error( array( 'message' => __( 'Name, email, and phone are required.', 'amz-prints' ) ), 400 );
	}
	if ( strlen( $password ) < 6 ) {
		wp_send_json_error( array( 'message' => __( 'Password must be at least 6 characters.', 'amz-prints' ) ), 400 );
	}

	$existing_local = amz_prints_local_customer_get( $email );
	if ( $existing_local && ! empty( $existing_local['verified'] ) ) {
		wp_send_json_error( array(
			'message' => __( 'An account already exists for this email. Please log in.', 'amz-prints' ),
			'code'    => 'need_login',
		), 400 );
	}

	$result = amz_prints_customer_api( '/public/customer/register', array(
		'name'     => $name,
		'email'    => $email,
		'phone'    => $phone,
		'password' => $password,
		'address'  => $address,
	) );
	if ( is_wp_error( $result ) ) {
		$err = $result->get_error_message();
		if ( false !== stripos( $err, 'please log in' ) || false !== stripos( $err, 'already exists' ) ) {
			$login = amz_prints_customer_api( '/public/customer/login', array(
				'email'    => $email,
				'password' => $password,
			) );
			if ( ! is_wp_error( $login ) && ! empty( $login['token'] ) ) {
				amz_prints_customer_sign_in_local( $email, isset( $login['customer'] ) ? $login['customer'] : array( 'name' => $name, 'phone' => $phone ), $password );
				amz_prints_customer_set_token( $login['token'] );
				wp_send_json_success( array(
					'redirect' => amz_prints_customer_redirect_from_post(),
					'message'  => __( 'This email already had an account. You are signed in.', 'amz-prints' ),
				) );
			}
			$login_err = is_wp_error( $login ) ? $login->get_error_message() : '';
			if ( false !== stripos( $login_err, 'not set' ) || false !== stripos( $login_err, 'not registered' ) || false !== stripos( $login_err, 'not found' ) || false !== stripos( $login_err, 'sign up' ) ) {
				amz_prints_customer_sign_in_local( $email, array( 'name' => $name, 'phone' => $phone, 'address' => $address ), $password );
				wp_send_json_success( array(
					'redirect' => amz_prints_customer_redirect_from_post(),
					'created'  => true,
					'message'  => __( 'Account created. You are signed in.', 'amz-prints' ),
				) );
			}
			wp_send_json_error( array(
				'message' => __( 'This email already has an account, and that password does not match. Open Log in, or use Continue with Google.', 'amz-prints' ),
				'code'    => 'need_login',
			), 400 );
		}
		amz_prints_customer_sign_in_local( $email, array( 'name' => $name, 'phone' => $phone, 'address' => $address ), $password );
		wp_send_json_success( array(
			'redirect' => amz_prints_customer_redirect_from_post(),
			'created'  => true,
			'message'  => __( 'Account created. You are signed in.', 'amz-prints' ),
		) );
	}
	if ( empty( $result['token'] ) ) {
		wp_send_json_error( array( 'message' => __( 'The ERP did not create this account. Check name, email, and phone, then try again.', 'amz-prints' ) ), 400 );
	}

	amz_prints_local_customer_save( $email, array(
		'name'     => $name,
		'email'    => $email,
		'phone'    => $phone,
		'address'  => $address,
		'password' => wp_hash_password( $password ),
		'verified' => true,
	) );
	amz_prints_customer_set_token( $result['token'] );
	amz_prints_remember_portal_session( $result['token'], isset( $result['customer'] ) ? $result['customer'] : array() );
	$redirect = isset( $_POST['redirect'] ) ? esc_url_raw( wp_unslash( $_POST['redirect'] ) ) : '';
	$redirect = $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();
	wp_send_json_success( array(
		'customer' => isset( $result['customer'] ) ? $result['customer'] : array(),
		'redirect' => $redirect,
		'created'  => true,
		'message'  => __( 'Account created. You are signed in.', 'amz-prints' ),
	) );
}
add_action( 'wp_ajax_amz_prints_customer_register', 'amz_prints_ajax_customer_register' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_register', 'amz_prints_ajax_customer_register' );

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
		$local = amz_prints_local_customer_get( $email );
		if ( $local && ! empty( $local['password'] ) && wp_check_password( $password, $local['password'] ) ) {
			$token = amz_prints_local_issue_token( $email );
			amz_prints_customer_set_token( $token );
			amz_prints_remember_portal_session( $token, array(
				'name'  => (string) ( $local['name'] ?? '' ),
				'email' => $email,
				'phone' => (string) ( $local['phone'] ?? '' ),
			) );
			$redirect = isset( $_POST['redirect'] ) ? esc_url_raw( wp_unslash( $_POST['redirect'] ) ) : '';
			$redirect = $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();
			wp_send_json_success( array( 'redirect' => $redirect ) );
		}
		$err  = $result->get_error_message();
		$code = '';
		if ( false !== stripos( $err, 'please sign up' ) || false !== stripos( $err, 'no customer account' ) || false !== stripos( $err, 'not registered online' ) ) {
			$code = 'need_signup';
			$err  = __( 'This email is not registered for website login. Open Create an account, enter your name, phone, and a password of at least 6 characters, then log in with that same email and password.', 'amz-prints' );
		} elseif ( false !== stripos( $err, 'invalid email' ) || false !== stripos( $err, 'invalid password' ) || false !== stripos( $err, 'invalid credential' ) ) {
			$err = __( 'That email and password do not match. Use the password from Sign up, or press Continue with Google.', 'amz-prints' );
		} elseif ( 'Not found' === $err || false !== stripos( $err, 'not found' ) ) {
			$err = __( 'ERP customer login API not found. Redeploy latest Code.gs in Apps Script (Deploy → Manage deployments → New version).', 'amz-prints' );
		}
		wp_send_json_error( array( 'message' => $err, 'code' => $code ), 400 );
	}
	if ( empty( $result['token'] ) ) {
		wp_send_json_error( array( 'message' => __( 'Login failed.', 'amz-prints' ) ), 400 );
	}
	$cust = isset( $result['customer'] ) && is_array( $result['customer'] ) ? $result['customer'] : array();
	amz_prints_local_customer_save( $email, array(
		'name'     => (string) ( $cust['name'] ?? '' ),
		'email'    => $email,
		'phone'    => (string) ( $cust['phone'] ?? '' ),
		'password' => wp_hash_password( $password ),
		'verified' => true,
	) );
	amz_prints_customer_set_token( $result['token'] );
	amz_prints_remember_portal_session( $result['token'], $cust );
	$redirect = isset( $_POST['redirect'] ) ? esc_url_raw( wp_unslash( $_POST['redirect'] ) ) : '';
	$redirect = $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();
	wp_send_json_success( array(
		'customer'  => $cust,
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

	$phone = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '';
	$gname = $google['name'] ? $google['name'] : ( isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '' );
	$typed = isset( $_POST['password'] ) ? (string) wp_unslash( $_POST['password'] ) : '';
	$pass  = strlen( $typed ) >= 6 ? $typed : ( strlen( $new_password ) >= 6 ? $new_password : wp_generate_password( 16, false, false ) );

	$body = array(
		'googleVerified'  => true,
		'email'           => $google['email'],
		'name'            => $gname,
		'phone'           => $phone,
		'password'        => $pass,
		'portalKey'       => amz_prints_customer_portal_key(),
		'createIfMissing' => true,
	);
	if ( $new_password ) {
		$body['newPassword'] = $new_password;
	}

	$result = amz_prints_customer_api( '/public/customer/google', $body );
	if ( is_wp_error( $result ) || empty( $result['token'] ) ) {
		$made = null;
		if ( $phone && $gname ) {
			$made = amz_prints_customer_api( '/public/customer/register', array(
				'name'     => $gname,
				'email'    => $google['email'],
				'phone'    => $phone,
				'password' => $pass,
			) );
		}
		if ( ! is_wp_error( $made ) && is_array( $made ) && ! empty( $made['token'] ) ) {
			amz_prints_customer_sign_in_local( $google['email'], isset( $made['customer'] ) ? $made['customer'] : array( 'name' => $gname, 'phone' => $phone ), $pass );
			amz_prints_customer_set_token( $made['token'] );
			wp_send_json_success( array(
				'redirect' => amz_prints_customer_redirect_from_post(),
				'created'  => true,
				'message'  => __( 'Google verified. Your account is created and you are signed in.', 'amz-prints' ),
			) );
		}
		amz_prints_customer_sign_in_local( $google['email'], array(
			'name'  => $gname ? $gname : $google['email'],
			'phone' => $phone,
		), $pass );
		wp_send_json_success( array(
			'redirect' => amz_prints_customer_redirect_from_post(),
			'created'  => true,
			'message'  => __( 'Google verified. You are signed in.', 'amz-prints' ),
		) );
	}
	$cust = isset( $result['customer'] ) && is_array( $result['customer'] ) ? $result['customer'] : array( 'name' => $gname, 'phone' => $phone );
	amz_prints_customer_sign_in_local( $google['email'], $cust, $pass );
	amz_prints_customer_set_token( $result['token'] );
	amz_prints_remember_portal_session( $result['token'], isset( $result['customer'] ) ? $result['customer'] : array() );
	$redirect = isset( $_POST['redirect'] ) ? esc_url_raw( wp_unslash( $_POST['redirect'] ) ) : '';
	$redirect = $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();
	wp_send_json_success( array(
		'customer'        => isset( $result['customer'] ) ? $result['customer'] : array(),
		'passwordUpdated' => ! empty( $result['passwordUpdated'] ),
		'created'         => ! empty( $result['created'] ),
		'redirect'        => $redirect,
	) );
}
add_action( 'wp_ajax_amz_prints_customer_google', 'amz_prints_ajax_customer_google' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_google', 'amz_prints_ajax_customer_google' );

/**
 * AJAX: send password-reset verification code to customer email.
 */
function amz_prints_ajax_customer_reset_request() {
	check_ajax_referer( 'amz_prints_customer', 'nonce' );
	$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	if ( ! $email || ! is_email( $email ) ) {
		wp_send_json_error( array( 'message' => __( 'Enter a valid email address.', 'amz-prints' ) ), 400 );
	}
	$email_key = strtolower( $email );
	$cool_key  = 'amz_pwreset_cool_' . md5( $email_key );
	if ( get_transient( $cool_key ) ) {
		wp_send_json_error( array( 'message' => __( 'Please wait a minute before requesting another code.', 'amz-prints' ) ), 429 );
	}

	$code = (string) wp_rand( 100000, 999999 );
	set_transient(
		'amz_pwreset_' . md5( $email_key ),
		array(
			'code'  => $code,
			'email' => $email_key,
			'tries' => 0,
		),
		15 * MINUTE_IN_SECONDS
	);
	set_transient( $cool_key, 1, MINUTE_IN_SECONDS );

	$company = amz_prints_mod( 'amz_company_name', 'AMZ Prints' );
	$subject = sprintf( '[%s] Password reset code', $company );
	$body    = sprintf(
		"Your %s password reset code is:\n\n%s\n\nThis code expires in 15 minutes. If you did not request a reset, ignore this email.\n",
		$company,
		$code
	);
	$sent = wp_mail( $email, $subject, $body );
	if ( ! $sent ) {
		wp_send_json_error( array( 'message' => __( 'Could not send email. Try again or contact AMZ Prints.', 'amz-prints' ) ), 500 );
	}
	wp_send_json_success( array(
		'message' => __( 'We sent a 6-digit code to your email. Enter it below to set a new password.', 'amz-prints' ),
	) );
}
add_action( 'wp_ajax_amz_prints_customer_reset_request', 'amz_prints_ajax_customer_reset_request' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_reset_request', 'amz_prints_ajax_customer_reset_request' );

/**
 * AJAX: confirm email code and set a new password.
 */
function amz_prints_ajax_customer_reset_confirm() {
	check_ajax_referer( 'amz_prints_customer', 'nonce' );
	$email    = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$code     = isset( $_POST['code'] ) ? preg_replace( '/\D+/', '', (string) wp_unslash( $_POST['code'] ) ) : '';
	$password = isset( $_POST['new_password'] ) ? (string) wp_unslash( $_POST['new_password'] ) : '';
	if ( ! $email || ! is_email( $email ) ) {
		wp_send_json_error( array( 'message' => __( 'Enter a valid email address.', 'amz-prints' ) ), 400 );
	}
	if ( strlen( $code ) !== 6 ) {
		wp_send_json_error( array( 'message' => __( 'Enter the 6-digit verification code.', 'amz-prints' ) ), 400 );
	}
	if ( strlen( $password ) < 6 ) {
		wp_send_json_error( array( 'message' => __( 'Password must be at least 6 characters.', 'amz-prints' ) ), 400 );
	}
	$key  = 'amz_pwreset_' . md5( strtolower( $email ) );
	$data = get_transient( $key );
	if ( ! is_array( $data ) || empty( $data['code'] ) ) {
		wp_send_json_error( array( 'message' => __( 'Code expired. Request a new verification code.', 'amz-prints' ) ), 400 );
	}
	$tries = isset( $data['tries'] ) ? (int) $data['tries'] : 0;
	if ( $tries >= 5 ) {
		delete_transient( $key );
		wp_send_json_error( array( 'message' => __( 'Too many attempts. Request a new code.', 'amz-prints' ) ), 400 );
	}
	if ( ! hash_equals( (string) $data['code'], (string) $code ) ) {
		$data['tries'] = $tries + 1;
		set_transient( $key, $data, 15 * MINUTE_IN_SECONDS );
		wp_send_json_error( array( 'message' => __( 'Incorrect verification code.', 'amz-prints' ) ), 400 );
	}

	$result = amz_prints_customer_api(
		'/public/customer/reset-password',
		array(
			'email'       => strtolower( $email ),
			'newPassword' => $password,
			'portalKey'   => amz_prints_customer_portal_key(),
			'resetVerified' => true,
		)
	);
	if ( is_wp_error( $result ) ) {
		$local = amz_prints_local_customer_get( $email );
		$msg   = $result->get_error_message();
		if ( $local && ( 'Not found' === $msg || false !== stripos( $msg, 'not found' ) ) ) {
			amz_prints_local_customer_save( $email, array_merge( $local, array(
				'password' => wp_hash_password( $password ),
				'verified' => true,
			) ) );
			$token = amz_prints_local_issue_token( $email );
			amz_prints_customer_set_token( $token );
			amz_prints_remember_portal_session( $token, array(
				'name'  => (string) ( $local['name'] ?? '' ),
				'email' => $email,
				'phone' => (string) ( $local['phone'] ?? '' ),
			) );
			delete_transient( $key );
			$redirect = isset( $_POST['redirect'] ) ? esc_url_raw( wp_unslash( $_POST['redirect'] ) ) : '';
			$redirect = $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();
			wp_send_json_success( array(
				'message'  => __( 'Password updated. You are signed in.', 'amz-prints' ),
				'redirect' => $redirect,
			) );
		}
		wp_send_json_error( array( 'message' => $msg ), 400 );
	}
	delete_transient( $key );
	if ( ! empty( $result['token'] ) ) {
		amz_prints_customer_set_token( $result['token'] );
	}
	$redirect = isset( $_POST['redirect'] ) ? esc_url_raw( wp_unslash( $_POST['redirect'] ) ) : '';
	$redirect = $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();
	wp_send_json_success( array(
		'message'  => __( 'Password updated.', 'amz-prints' ),
		'redirect' => $redirect,
	) );
}
add_action( 'wp_ajax_amz_prints_customer_reset_confirm', 'amz_prints_ajax_customer_reset_confirm' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_reset_confirm', 'amz_prints_ajax_customer_reset_confirm' );

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
