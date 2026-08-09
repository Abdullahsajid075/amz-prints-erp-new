<?php
/**
 * Website shop — cart helpers, customer auth AJAX, order placement via ERP.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Safe product image src (supports ERP data-URLs).
 *
 * @param string $src Image URL or data URI.
 * @return string
 */
function amz_prints_product_image_src( $src ) {
	$src = trim( (string) $src );
	if ( ! $src ) {
		return '';
	}
	if ( 0 === strpos( $src, 'data:image/' ) ) {
		return $src;
	}
	return esc_url( $src );
}

/**
 * Product detail URL for ERP product.
 *
 * @param array $product Product row.
 * @return string
 */
function amz_prints_product_url( $product ) {
	$id = isset( $product['id'] ) ? $product['id'] : '';
	return add_query_arg( 'id', rawurlencode( (string) $id ), home_url( '/product/' ) );
}

/**
 * Single ERP product by id.
 *
 * @param string $id Product id.
 * @return array|null
 */
function amz_prints_erp_get_product( $id ) {
	$id = trim( (string) $id );
	if ( ! $id ) {
		return null;
	}
	$data = amz_prints_erp_request( 'GET', '/public/products/' . rawurlencode( $id ) );
	if ( is_wp_error( $data ) || ! is_array( $data ) ) {
		// Fallback: search cached list
		foreach ( amz_prints_erp_get_products() as $row ) {
			if ( (string) $row['id'] === $id ) {
				return $row;
			}
		}
		return null;
	}
	$name = trim( (string) ( $data['name'] ?? '' ) );
	if ( ! $name ) {
		return null;
	}
	$price  = isset( $data['basePrice'] ) ? (float) $data['basePrice'] : ( isset( $data['rate'] ) ? (float) $data['rate'] : 0 );
	$images = array();
	if ( ! empty( $data['images'] ) && is_array( $data['images'] ) ) {
		$images = array_values( array_filter( array_map( 'strval', $data['images'] ) ) );
	}
	$primary = (string) ( $data['image'] ?? $data['photo'] ?? '' );
	if ( $primary && ! in_array( $primary, $images, true ) ) {
		array_unshift( $images, $primary );
	}
	return array(
		'id'          => (string) ( $data['id'] ?? $id ),
		'name'        => $name,
		'category'    => (string) ( $data['category'] ?? '' ),
		'productType' => (string) ( $data['productType'] ?? 'Product' ),
		'basePrice'   => $price,
		'unit'        => (string) ( $data['unit'] ?? 'per piece' ),
		'description' => (string) ( $data['description'] ?? '' ),
		'material'    => (string) ( $data['material'] ?? '' ),
		'size'        => (string) ( $data['size'] ?? '' ),
		'minQuantity' => isset( $data['minQuantity'] ) ? (float) $data['minQuantity'] : 1,
		'image'       => $primary ?: ( $images[0] ?? '' ),
		'images'      => $images,
	);
}

/**
 * Should promo popup show on current page?
 */
function amz_prints_popup_should_show() {
	if ( ! amz_prints_mod( 'amz_popup_enabled', false ) ) {
		return false;
	}
	if ( ! absint( amz_prints_mod( 'amz_popup_image', 0 ) ) ) {
		return false;
	}
	$pages = strtolower( trim( (string) amz_prints_mod( 'amz_popup_pages', 'home' ) ) );
	$tokens = array_filter( array_map( 'trim', explode( ',', $pages ) ) );
	if ( in_array( 'all', $tokens, true ) ) {
		return true;
	}
	if ( ( is_front_page() || is_home() ) && ( in_array( 'home', $tokens, true ) || empty( $tokens ) ) ) {
		return true;
	}
	if ( is_page( 'products' ) && in_array( 'products', $tokens, true ) ) {
		return true;
	}
	if ( is_page( 'services' ) && in_array( 'services', $tokens, true ) ) {
		return true;
	}
	foreach ( $tokens as $slug ) {
		if ( $slug && is_page( $slug ) ) {
			return true;
		}
	}
	return false;
}

/**
 * ERP request with optional customer portal token in body.
 *
 * @param string     $method Method.
 * @param string     $path   Path.
 * @param array|null $body   Body.
 * @param string     $token  Customer token.
 * @return array|WP_Error
 */
function amz_prints_erp_customer_request( $method, $path, $body = null, $token = '' ) {
	$body = is_array( $body ) ? $body : array();
	if ( $token ) {
		$body['token'] = $token;
	}
	return amz_prints_erp_request( $method, $path, $body );
}

/**
 * AJAX: customer register
 */
function amz_prints_ajax_customer_register() {
	check_ajax_referer( 'amz_prints_shop', 'nonce' );
	$result = amz_prints_erp_request(
		'POST',
		'/public/customer/register',
		array(
			'name'     => isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '',
			'phone'    => isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '',
			'email'    => isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '',
			'password' => isset( $_POST['password'] ) ? (string) wp_unslash( $_POST['password'] ) : '',
			'address'  => isset( $_POST['address'] ) ? sanitize_textarea_field( wp_unslash( $_POST['address'] ) ) : '',
		)
	);
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( array( 'message' => $result->get_error_message() ), 400 );
	}
	wp_send_json_success( $result );
}
add_action( 'wp_ajax_amz_prints_customer_register', 'amz_prints_ajax_customer_register' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_register', 'amz_prints_ajax_customer_register' );

/**
 * AJAX: customer login
 */
function amz_prints_ajax_customer_login() {
	check_ajax_referer( 'amz_prints_shop', 'nonce' );
	$result = amz_prints_erp_request(
		'POST',
		'/public/customer/login',
		array(
			'email'    => isset( $_POST['email'] ) ? sanitize_text_field( wp_unslash( $_POST['email'] ) ) : '',
			'password' => isset( $_POST['password'] ) ? (string) wp_unslash( $_POST['password'] ) : '',
		)
	);
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( array( 'message' => $result->get_error_message() ), 400 );
	}
	wp_send_json_success( $result );
}
add_action( 'wp_ajax_amz_prints_customer_login', 'amz_prints_ajax_customer_login' );
add_action( 'wp_ajax_nopriv_amz_prints_customer_login', 'amz_prints_ajax_customer_login' );

/**
 * AJAX: place order (requires customer token)
 */
function amz_prints_ajax_place_order() {
	check_ajax_referer( 'amz_prints_shop', 'nonce' );

	$token = isset( $_POST['token'] ) ? sanitize_text_field( wp_unslash( $_POST['token'] ) ) : '';
	if ( ! $token ) {
		wp_send_json_error( array( 'message' => __( 'Please login before placing an order.', 'amz-prints' ) ), 401 );
	}

	$items_raw = isset( $_POST['items'] ) ? wp_unslash( $_POST['items'] ) : '[]';
	$items     = json_decode( $items_raw, true );
	if ( ! is_array( $items ) || empty( $items ) ) {
		wp_send_json_error( array( 'message' => __( 'Your cart is empty.', 'amz-prints' ) ), 400 );
	}

	$accept = ! empty( $_POST['accept_policy'] ) && '1' === (string) $_POST['accept_policy'];
	if ( ! $accept ) {
		wp_send_json_error( array( 'message' => __( 'Please accept the Order Processing Policy.', 'amz-prints' ) ), 400 );
	}

	$body = array(
		'token'            => $token,
		'products'         => $items,
		'paymentMethod'    => isset( $_POST['payment_method'] ) ? sanitize_text_field( wp_unslash( $_POST['payment_method'] ) ) : 'Cash on Delivery',
		'discount'         => isset( $_POST['discount'] ) ? floatval( $_POST['discount'] ) : 0,
		'deliveryCharges'  => isset( $_POST['delivery_charges'] ) ? floatval( $_POST['delivery_charges'] ) : floatval( amz_prints_mod( 'amz_delivery_charges', 0 ) ),
		'customerAddress'  => isset( $_POST['address'] ) ? sanitize_textarea_field( wp_unslash( $_POST['address'] ) ) : '',
		'deliveryAddress'  => isset( $_POST['address'] ) ? sanitize_textarea_field( wp_unslash( $_POST['address'] ) ) : '',
		'notes'            => isset( $_POST['notes'] ) ? sanitize_textarea_field( wp_unslash( $_POST['notes'] ) ) : '',
		'acceptPolicy'     => true,
		'policyAccepted'   => true,
	);

	$result = amz_prints_erp_request( 'POST', '/public/orders', $body );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( array( 'message' => $result->get_error_message() ), 400 );
	}
	wp_send_json_success( $result );
}
add_action( 'wp_ajax_amz_prints_place_order', 'amz_prints_ajax_place_order' );
add_action( 'wp_ajax_nopriv_amz_prints_place_order', 'amz_prints_ajax_place_order' );
