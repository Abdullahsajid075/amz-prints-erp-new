<?php
/**
 * Customer portal — email login, Google verify reset, read-only account.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const AMZ_PRINTS_CUSTOMER_COOKIE = 'amz_cust';

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

function amz_prints_customer_cookie_paths() {
	$paths = array( '/', (string) COOKIEPATH, (string) SITECOOKIEPATH );
	return array_values( array_unique( array_filter( $paths ) ) );
}

function amz_prints_customer_expire_cookie( $name ) {
	foreach ( amz_prints_customer_cookie_paths() as $path ) {
		setcookie( $name, '', array(
			'expires'  => time() - HOUR_IN_SECONDS,
			'path'     => $path,
			'secure'   => is_ssl(),
			'httponly' => true,
			'samesite' => 'Lax',
		) );
	}
	unset( $_COOKIE[ $name ] );
}

function amz_prints_customer_set_token( $token ) {
	$token = (string) $token;
	amz_prints_customer_expire_cookie( 'amz_customer_token' );
	$expire = time() + WEEK_IN_SECONDS;
	setcookie( AMZ_PRINTS_CUSTOMER_COOKIE, $token, array(
		'expires'  => $expire,
		'path'     => '/',
		'secure'   => is_ssl(),
		'httponly' => true,
		'samesite' => 'Lax',
	) );
	$_COOKIE[ AMZ_PRINTS_CUSTOMER_COOKIE ] = $token;
}

function amz_prints_customer_clear_token() {
	amz_prints_customer_expire_cookie( AMZ_PRINTS_CUSTOMER_COOKIE );
	amz_prints_customer_expire_cookie( 'amz_customer_token' );
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

function amz_prints_customer_signup_url( $redirect = '' ) {
	$url = home_url( '/customer-signup/' );
	if ( $redirect ) {
		$url = add_query_arg( 'redirect', rawurlencode( $redirect ), $url );
	}
	return $url;
}

function amz_prints_customer_profile_url() {
	return home_url( '/my-account/#profile' );
}

function amz_prints_customer_normalize_phone( $phone ) {
	$phone = preg_replace( '/[\s\-().]/', '', trim( (string) $phone ) );
	if ( 0 === strpos( $phone, '00' ) ) {
		$phone = '+' . substr( $phone, 2 );
	}
	return $phone;
}

function amz_prints_customer_phone_error( $phone ) {
	$phone = amz_prints_customer_normalize_phone( $phone );
	if ( ! preg_match( '/^\+[1-9]\d{7,14}$/', $phone ) ) {
		return __( 'Enter a mobile number with country code, for example +923001234567.', 'amz-prints' );
	}
	return '';
}

function amz_prints_customer_address_error( $address ) {
	$address = trim( preg_replace( '/\s+/', ' ', (string) $address ) );
	if ( strlen( $address ) < 8 ) {
		return __( 'Enter a complete delivery address (street, area, and city).', 'amz-prints' );
	}
	return '';
}

/**
 * Name, email, country-code phone, and delivery address.
 *
 * @return array|WP_Error
 */
function amz_prints_customer_validate_identity( $name, $email, $phone, $address, $require_address = true ) {
	$name    = trim( (string) $name );
	$email   = strtolower( sanitize_email( (string) $email ) );
	$phone   = amz_prints_customer_normalize_phone( $phone );
	$address = trim( (string) $address );
	if ( strlen( $name ) < 2 ) {
		return new WP_Error( 'amz_name', __( 'Enter your full name.', 'amz-prints' ) );
	}
	if ( ! is_email( $email ) || ! preg_match( '/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email ) ) {
		return new WP_Error( 'amz_email', __( 'Enter a correct email address.', 'amz-prints' ) );
	}
	$phone_error = amz_prints_customer_phone_error( $phone );
	if ( $phone_error ) {
		return new WP_Error( 'amz_phone', $phone_error );
	}
	if ( $require_address ) {
		$address_error = amz_prints_customer_address_error( $address );
		if ( $address_error ) {
			return new WP_Error( 'amz_address', $address_error );
		}
	}
	return array(
		'name'    => $name,
		'email'   => $email,
		'phone'   => $phone,
		'address' => $address,
	);
}

function amz_prints_customer_profile_is_complete( $customer = null ) {
	if ( ! is_array( $customer ) ) {
		$token = amz_prints_customer_token();
		$local = $token ? amz_prints_local_session_customer( $token ) : null;
		$customer = ( is_array( $local ) && ! empty( $local['customer'] ) ) ? $local['customer'] : array();
	}
	$checked = amz_prints_customer_validate_identity(
		$customer['name'] ?? '',
		$customer['email'] ?? '',
		$customer['phone'] ?? '',
		$customer['address'] ?? '',
		true
	);
	return ! is_wp_error( $checked );
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
		return new WP_Error( 'amz_google_aud', __( 'Google sign-in could not be verified. Try again.', 'amz-prints' ) );
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
function amz_prints_customer_sign_in_local( $email, $profile, $password = '', $erp_token = '' ) {
	$email   = strtolower( trim( (string) $email ) );
	$profile = is_array( $profile ) ? $profile : array();
	$row     = amz_prints_local_customer_get( $email );
	$row     = is_array( $row ) ? $row : array();
	$typed_name = trim( (string) ( $profile['name'] ?? '' ) );
	if ( $typed_name ) {
		$row['name'] = $typed_name;
	} elseif ( empty( $row['name'] ) ) {
		$row['name'] = '';
	}
	$row['email']    = $email;
	$typed_phone = trim( (string) ( $profile['phone'] ?? '' ) );
	if ( $typed_phone ) {
		$row['phone'] = $typed_phone;
	}
	if ( isset( $profile['address'] ) && '' !== trim( (string) $profile['address'] ) ) {
		$row['address'] = (string) $profile['address'];
	}
	$row['verified'] = true;
	if ( strlen( (string) $password ) >= 6 ) {
		$row['password'] = wp_hash_password( $password );
	}
	if ( $erp_token ) {
		$row['erp_token'] = (string) $erp_token;
	}
	amz_prints_local_customer_save( $email, $row );
	$token = amz_prints_local_issue_token( $email );
	amz_prints_customer_set_token( $token );
	amz_prints_remember_portal_session( $token, array(
		'name'    => $row['name'],
		'email'   => $email,
		'phone'   => (string) ( $row['phone'] ?? '' ),
		'address' => (string) ( $row['address'] ?? '' ),
	) );
	return $token;
}

function amz_prints_customer_matching_erp_token( $email, $result ) {
	if ( is_wp_error( $result ) || empty( $result['token'] ) || ! is_array( $result['customer'] ?? null ) ) {
		return '';
	}
	$api_email = strtolower( trim( (string) ( $result['customer']['email'] ?? '' ) ) );
	if ( ! $api_email || $api_email !== strtolower( trim( (string) $email ) ) ) {
		return '';
	}
	return (string) $result['token'];
}

function amz_prints_customer_erp_token() {
	$token = amz_prints_customer_token();
	$local = amz_prints_local_session_customer( $token );
	$email = strtolower( (string) ( $local['customer']['email'] ?? '' ) );
	$row   = $email ? amz_prints_local_customer_get( $email ) : null;
	if ( is_array( $row ) && ! empty( $row['erp_token'] ) ) {
		return (string) $row['erp_token'];
	}
	return ( 0 === strpos( (string) $token, 'amzlocal.' ) ) ? '' : (string) $token;
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
		'customer' => amz_prints_customer_card_fields( $customer ),
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

function amz_prints_store_customer_order( $email, $order ) {
	$email = strtolower( trim( (string) $email ) );
	if ( ! $email || ! is_array( $order ) ) {
		return;
	}
	$all = get_option( 'amz_prints_customer_orders', array() );
	if ( ! is_array( $all ) ) {
		$all = array();
	}
	if ( empty( $all[ $email ] ) || ! is_array( $all[ $email ] ) ) {
		$all[ $email ] = array();
	}
	$all[ $email ][] = $order;
	update_option( 'amz_prints_customer_orders', $all, false );
}

function amz_prints_customer_orders_for( $email ) {
	$email = strtolower( trim( (string) $email ) );
	$all   = get_option( 'amz_prints_customer_orders', array() );
	$rows  = ( $email && is_array( $all ) && isset( $all[ $email ] ) && is_array( $all[ $email ] ) ) ? $all[ $email ] : array();
	return array_reverse( $rows );
}

function amz_prints_customer_fetch_session() {
	$token = amz_prints_customer_token();
	if ( ! $token || 0 !== strpos( (string) $token, 'amzlocal.' ) ) {
		if ( $token ) {
			amz_prints_customer_clear_token();
		}
		return new WP_Error( 'amz_customer_auth', __( 'Please log in.', 'amz-prints' ) );
	}
	$local = amz_prints_local_session_customer( $token );
	if ( ! $local ) {
		amz_prints_customer_clear_token();
		return new WP_Error( 'amz_customer_auth', __( 'Please log in again.', 'amz-prints' ) );
	}
	$email = strtolower( trim( (string) ( $local['customer']['email'] ?? '' ) ) );
	$row   = $email ? amz_prints_local_customer_get( $email ) : null;
	if ( ! is_array( $row ) || strtolower( trim( (string) ( $row['email'] ?? '' ) ) ) !== $email ) {
		amz_prints_customer_clear_token();
		return new WP_Error( 'amz_customer_auth', __( 'Please log in again.', 'amz-prints' ) );
	}
	$local['customer'] = amz_prints_customer_card_fields( $row );
	$local['orders']                 = amz_prints_customer_orders_for( $email );
	$local['invoices']               = array();
	$local['ledger']                 = array(
		'totalBilled'  => 0,
		'totalPaid'    => 0,
		'outstanding'  => 0,
		'payments'     => array(),
	);
	$local['pendingPayments']        = array();

	$erp = (string) ( $row['erp_token'] ?? '' );
	if ( $erp ) {
		$remote = amz_prints_customer_api( '/public/customer/session', array( 'token' => $erp ) );
		if ( ! is_wp_error( $remote ) && is_array( $remote ) ) {
			$remote_email = strtolower( trim( (string) ( $remote['customer']['email'] ?? '' ) ) );
			if ( $remote_email === $email ) {
				$remote_orders = isset( $remote['orders'] ) && is_array( $remote['orders'] ) ? $remote['orders'] : array();
				$local['orders'] = array_merge( $local['orders'], $remote_orders );
				if ( ! empty( $remote['invoices'] ) && is_array( $remote['invoices'] ) ) {
					$local['invoices'] = $remote['invoices'];
				}
				if ( ! empty( $remote['ledger'] ) && is_array( $remote['ledger'] ) ) {
					$local['ledger'] = $remote['ledger'];
				}
				if ( ! empty( $remote['pendingPayments'] ) && is_array( $remote['pendingPayments'] ) ) {
					$local['pendingPayments'] = $remote['pendingPayments'];
				}
				if ( ! empty( $remote['discounts'] ) ) {
					$local['discounts'] = $remote['discounts'];
				}
			}
		}
	}
	return $local;
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
	$local = amz_prints_local_customer_get( $email );
	if ( $local && ! empty( $local['verified'] ) && ! empty( $local['password'] ) ) {
		wp_send_json_success( array(
			'exists'      => true,
			'hasPassword' => true,
		) );
	}
	$result = amz_prints_customer_api( '/public/customer/lookup', array( 'email' => $email ) );
	if ( is_wp_error( $result ) ) {
		wp_send_json_success( array(
			'exists'      => false,
			'hasPassword' => false,
		) );
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
	$identity = amz_prints_customer_validate_identity( $name, $email, $phone, $address, true );
	if ( is_wp_error( $identity ) ) {
		wp_send_json_error( array( 'message' => $identity->get_error_message() ), 400 );
	}
	$name    = $identity['name'];
	$email   = $identity['email'];
	$phone   = $identity['phone'];
	$address = $identity['address'];

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
				amz_prints_customer_sign_in_local( $email, array( 'name' => $name, 'phone' => $phone, 'address' => $address ), $password, amz_prints_customer_matching_erp_token( $email, $login ) );
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

	amz_prints_customer_sign_in_local(
		$email,
		array( 'name' => $name, 'phone' => $phone, 'address' => $address ),
		$password,
		amz_prints_customer_matching_erp_token( $email, $result )
	);
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
	$email    = isset( $_POST['email'] ) ? strtolower( sanitize_email( wp_unslash( $_POST['email'] ) ) ) : '';
	$password = isset( $_POST['password'] ) ? (string) wp_unslash( $_POST['password'] ) : '';
	if ( ! is_email( $email ) ) {
		wp_send_json_error( array( 'message' => __( 'Enter a correct email address.', 'amz-prints' ) ), 400 );
	}

	$redirect = isset( $_POST['redirect'] ) ? esc_url_raw( wp_unslash( $_POST['redirect'] ) ) : '';
	$redirect = $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();

	$local = amz_prints_local_customer_get( $email );
	if ( $local && ! empty( $local['password'] ) && wp_check_password( $password, $local['password'] ) ) {
		amz_prints_customer_sign_in_local(
			$email,
			array(
				'name'    => (string) ( $local['name'] ?? '' ),
				'phone'   => (string) ( $local['phone'] ?? '' ),
				'address' => (string) ( $local['address'] ?? '' ),
			)
		);
		wp_send_json_success( array(
			'redirect' => $redirect,
			'customer' => array(
				'name'    => (string) ( $local['name'] ?? '' ),
				'email'   => $email,
				'phone'   => (string) ( $local['phone'] ?? '' ),
				'address' => (string) ( $local['address'] ?? '' ),
			),
		) );
	}

	$result = amz_prints_customer_api( '/public/customer/login', array(
		'email'    => $email,
		'password' => $password,
	) );
	if ( is_wp_error( $result ) ) {
		$err  = $result->get_error_message();
		$code = '';
		if ( false !== stripos( $err, 'please sign up' ) || false !== stripos( $err, 'no customer account' ) || false !== stripos( $err, 'not registered online' ) || 'Not found' === $err || false !== stripos( $err, 'not found' ) ) {
			$code = 'need_signup';
			$err  = __( 'No account for this email. Create an account with your name, email, mobile number, and delivery address.', 'amz-prints' );
		} elseif ( false !== stripos( $err, 'invalid email' ) || false !== stripos( $err, 'invalid password' ) || false !== stripos( $err, 'invalid credential' ) ) {
			$err = __( 'That email and password do not match. Use the password from Sign up.', 'amz-prints' );
		}
		wp_send_json_error( array( 'message' => $err, 'code' => $code ), 400 );
	}
	if ( empty( $result['token'] ) ) {
		wp_send_json_error( array( 'message' => __( 'Login failed.', 'amz-prints' ) ), 400 );
	}
	$cust      = isset( $result['customer'] ) && is_array( $result['customer'] ) ? $result['customer'] : array();
	$api_email = strtolower( trim( (string) ( $cust['email'] ?? '' ) ) );
	if ( $api_email !== $email ) {
		wp_send_json_error( array(
			'message' => __( 'This login did not match your email. Create your own account and sign in with that email.', 'amz-prints' ),
			'code'    => 'need_signup',
		), 400 );
	}
	$profile = array(
		'name'    => (string) ( $local['name'] ?? '' ),
		'phone'   => (string) ( $local['phone'] ?? '' ),
		'address' => (string) ( $local['address'] ?? '' ),
	);
	if ( '' === trim( $profile['name'] ) ) {
		$profile['name'] = (string) ( $cust['name'] ?? '' );
	}
	if ( '' === trim( $profile['phone'] ) ) {
		$profile['phone'] = (string) ( $cust['phone'] ?? '' );
	}
	if ( '' === trim( $profile['address'] ) ) {
		$profile['address'] = (string) ( $cust['address'] ?? '' );
	}
	amz_prints_customer_sign_in_local( $email, $profile, $password, amz_prints_customer_matching_erp_token( $email, $result ) );
	wp_send_json_success( array(
		'customer' => array(
			'name'    => $profile['name'],
			'email'   => $email,
			'phone'   => $profile['phone'],
			'address' => $profile['address'],
		),
		'redirect' => $redirect,
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

	$phone = isset( $_POST['phone'] ) ? amz_prints_customer_normalize_phone( sanitize_text_field( wp_unslash( $_POST['phone'] ) ) ) : '';
	if ( $phone && amz_prints_customer_phone_error( $phone ) ) {
		wp_send_json_error( array( 'message' => amz_prints_customer_phone_error( $phone ) ), 400 );
	}
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
			amz_prints_customer_sign_in_local( $google['email'], array( 'name' => $gname, 'phone' => $phone ), $pass, amz_prints_customer_matching_erp_token( $google['email'], $made ) );
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
	amz_prints_customer_sign_in_local( $google['email'], array( 'name' => $gname, 'phone' => $phone ), $pass, amz_prints_customer_matching_erp_token( $google['email'], $result ) );
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
		$reset_customer = isset( $result['customer'] ) && is_array( $result['customer'] ) ? $result['customer'] : array();
		$saved_local    = amz_prints_local_customer_get( $email );
		$saved_local    = is_array( $saved_local ) ? $saved_local : array();
		amz_prints_customer_sign_in_local( $email, array(
			'name'    => (string) ( $saved_local['name'] ?? '' ) !== '' ? (string) $saved_local['name'] : (string) ( $reset_customer['name'] ?? '' ),
			'phone'   => (string) ( $saved_local['phone'] ?? '' ) !== '' ? (string) $saved_local['phone'] : (string) ( $reset_customer['phone'] ?? '' ),
			'address' => (string) ( $saved_local['address'] ?? '' ),
		), $password, amz_prints_customer_matching_erp_token( $email, $result ) );
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
 * AJAX: public order tracking. No account required.
 */
function amz_prints_ajax_customer_track() {
	check_ajax_referer( 'amz_prints_customer', 'nonce' );
	$code   = isset( $_POST['code'] ) ? sanitize_text_field( wp_unslash( $_POST['code'] ) ) : '';
	$result = function_exists( 'amz_prints_public_track' ) ? amz_prints_public_track( $code ) : new WP_Error( 'amz_track', __( 'Tracking is not available right now.', 'amz-prints' ) );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( array( 'message' => $result->get_error_message() ), 400 );
	}
	$products = array();
	foreach ( (array) ( $result['products'] ?? array() ) as $name ) {
		$name = trim( (string) $name );
		if ( $name ) {
			$products[] = array( 'name' => $name );
		}
	}
	wp_send_json_success( array(
		'orderId'         => (string) ( $result['order_id'] ?? '' ),
		'trackingNumber'  => (string) ( $result['tracking_number'] ?? '' ),
		'status'          => (string) ( $result['status'] ?? '' ),
		'customerName'    => (string) ( $result['customer'] ?? '' ),
		'products'        => $products,
		'timeline'        => isset( $result['timeline'] ) && is_array( $result['timeline'] ) ? $result['timeline'] : array(),
	) );
}

/**
 * Fields shown on the account form and loyalty card.
 *
 * @param array $row Saved customer row.
 * @return array
 */
function amz_prints_customer_card_fields( $row ) {
	$row   = is_array( $row ) ? $row : array();
	$email = strtolower( trim( (string) ( $row['email'] ?? '' ) ) );
	return array(
		'name'       => (string) ( $row['name'] ?? '' ),
		'email'      => $email,
		'phone'      => (string) ( $row['phone'] ?? '' ),
		'address'    => (string) ( $row['address'] ?? '' ),
		'street'     => (string) ( $row['street'] ?? '' ),
		'area'       => (string) ( $row['area'] ?? '' ),
		'city'       => (string) ( $row['city'] ?? '' ),
		'postal'     => (string) ( $row['postal'] ?? '' ),
		'landmark'   => (string) ( $row['landmark'] ?? '' ),
		'photo'      => (string) ( $row['photo'] ?? '' ),
		'cardNumber' => 'AMZ-' . strtoupper( substr( md5( $email ), 0, 6 ) ),
	);
}

/**
 * Delivered online spend for the loyalty card.
 *
 * @param array $orders Orders for this email.
 * @return float
 */
function amz_prints_loyalty_delivered_total( $orders ) {
	$total = 0.0;
	if ( ! is_array( $orders ) ) {
		return 0.0;
	}
	foreach ( $orders as $order ) {
		if ( ! is_array( $order ) ) {
			continue;
		}
		$status = strtolower( trim( (string) ( $order['status'] ?? '' ) ) );
		if ( '' === $status || false !== strpos( $status, 'out for' ) || false !== strpos( $status, 'undeliver' ) ) {
			continue;
		}
		if ( ! preg_match( '/\bdelivered\b/', $status ) ) {
			continue;
		}
		$amount = $order['totalAmount'] ?? ( $order['total'] ?? 0 );
		$total += (float) $amount;
	}
	return $total;
}

/**
 * Code 39 bars for the loyalty card number.
 *
 * @param string $text Card number.
 * @return string HTML
 */
function amz_prints_barcode_markup( $text ) {
	$patterns = array(
		'0' => 'nnnwwnwnn', '1' => 'wnnwnnnnw', '2' => 'nnwwnnnnw', '3' => 'wnwwnnnnn',
		'4' => 'nnnwwnnnw', '5' => 'wnnwwnnnn', '6' => 'nnwwwnnnn', '7' => 'nnnwnnwnw',
		'8' => 'wnnwnnwnn', '9' => 'nnwwnnwnn', 'A' => 'wnnnnwnnw', 'B' => 'nnwnnwnnw',
		'C' => 'wnwnnwnnn', 'D' => 'nnnnwwnnw', 'E' => 'wnnnwwnnn', 'F' => 'nnwnwwnnn',
		'G' => 'nnnnnwwnw', 'H' => 'wnnnnwwnn', 'I' => 'nnwnnwwnn', 'J' => 'nnnnwwwnn',
		'K' => 'wnnnnnnww', 'L' => 'nnwnnnnww', 'M' => 'wnwnnnnwn', 'N' => 'nnnnwnnww',
		'O' => 'wnnnwnnwn', 'P' => 'nnwnwnnwn', 'Q' => 'nnnnnnwww', 'R' => 'wnnnnnwwn',
		'S' => 'nnwnnnwwn', 'T' => 'nnnnwnwwn', 'U' => 'wwnnnnnnw', 'V' => 'nwwnnnnnw',
		'W' => 'wwwnnnnnn', 'X' => 'nwnnwnnnw', 'Y' => 'wwnnwnnnn', 'Z' => 'nwwnwnnnn',
		'-' => 'nwnnnnwnw', '.' => 'wwnnnnwnn', ' ' => 'nwwnnnwnn', '*' => 'nwnnwnwnn',
	);
	$text = strtoupper( preg_replace( '/[^0-9A-Z\-.]/', '', (string) $text ) );
	if ( '' === $text ) {
		$text = 'AMZ';
	}
	$encoded = '*' . $text . '*';
	$html    = '<div class="loyalty-barcode" aria-hidden="true">';
	$length  = strlen( $encoded );
	for ( $i = 0; $i < $length; $i++ ) {
		$char = $encoded[ $i ];
		if ( ! isset( $patterns[ $char ] ) ) {
			continue;
		}
		$seq   = $patterns[ $char ];
		$isbar = true;
		$seq_n = strlen( $seq );
		for ( $k = 0; $k < $seq_n; $k++ ) {
			$wide = ( 'w' === $seq[ $k ] );
			$w    = $wide ? 4 : 2;
			$html .= $isbar
				? '<i style="width:' . $w . 'px"></i>'
				: '<b style="width:' . $w . 'px"></b>';
			$isbar = ! $isbar;
		}
		$html .= '<b style="width:2px"></b>';
	}
	$html .= '</div>';
	return $html;
}

/**
 * Store a customer profile photo in the uploads folder.
 *
 * @return string|WP_Error URL, empty string when no file, or error.
 */
function amz_prints_customer_store_photo() {
	if ( empty( $_FILES['photo']['name'] ) ) {
		return '';
	}
	$file = $_FILES['photo'];
	if ( UPLOAD_ERR_NO_FILE === (int) ( $file['error'] ?? UPLOAD_ERR_NO_FILE ) ) {
		return '';
	}
	if ( ! empty( $file['error'] ) ) {
		return new WP_Error( 'amz_photo', __( 'Could not upload the profile picture. Use a JPG or PNG under 2 MB.', 'amz-prints' ) );
	}
	if ( (int) ( $file['size'] ?? 0 ) > 2 * 1024 * 1024 ) {
		return new WP_Error( 'amz_photo', __( 'Profile picture must be under 2 MB.', 'amz-prints' ) );
	}
	$check   = wp_check_filetype_and_ext( $file['tmp_name'], $file['name'] );
	$allowed = array( 'jpg', 'jpeg', 'png', 'webp' );
	if ( empty( $check['ext'] ) || ! in_array( strtolower( (string) $check['ext'] ), $allowed, true ) ) {
		return new WP_Error( 'amz_photo', __( 'Use a JPG, PNG, or WebP picture.', 'amz-prints' ) );
	}
	require_once ABSPATH . 'wp-admin/includes/file.php';
	$upload = wp_handle_upload(
		$file,
		array(
			'test_form' => false,
			'mimes'     => array(
				'jpg|jpeg|jpe' => 'image/jpeg',
				'png'          => 'image/png',
				'webp'         => 'image/webp',
			),
		)
	);
	if ( ! empty( $upload['error'] ) ) {
		return new WP_Error( 'amz_photo', __( 'Could not upload the profile picture. Try a smaller JPG or PNG.', 'amz-prints' ) );
	}
	return (string) ( $upload['url'] ?? '' );
}

/**
 * AJAX: save this customer's full profile. Works for website customers, not only WP admins.
 */
function amz_prints_ajax_customer_profile() {
	check_ajax_referer( 'amz_prints_customer', 'nonce' );
	$token = amz_prints_customer_token();
	$local = $token ? amz_prints_local_session_customer( $token ) : null;
	if ( ! is_array( $local ) || empty( $local['customer']['email'] ) ) {
		wp_send_json_error( array( 'message' => __( 'Please log in again, then save your profile.', 'amz-prints' ) ), 401 );
	}
	$email    = strtolower( trim( (string) $local['customer']['email'] ) );
	$name     = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	$phone    = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '';
	$street   = isset( $_POST['street'] ) ? sanitize_text_field( wp_unslash( $_POST['street'] ) ) : '';
	$area     = isset( $_POST['area'] ) ? sanitize_text_field( wp_unslash( $_POST['area'] ) ) : '';
	$city     = isset( $_POST['city'] ) ? sanitize_text_field( wp_unslash( $_POST['city'] ) ) : '';
	$postal   = isset( $_POST['postal'] ) ? sanitize_text_field( wp_unslash( $_POST['postal'] ) ) : '';
	$landmark = isset( $_POST['landmark'] ) ? sanitize_text_field( wp_unslash( $_POST['landmark'] ) ) : '';
	if ( strlen( $street ) < 3 || strlen( $area ) < 2 || strlen( $city ) < 2 ) {
		wp_send_json_error( array( 'message' => __( 'Enter your street, area, and city so the delivery address is complete.', 'amz-prints' ) ), 400 );
	}
	$address  = implode( ', ', array_filter( array( $street, $area, $city, $postal, $landmark ) ) );
	$identity = amz_prints_customer_validate_identity( $name, $email, $phone, $address, true );
	if ( is_wp_error( $identity ) ) {
		wp_send_json_error( array( 'message' => $identity->get_error_message() ), 400 );
	}
	$photo = amz_prints_customer_store_photo();
	if ( is_wp_error( $photo ) ) {
		wp_send_json_error( array( 'message' => $photo->get_error_message() ), 400 );
	}
	$row = amz_prints_local_customer_get( $email );
	$row = is_array( $row ) ? $row : array();
	$row['name']     = $identity['name'];
	$row['email']    = $email;
	$row['phone']    = $identity['phone'];
	$row['street']   = $street;
	$row['area']     = $area;
	$row['city']     = $city;
	$row['postal']   = $postal;
	$row['landmark'] = $landmark;
	$row['address']  = $address;
	$row['verified'] = true;
	if ( $photo ) {
		$row['photo'] = $photo;
	}
	amz_prints_local_customer_save( $email, $row );
	amz_prints_remember_portal_session( $token, amz_prints_customer_card_fields( $row ) );
	wp_send_json_success( array(
		'message'  => __( 'Profile saved for this account.', 'amz-prints' ),
		'customer' => amz_prints_customer_card_fields( $row ),
	) );
}
add_action( 'wp_ajax_amz_prints_customer_profile', 'amz_prints_ajax_customer_profile' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_profile', 'amz_prints_ajax_customer_profile' );
add_action( 'wp_ajax_amz_prints_customer_track', 'amz_prints_ajax_customer_track' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_track', 'amz_prints_ajax_customer_track' );
