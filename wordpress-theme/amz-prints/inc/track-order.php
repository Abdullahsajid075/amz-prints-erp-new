<?php
/**
 * Live order tracking via AMZ ERP public API
 * (same data as https://erp.amzprints.com/track)
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Supabase-backed ERP API used by erp.amzprints.com */
define(
	'AMZ_PRINTS_ERP_API_DEFAULT',
	'https://amz-prints-api.vercel.app'
);

/**
 * ERP API base URL (Customizer override supported).
 */
function amz_prints_erp_api_url() {
	$url = trim( (string) amz_prints_mod( 'amz_erp_api_url', AMZ_PRINTS_ERP_API_DEFAULT ) );
	return $url ? $url : AMZ_PRINTS_ERP_API_DEFAULT;
}

/**
 * Public track page on ERP (for deep links).
 */
function amz_prints_erp_track_page_url( $code = '' ) {
	$base = trim( (string) amz_prints_mod( 'amz_erp_track_url', 'https://erp.amzprints.com/track' ) );
	$base = untrailingslashit( $base ? $base : 'https://erp.amzprints.com/track' );
	$code = trim( (string) $code );
	return $code ? $base . '/' . rawurlencode( $code ) : $base;
}

/**
 * Call ERP GET /public/track/{code}
 *
 * @param string $code Order ID or tracking number.
 * @return array|WP_Error Decoded payload or error.
 */
function amz_prints_erp_fetch_track( $code ) {
	$code = trim( (string) $code );
	if ( '' === $code ) {
		return new WP_Error( 'amz_track_empty', __( 'Enter your Order ID or Tracking Number.', 'amz-prints' ) );
	}

	$api  = amz_prints_erp_api_url();
	$path = '/public/track/' . rawurlencode( $code );
	$url  = add_query_arg( 'path', $path, $api );

	$response = wp_remote_get(
		$url,
		array(
			'timeout' => 25,
			'headers' => array(
				'Accept' => 'application/json',
			),
		)
	);

	if ( is_wp_error( $response ) ) {
		return new WP_Error(
			'amz_track_network',
			__( 'Unable to reach the order tracking service. Please try again shortly.', 'amz-prints' )
		);
	}

	$status = (int) wp_remote_retrieve_response_code( $response );
	$body   = wp_remote_retrieve_body( $response );
	$data   = json_decode( $body, true );

	if ( ! is_array( $data ) ) {
		return new WP_Error(
			'amz_track_bad_response',
			__( 'Unexpected response from tracking service.', 'amz-prints' )
		);
	}

	$app_status = isset( $data['_status'] ) ? (int) $data['_status'] : $status;
	if ( $app_status >= 400 || ! empty( $data['message'] ) && empty( $data['status'] ) && empty( $data['orderId'] ) ) {
		$msg = ! empty( $data['message'] )
			? sanitize_text_field( $data['message'] )
			: __( 'Order not found. Check your Order ID / Tracking Number.', 'amz-prints' );
		return new WP_Error( 'amz_track_not_found', $msg );
	}

	if ( empty( $data['orderId'] ) && empty( $data['trackingNumber'] ) && empty( $data['status'] ) ) {
		return new WP_Error(
			'amz_track_not_found',
			__( 'Order not found. Check your Order ID / Tracking Number.', 'amz-prints' )
		);
	}

	return $data;
}

/**
 * Map ERP public track payload → theme track card.
 *
 * @param array $data ERP JSON.
 * @return array
 */
function amz_prints_map_erp_track( $data ) {
	$products = array();
	if ( ! empty( $data['products'] ) && is_array( $data['products'] ) ) {
		foreach ( $data['products'] as $p ) {
			$name = is_array( $p ) ? trim( (string) ( $p['name'] ?? '' ) ) : trim( (string) $p );
			if ( $name ) {
				$products[] = $name;
			}
		}
	}

	$timeline = array();
	$status_index = 0;
	if ( ! empty( $data['timeline'] ) && is_array( $data['timeline'] ) ) {
		foreach ( $data['timeline'] as $i => $step ) {
			$label   = is_array( $step ) ? (string) ( $step['status'] ?? '' ) : (string) $step;
			$done    = is_array( $step ) ? ! empty( $step['done'] ) : false;
			$current = is_array( $step ) ? ! empty( $step['current'] ) : false;
			if ( ! $label ) {
				continue;
			}
			$timeline[] = array(
				'status'  => $label,
				'done'    => $done,
				'current' => $current,
			);
			if ( $current ) {
				$status_index = count( $timeline ) - 1;
			} elseif ( $done ) {
				$status_index = count( $timeline ) - 1;
			}
		}
	}

	$order_id = (string) ( $data['orderId'] ?? '' );
	$track_no = (string) ( $data['trackingNumber'] ?? $data['trackCode'] ?? $order_id );
	$display  = $order_id ? $order_id : $track_no;
	$status   = (string) ( $data['status'] ?? '' );
	if ( function_exists( 'amz_prints_customer_status_label' ) ) {
		$status = amz_prints_customer_status_label( $status );
	}
	$cancelled = ! empty( $data['cancelled'] );
	if ( ! $cancelled && function_exists( 'amz_prints_order_is_cancelled' ) ) {
		$cancelled = amz_prints_order_is_cancelled( $status );
	}

	$mapped = array(
		'order_id'         => $display,
		'tracking_number'  => $track_no,
		'customer'         => (string) ( $data['customerName'] ?? '' ),
		'status'           => $status,
		'status_index'     => (int) $status_index,
		'updated'          => '',
		'items'            => $products ? implode( ', ', $products ) : __( 'Print job', 'amz-prints' ),
		'products'         => $products,
		'timeline'         => $timeline,
		'cancelled'        => $cancelled,
		'message'          => (string) ( $data['companyNote'] ?? '' ),
		'erp_track_url'    => amz_prints_erp_track_page_url( $data['trackCode'] ?? $track_no ),
		'payment_status'   => (string) ( $data['paymentStatus'] ?? '' ),
		'payment_method'   => (string) ( $data['paymentMethod'] ?? '' ),
		'total_amount'     => isset( $data['totalAmount'] ) ? (float) $data['totalAmount'] : null,
		'balance_amount'   => isset( $data['balanceAmount'] ) ? (float) $data['balanceAmount'] : null,
		'demo'             => false,
		'source'           => 'erp',
	);
	return amz_prints_track_apply_status( $mapped );
}

/**
 * Make the timeline show the live stage, including Cancelled and stages outside the default pipeline.
 *
 * @param array $mapped Track card.
 * @return array
 */
function amz_prints_track_apply_status( $mapped ) {
	$status = trim( (string) ( $mapped['status'] ?? '' ) );
	if ( function_exists( 'amz_prints_customer_status_label' ) && '' !== $status ) {
		$status = amz_prints_customer_status_label( $status );
		$mapped['status'] = $status;
	}
	$cancelled = ! empty( $mapped['cancelled'] );
	if ( ! $cancelled && function_exists( 'amz_prints_order_is_cancelled' ) ) {
		$cancelled = amz_prints_order_is_cancelled( $status );
	}
	$mapped['cancelled'] = $cancelled;
	if ( $cancelled ) {
		$mapped['balance_amount'] = 0;
	}
	$timeline = isset( $mapped['timeline'] ) && is_array( $mapped['timeline'] ) ? $mapped['timeline'] : array();
	$found    = false;
	foreach ( $timeline as $i => $step ) {
		if ( ! is_array( $step ) ) {
			continue;
		}
		$label = (string) ( $step['status'] ?? '' );
		$match = ( '' !== $status && 0 === strcasecmp( $label, $status ) );
		if ( '' !== $status && ! $match ) {
			$timeline[ $i ]['current'] = false;
		}
		if ( $cancelled ) {
			$timeline[ $i ]['done']    = false;
			$timeline[ $i ]['current'] = false;
		} elseif ( $match ) {
			$timeline[ $i ]['current'] = true;
			$timeline[ $i ]['done']    = true;
			$found = true;
		}
	}
	if ( '' !== $status && ! $found ) {
		$timeline[] = array(
			'status'  => $status,
			'done'    => true,
			'current' => true,
		);
	}
	$mapped['timeline'] = $timeline;
	return $mapped;
}

/**
 * Read one ERP order by id. Tracking numbers stay on the public track route.
 *
 * @param string $code Order ID.
 * @return array|null
 */
function amz_prints_erp_fetch_order_by_code( $code ) {
	$code = trim( (string) $code );
	if ( '' === $code || ! function_exists( 'amz_prints_erp_staff_token' ) || ! function_exists( 'amz_prints_erp_request' ) ) {
		return null;
	}
	$token = amz_prints_erp_staff_token();
	if ( '' === $token ) {
		return null;
	}
	$data = amz_prints_erp_request( 'GET', '/orders/' . rawurlencode( $code ), null, $token );
	if ( is_wp_error( $data ) ) {
		$msg  = $data->get_error_message();
		$meta = $data->get_error_data();
		$http = is_array( $meta ) && isset( $meta['status'] ) ? (int) $meta['status'] : 0;
		if ( 401 === $http || false !== stripos( $msg, 'unauthorized' ) || false !== stripos( $msg, 'invalid token' ) ) {
			delete_transient( 'amz_erp_staff_token' );
		}
		return null;
	}
	if ( ! is_array( $data ) || ( empty( $data['orderId'] ) && empty( $data['status'] ) ) ) {
		return null;
	}
	$doc = strtolower( trim( (string) ( $data['docType'] ?? 'order' ) ) );
	if ( 'quotation' === $doc || 'pos' === $doc ) {
		return null;
	}
	return $data;
}

/**
 * Copy money fields from a full ERP order onto a track card.
 *
 * @param array $mapped Track card.
 * @param array $order  ERP order.
 * @return array
 */
function amz_prints_track_overlay_order( $mapped, $order ) {
	$status = (string) ( $order['status'] ?? '' );
	if ( function_exists( 'amz_prints_customer_status_label' ) ) {
		$status = amz_prints_customer_status_label( $status );
	}
	if ( '' !== $status ) {
		$mapped['status'] = $status;
	}
	$mapped['cancelled'] = function_exists( 'amz_prints_order_is_cancelled' ) && amz_prints_order_is_cancelled( $mapped['status'] ?? '' );
	if ( ! empty( $order['paymentStatus'] ) ) {
		$mapped['payment_status'] = (string) $order['paymentStatus'];
	}
	if ( ! empty( $order['paymentMethod'] ) ) {
		$mapped['payment_method'] = (string) $order['paymentMethod'];
	}
	if ( isset( $order['totalAmount'] ) ) {
		$mapped['total_amount'] = (float) $order['totalAmount'];
	}
	if ( isset( $order['balanceAmount'] ) ) {
		$mapped['balance_amount'] = (float) $order['balanceAmount'];
	}
	if ( empty( $mapped['products'] ) && ! empty( $order['products'] ) && is_array( $order['products'] ) ) {
		$names = array();
		foreach ( $order['products'] as $product ) {
			$name = is_array( $product ) ? trim( (string) ( $product['name'] ?? '' ) ) : trim( (string) $product );
			if ( '' !== $name ) {
				$names[] = $name;
			}
		}
		if ( $names ) {
			$mapped['products'] = $names;
			$mapped['items']    = implode( ', ', $names );
		}
	}
	return amz_prints_track_apply_status( $mapped );
}

/**
 * Save the live status onto the website copy of this order.
 *
 * @param string $code   Code the customer searched.
 * @param array  $mapped Track card.
 */
function amz_prints_touch_local_order_status( $code, $mapped ) {
	$needles = array( strtolower( trim( (string) $code ) ) );
	foreach ( array( 'order_id', 'tracking_number' ) as $key ) {
		$value = strtolower( trim( (string) ( $mapped[ $key ] ?? '' ) ) );
		if ( '' !== $value ) {
			$needles[] = $value;
		}
	}
	$needles = array_values( array_unique( array_filter( $needles ) ) );
	if ( ! $needles ) {
		return;
	}
	$all = get_option( 'amz_prints_customer_orders', array() );
	if ( ! is_array( $all ) ) {
		return;
	}
	$changed = false;
	foreach ( $all as $email => $orders ) {
		if ( ! is_array( $orders ) ) {
			continue;
		}
		foreach ( $orders as $index => $order ) {
			if ( ! is_array( $order ) ) {
				continue;
			}
			$keys = array();
			foreach ( array( 'orderId', 'trackingNumber', 'id' ) as $key ) {
				$value = strtolower( trim( (string) ( $order[ $key ] ?? '' ) ) );
				if ( '' !== $value ) {
					$keys[] = $value;
				}
			}
			if ( ! array_intersect( $needles, $keys ) ) {
				continue;
			}
			if ( ! empty( $mapped['status'] ) ) {
				$all[ $email ][ $index ]['status'] = (string) $mapped['status'];
			}
			if ( isset( $mapped['balance_amount'] ) && null !== $mapped['balance_amount'] ) {
				$all[ $email ][ $index ]['balanceAmount'] = (float) $mapped['balance_amount'];
			}
			if ( isset( $mapped['total_amount'] ) && null !== $mapped['total_amount'] && (float) $mapped['total_amount'] > 0 ) {
				$all[ $email ][ $index ]['totalAmount'] = (float) $mapped['total_amount'];
			}
			if ( ! empty( $mapped['payment_status'] ) ) {
				$all[ $email ][ $index ]['paymentStatus'] = (string) $mapped['payment_status'];
			}
			$all[ $email ][ $index ]['erpSynced'] = 1;
			$changed = true;
		}
	}
	if ( $changed ) {
		update_option( 'amz_prints_customer_orders', $all, false );
	}
}

/**
 * Hook: live ERP lookup for Track Order page.
 *
 * @param mixed  $result Existing result.
 * @param string $order_id Order ID / tracking from form.
 * @param string $phone    Optional phone (used as fallback search code).
 * @return array|WP_Error|null
 */
function amz_prints_track_order_from_erp( $result, $order_id, $phone = '' ) {
	if ( null !== $result ) {
		return $result;
	}

	$code = trim( (string) $order_id );
	if ( '' === $code ) {
		$code = trim( (string) $phone );
	}
	if ( '' === $code ) {
		return new WP_Error( 'amz_track_empty', __( 'Enter your Order ID or Tracking Number.', 'amz-prints' ) );
	}

	$raw = amz_prints_erp_fetch_track( $code );
	if ( is_wp_error( $raw ) ) {
		return $raw;
	}

	return amz_prints_map_erp_track( $raw );
}
add_filter( 'amz_prints_track_order', 'amz_prints_track_order_from_erp', 10, 3 );

/**
 * Find a website order by id. Does not require an account.
 *
 * @param string $code Order ID or tracking number.
 * @return array|null
 */
function amz_prints_find_local_public_order( $code ) {
	$code = strtolower( trim( (string) $code ) );
	if ( '' === $code ) {
		return null;
	}
	$all = get_option( 'amz_prints_customer_orders', array() );
	if ( ! is_array( $all ) ) {
		return null;
	}
	foreach ( $all as $orders ) {
		if ( ! is_array( $orders ) ) {
			continue;
		}
		foreach ( $orders as $order ) {
			if ( ! is_array( $order ) ) {
				continue;
			}
			$keys = array( $order['orderId'] ?? '', $order['trackingNumber'] ?? '', $order['id'] ?? '' );
			foreach ( $keys as $key ) {
				if ( $key && strtolower( trim( (string) $key ) ) === $code ) {
					return $order;
				}
			}
		}
	}
	return null;
}

/**
 * Public tracking for a code. Website orders first, then the ERP track API.
 *
 * @param string $code Order ID or tracking number.
 * @return array|WP_Error
 */
function amz_prints_public_track( $code ) {
	$code = trim( (string) $code );
	if ( '' === $code ) {
		return new WP_Error( 'amz_track_empty', __( 'Enter your Order ID or Tracking Number.', 'amz-prints' ) );
	}
	$mapped = null;
	$raw    = amz_prints_erp_fetch_track( $code );
	if ( ! is_wp_error( $raw ) ) {
		$mapped = amz_prints_map_erp_track( $raw );
	}
	$staff = amz_prints_erp_fetch_order_by_code( $code );
	if ( is_array( $staff ) ) {
		if ( ! is_array( $mapped ) ) {
			$mapped = amz_prints_map_erp_track( $staff );
		}
		$mapped = amz_prints_track_overlay_order( $mapped, $staff );
	}
	if ( is_array( $mapped ) ) {
		amz_prints_touch_local_order_status( $code, $mapped );
		return $mapped;
	}

	$local = amz_prints_find_local_public_order( $code );
	if ( $local ) {
		$items = $local['items'] ?? $local['products'] ?? array();
		$names = array();
		if ( is_array( $items ) ) {
			foreach ( $items as $item ) {
				$name = is_array( $item ) ? (string) ( $item['name'] ?? '' ) : (string) $item;
				if ( trim( $name ) ) {
					$names[] = trim( $name );
				}
			}
		} elseif ( is_string( $items ) && trim( $items ) ) {
			$names[] = trim( $items );
		}
		$order_id = (string) ( $local['orderId'] ?? $local['trackingNumber'] ?? $code );
		$status   = (string) ( $local['status'] ?? 'Order Received' );
		if ( function_exists( 'amz_prints_customer_status_label' ) ) {
			$status = amz_prints_customer_status_label( $status );
		}
		$cancelled = function_exists( 'amz_prints_order_is_cancelled' ) && amz_prints_order_is_cancelled( $status );
		return amz_prints_track_apply_status( array(
			'order_id'        => $order_id,
			'tracking_number' => (string) ( $local['trackingNumber'] ?? $order_id ),
			'customer'        => (string) ( $local['name'] ?? '' ),
			'status'          => $status,
			'status_index'    => 0,
			'updated'         => (string) ( $local['date'] ?? '' ),
			'items'           => $names ? implode( ', ', $names ) : __( 'Print job', 'amz-prints' ),
			'products'        => $names,
			'timeline'        => array(),
			'cancelled'       => $cancelled,
			'payment_status'  => (string) ( $local['paymentStatus'] ?? '' ),
			'payment_method'  => (string) ( $local['paymentMethod'] ?? '' ),
			'total_amount'    => isset( $local['totalAmount'] ) ? (float) $local['totalAmount'] : null,
			'balance_amount'  => $cancelled ? 0 : ( isset( $local['balanceAmount'] ) ? (float) $local['balanceAmount'] : null ),
			'message'         => '',
			'demo'            => false,
			'source'          => 'website',
		) );
	}
	if ( is_wp_error( $raw ) ) {
		return $raw;
	}
	return new WP_Error(
		'amz_track_not_found',
		__( 'Order not found. Check your Order ID / Tracking Number.', 'amz-prints' )
	);
}
