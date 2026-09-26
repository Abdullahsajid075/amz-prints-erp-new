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
 * Checkout totals. Home delivery inside 10 km is PKR 250. Pickup is free.
 *
 * @param float  $subtotal Product subtotal.
 * @param float  $discount Discount amount.
 * @param string $method   home|pickup.
 * @param string $zone     inside|outside|''.
 * @return array|WP_Error
 */
function amz_prints_checkout_quote( $subtotal, $discount, $method, $zone ) {
	$subtotal = max( 0, (float) $subtotal );
	$discount = min( $subtotal, max( 0, (float) $discount ) );
	$method   = sanitize_key( (string) $method );
	$zone     = sanitize_key( (string) $zone );
	if ( 'home' !== $method && 'pickup' !== $method ) {
		return new WP_Error( 'amz_delivery', __( 'Select home delivery or store pickup.', 'amz-prints' ) );
	}
	if ( 'home' === $method && 'inside' !== $zone ) {
		if ( 'outside' === $zone ) {
			return new WP_Error( 'amz_delivery', __( 'Your address is outside the 10 km delivery area. The standard delivery charge of PKR 250 is not applied. Choose store pickup or contact the office.', 'amz-prints' ) );
		}
		return new WP_Error( 'amz_delivery', __( 'Confirm whether your address is within 10 km of the office.', 'amz-prints' ) );
	}
	$delivery = ( 'home' === $method ) ? 250.0 : 0.0;
	$total    = round( $subtotal - $discount + $delivery, 2 );
	$advance  = round( $total * 0.5, 2 );
	return array(
		'deliveryMethod'  => ( 'home' === $method ) ? 'Home Delivery' : 'Store Pickup',
		'deliveryCharges' => $delivery,
		'subtotal'        => round( $subtotal, 2 ),
		'discount'        => round( $discount, 2 ),
		'total'           => $total,
		'advanceDue'      => $advance,
		'balance'         => round( $total - $advance, 2 ),
	);
}

/**
 * Store a bank-transfer receipt.
 *
 * @return string|WP_Error URL or error.
 */
function amz_prints_checkout_store_receipt() {
	if ( empty( $_FILES['payment_receipt']['name'] ) ) {
		return new WP_Error( 'amz_receipt', __( 'Upload the payment receipt or screenshot.', 'amz-prints' ) );
	}
	$file = $_FILES['payment_receipt'];
	if ( ! empty( $file['error'] ) ) {
		return new WP_Error( 'amz_receipt', __( 'Could not upload the receipt. Use a JPG, PNG, WebP, or PDF under 5 MB.', 'amz-prints' ) );
	}
	if ( (int) ( $file['size'] ?? 0 ) > 5 * 1024 * 1024 ) {
		return new WP_Error( 'amz_receipt', __( 'The receipt must be under 5 MB.', 'amz-prints' ) );
	}
	$check   = wp_check_filetype_and_ext( $file['tmp_name'], $file['name'] );
	$allowed = array( 'jpg', 'jpeg', 'png', 'webp', 'pdf' );
	if ( empty( $check['ext'] ) || ! in_array( strtolower( (string) $check['ext'] ), $allowed, true ) ) {
		return new WP_Error( 'amz_receipt', __( 'Use a JPG, PNG, WebP, or PDF receipt.', 'amz-prints' ) );
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
				'pdf'          => 'application/pdf',
			),
		)
	);
	if ( ! empty( $upload['error'] ) || empty( $upload['url'] ) ) {
		return new WP_Error( 'amz_receipt', __( 'Could not store the receipt. Try a smaller JPG or PDF.', 'amz-prints' ) );
	}
	return (string) $upload['url'];
}

/**
 * Tell the office that a website checkout just happened.
 *
 * @param array $details      Order facts for the email.
 * @param bool  $saved_in_erp True when the ERP order insert succeeded.
 */
function amz_prints_notify_website_order( $details, $saved_in_erp ) {
	$details  = is_array( $details ) ? $details : array();
	$order_id = (string) ( $details['orderId'] ?? '' );
	$money    = function ( $amount ) {
		return function_exists( 'amz_prints_money' ) ? amz_prints_money( $amount ) : (string) $amount;
	};
	$lines    = array();
	if ( $saved_in_erp ) {
		$lines[] = 'A customer placed an order on the website.';
		$lines[] = 'Open ERP → Orders. It is listed as Order Received, payment Pending Verification, source Website.';
		$lines[] = 'The declared advance is not in the customer ledger until you open this order, enter the verified advance, and save.';
	} else {
		$lines[] = 'A customer placed an order on the website, but it was NOT saved in ERP Orders.';
		$lines[] = 'Redeploy the API (the api folder, live at https://amz-prints-api.vercel.app) from this project. Until then this order exists only on the customer website account.';
	}
	$lines[] = '';
	$lines[] = 'Order: ' . $order_id;
	$lines[] = 'Customer: ' . (string) ( $details['customerName'] ?? '' );
	$lines[] = 'Email: ' . (string) ( $details['email'] ?? '' );
	$lines[] = 'WhatsApp: ' . (string) ( $details['phone'] ?? '' );
	if ( ! empty( $details['altPhone'] ) ) {
		$lines[] = 'Alternative phone: ' . (string) $details['altPhone'];
	}
	$lines[] = 'Address: ' . (string) ( $details['address'] ?? '' );
	$lines[] = 'Delivery: ' . (string) ( $details['deliveryMethod'] ?? '' );
	$lines[] = 'Delivery charges: ' . $money( $details['deliveryCharges'] ?? 0 );
	$lines[] = 'Payment method: ' . (string) ( $details['paymentMethod'] ?? '' );
	$lines[] = 'Subtotal: ' . $money( $details['subtotal'] ?? 0 );
	$lines[] = 'Discount: ' . $money( $details['discount'] ?? 0 );
	$lines[] = 'Total: ' . $money( $details['totalAmount'] ?? 0 );
	$lines[] = 'Declared advance (not verified): ' . $money( $details['declaredAdvance'] ?? 0 );
	$lines[] = 'Remaining balance: ' . $money( $details['balanceAmount'] ?? 0 );
	if ( ! empty( $details['receiptUrl'] ) ) {
		$lines[] = 'Receipt: ' . (string) $details['receiptUrl'];
	}
	$lines[] = '';
	$lines[] = 'Products:';
	foreach ( (array) ( $details['items'] ?? array() ) as $item ) {
		if ( is_array( $item ) ) {
			$lines[] = '- ' . (string) ( $item['name'] ?? '' ) . ' × ' . (string) ( $item['quantity'] ?? 1 ) . ' — ' . $money( $item['lineTotal'] ?? 0 );
		} else {
			$lines[] = '- ' . (string) $item;
		}
	}
	$reply   = sanitize_email( (string) ( $details['email'] ?? '' ) );
	$headers = $reply ? array( 'Reply-To: ' . $reply ) : array();
	wp_mail( 'info@amzprints.com', sprintf( '[AMZ Prints] Website order %s', $order_id ), implode( "\n", $lines ), $headers );
}

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

	$session  = function_exists( 'amz_prints_customer_fetch_session' ) ? amz_prints_customer_fetch_session() : array();
	$customer = ( ! is_wp_error( $session ) && ! empty( $session['customer'] ) ) ? $session['customer'] : array();
	$email    = strtolower( trim( (string) ( $customer['email'] ?? '' ) ) );
	if ( ! $email && function_exists( 'amz_prints_customer_current_email' ) ) {
		$email = amz_prints_customer_current_email();
	}

	$checkout_token = isset( $_POST['checkout_token'] ) ? sanitize_text_field( wp_unslash( $_POST['checkout_token'] ) ) : '';
	if ( ! preg_match( '/^[A-Za-z0-9]{16,64}$/', $checkout_token ) ) {
		wp_send_json_error( array( 'message' => __( 'Refresh the checkout page and place the order again.', 'amz-prints' ) ), 400 );
	}
	$lock_key = 'amz_chk_' . md5( $email . '|' . $checkout_token );
	$locked   = get_transient( $lock_key );
	if ( is_array( $locked ) ) {
		wp_send_json_success( $locked );
	}
	if ( 'pending' === $locked ) {
		wp_send_json_error( array( 'message' => __( 'This order is already being placed. Please wait.', 'amz-prints' ) ), 409 );
	}

	$name    = isset( $_POST['customer_name'] ) ? sanitize_text_field( wp_unslash( $_POST['customer_name'] ) ) : '';
	$phone   = isset( $_POST['customer_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['customer_phone'] ) ) : '';
	$alt     = isset( $_POST['alt_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['alt_phone'] ) ) : '';
	$address = isset( $_POST['delivery_address'] ) ? sanitize_textarea_field( wp_unslash( $_POST['delivery_address'] ) ) : '';
	$note    = isset( $_POST['customer_note'] ) ? sanitize_textarea_field( wp_unslash( $_POST['customer_note'] ) ) : '';
	$method  = isset( $_POST['delivery_method'] ) ? sanitize_key( wp_unslash( $_POST['delivery_method'] ) ) : '';
	$zone    = isset( $_POST['delivery_zone'] ) ? sanitize_key( wp_unslash( $_POST['delivery_zone'] ) ) : '';
	$payment_method = isset( $_POST['payment_method'] ) ? sanitize_text_field( wp_unslash( $_POST['payment_method'] ) ) : '';
	$declared = isset( $_POST['policy_accepted'] );
	$pay_date = isset( $_POST['payment_date'] ) ? sanitize_text_field( wp_unslash( $_POST['payment_date'] ) ) : '';
	$pay_ref  = isset( $_POST['transaction_ref'] ) ? sanitize_text_field( wp_unslash( $_POST['transaction_ref'] ) ) : '';
	$pay_amt  = isset( $_POST['advance_amount'] ) ? (float) wp_unslash( $_POST['advance_amount'] ) : 0;

	if ( strlen( $name ) < 2 ) {
		wp_send_json_error( array( 'message' => __( 'Enter your full name.', 'amz-prints' ) ), 400 );
	}
	if ( ! $declared ) {
		wp_send_json_error( array( 'message' => __( 'Please accept the declaration before placing the order.', 'amz-prints' ) ), 400 );
	}
	$quote = amz_prints_checkout_quote( $cart['subtotal'], $cart['discount'], $method, $zone );
	if ( is_wp_error( $quote ) ) {
		wp_send_json_error( array( 'message' => $quote->get_error_message() ), 400 );
	}
	$pay_opt = amz_prints_find_payment_method( $payment_method );
	if ( ! $pay_opt || ! in_array( $pay_opt['type'], array( 'cod', 'bank' ), true ) ) {
		wp_send_json_error( array( 'message' => __( 'Select Cash on Delivery or Bank Transfer.', 'amz-prints' ) ), 400 );
	}
	$phone_error = function_exists( 'amz_prints_customer_phone_error' ) ? amz_prints_customer_phone_error( $phone ) : '';
	if ( $phone_error ) {
		wp_send_json_error( array( 'message' => $phone_error ), 400 );
	}
	$phone = function_exists( 'amz_prints_customer_normalize_phone' ) ? amz_prints_customer_normalize_phone( $phone ) : $phone;
	if ( '' !== trim( $alt ) ) {
		$alt_error = function_exists( 'amz_prints_customer_phone_error' ) ? amz_prints_customer_phone_error( $alt ) : '';
		if ( $alt_error ) {
			wp_send_json_error( array( 'message' => __( 'The alternative number also needs a country code, for example +923001234567.', 'amz-prints' ) ), 400 );
		}
		$alt = function_exists( 'amz_prints_customer_normalize_phone' ) ? amz_prints_customer_normalize_phone( $alt ) : $alt;
	}
	if ( 'home' === $method ) {
		$address_error = function_exists( 'amz_prints_customer_address_error' ) ? amz_prints_customer_address_error( $address ) : '';
		if ( $address_error ) {
			wp_send_json_error( array( 'message' => $address_error ), 400 );
		}
	} else {
		$office  = function_exists( 'amz_prints_mod' ) ? trim( (string) amz_prints_mod( 'amz_address', '' ) ) : '';
		$address = $office ? ( 'Store pickup — ' . $office ) : 'Store pickup from the AMZ Prints office';
	}

	$is_bank  = ( 'bank' === $pay_opt['type'] );
	$declared_advance = $quote['advanceDue'];
	$receipt_url      = '';
	if ( $is_bank ) {
		if ( round( $pay_amt, 2 ) + 0.001 < $quote['advanceDue'] ) {
			wp_send_json_error( array(
				'message' => sprintf(
					/* translators: %s minimum advance */
					__( 'The advance payment must be at least 50%% of the order (%s).', 'amz-prints' ),
					amz_prints_money( $quote['advanceDue'] )
				),
			), 400 );
		}
		if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $pay_date ) ) {
			wp_send_json_error( array( 'message' => __( 'Enter the payment date.', 'amz-prints' ) ), 400 );
		}
		$receipt = amz_prints_checkout_store_receipt();
		if ( is_wp_error( $receipt ) ) {
			wp_send_json_error( array( 'message' => $receipt->get_error_message() ), 400 );
		}
		$receipt_url      = $receipt;
		$declared_advance = round( $pay_amt, 2 );
	}

	$items = array();
	$summary_items = array();
	foreach ( $cart['items'] as $item ) {
		$items[] = array(
			'productId' => $item['id'],
			'name'      => $item['name'],
			'quantity'  => $item['quantity'],
			'rate'      => $item['price'],
		);
		$summary_items[] = array(
			'name'      => $item['name'],
			'quantity'  => $item['quantity'],
			'rate'      => $item['price'],
			'lineTotal' => $item['lineTotal'],
		);
	}

	set_transient( $lock_key, 'pending', 2 * MINUTE_IN_SECONDS );

	$pay_label = $is_bank ? 'Bank Transfer' : 'Cash on Delivery';
	$body = array(
		'token'               => function_exists( 'amz_prints_customer_erp_token' ) ? amz_prints_customer_erp_token() : amz_prints_customer_token(),
		'items'               => $items,
		'paymentMethod'       => $pay_label,
		'policyAccepted'      => true,
		'declarationAccepted' => true,
		'deliveryMethod'      => $method,
		'deliveryZone'        => ( 'home' === $method ) ? $zone : '',
		'deliveryAddress'     => $address,
		'customerPhone'       => $phone,
		'altPhone'            => $alt,
		'customerNote'        => $note,
		'subtotal'            => $quote['subtotal'],
		'discountAmount'      => $quote['discount'],
		'deliveryCharges'     => $quote['deliveryCharges'],
		'declaredAdvance'     => $declared_advance,
		'paymentDate'         => $is_bank ? $pay_date : '',
		'transactionRef'      => $is_bank ? $pay_ref : '',
		'receiptUrl'          => $receipt_url,
		'customerName'        => $name,
		'customerEmail'       => $email,
		'portalKey'           => function_exists( 'amz_prints_customer_portal_key' ) ? amz_prints_customer_portal_key() : '',
	);
	if ( $email && function_exists( 'amz_prints_local_customer_get' ) ) {
		$profile_row = amz_prints_local_customer_get( $email );
		if ( is_array( $profile_row ) ) {
			$profile_row['name']  = $name;
			$profile_row['phone'] = $phone;
			if ( 'home' === $method ) {
				$profile_row['address'] = $address;
			}
			amz_prints_local_customer_save( $email, $profile_row );
		}
	}
	if ( $email && function_exists( 'amz_prints_customer_ensure_erp' ) ) {
		amz_prints_customer_ensure_erp( $email );
	}
	if ( $email && function_exists( 'amz_prints_customer_production_token' ) ) {
		$fresh_token = amz_prints_customer_production_token( $email, $name, $phone, $address );
		if ( $fresh_token ) {
			$body['token'] = $fresh_token;
		}
	}
	$body['acceptPolicy'] = true;
	$body['notes']        = implode( ' · ', array_filter( array(
		'Website order',
		'Customer: ' . $name,
		'WhatsApp: ' . $phone,
		$alt ? 'Alternative phone: ' . $alt : '',
		'Delivery: ' . (string) ( $quote['deliveryMethod'] ?? '' ),
		'Delivery charges: ' . (string) $quote['deliveryCharges'],
		'Subtotal: ' . (string) $quote['subtotal'],
		'Total: ' . (string) $quote['total'],
		'Declared advance (not verified): ' . (string) $declared_advance,
		'Payment: ' . $pay_label,
		$receipt_url ? 'Receipt: ' . $receipt_url : '',
		$note ? 'Note: ' . $note : '',
	) ) );
	$body['customerNote'] = $body['notes'];

	$payload = array(
		'orderId'          => '',
		'trackingNumber'   => '',
		'paymentMethod'    => $pay_label,
		'paymentStatus'    => 'Pending Verification',
		'status'           => 'Order Received',
		'subtotal'         => $quote['subtotal'],
		'discount'         => $quote['discount'],
		'deliveryCharges'  => $quote['deliveryCharges'],
		'deliveryMethod'   => $quote['deliveryMethod'],
		'totalAmount'      => $quote['total'],
		'advanceDue'       => $quote['advanceDue'],
		'declaredAdvance'  => $declared_advance,
		'balanceAmount'    => round( $quote['total'] - $declared_advance, 2 ),
		'receiptUrl'       => $receipt_url,
		'items'            => $summary_items,
		'customerName'     => $name,
		'message'          => __( 'Your order has been received. It will be confirmed after the advance payment is verified.', 'amz-prints' ),
		'accountUrl'       => home_url( '/my-account/' ),
		'trackUrl'         => home_url( '/track-order/' ),
	);

	$result = null;
	foreach ( array( '/public/customer/order', '/public/orders', '/public/checkout' ) as $order_path ) {
		$try = amz_prints_erp_request( 'POST', $order_path, $body );
		if ( ! is_wp_error( $try ) ) {
			$result = $try;
			break;
		}
		$result   = $try;
		$err_data = $try->get_error_data();
		$err_code = is_array( $err_data ) && isset( $err_data['status'] ) ? (int) $err_data['status'] : 0;
		$err_msg  = $try->get_error_message();
		$missing  = ( 404 === $err_code || false !== stripos( $err_msg, 'Not found' ) );
		$denied   = ( 401 === $err_code || false !== stripos( $err_msg, 'Login required' ) || false !== stripos( $err_msg, 'Please log in' ) );
		if ( $denied && $email && function_exists( 'amz_prints_customer_production_token' ) ) {
			$fresh_token = amz_prints_customer_production_token( $email, $name, $phone, $address, '', true );
			if ( $fresh_token ) {
				$body['token'] = $fresh_token;
				$again         = amz_prints_erp_request( 'POST', $order_path, $body );
				if ( ! is_wp_error( $again ) ) {
					$result = $again;
					break;
				}
				$result = $again;
			}
		}
		if ( ! $missing && ! $denied ) {
			break;
		}
	}
	if ( is_array( $result ) ) {
		if ( empty( $result['orderId'] ) && ! empty( $result['order']['orderId'] ) ) {
			$result['orderId'] = (string) $result['order']['orderId'];
		}
		if ( empty( $result['trackingNumber'] ) && ! empty( $result['order']['trackingNumber'] ) ) {
			$result['trackingNumber'] = (string) $result['order']['trackingNumber'];
		}
	}
	if ( is_wp_error( $result ) ) {
		$fail_data = $result->get_error_data();
		$fail_code = is_array( $fail_data ) && isset( $fail_data['status'] ) ? (int) $fail_data['status'] : 0;
		if ( $fail_code >= 400 && 404 !== $fail_code && false === stripos( $result->get_error_message(), 'Not found' ) ) {
			delete_transient( $lock_key );
			wp_send_json_error( array( 'message' => $result->get_error_message() ), $fail_code ? $fail_code : 400 );
		}
	}
	if ( is_wp_error( $result ) ) {
		$order_id = 'WEB-' . gmdate( 'ymd' ) . '-' . wp_rand( 1000, 9999 );
		$payload['orderId']        = $order_id;
		$payload['trackingNumber'] = $order_id;
		$payload['trackUrl']       = home_url( '/track-order/?code=' . rawurlencode( $order_id ) );
		if ( function_exists( 'amz_prints_store_customer_order' ) ) {
			amz_prints_store_customer_order( $email, array(
				'orderId'         => $order_id,
				'trackingNumber'  => $order_id,
				'status'          => 'Order Received',
				'paymentMethod'   => $pay_label,
				'paymentStatus'   => 'Pending Verification',
				'totalAmount'     => $quote['total'],
				'balanceAmount'   => $quote['total'],
				'declaredAdvance' => $declared_advance,
				'deliveryCharges' => $quote['deliveryCharges'],
				'deliveryMethod'  => $quote['deliveryMethod'],
				'receiptUrl'      => $receipt_url,
				'items'           => array_map( function ( $row ) { return (string) ( $row['name'] ?? '' ); }, $items ),
				'date'            => gmdate( 'Y-m-d' ),
				'address'         => $address,
				'phone'           => $phone,
				'email'           => $email,
				'name'            => $name,
				'createdAt'       => gmdate( 'c' ),
			) );
		}
	} else {
		$order_id = isset( $result['orderId'] ) ? (string) $result['orderId'] : '';
		$payload['orderId']        = $order_id;
		$payload['trackingNumber'] = isset( $result['trackingNumber'] ) ? (string) $result['trackingNumber'] : $order_id;
		$payload['trackUrl']       = $order_id ? home_url( '/track-order/?code=' . rawurlencode( $order_id ) ) : home_url( '/track-order/' );
		if ( function_exists( 'amz_prints_store_customer_order' ) ) {
			amz_prints_store_customer_order( $email, array(
				'orderId'         => $order_id,
				'trackingNumber'  => $payload['trackingNumber'],
				'status'          => 'Order Received',
				'paymentMethod'   => $pay_label,
				'paymentStatus'   => 'Pending Verification',
				'date'            => gmdate( 'Y-m-d' ),
				'totalAmount'     => $quote['total'],
				'balanceAmount'   => $quote['total'],
				'declaredAdvance' => $declared_advance,
				'deliveryCharges' => $quote['deliveryCharges'],
				'items'           => array_map( function ( $row ) { return (string) ( $row['name'] ?? '' ); }, $items ),
				'email'           => $email,
				'name'            => $name,
			) );
		}
	}

	amz_prints_notify_website_order(
		array(
			'orderId'         => $payload['orderId'],
			'customerName'    => $name,
			'email'           => $email,
			'phone'           => $phone,
			'altPhone'        => $alt,
			'address'         => $address,
			'deliveryMethod'  => $quote['deliveryMethod'],
			'deliveryCharges' => $quote['deliveryCharges'],
			'paymentMethod'   => $pay_label,
			'subtotal'        => $quote['subtotal'],
			'discount'        => $quote['discount'],
			'totalAmount'     => $quote['total'],
			'declaredAdvance' => $declared_advance,
			'balanceAmount'   => $payload['balanceAmount'],
			'receiptUrl'      => $receipt_url,
			'items'           => $summary_items,
		),
		! is_wp_error( $result )
	);

	amz_prints_cart_clear();
	set_transient( $lock_key, $payload, 30 * MINUTE_IN_SECONDS );
	wp_send_json_success( $payload );
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
			'details' => __( 'Cash on Delivery covers only the balance left after the 50% advance is received and verified.', 'amz-prints' ),
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
	$has_cod  = false;
	$has_bank = false;
	foreach ( $methods as $method ) {
		if ( 'cod' === $method['type'] ) {
			$has_cod = true;
		}
		if ( 'bank' === $method['type'] ) {
			$has_bank = true;
		}
	}
	if ( ! $has_cod ) {
		array_unshift( $methods, array(
			'id'      => 'cod',
			'label'   => __( 'Cash on Delivery', 'amz-prints' ),
			'type'    => 'cod',
			'details' => __( 'Cash on Delivery covers only the balance left after the 50% advance is received and verified.', 'amz-prints' ),
			'image'   => '',
		) );
	}
	if ( ! $has_bank ) {
		$methods[] = array(
			'id'      => 'bank_1',
			'label'   => __( 'Bank Transfer', 'amz-prints' ),
			'type'    => 'bank',
			'details' => "Account title: Amazon Printings (Pvt) Ltd\nAccount no: 0000-0000000-00\nIBAN: PK00XXXX0000000000000000",
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
