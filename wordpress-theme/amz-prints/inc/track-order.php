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

	return array(
		'order_id'         => $display,
		'tracking_number'  => $track_no,
		'customer'         => (string) ( $data['customerName'] ?? '' ),
		'status'           => (string) ( $data['status'] ?? '' ),
		'status_index'     => (int) $status_index,
		'updated'          => '',
		'items'            => $products ? implode( ', ', $products ) : __( 'Print job', 'amz-prints' ),
		'products'         => $products,
		'timeline'         => $timeline,
		'cancelled'        => ! empty( $data['cancelled'] ),
		'message'          => (string) ( $data['companyNote'] ?? '' ),
		'erp_track_url'    => amz_prints_erp_track_page_url( $data['trackCode'] ?? $track_no ),
		'demo'             => false,
		'source'           => 'erp',
	);
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
	$local = amz_prints_find_local_public_order( $code );
	if ( $local ) {
		$items = $local['items'] ?? array();
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
		return array(
			'order_id'        => $order_id,
			'tracking_number' => (string) ( $local['trackingNumber'] ?? $order_id ),
			'customer'        => (string) ( $local['name'] ?? '' ),
			'status'          => $status,
			'status_index'    => 0,
			'updated'         => (string) ( $local['date'] ?? '' ),
			'items'           => $names ? implode( ', ', $names ) : __( 'Print job', 'amz-prints' ),
			'products'        => $names,
			'timeline'        => array(
				array(
					'status'  => $status,
					'done'    => true,
					'current' => true,
				),
			),
			'cancelled'       => false,
			'message'         => '',
			'demo'            => false,
			'source'          => 'website',
		);
	}
	$raw = amz_prints_erp_fetch_track( $code );
	if ( is_wp_error( $raw ) ) {
		return $raw;
	}
	return amz_prints_map_erp_track( $raw );
}
