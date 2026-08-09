<?php
/**
 * Shared ERP API helpers — products catalog + CRM leads.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'AMZ_PRINTS_ERP_API_DEFAULT' ) ) {
	define(
		'AMZ_PRINTS_ERP_API_DEFAULT',
		'https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec'
	);
}

if ( ! function_exists( 'amz_prints_erp_api_url' ) ) {
	/**
	 * ERP API base URL (Customizer override supported).
	 */
	function amz_prints_erp_api_url() {
		$url = trim( (string) amz_prints_mod( 'amz_erp_api_url', AMZ_PRINTS_ERP_API_DEFAULT ) );
		return $url ? $url : AMZ_PRINTS_ERP_API_DEFAULT;
	}
}

/**
 * Decode ERP JSON payload (list or object).
 *
 * @param string $raw Response body.
 * @param int    $code HTTP status.
 * @return array|WP_Error
 */
function amz_prints_erp_decode_response( $raw, $code = 200 ) {
	$data = json_decode( (string) $raw, true );
	if ( ! is_array( $data ) ) {
		$preview = trim( wp_strip_all_tags( (string) $raw ) );
		$preview = $preview ? substr( $preview, 0, 120 ) : '';
		return new WP_Error(
			'amz_erp_bad_response',
			$preview
				? sprintf( __( 'Unexpected ERP response: %s', 'amz-prints' ), $preview )
				: __( 'Unexpected response from ERP API.', 'amz-prints' )
		);
	}

	// Object error payloads include _status; bare product lists do not.
	$app_status = ( isset( $data['_status'] ) && ! isset( $data[0] ) ) ? (int) $data['_status'] : (int) $code;
	if ( $app_status >= 400 ) {
		$msg = ! empty( $data['message'] )
			? sanitize_text_field( $data['message'] )
			: __( 'ERP request failed.', 'amz-prints' );
		return new WP_Error( 'amz_erp_http_' . $app_status, $msg, array( 'status' => $app_status ) );
	}

	return $data;
}

/**
 * Low-level ERP request (GAS / Hostinger style: ?path=...).
 *
 * Apps Script returns 302 → googleusercontent echo URL for POST.
 * WordPress must NOT auto-convert that to GET-with-body-loss; we follow manually.
 *
 * @param string     $method GET|POST|PUT|PATCH|DELETE
 * @param string     $path   API path starting with /
 * @param array|null $body   JSON body for non-GET
 * @return array|WP_Error
 */
function amz_prints_erp_request( $method, $path, $body = null ) {
	$method = strtoupper( (string) $method );
	$path   = '/' . ltrim( (string) $path, '/' );
	$api    = amz_prints_erp_api_url();
	$url    = add_query_arg( 'path', $path, $api );

	$http_method = $method;
	if ( ! in_array( $http_method, array( 'GET', 'POST' ), true ) ) {
		$url         = add_query_arg( '_method', $http_method, $url );
		$http_method = 'POST';
	}

	$args = array(
		'timeout'     => 30,
		'redirection' => 0, // handle GAS 302 ourselves
		'headers'     => array(
			'Accept'       => 'application/json',
			'Content-Type' => 'text/plain;charset=utf-8',
		),
	);

	if ( null !== $body && 'POST' === $http_method ) {
		$args['body'] = wp_json_encode( $body );
	}

	$response = ( 'GET' === $http_method )
		? wp_remote_get( $url, $args )
		: wp_remote_post( $url, $args );

	if ( is_wp_error( $response ) ) {
		return $response;
	}

	$code = (int) wp_remote_retrieve_response_code( $response );
	$raw  = wp_remote_retrieve_body( $response );

	// GAS web app: POST/GET often 302 to script.googleusercontent.com/macros/echo?...
	if ( in_array( $code, array( 301, 302, 303, 307, 308 ), true ) ) {
		$location = wp_remote_retrieve_header( $response, 'location' );
		if ( ! $location ) {
			return new WP_Error( 'amz_erp_redirect', __( 'ERP API redirected without a Location header.', 'amz-prints' ) );
		}
		$follow = wp_remote_get(
			$location,
			array(
				'timeout'     => 30,
				'redirection' => 3,
				'headers'     => array( 'Accept' => 'application/json' ),
			)
		);
		if ( is_wp_error( $follow ) ) {
			return $follow;
		}
		$code = (int) wp_remote_retrieve_response_code( $follow );
		$raw  = wp_remote_retrieve_body( $follow );
	}

	return amz_prints_erp_decode_response( $raw, $code );
}

/**
 * Live active products from ERP (cached ~5 minutes).
 *
 * @param bool $force_refresh Bypass transient.
 * @return array List of product arrays (empty on failure).
 */
function amz_prints_erp_get_products( $force_refresh = false ) {
	$cache_key = 'amz_prints_erp_products_v1';
	if ( ! $force_refresh ) {
		$cached = get_transient( $cache_key );
		if ( is_array( $cached ) ) {
			return $cached;
		}
	}

	$data = amz_prints_erp_request( 'GET', '/public/products' );
	if ( is_wp_error( $data ) ) {
		return array();
	}

	// Payload may be a bare list or { products: [...] }
	$list = array();
	if ( isset( $data['products'] ) && is_array( $data['products'] ) ) {
		$list = $data['products'];
	} elseif ( array_keys( $data ) === range( 0, count( $data ) - 1 ) ) {
		$list = $data;
	} elseif ( is_array( $data ) ) {
		// Associative single? ignore. Prefer numeric list only.
		$looks_list = true;
		foreach ( $data as $item ) {
			if ( ! is_array( $item ) ) {
				$looks_list = false;
				break;
			}
		}
		if ( $looks_list ) {
			$list = array_values( $data );
		}
	}

	$products = array();
	foreach ( $list as $row ) {
		if ( ! is_array( $row ) ) {
			continue;
		}
		$name = trim( (string) ( $row['name'] ?? '' ) );
		if ( ! $name ) {
			continue;
		}
		$price = isset( $row['basePrice'] ) ? (float) $row['basePrice'] : ( isset( $row['rate'] ) ? (float) $row['rate'] : 0 );
		$primary = (string) ( $row['image'] ?? $row['photo'] ?? '' );
		$images  = array();
		if ( ! empty( $row['images'] ) && is_array( $row['images'] ) ) {
			$images = array_values( array_filter( array_map( 'strval', $row['images'] ) ) );
		}
		if ( $primary && ! in_array( $primary, $images, true ) ) {
			array_unshift( $images, $primary );
		}
		$variations = array();
		if ( ! empty( $row['variations'] ) && is_array( $row['variations'] ) ) {
			foreach ( $row['variations'] as $v ) {
				if ( ! is_array( $v ) || empty( $v['name'] ) ) {
					continue;
				}
				$variations[] = array(
					'id'    => (string) ( $v['id'] ?? '' ),
					'name'  => (string) $v['name'],
					'price' => isset( $v['price'] ) && $v['price'] !== null && $v['price'] !== '' ? (float) $v['price'] : null,
					'sku'   => (string) ( $v['sku'] ?? '' ),
				);
			}
		}
		$products[] = array(
			'id'              => (string) ( $row['id'] ?? '' ),
			'name'            => $name,
			'category'        => (string) ( $row['category'] ?? '' ),
			'productType'     => (string) ( $row['productType'] ?? 'Product' ),
			'basePrice'       => $price,
			'unit'            => (string) ( $row['unit'] ?? 'per piece' ),
			'description'     => (string) ( $row['description'] ?? '' ),
			'fullDescription' => (string) ( $row['fullDescription'] ?? '' ),
			'material'        => (string) ( $row['material'] ?? '' ),
			'size'            => (string) ( $row['size'] ?? '' ),
			'minQuantity'     => isset( $row['minQuantity'] ) ? (float) $row['minQuantity'] : 1,
			'image'           => $primary ?: ( $images[0] ?? '' ),
			'images'          => $images,
			'variations'      => $variations,
			'showOnWebsite'   => ! empty( $row['showOnWebsite'] ) || ! array_key_exists( 'showOnWebsite', $row ),
		);
	}

	set_transient( $cache_key, $products, 5 * MINUTE_IN_SECONDS );
	return $products;
}

/**
 * Format ERP price for display.
 *
 * @param array $product Product row.
 * @return string
 */
function amz_prints_erp_product_price_label( $product ) {
	$price = isset( $product['basePrice'] ) ? (float) $product['basePrice'] : 0;
	$unit  = ! empty( $product['unit'] ) ? $product['unit'] : '';
	if ( $price <= 0 ) {
		return __( 'Get a quote', 'amz-prints' );
	}
	$formatted = 'From Rs. ' . number_format_i18n( $price, $price == floor( $price ) ? 0 : 2 );
	return $unit ? ( $formatted . ' / ' . $unit ) : $formatted;
}

/**
 * Create / update CRM lead via ERP public API.
 *
 * @param array $payload Lead fields.
 * @return array|WP_Error
 */
function amz_prints_erp_create_lead( $payload ) {
	$payload = is_array( $payload ) ? $payload : array();
	$name    = trim( (string) ( $payload['name'] ?? '' ) );
	$phone   = trim( (string) ( $payload['phone'] ?? '' ) );
	$email   = trim( (string) ( $payload['email'] ?? '' ) );

	if ( ! $name ) {
		return new WP_Error( 'amz_lead_name', __( 'Name is required.', 'amz-prints' ) );
	}
	if ( ! $phone && ! $email ) {
		return new WP_Error( 'amz_lead_contact', __( 'Phone or email is required.', 'amz-prints' ) );
	}

	$body = array(
		'name'      => $name,
		'phone'     => $phone,
		'email'     => $email,
		'company'   => trim( (string) ( $payload['company'] ?? '' ) ),
		'product'   => trim( (string) ( $payload['product'] ?? $payload['service'] ?? '' ) ),
		'quantity'  => trim( (string) ( $payload['quantity'] ?? '' ) ),
		'neededBy'  => trim( (string) ( $payload['neededBy'] ?? $payload['needed_by'] ?? '' ) ),
		'details'   => trim( (string) ( $payload['details'] ?? $payload['message'] ?? '' ) ),
		'source'    => trim( (string) ( $payload['source'] ?? 'website' ) ),
	);

	return amz_prints_erp_request( 'POST', '/public/lead', $body );
}

/**
 * AJAX: submit website lead to ERP CRM (then JS opens WhatsApp).
 */
function amz_prints_ajax_submit_lead() {
	check_ajax_referer( 'amz_prints_lead', 'nonce' );

	$payload = array(
		'name'      => isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '',
		'phone'     => isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '',
		'email'     => isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '',
		'company'   => isset( $_POST['company'] ) ? sanitize_text_field( wp_unslash( $_POST['company'] ) ) : '',
		'product'   => isset( $_POST['product'] ) ? sanitize_text_field( wp_unslash( $_POST['product'] ) ) : '',
		'quantity'  => isset( $_POST['quantity'] ) ? sanitize_text_field( wp_unslash( $_POST['quantity'] ) ) : '',
		'neededBy'  => isset( $_POST['needed_by'] ) ? sanitize_text_field( wp_unslash( $_POST['needed_by'] ) ) : '',
		'details'   => isset( $_POST['details'] ) ? sanitize_textarea_field( wp_unslash( $_POST['details'] ) ) : '',
		'source'    => isset( $_POST['source'] ) ? sanitize_text_field( wp_unslash( $_POST['source'] ) ) : 'website-quote',
	);

	if ( empty( $payload['details'] ) && ! empty( $_POST['message'] ) ) {
		$payload['details'] = sanitize_textarea_field( wp_unslash( $_POST['message'] ) );
	}

	$result = amz_prints_erp_create_lead( $payload );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error(
			array( 'message' => $result->get_error_message() ),
			400
		);
	}

	wp_send_json_success(
		array(
			'ok'         => ! empty( $result['ok'] ),
			'customerId' => isset( $result['customerId'] ) ? $result['customerId'] : '',
			'stage'      => isset( $result['stage'] ) ? $result['stage'] : 'lead',
		)
	);
}
add_action( 'wp_ajax_amz_prints_submit_lead', 'amz_prints_ajax_submit_lead' );
add_action( 'wp_ajax_nopriv_amz_prints_submit_lead', 'amz_prints_ajax_submit_lead' );
