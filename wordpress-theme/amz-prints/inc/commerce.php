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
		'path'     => COOKIEPATH ? COOKIEPATH : '/',
		'domain'   => COOKIE_DOMAIN,
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
		'path'     => COOKIEPATH ? COOKIEPATH : '/',
		'domain'   => COOKIE_DOMAIN,
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

	$product = amz_prints_erp_find_product( $product_id );
	if ( ! $product ) {
		wp_send_json_error( array( 'message' => __( 'Product not found in ERP catalog.', 'amz-prints' ) ), 404 );
	}

	$min_q = max( 1, (int) ( $product['minQuantity'] ?? 1 ) );
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
				'message'  => __( 'Please log in to place your order.', 'amz-prints' ),
				'loginUrl' => amz_prints_customer_login_url( amz_prints_checkout_url() ),
				'code'     => 'login_required',
			),
			401
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
	if ( ! in_array( $payment_method, array( 'cod', 'online' ), true ) ) {
		wp_send_json_error( array( 'message' => __( 'Select Cash on Delivery or Online Payment.', 'amz-prints' ) ), 400 );
	}
	if ( ! $address ) {
		wp_send_json_error( array( 'message' => __( 'Delivery address is required.', 'amz-prints' ) ), 400 );
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
		'token'            => amz_prints_customer_token(),
		'items'            => $items,
		'paymentMethod'    => ( 'cod' === $payment_method ) ? 'Cash on Delivery' : 'Online Payment',
		'policyAccepted'   => true,
		'deliveryAddress'  => $address,
		'customerPhone'    => $phone,
		'customerNote'     => $note,
		'subtotal'         => $cart['subtotal'],
		'discountAmount'   => $cart['discount'],
		'deliveryCharges'  => $cart['deliveryCharges'],
	);

	$result = amz_prints_erp_request( 'POST', '/public/customer/order', $body );
	if ( is_wp_error( $result ) ) {
		$err = $result->get_error_message();
		if ( 'Not found' === $err || false !== stripos( $err, 'not found' ) ) {
			$err = __( 'ERP website order API not found. Redeploy latest Code.gs (New version) and try again.', 'amz-prints' );
		}
		wp_send_json_error( array( 'message' => $err ), 400 );
	}

	amz_prints_cart_clear();

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
			'trackUrl'        => home_url( '/my-account/#track' ),
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
