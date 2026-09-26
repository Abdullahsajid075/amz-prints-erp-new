<?php
/**
 * Website e-commerce — cart, checkout, ERP order placement.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const AMZ_PRINTS_CART_COOKIE = 'amz_cart_v1';

/**
 * Safe product image src (supports https and data:image from ERP).
 *
 * @param string $src Raw image.
 * @return string
 */
function amz_prints_product_img_src( $src ) {
	$src = trim( (string) $src );
	if ( ! $src ) {
		return '';
	}
	if ( 0 === strpos( $src, 'data:image' ) ) {
		return $src;
	}
	return esc_url( $src );
}

/**
 * Image URL safe for JSON / localize payloads (omit huge data: URIs).
 *
 * @param string $src Raw image.
 * @return string http(s) URL or empty.
 */
function amz_prints_public_image_url( $src ) {
	$src = trim( (string) $src );
	if ( ! $src || 0 === stripos( $src, 'data:' ) ) {
		return '';
	}
	if ( preg_match( '#^https?://#i', $src ) ) {
		return esc_url_raw( $src );
	}
	return '';
}

/**
 * Catalog payload for front-end product modal (no data:image bloat).
 *
 * @return array
 */
function amz_prints_commerce_product_catalog() {
	$catalog = array();
	if ( ! function_exists( 'amz_prints_erp_get_products' ) ) {
		return $catalog;
	}
	foreach ( amz_prints_erp_get_products() as $p ) {
		$images = array();
		if ( ! empty( $p['images'] ) && is_array( $p['images'] ) ) {
			foreach ( $p['images'] as $img ) {
				$url = amz_prints_public_image_url( $img );
				if ( $url && ! in_array( $url, $images, true ) ) {
					$images[] = $url;
				}
			}
		}
		$primary = amz_prints_public_image_url( $p['image'] ?? '' );
		if ( $primary && ! in_array( $primary, $images, true ) ) {
			array_unshift( $images, $primary );
		} elseif ( ! $primary && ! empty( $images ) ) {
			$primary = $images[0];
		}
		$catalog[] = array(
			'id'          => (string) ( $p['id'] ?? '' ),
			'name'        => (string) ( $p['name'] ?? '' ),
			'category'    => (string) ( $p['category'] ?? '' ),
			'description' => (string) ( $p['description'] ?? '' ),
			'basePrice'   => (float) ( $p['basePrice'] ?? 0 ),
			'unit'        => (string) ( $p['unit'] ?? '' ),
			'material'    => (string) ( $p['material'] ?? '' ),
			'size'        => (string) ( $p['size'] ?? '' ),
			'minQuantity' => max( 1, (int) ( $p['minQuantity'] ?? 1 ) ),
			'image'       => $primary,
			'images'      => $images,
		);
	}
	return $catalog;
}

/**
 * Product detail URL for an ERP product id.
 *
 * @param string $product_id ERP product id.
 * @return string
 */
function amz_prints_erp_product_url( $product_id ) {
	$product_id = rawurlencode( (string) $product_id );
	return home_url( '/product/?id=' . $product_id );
}

/**
 * Find ERP product by id.
 *
 * @param string $product_id Product id.
 * @return array|null
 */
/**
 * Public photo URL for an ERP product, or empty when none was uploaded.
 *
 * @param array $product Product row.
 * @return string
 */
function amz_prints_product_photo_url( $product ) {
	if ( ! is_array( $product ) ) {
		return '';
	}
	$raw = trim( (string) ( $product['image'] ?? '' ) );
	if ( ! $raw && ! empty( $product['images'][0] ) ) {
		$raw = trim( (string) $product['images'][0] );
	}
	if ( ! $raw ) {
		return '';
	}
	if ( function_exists( 'amz_prints_public_image_url' ) ) {
		$url = amz_prints_public_image_url( $raw );
		if ( $url ) {
			return $url;
		}
	}
	if ( 0 === strpos( $raw, 'data:image' ) || preg_match( '#^https?://#i', $raw ) ) {
		return $raw;
	}
	return '';
}

/**
 * Other ERP products with photos, same category first.
 *
 * @param array $product Current product.
 * @param int   $limit   Max items.
 * @return array
 */
function amz_prints_related_products( $product, $limit = 8 ) {
	$limit = max( 1, (int) $limit );
	if ( ! function_exists( 'amz_prints_erp_get_products' ) ) {
		return array();
	}
	$cat  = mb_strtolower( trim( (string) ( $product['category'] ?? '' ) ) );
	$id   = (string) ( $product['id'] ?? '' );
	$same = array();
	$rest = array();
	foreach ( amz_prints_erp_get_products() as $row ) {
		if ( (string) ( $row['id'] ?? '' ) === $id || ! amz_prints_product_photo_url( $row ) ) {
			continue;
		}
		$row_cat = mb_strtolower( trim( (string) ( $row['category'] ?? '' ) ) );
		if ( $cat && $row_cat === $cat ) {
			$same[] = $row;
		} else {
			$rest[] = $row;
		}
	}
	$picked = $same ? $same : $rest;
	return array_slice( $picked, 0, $limit );
}

function amz_prints_erp_find_product( $product_id ) {
	$product_id = (string) $product_id;
	if ( ! $product_id || ! function_exists( 'amz_prints_erp_get_products' ) ) {
		return null;
	}
	foreach ( amz_prints_erp_get_products() as $p ) {
		if ( (string) ( $p['id'] ?? '' ) === $product_id ) {
			return $p;
		}
	}
	return null;
}

/**
 * Read cart lines from cookie: [ ['id'=>'', 'qty'=>1 ], ... ]
 *
 * @return array
 */
function amz_prints_cart_raw() {
	if ( empty( $_COOKIE[ AMZ_PRINTS_CART_COOKIE ] ) ) {
		return array();
	}
	$raw = wp_unslash( $_COOKIE[ AMZ_PRINTS_CART_COOKIE ] );
	$data = json_decode( $raw, true );
	if ( ! is_array( $data ) ) {
		return array();
	}
	$out = array();
	foreach ( $data as $row ) {
		if ( ! is_array( $row ) ) {
			continue;
		}
		$id  = sanitize_text_field( (string) ( $row['id'] ?? '' ) );
		$qty = max( 1, (int) ( $row['qty'] ?? 1 ) );
		if ( ! $id ) {
			continue;
		}
		$out[] = array(
			'id'  => $id,
			'qty' => $qty,
		);
	}
	return $out;
}

/**
 * Persist cart cookie.
 *
 * @param array $lines Cart lines.
 */
function amz_prints_cart_save( $lines ) {
	$payload = wp_json_encode( array_values( $lines ) );
	$expire  = time() + ( 14 * DAY_IN_SECONDS );
	setcookie( AMZ_PRINTS_CART_COOKIE, $payload, array(
		'expires'  => $expire,
		'path'     => '/',
		'secure'   => is_ssl(),
		'httponly' => false,
		'samesite' => 'Lax',
	) );
	$_COOKIE[ AMZ_PRINTS_CART_COOKIE ] = $payload;
}

/**
 * Clear cart.
 */
function amz_prints_cart_clear() {
	setcookie( AMZ_PRINTS_CART_COOKIE, '', array(
		'expires'  => time() - HOUR_IN_SECONDS,
		'path'     => '/',
		'secure'   => is_ssl(),
		'httponly' => false,
		'samesite' => 'Lax',
	) );
	unset( $_COOKIE[ AMZ_PRINTS_CART_COOKIE ] );
}

/**
 * Delivery charge from Customizer.
 *
 * @param float $subtotal Cart subtotal.
 * @return float
 */
function amz_prints_cart_delivery_charge( $subtotal ) {
	$flat = (float) amz_prints_mod( 'amz_delivery_charge', 0 );
	$free = (float) amz_prints_mod( 'amz_free_delivery_over', 0 );
	if ( $flat <= 0 ) {
		return 0;
	}
	if ( $free > 0 && $subtotal >= $free ) {
		return 0;
	}
	return $flat;
}

/**
 * Optional cart discount percent from Customizer.
 *
 * @param float $subtotal Subtotal.
 * @return float Discount amount.
 */
function amz_prints_cart_discount_amount( $subtotal ) {
	$pct = (float) amz_prints_mod( 'amz_cart_discount_percent', 0 );
	if ( $pct <= 0 || $subtotal <= 0 ) {
		return 0;
	}
	if ( $pct > 100 ) {
		$pct = 100;
	}
	return round( $subtotal * ( $pct / 100 ), 2 );
}

/**
 * Build hydrated cart with product details + totals.
 *
 * @return array
 */
function amz_prints_cart_summary() {
	$lines    = amz_prints_cart_raw();
	$items    = array();
	$subtotal = 0;
	$count    = 0;

	foreach ( $lines as $line ) {
		$product = amz_prints_erp_find_product( $line['id'] );
		if ( ! $product ) {
			continue;
		}
		$price = (float) ( $product['basePrice'] ?? 0 );
		$min_q = max( 1, (int) ( $product['minQuantity'] ?? 1 ) );
		$qty   = max( $min_q, (int) $line['qty'] );
		$line_total = $price * $qty;
		$subtotal  += $line_total;
		$count     += $qty;
		$images     = ! empty( $product['images'] ) && is_array( $product['images'] ) ? $product['images'] : array();
		$image      = (string) ( $product['image'] ?? ( $images[0] ?? '' ) );
		$items[]    = array(
			'id'         => (string) $product['id'],
			'name'       => (string) $product['name'],
			'price'      => $price,
			'quantity'   => $qty,
			'minQuantity'=> $min_q,
			'unit'       => (string) ( $product['unit'] ?? '' ),
			'image'      => $image,
			'lineTotal'  => $line_total,
			'url'        => amz_prints_erp_product_url( $product['id'] ),
			'orderable'  => $price > 0,
		);
	}

	$discount = amz_prints_cart_discount_amount( $subtotal );
	$delivery = amz_prints_cart_delivery_charge( max( 0, $subtotal - $discount ) );
	$total    = max( 0, $subtotal - $discount + $delivery );

	return array(
		'items'           => $items,
		'count'           => $count,
		'subtotal'        => $subtotal,
		'discount'        => $discount,
		'deliveryCharges' => $delivery,
		'total'           => $total,
		'currency'        => 'Rs.',
	);
}

function amz_prints_cart_count() {
	$sum = amz_prints_cart_summary();
	return (int) ( $sum['count'] ?? 0 );
}

function amz_prints_cart_url() {
	return home_url( '/cart/' );
}

function amz_prints_checkout_url() {
	return home_url( '/checkout/' );
}

function amz_prints_money( $amount ) {
	$amount = (float) $amount;
	$dec    = ( floor( $amount ) == $amount ) ? 0 : 2;
	return 'Rs. ' . number_format_i18n( $amount, $dec );
}

/**
 * AJAX: get cart summary
 */
function amz_prints_ajax_cart_get() {
	check_ajax_referer( 'amz_prints_commerce', 'nonce' );
	wp_send_json_success( amz_prints_cart_summary() );
}
add_action( 'wp_ajax_amz_prints_cart_get', 'amz_prints_ajax_cart_get' );
add_action( 'wp_ajax_nopriv_amz_prints_cart_get', 'amz_prints_ajax_cart_get' );

/**
 * AJAX: add / update / remove cart item
 */
function amz_prints_ajax_cart_update() {
	check_ajax_referer( 'amz_prints_commerce', 'nonce' );
	$product_id = isset( $_POST['product_id'] ) ? sanitize_text_field( wp_unslash( $_POST['product_id'] ) ) : '';
	$qty        = isset( $_POST['quantity'] ) ? (int) $_POST['quantity'] : 1;
	$action     = isset( $_POST['cart_action'] ) ? sanitize_key( wp_unslash( $_POST['cart_action'] ) ) : 'set';

	if ( ! $product_id ) {
		wp_send_json_error( array( 'message' => __( 'Product required.', 'amz-prints' ) ), 400 );
	}

	$adding = ( 'remove' !== $action && $qty > 0 );
	if ( $adding && function_exists( 'amz_prints_customer_profile_is_complete' ) && ! amz_prints_customer_profile_is_complete() ) {
		$back = wp_get_referer();
		$back = $back ? wp_validate_redirect( $back, home_url( '/products/' ) ) : home_url( '/products/' );
		$logged = function_exists( 'amz_prints_customer_is_logged_in' ) && amz_prints_customer_is_logged_in();
		$url = $logged ? amz_prints_customer_profile_url() : amz_prints_customer_signup_url( $back );
		wp_send_json_error(
			array(
				'message'    => __( 'Complete your profile before adding to cart: correct email, mobile number with country code, and delivery address.', 'amz-prints' ),
				'code'       => 'profile_required',
				'profileUrl' => $url,
			),
			403
		);
	}

	$product = amz_prints_erp_find_product( $product_id );
	if ( ! $product && 'remove' !== $action ) {
		wp_send_json_error( array( 'message' => __( 'Product not found in ERP catalog.', 'amz-prints' ) ), 404 );
	}

	$min_q = max( 1, (int) ( is_array( $product ) ? ( $product['minQuantity'] ?? 1 ) : 1 ) );
	$lines = amz_prints_cart_raw();
	$found = false;
	$next  = array();

	foreach ( $lines as $line ) {
		if ( $line['id'] === $product_id ) {
			$found = true;
			if ( 'remove' === $action || $qty <= 0 ) {
				continue;
			}
			if ( 'add' === $action ) {
				$qty = (int) $line['qty'] + max( 1, $qty );
			}
			$next[] = array(
				'id'  => $product_id,
				'qty' => max( $min_q, $qty ),
			);
		} else {
			$next[] = $line;
		}
	}

	if ( ! $found && 'remove' !== $action && $qty > 0 ) {
		$next[] = array(
			'id'  => $product_id,
			'qty' => max( $min_q, max( 1, $qty ) ),
		);
	}

	amz_prints_cart_save( $next );
	wp_send_json_success( amz_prints_cart_summary() );
}
add_action( 'wp_ajax_amz_prints_cart_update', 'amz_prints_ajax_cart_update' );
add_action( 'wp_ajax_nopriv_amz_prints_cart_update', 'amz_prints_ajax_cart_update' );

/**
 * AJAX: place order (requires customer login)
 */
function amz_prints_ajax_place_order() {
	check_ajax_referer( 'amz_prints_commerce', 'nonce' );

	if ( ! function_exists( 'amz_prints_customer_is_logged_in' ) || ! amz_prints_customer_is_logged_in() ) {
		wp_send_json_error(
			array(
				'message'    => __( 'Create an account and complete your profile before placing an order.', 'amz-prints' ),
				'profileUrl' => amz_prints_customer_signup_url( amz_prints_checkout_url() ),
				'code'       => 'profile_required',
			),
			401
		);
	}
	if ( function_exists( 'amz_prints_customer_profile_is_complete' ) && ! amz_prints_customer_profile_is_complete() ) {
		wp_send_json_error(
			array(
				'message'    => __( 'Add your mobile number with country code and a complete delivery address before placing the order.', 'amz-prints' ),
				'profileUrl' => amz_prints_customer_profile_url(),
				'code'       => 'profile_required',
			),
			403
		);
	}

	$cart = amz_prints_cart_summary();
	if ( empty( $cart['items'] ) ) {
		wp_send_json_error( array( 'message' => __( 'Your cart is empty.', 'amz-prints' ) ), 400 );
	}

	foreach ( $cart['items'] as $item ) {
		if ( empty( $item['orderable'] ) ) {
			wp_send_json_error(
				array(
					'message' => sprintf(
						/* translators: %s product name */
						__( '"%s" needs a custom quote and cannot be ordered online yet.', 'amz-prints' ),
						$item['name']
					),
				),
				400
			);
		}
	}

	$payment_method = isset( $_POST['payment_method'] ) ? sanitize_text_field( wp_unslash( $_POST['payment_method'] ) ) : '';
	$policy         = ! empty( $_POST['policy_accepted'] );
	$address        = isset( $_POST['delivery_address'] ) ? sanitize_textarea_field( wp_unslash( $_POST['delivery_address'] ) ) : '';
	$phone          = isset( $_POST['customer_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['customer_phone'] ) ) : '';
	$note           = isset( $_POST['customer_note'] ) ? sanitize_textarea_field( wp_unslash( $_POST['customer_note'] ) ) : '';

	if ( ! $policy ) {
		wp_send_json_error( array( 'message' => __( 'Please accept the Order Processing Policy.', 'amz-prints' ) ), 400 );
	}
	$pay_opt = amz_prints_find_payment_method( $payment_method );
	if ( ! $pay_opt ) {
		wp_send_json_error( array( 'message' => __( 'Select a valid payment method.', 'amz-prints' ) ), 400 );
	}
	$phone_error = function_exists( 'amz_prints_customer_phone_error' ) ? amz_prints_customer_phone_error( $phone ) : '';
	if ( $phone_error ) {
		wp_send_json_error( array( 'message' => $phone_error ), 400 );
	}
	$phone = function_exists( 'amz_prints_customer_normalize_phone' ) ? amz_prints_customer_normalize_phone( $phone ) : $phone;
	$address_error = function_exists( 'amz_prints_customer_address_error' ) ? amz_prints_customer_address_error( $address ) : '';
	if ( $address_error ) {
		wp_send_json_error( array( 'message' => $address_error ), 400 );
	}

	$items = array();
	foreach ( $cart['items'] as $item ) {
		$items[] = array(
			'productId' => $item['id'],
			'name'      => $item['name'],
			'quantity'  => $item['quantity'],
			'rate'      => $item['price'],
		);
	}

	$body = array(
		'token'            => function_exists( 'amz_prints_customer_erp_token' ) ? amz_prints_customer_erp_token() : amz_prints_customer_token(),
		'items'            => $items,
		'paymentMethod'    => $pay_opt['label'],
		'policyAccepted'   => true,
		'deliveryAddress'  => $address,
		'customerPhone'    => $phone,
		'customerNote'     => $note,
		'subtotal'         => $cart['subtotal'],
		'discountAmount'   => $cart['discount'],
		'deliveryCharges'  => $cart['deliveryCharges'],
	);

	$session  = function_exists( 'amz_prints_customer_fetch_session' ) ? amz_prints_customer_fetch_session() : array();
	$customer = ( ! is_wp_error( $session ) && ! empty( $session['customer'] ) ) ? $session['customer'] : array();
	$body['customerName']  = (string) ( $customer['name'] ?? '' );
	$body['customerEmail'] = strtolower( (string) ( $customer['email'] ?? '' ) );
	$body['paymentMethod'] = 'cod' === $pay_opt['type'] ? 'Cash on Delivery' : 'Online Payment';
	if ( $body['customerEmail'] && function_exists( 'amz_prints_local_customer_get' ) ) {
		$profile_row = amz_prints_local_customer_get( $body['customerEmail'] );
		if ( is_array( $profile_row ) ) {
			$profile_row['phone']   = $phone;
			$profile_row['address'] = $address;
			amz_prints_local_customer_save( $body['customerEmail'], $profile_row );
		}
	}

	$result = amz_prints_erp_request( 'POST', '/public/customer/order', $body );
	if ( is_wp_error( $result ) ) {
		$order_id = 'WEB-' . gmdate( 'ymd' ) . '-' . wp_rand( 1000, 9999 );
		$saved    = array(
			'orderId'        => $order_id,
			'trackingNumber' => $order_id,
			'status'         => 'Order Received',
			'paymentMethod'  => $body['paymentMethod'],
			'paymentStatus'  => 'cod' === $pay_opt['type'] ? 'Unpaid' : 'Payment Pending',
			'totalAmount'    => $cart['total'],
			'items'          => array_map( function ( $row ) { return (string) ( $row['name'] ?? '' ); }, $items ),
			'date'           => gmdate( 'Y-m-d' ),
			'balanceAmount'  => $cart['total'],
			'address'        => $address,
			'phone'          => $phone,
			'email'          => strtolower( (string) ( $customer['email'] ?? '' ) ),
			'name'           => (string) ( $customer['name'] ?? '' ),
			'createdAt'      => gmdate( 'c' ),
		);
		if ( function_exists( 'amz_prints_store_customer_order' ) ) {
			amz_prints_store_customer_order( $saved['email'], $saved );
		}
		amz_prints_cart_clear();
		wp_send_json_success( array(
			'orderId'        => $order_id,
			'trackingNumber' => $order_id,
			'paymentMethod'  => $saved['paymentMethod'],
			'paymentStatus'  => $saved['paymentStatus'],
			'totalAmount'    => $cart['total'],
			'message'        => __( 'Order placed. It is saved on this customer account.', 'amz-prints' ),
			'accountUrl'     => home_url( '/my-account/' ),
			'trackUrl'       => home_url( '/track-order/?code=' . rawurlencode( $order_id ) ),
		) );
	}

	amz_prints_cart_clear();
	if ( function_exists( 'amz_prints_store_customer_order' ) ) {
		amz_prints_store_customer_order( strtolower( (string) ( $customer['email'] ?? '' ) ), array(
			'orderId'        => isset( $result['orderId'] ) ? (string) $result['orderId'] : '',
			'trackingNumber' => isset( $result['trackingNumber'] ) ? (string) $result['trackingNumber'] : '',
			'status'         => 'Order Received',
			'date'           => gmdate( 'Y-m-d' ),
			'totalAmount'    => $cart['total'],
			'balanceAmount'  => $cart['total'],
			'items'          => array_map( function ( $row ) { return (string) ( $row['name'] ?? '' ); }, $items ),
			'email'          => strtolower( (string) ( $customer['email'] ?? '' ) ),
			'name'           => (string) ( $customer['name'] ?? '' ),
		) );
	}

	$order_id = isset( $result['orderId'] ) ? (string) $result['orderId'] : '';
	wp_send_json_success(
		array(
			'orderId'         => $order_id,
			'trackingNumber'  => isset( $result['trackingNumber'] ) ? $result['trackingNumber'] : '',
			'paymentMethod'   => isset( $result['paymentMethod'] ) ? $result['paymentMethod'] : '',
			'paymentStatus'   => isset( $result['paymentStatus'] ) ? $result['paymentStatus'] : '',
			'totalAmount'     => isset( $result['totalAmount'] ) ? $result['totalAmount'] : $cart['total'],
			'message'         => isset( $result['message'] ) ? $result['message'] : __( 'Order placed successfully.', 'amz-prints' ),
			'accountUrl'      => home_url( '/my-account/' ),
			'trackUrl'        => $order_id ? home_url( '/track-order/?code=' . rawurlencode( $order_id ) ) : home_url( '/track-order/' ),
		)
	);
}
add_action( 'wp_ajax_amz_prints_place_order', 'amz_prints_ajax_place_order' );
add_action( 'wp_ajax_nopriv_amz_prints_place_order', 'amz_prints_ajax_place_order' );

/**
 * Order processing policy text (Customizer).
 *
 * @return string
 */
function amz_prints_order_policy_text() {
	$default = __( 'Your order will begin processing after payment confirmation. Please complete the required payment according to the selected payment method. Order processing will start once payment has been verified.', 'amz-prints' );
	return (string) amz_prints_mod( 'amz_order_policy', $default );
}

/**
 * Checkout payment methods (COD + customizable bank cards).
 *
 * @return array
 */
function amz_prints_payment_methods() {
	$methods = array();
	if ( amz_prints_mod( 'amz_pay_cod_enabled', true ) ) {
		$methods[] = array(
			'id'      => 'cod',
			'label'   => __( 'Cash on Delivery', 'amz-prints' ),
			'type'    => 'cod',
			'details' => __( 'Order is placed under COD terms. Payment status starts as Unpaid.', 'amz-prints' ),
			'image'   => '',
		);
	}
	for ( $i = 1; $i <= 4; $i++ ) {
		$enabled = amz_prints_mod( 'amz_pay_bank_' . $i . '_enable', 1 === $i );
		$name    = trim( (string) amz_prints_mod( 'amz_pay_bank_' . $i . '_name', 1 === $i ? 'Bank transfer' : '' ) );
		$details = trim( (string) amz_prints_mod( 'amz_pay_bank_' . $i . '_details', '' ) );
		$img_id  = absint( amz_prints_mod( 'amz_pay_bank_' . $i . '_image', 0 ) );
		if ( ! $enabled || ( ! $name && ! $details ) ) {
			continue;
		}
		$img = $img_id ? wp_get_attachment_image_url( $img_id, 'medium' ) : '';
		$methods[] = array(
			'id'      => 'bank_' . $i,
			'label'   => $name ? $name : sprintf( __( 'Bank account %d', 'amz-prints' ), $i ),
			'type'    => 'bank',
			'details' => $details,
			'image'   => $img ? $img : '',
		);
	}
	if ( empty( $methods ) ) {
		$methods[] = array(
			'id'      => 'cod',
			'label'   => __( 'Cash on Delivery', 'amz-prints' ),
			'type'    => 'cod',
			'details' => __( 'Order is placed under COD terms. Payment status starts as Unpaid.', 'amz-prints' ),
			'image'   => '',
		);
	}
	return $methods;
}

function amz_prints_find_payment_method( $id ) {
	foreach ( amz_prints_payment_methods() as $method ) {
		if ( (string) $method['id'] === (string) $id ) {
			return $method;
		}
	}
	return null;
}
