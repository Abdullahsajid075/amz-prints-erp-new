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
 * Low-level ERP request (GAS / Hostinger style: ?path=...).
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
		'timeout' => 25,
		'headers' => array(
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
	$data = json_decode( $raw, true );

	if ( ! is_array( $data ) ) {
		return new WP_Error( 'amz_erp_bad_response', __( 'Unexpected response from ERP API.', 'amz-prints' ) );
	}

	// Object error payloads include _status; bare product lists do not.
	$app_status = ( isset( $data['_status'] ) && ! isset( $data[0] ) ) ? (int) $data['_status'] : $code;
	if ( $app_status >= 400 ) {
		$msg = ! empty( $data['message'] )
			? sanitize_text_field( $data['message'] )
			: __( 'ERP request failed.', 'amz-prints' );
		return new WP_Error( 'amz_erp_http_' . $app_status, $msg, array( 'status' => $app_status ) );
	}

	return $data;
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
		$products[] = array(
			'id'           => (string) ( $row['id'] ?? '' ),
			'name'         => $name,
			'category'     => (string) ( $row['category'] ?? '' ),
			'productType'  => (string) ( $row['productType'] ?? 'Product' ),
			'basePrice'    => $price,
			'unit'         => (string) ( $row['unit'] ?? 'per piece' ),
			'description'  => (string) ( $row['description'] ?? '' ),
			'material'     => (string) ( $row['material'] ?? '' ),
			'size'         => (string) ( $row['size'] ?? '' ),
			'minQuantity'  => isset( $row['minQuantity'] ) ? (float) $row['minQuantity'] : 1,
			'image'        => (string) ( $row['image'] ?? $row['photo'] ?? '' ),
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

/**
 * Submit a completed CV to the ERP (stored in ERP "CV Submissions" section).
 *
 * @param array $payload CV fields.
 * @return array|WP_Error
 */
function amz_prints_erp_submit_cv( $payload ) {
	$payload = is_array( $payload ) ? $payload : array();
	$name    = trim( (string) ( $payload['fullName'] ?? '' ) );
	if ( ! $name ) {
		return new WP_Error( 'amz_cv_name', __( 'Full name is required.', 'amz-prints' ) );
	}

	$clean_rows = function ( $rows, $keys ) {
		$out = array();
		if ( ! is_array( $rows ) ) {
			return $out;
		}
		foreach ( $rows as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$clean = array();
			$has   = false;
			foreach ( $keys as $k ) {
				$val       = sanitize_text_field( (string) ( $row[ $k ] ?? '' ) );
				$clean[ $k ] = $val;
				if ( $val ) {
					$has = true;
				}
			}
			if ( $has ) {
				$out[] = $clean;
			}
		}
		return $out;
	};

	$skills = array();
	if ( ! empty( $payload['skills'] ) && is_array( $payload['skills'] ) ) {
		foreach ( $payload['skills'] as $s ) {
			$s = sanitize_text_field( (string) $s );
			if ( $s ) {
				$skills[] = $s;
			}
		}
	}
	$languages = array();
	if ( ! empty( $payload['languages'] ) && is_array( $payload['languages'] ) ) {
		foreach ( $payload['languages'] as $s ) {
			$s = sanitize_text_field( (string) $s );
			if ( $s ) {
				$languages[] = $s;
			}
		}
	}

	// Photo: accept a data URL (base64) only, capped to keep payload sane.
	$photo = (string) ( $payload['photo'] ?? '' );
	if ( $photo && ! preg_match( '#^data:image/[a-zA-Z0-9.+-]+;base64,#', $photo ) ) {
		$photo = '';
	}
	if ( strlen( $photo ) > 3500000 ) {
		$photo = '';
	}

	$body = array(
		'fullName'    => $name,
		'headline'    => sanitize_text_field( (string) ( $payload['headline'] ?? '' ) ),
		'email'       => sanitize_email( (string) ( $payload['email'] ?? '' ) ),
		'phone'       => sanitize_text_field( (string) ( $payload['phone'] ?? '' ) ),
		'city'        => sanitize_text_field( (string) ( $payload['city'] ?? '' ) ),
		'summary'     => sanitize_textarea_field( (string) ( $payload['summary'] ?? '' ) ),
		'photo'       => $photo,
		'template'    => sanitize_text_field( (string) ( $payload['template'] ?? 'classic' ) ),
		'accentColor' => sanitize_hex_color( (string) ( $payload['accentColor'] ?? '#F26522' ) ) ?: '#F26522',
		'experience'  => $clean_rows( $payload['experience'] ?? array(), array( 'role', 'company', 'period', 'details' ) ),
		'education'   => $clean_rows( $payload['education'] ?? array(), array( 'degree', 'school', 'year' ) ),
		'skills'      => $skills,
		'languages'   => $languages,
		'status'      => 'Completed',
		'source'      => 'website-free-cv',
		'wpUser'      => is_user_logged_in() ? wp_get_current_user()->user_login : '',
	);

	return amz_prints_erp_request( 'POST', '/public/cv', $body );
}

/**
 * AJAX: submit completed CV to ERP (login required).
 */
function amz_prints_ajax_submit_cv() {
	check_ajax_referer( 'amz_prints_cv', 'nonce' );

	if ( ! is_user_logged_in() ) {
		wp_send_json_error( array( 'message' => __( 'Please log in to submit your CV.', 'amz-prints' ) ), 401 );
	}

	$raw = isset( $_POST['cv'] ) ? wp_unslash( $_POST['cv'] ) : '';
	$data = json_decode( (string) $raw, true );
	if ( ! is_array( $data ) ) {
		wp_send_json_error( array( 'message' => __( 'Invalid CV data.', 'amz-prints' ) ), 400 );
	}

	$result = amz_prints_erp_submit_cv( $data );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( array( 'message' => $result->get_error_message() ), 400 );
	}

	wp_send_json_success( array(
		'ok'   => ! empty( $result['ok'] ),
		'cvId' => isset( $result['cvId'] ) ? $result['cvId'] : '',
		'id'   => isset( $result['id'] ) ? $result['id'] : '',
	) );
}
add_action( 'wp_ajax_amz_prints_submit_cv', 'amz_prints_ajax_submit_cv' );
