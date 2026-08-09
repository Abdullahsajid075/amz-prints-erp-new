<?php
/**
 * Scripts & styles
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function amz_prints_enqueue_assets() {
	$fonts = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap';

	wp_enqueue_style( 'amz-prints-fonts', $fonts, array(), null );
	wp_enqueue_style( 'amz-prints-main', AMZ_PRINTS_URI . '/assets/css/main.css', array( 'amz-prints-fonts' ), AMZ_PRINTS_VERSION );
	wp_enqueue_script( 'amz-prints-main', AMZ_PRINTS_URI . '/assets/js/main.js', array(), AMZ_PRINTS_VERSION, true );

	$wa = preg_replace( '/\D+/', '', amz_prints_mod( 'amz_whatsapp', amz_prints_mod( 'amz_phone', '' ) ) );
	$wa_flow = amz_prints_mod( 'amz_wa_flow_url', '' );
	$wa_msg  = amz_prints_mod( 'amz_wa_message', 'Hello Amazon Printings, I need help with a printing service.' );

	wp_localize_script( 'amz-prints-main', 'amzPrints', array(
		'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
		'nonce'     => wp_create_nonce( 'amz_ai_chat' ),
		'leadNonce' => wp_create_nonce( 'amz_prints_lead' ),
		'homeUrl'   => home_url( '/' ),
		'lang'      => 'en',
		'wa'        => array(
			'number'      => $wa,
			'flowUrl'     => $wa_flow,
			'message'     => $wa_msg,
			'headerImage' => AMZ_PRINTS_URI . '/assets/images/required-info.png',
			'href'        => $wa_flow ? $wa_flow : ( $wa ? 'https://wa.me/' . $wa . '?text=' . rawurlencode( $wa_msg ) : '' ),
		),
		'chat'      => array(
			'quote'    => home_url( '/quote/' ),
			'track'    => home_url( '/track-order/' ),
			'services' => home_url( '/services/' ),
			'whatsapp' => $wa,
		),
	) );
}
add_action( 'wp_enqueue_scripts', 'amz_prints_enqueue_assets' );

/**
 * AI chat AJAX — webhook if set, else smart local replies
 */
function amz_prints_ai_chat_ajax() {
	check_ajax_referer( 'amz_ai_chat', 'nonce' );
	$message = isset( $_POST['message'] ) ? sanitize_text_field( wp_unslash( $_POST['message'] ) ) : '';
	if ( ! $message ) {
		wp_send_json_error( array( 'reply' => 'Empty message' ) );
	}

	$webhook = amz_prints_mod( 'amz_ai_webhook', '' );
	if ( $webhook ) {
		$response = wp_remote_post( $webhook, array(
			'timeout' => 20,
			'headers' => array( 'Content-Type' => 'application/json' ),
			'body'    => wp_json_encode( array(
				'message' => $message,
				'lang'    => amz_prints_lang(),
				'site'    => home_url( '/' ),
			) ),
		) );
		if ( ! is_wp_error( $response ) ) {
			$body = json_decode( wp_remote_retrieve_body( $response ), true );
			if ( ! empty( $body['reply'] ) ) {
				wp_send_json_success( array( 'reply' => sanitize_text_field( $body['reply'] ) ) );
			}
		}
	}

	wp_send_json_success( array( 'reply' => amz_prints_ai_local_reply( $message ) ) );
}
add_action( 'wp_ajax_amz_ai_chat', 'amz_prints_ai_chat_ajax' );
add_action( 'wp_ajax_nopriv_amz_ai_chat', 'amz_prints_ai_chat_ajax' );

function amz_prints_ai_local_reply( $message ) {
	$lower = mb_strtolower( $message );
	$ur    = function_exists( 'amz_prints_is_rtl' ) && amz_prints_is_rtl();

	$map = $ur ? array(
		array( array( 'قیمت', 'ریٹ', 'کوٹ', 'quote', 'price' ), 'کوٹیشن کے لیے Get a Quote کھولیں، یا واٹس ایپ پر سائز/مقدار بھیجیں۔' ),
		array( array( 'ٹریک', 'آرڈر', 'track', 'order' ), 'Track Order صفحے پر آرڈر آئی ڈی درج کریں۔' ),
		array( array( 'نادرا', 'cnic', 'nadra' ), 'ہم مجاز نادرا پارٹنر ہیں۔ NADRA صفحہ دیکھیں یا واٹس ایپ پر پوچھیں۔' ),
		array( array( 'پرنٹ', 'بینر', 'کارڈ', 'print', 'banner' ), 'ڈیجیٹل، آفسیٹ، لارج فارمیٹ، یو وی، ڈی ٹی ایف دستیاب ہیں۔ Services مینو کھولیں۔' ),
		array( array( 'پیکجنگ', 'box', 'packaging' ), 'پروڈکٹ باکسز، فوڈ پیکجنگ، لیبلز اور کسٹم پیکجنگ دستیاب ہے۔' ),
		array( array( 'السلام', 'hello', 'hi', 'salam' ), 'السلام علیکم! AMZ Prints اسسٹنٹ حاضر ہے۔ پوچھیں: کوٹیشن، سروسز، ٹریکنگ۔' ),
	) : array(
		array( array( 'price', 'quote', 'cost', 'rate' ), 'Open Get a Quote with size, quantity and finish — or WhatsApp us for a fast estimate.' ),
		array( array( 'track', 'order', 'status' ), 'Go to Track Order and enter your Order ID for live status.' ),
		array( array( 'nadra', 'cnic', 'frc' ), 'We are an authorized NADRA partner. Open the NADRA page or WhatsApp for help.' ),
		array( array( 'print', 'banner', 'card', 'offset', 'digital', 'uv', 'dtf' ), 'We offer digital, offset, large format, UV, screen, DTF and sublimation. Open Services.' ),
		array( array( 'packaging', 'box', 'label' ), 'Packaging includes product boxes, food packs, labels and custom packaging.' ),
		array( array( 'hello', 'hi', 'salam', 'hey' ), 'Hello! I am the AMZ Prints assistant. Ask about quotes, services, tracking or NADRA.' ),
	);

	foreach ( $map as $row ) {
		foreach ( $row[0] as $key ) {
			if ( false !== mb_strpos( $lower, mb_strtolower( $key ) ) ) {
				return $row[1];
			}
		}
	}

	return $ur
		? 'میں پرنٹنگ، برانڈنگ، پیکجنگ، نادرا اور آرڈر ٹریکنگ میں مدد کر سکتا ہوں۔ یا واٹس ایپ فلو بٹن استعمال کریں۔'
		: 'I can help with printing, branding, packaging, NADRA and tracking — or use the WhatsApp Flow button.';
}
