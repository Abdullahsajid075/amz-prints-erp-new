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
	if ( amz_prints_is_catalog_book() ) {
		$fonts = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Source+Sans+3:wght@400;500;600;700&display=swap';
		wp_enqueue_style( 'amz-prints-fonts', $fonts, array(), null );
		wp_enqueue_style( 'amz-prints-main', AMZ_PRINTS_URI . '/assets/css/main.css', array( 'amz-prints-fonts' ), AMZ_PRINTS_VERSION );
		wp_enqueue_style( 'amz-prints-catalog', AMZ_PRINTS_URI . '/assets/css/catalog-atelier.css', array( 'amz-prints-main' ), AMZ_PRINTS_VERSION );
		wp_enqueue_script(
			'amz-prints-pageflip',
			AMZ_PRINTS_URI . '/assets/js/vendor/page-flip.browser.min.js',
			array(),
			'2.0.7',
			true
		);
		wp_enqueue_script(
			'amz-prints-catalog-flipbook',
			AMZ_PRINTS_URI . '/assets/js/catalog-flipbook.js',
			array( 'amz-prints-pageflip' ),
			AMZ_PRINTS_VERSION,
			true
		);
		wp_enqueue_script(
			'amz-prints-catalog-pdf',
			AMZ_PRINTS_URI . '/assets/js/catalog-pdf.js',
			array( 'amz-prints-catalog-flipbook' ),
			AMZ_PRINTS_VERSION,
			true
		);
		$filename = 'AMZ-Prints-Company-Profile.pdf';
		$pdf_url  = '';
		$images   = array();
		if ( is_page( 'company-profile-print' ) || is_page_template( 'page-templates/template-company-profile-print.php' ) ) {
			$filename = 'Amazon-Printings-Company-Profile.pdf';
			$pdf_url  = amz_prints_catalog_pdf_file( 'print' );
			$images   = amz_prints_catalog_page_images( 'print' );
		} elseif ( is_page( 'company-profile-digital' ) || is_page_template( 'page-templates/template-company-profile-digital.php' ) ) {
			$filename = 'AMZ-Prints-Digital-Services-Profile.pdf';
			$pdf_url  = amz_prints_catalog_pdf_file( 'digital' );
			$images   = amz_prints_catalog_page_images( 'digital' );
		}
		wp_localize_script(
			'amz-prints-catalog-flipbook',
			'amzFlipbook',
			array(
				'images' => $images,
			)
		);
		wp_localize_script(
			'amz-prints-catalog-pdf',
			'amzCatalogPdf',
			array(
				'filename' => $filename,
				'pdfUrl'   => $pdf_url,
			)
		);
		return;
	}

	$fonts = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@500;600;700;800&display=swap';

	wp_enqueue_style( 'amz-prints-fonts', $fonts, array(), null );
	wp_enqueue_style( 'amz-prints-main', AMZ_PRINTS_URI . '/assets/css/main.css', array( 'amz-prints-fonts' ), AMZ_PRINTS_VERSION );

	wp_enqueue_script( 'amz-prints-main', AMZ_PRINTS_URI . '/assets/js/main.js', array(), AMZ_PRINTS_VERSION, true );
	wp_enqueue_script( 'amz-prints-customer', AMZ_PRINTS_URI . '/assets/js/customer-portal.js', array(), AMZ_PRINTS_VERSION, true );
	wp_enqueue_script( 'amz-prints-commerce', AMZ_PRINTS_URI . '/assets/js/commerce.js', array(), AMZ_PRINTS_VERSION, true );
	wp_enqueue_script( 'amz-prints-popup', AMZ_PRINTS_URI . '/assets/js/promo-popup.js', array(), AMZ_PRINTS_VERSION, true );

	$is_cv = is_page_template( 'page-templates/template-cv-builder.php' ) || is_page( 'create-free-cv' );
	if ( $is_cv ) {
		wp_enqueue_style(
			'amz-prints-cv-fonts',
			'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&display=swap',
			array(),
			null
		);
		wp_enqueue_style( 'amz-prints-cv', AMZ_PRINTS_URI . '/assets/css/cv-builder.css', array( 'amz-prints-main' ), AMZ_PRINTS_VERSION );
		wp_enqueue_script( 'amz-prints-cv', AMZ_PRINTS_URI . '/assets/js/cv-builder.js', array(), AMZ_PRINTS_VERSION, true );
	}

	$google_client = trim( (string) amz_prints_mod( 'amz_google_client_id', '' ) );
	if ( $google_client && ( is_page_template( 'page-templates/template-customer-login.php' ) || is_page( 'customer-login' ) ) ) {
		wp_enqueue_script( 'google-gsi', 'https://accounts.google.com/gsi/client', array(), null, true );
	}

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

	wp_localize_script( 'amz-prints-customer', 'amzCustomer', array(
		'ajaxUrl'       => admin_url( 'admin-ajax.php' ),
		'nonce'         => wp_create_nonce( 'amz_prints_customer' ),
		'googleClientId'=> $google_client,
		'accountUrl'    => home_url( '/my-account/' ),
		'loginUrl'      => home_url( '/customer-login/' ),
		'loggedIn'      => function_exists( 'amz_prints_customer_is_logged_in' ) ? amz_prints_customer_is_logged_in() : false,
	) );

	// Keep localize lean — full catalog is printed as JSON in footer (avoids broken JS from data:image).
	wp_localize_script( 'amz-prints-commerce', 'amzCommerce', array(
		'ajaxUrl'    => admin_url( 'admin-ajax.php' ),
		'nonce'      => wp_create_nonce( 'amz_prints_commerce' ),
		'cartUrl'    => home_url( '/cart/' ),
		'checkoutUrl'=> home_url( '/checkout/' ),
		'quoteUrl'   => home_url( '/quote/' ),
		'cartCount'  => function_exists( 'amz_prints_cart_count' ) ? amz_prints_cart_count() : 0,
		'loggedIn'   => function_exists( 'amz_prints_customer_is_logged_in' ) ? amz_prints_customer_is_logged_in() : false,
		'products'   => array(),
	) );
}
add_action( 'wp_enqueue_scripts', 'amz_prints_enqueue_assets' );

/**
 * Print product catalog JSON for the product modal (reliable vs wp_localize size limits).
 */
function amz_prints_print_products_json() {
	if ( is_admin() || ( function_exists( 'amz_prints_is_catalog_book' ) && amz_prints_is_catalog_book() ) ) {
		return;
	}
	if ( is_page_template( 'page-templates/template-cv-builder.php' ) || is_page( 'create-free-cv' ) ) {
		return;
	}
	$catalog = function_exists( 'amz_prints_commerce_product_catalog' )
		? amz_prints_commerce_product_catalog()
		: array();
	echo '<script type="application/json" id="amz-products-data">' . wp_json_encode( $catalog ) . '</script>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}
add_action( 'wp_footer', 'amz_prints_print_products_json', 5 );

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
