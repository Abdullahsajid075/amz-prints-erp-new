<?php
/**
 * AMZ Prints Theme Functions
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AMZ_PRINTS_VERSION', '3.0.8' );

/**
 * Avoid long Hostinger CDN HTML cache hiding theme updates.
 */
function amz_prints_nocache_html_headers() {
	if ( is_admin() ) {
		return;
	}
	// HTML pages should revalidate quickly after theme publishes.
	header( 'Cache-Control: no-cache, no-store, must-revalidate, max-age=0', true );
	header( 'Pragma: no-cache', true );
	header( 'Expires: 0', true );
	header( 'CDN-Cache-Control: no-store', true );
	header( 'Cloudflare-CDN-Cache-Control: no-store', true );
}
add_action( 'template_redirect', 'amz_prints_nocache_html_headers', 0 );

/**
 * Admin reminder: Customizer can show new theme while CDN serves old homepage.
 */
function amz_prints_admin_cache_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || ! in_array( $screen->id, array( 'themes', 'dashboard', 'toplevel_page_hostinger' ), true ) ) {
		// Show on Themes + Dashboard.
		if ( ! $screen || ( 'themes' !== $screen->id && 'dashboard' !== $screen->id ) ) {
			return;
		}
	}
	echo '<div class="notice notice-warning"><p><strong>AMZ Prints:</strong> If Login shows in Customizer but not on the live homepage, purge <em>Hostinger Cache / CDN</em> (hPanel → Cache → Clear All). Test with <code>/?v=1</code> — that bypasses stale CDN HTML.</p></div>';
}
add_action( 'admin_notices', 'amz_prints_admin_cache_notice' );
define( 'AMZ_PRINTS_DIR', get_template_directory() );
define( 'AMZ_PRINTS_URI', get_template_directory_uri() );

require_once AMZ_PRINTS_DIR . '/inc/services-catalog.php';
require_once AMZ_PRINTS_DIR . '/inc/company-catalog.php';
require_once AMZ_PRINTS_DIR . '/inc/catalog-book-ui.php';
require_once AMZ_PRINTS_DIR . '/inc/enqueue.php';
require_once AMZ_PRINTS_DIR . '/inc/customizer.php';
require_once AMZ_PRINTS_DIR . '/inc/post-types.php';
require_once AMZ_PRINTS_DIR . '/inc/i18n.php';
require_once AMZ_PRINTS_DIR . '/inc/track-order.php';
require_once AMZ_PRINTS_DIR . '/inc/erp-api.php';
require_once AMZ_PRINTS_DIR . '/inc/customer-portal.php';
require_once AMZ_PRINTS_DIR . '/inc/commerce.php';

/**
 * Theme setup
 */
function amz_prints_setup() {
	load_theme_textdomain( 'amz-prints', AMZ_PRINTS_DIR . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'custom-logo', array(
		'height'      => 80,
		'width'       => 240,
		'flex-height' => true,
		'flex-width'  => true,
	) );
	add_theme_support( 'custom-background', array(
		'default-color' => 'f5f7fb',
	) );
	add_theme_support( 'align-wide' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/main.css' );

	add_image_size( 'amz-hero', 1920, 1080, true );
	add_image_size( 'amz-card', 800, 600, true );
	add_image_size( 'amz-product', 640, 640, true );

	register_nav_menus( array(
		'primary' => __( 'Primary Menu', 'amz-prints' ),
		'footer'  => __( 'Footer Menu', 'amz-prints' ),
	) );
}
add_action( 'after_setup_theme', 'amz_prints_setup' );

/**
 * Widget areas
 */
function amz_prints_widgets_init() {
	register_sidebar( array(
		'name'          => __( 'Footer Column 1', 'amz-prints' ),
		'id'            => 'footer-1',
		'before_widget' => '<div class="footer-widget">',
		'after_widget'  => '</div>',
		'before_title'  => '<h4 class="footer-widget__title">',
		'after_title'   => '</h4>',
	) );
	register_sidebar( array(
		'name'          => __( 'Footer Column 2', 'amz-prints' ),
		'id'            => 'footer-2',
		'before_widget' => '<div class="footer-widget">',
		'after_widget'  => '</div>',
		'before_title'  => '<h4 class="footer-widget__title">',
		'after_title'   => '</h4>',
	) );
	register_sidebar( array(
		'name'          => __( 'Footer Column 3', 'amz-prints' ),
		'id'            => 'footer-3',
		'before_widget' => '<div class="footer-widget">',
		'after_widget'  => '</div>',
		'before_title'  => '<h4 class="footer-widget__title">',
		'after_title'   => '</h4>',
	) );
}
add_action( 'widgets_init', 'amz_prints_widgets_init' );

/**
 * Helper: theme mod with fallback
 */
function amz_prints_mod( $key, $default = '' ) {
	return get_theme_mod( $key, $default );
}

/**
 * Output inline CSS variables from Customizer
 */
function amz_prints_custom_css_vars() {
	$primary   = sanitize_hex_color( amz_prints_mod( 'amz_primary_color', '#F26522' ) );
	$secondary = sanitize_hex_color( amz_prints_mod( 'amz_secondary_color', '#1A1A1A' ) );
	$accent    = sanitize_hex_color( amz_prints_mod( 'amz_accent_color', '#10B981' ) );
	?>
	<style id="amz-prints-vars">
		:root {
			--amz-primary: <?php echo esc_attr( $primary ); ?>;
			--amz-secondary: <?php echo esc_attr( $secondary ); ?>;
			--amz-accent: <?php echo esc_attr( $accent ); ?>;
		}
	</style>
	<?php
}
add_action( 'wp_head', 'amz_prints_custom_css_vars', 20 );

/**
 * Excerpt length
 */
function amz_prints_excerpt_length( $length ) {
	return 22;
}
add_filter( 'excerpt_length', 'amz_prints_excerpt_length' );

/**
 * Body classes
 */
function amz_prints_body_classes( $classes ) {
	if ( is_front_page() ) {
		$classes[] = 'amz-home';
	}
	return $classes;
}
add_filter( 'body_class', 'amz_prints_body_classes' );

/**
 * Fallback primary menu
 */
function amz_prints_fallback_menu() {
	$pages = array(
		'/'               => 'Home',
		'/services/'      => 'Services',
		'/products/'      => 'Products',
		'/how-we-work/'   => 'How We Work',
		'/nadra-e-services/' => 'NADRA E-Services',
		'/track-order/'   => 'Track Order',
		'/gallery/'       => 'Gallery',
		'/about/'         => 'About',
		'/contact/'       => 'Contact',
	);
	echo '<ul class="site-nav__list">';
	foreach ( $pages as $path => $label ) {
		printf(
			'<li><a href="%s">%s</a></li>',
			esc_url( home_url( $path ) ),
			esc_html( $label )
		);
	}
	echo '</ul>';
}

/**
 * Default pages map
 */
function amz_prints_default_pages() {
	return array(
		'home'             => array( 'title' => 'Home', 'template' => '' ),
		'about'            => array( 'title' => 'About', 'template' => 'page-templates/template-about.php' ),
		'services'         => array( 'title' => 'Services', 'template' => 'page-templates/template-services.php' ),
		'products'         => array( 'title' => 'Products', 'template' => 'page-templates/template-products.php' ),
		'pricing'          => array( 'title' => 'Pricing', 'template' => 'page-templates/template-pricing.php' ),
		'how-we-work'      => array( 'title' => 'How We Work', 'template' => 'page-templates/template-how-we-work.php' ),
		'nadra-e-services' => array( 'title' => 'NADRA E-Services', 'template' => 'page-templates/template-nadra.php' ),
		'track-order'      => array( 'title' => 'Track Order', 'template' => 'page-templates/template-track-order.php' ),
		'customer-login'   => array( 'title' => 'Customer Login', 'template' => 'page-templates/template-customer-login.php' ),
		'my-account'       => array( 'title' => 'My Account', 'template' => 'page-templates/template-my-account.php' ),
		'product'          => array( 'title' => 'Product', 'template' => 'page-templates/template-product.php' ),
		'cart'             => array( 'title' => 'Cart', 'template' => 'page-templates/template-cart.php' ),
		'checkout'         => array( 'title' => 'Checkout', 'template' => 'page-templates/template-checkout.php' ),
		'digital-services'         => array( 'title' => 'Digital Services', 'template' => 'page-templates/template-digital-services.php' ),
		'company-profile'          => array( 'title' => 'Company Profile', 'template' => 'page-templates/template-company-profile.php' ),
		'company-profile-print'    => array( 'title' => 'Print & Design Profile', 'template' => 'page-templates/template-company-profile-print.php' ),
		'company-profile-digital'  => array( 'title' => 'Digital Services Profile', 'template' => 'page-templates/template-company-profile-digital.php' ),
		'gallery'          => array( 'title' => 'Gallery', 'template' => 'page-templates/template-gallery.php' ),
		'quote'            => array( 'title' => 'Get a Quote', 'template' => 'page-templates/template-quote.php' ),
		'contact'          => array( 'title' => 'Contact', 'template' => 'page-templates/template-contact.php' ),
	);
}

/**
 * Ensure theme pages exist (activation + upgrades)
 */
function amz_prints_ensure_pages() {
	$created = array();
	foreach ( amz_prints_default_pages() as $slug => $data ) {
		$existing = get_page_by_path( $slug );
		if ( ! $existing ) {
			$id = wp_insert_post( array(
				'post_title'   => $data['title'],
				'post_name'    => $slug,
				'post_status'  => 'publish',
				'post_type'    => 'page',
				'post_content' => '',
			) );
			if ( $id && ! is_wp_error( $id ) && $data['template'] ) {
				update_post_meta( $id, '_wp_page_template', $data['template'] );
			}
			$created[ $slug ] = $id;
		} else {
			$created[ $slug ] = $existing->ID;
			if ( $data['template'] ) {
				update_post_meta( $existing->ID, '_wp_page_template', $data['template'] );
			}
		}
	}
	return $created;
}

/**
 * Create default pages on theme activation
 */
function amz_prints_after_switch() {
	$created = amz_prints_ensure_pages();

	if ( ! empty( $created['home'] ) ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $created['home'] );
	}

	if ( ! wp_get_nav_menu_object( 'Primary' ) ) {
		$menu_id = wp_create_nav_menu( 'Primary' );
		$order   = 1;
		$map     = array(
			'home'             => 'Home',
			'services'         => 'Services',
			'products'         => 'Products',
			'how-we-work'      => 'How We Work',
			'nadra-e-services' => 'NADRA',
			'track-order'      => 'Track Order',
			'gallery'          => 'Gallery',
			'about'            => 'About',
			'quote'            => 'Get a Quote',
			'contact'          => 'Contact',
		);
		foreach ( $map as $slug => $label ) {
			if ( empty( $created[ $slug ] ) ) {
				continue;
			}
			wp_update_nav_menu_item( $menu_id, 0, array(
				'menu-item-title'     => $label,
				'menu-item-object'    => 'page',
				'menu-item-object-id' => $created[ $slug ],
				'menu-item-type'      => 'post_type',
				'menu-item-status'    => 'publish',
				'menu-item-position'  => $order++,
			) );
		}
		$locations            = get_theme_mod( 'nav_menu_locations', array() );
		$locations['primary'] = $menu_id;
		$locations['footer']  = $menu_id;
		set_theme_mod( 'nav_menu_locations', $locations );
	}

	amz_prints_seed_demo_content();
	flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'amz_prints_after_switch' );

/**
 * Create missing pages on upgrade (fixes Services 404 without re-activating theme)
 */
function amz_prints_maybe_upgrade_pages() {
	if ( get_option( 'amz_prints_pages_ver' ) === '3.0.7' ) {
		return;
	}
	amz_prints_ensure_pages();
	flush_rewrite_rules( false );
	update_option( 'amz_prints_pages_ver', '3.0.7' );
}
add_action( 'init', 'amz_prints_maybe_upgrade_pages', 20 );

/**
 * Seed demo products & services
 */
function amz_prints_seed_demo_content() {
	if ( get_option( 'amz_prints_seeded' ) ) {
		return;
	}

	$services = array(
		array(
			'title'   => 'Offset Printing',
			'content' => 'High-volume commercial printing with crisp color accuracy for brochures, catalogs, and marketing collateral.',
			'icon'    => 'layers',
		),
		array(
			'title'   => 'Digital Printing',
			'content' => 'Fast turnaround short runs with vibrant quality — perfect for flyers, business cards, and custom jobs.',
			'icon'    => 'zap',
		),
		array(
			'title'   => 'Large Format',
			'content' => 'Banners, vinyl, foam boards, and outdoor signage that command attention at any scale.',
			'icon'    => 'maximize',
		),
		array(
			'title'   => 'Packaging & Boxes',
			'content' => 'Custom packaging that protects your product and elevates your brand on the shelf.',
			'icon'    => 'package',
		),
		array(
			'title'   => 'Branding & Design',
			'content' => 'From logo systems to full campaign kits — design that prints beautifully.',
			'icon'    => 'pen',
		),
		array(
			'title'   => 'Vehicle Branding',
			'content' => 'Wraps and fleet graphics that turn every drive into a moving billboard.',
			'icon'    => 'truck',
		),
	);

	foreach ( $services as $i => $service ) {
		$id = wp_insert_post( array(
			'post_title'   => $service['title'],
			'post_content' => $service['content'],
			'post_status'  => 'publish',
			'post_type'    => 'amz_service',
			'menu_order'   => $i,
		) );
		if ( $id && ! is_wp_error( $id ) ) {
			update_post_meta( $id, '_amz_icon', $service['icon'] );
		}
	}

	$products = array(
		array( 'title' => 'Business Cards', 'content' => 'Premium stocks, spot UV, foil, and die-cuts that make first impressions last.', 'price' => 'From $25' ),
		array( 'title' => 'Flyers & Brochures', 'content' => 'Eye-catching marketing print in any fold, finish, and quantity.', 'price' => 'From $40' ),
		array( 'title' => 'Banners & Signage', 'content' => 'Indoor and outdoor banners engineered for color and durability.', 'price' => 'From $60' ),
		array( 'title' => 'Stickers & Labels', 'content' => 'Custom die-cut stickers and product labels in vinyl or paper.', 'price' => 'From $20' ),
		array( 'title' => 'Letterheads & Stationery', 'content' => 'Complete branded stationery sets for a polished professional look.', 'price' => 'From $35' ),
		array( 'title' => 'Custom Apparel', 'content' => 'Screen print and DTG apparel for teams, events, and merch drops.', 'price' => 'From $15' ),
	);

	foreach ( $products as $i => $product ) {
		$id = wp_insert_post( array(
			'post_title'   => $product['title'],
			'post_content' => $product['content'],
			'post_status'  => 'publish',
			'post_type'    => 'amz_product',
			'menu_order'   => $i,
		) );
		if ( $id && ! is_wp_error( $id ) ) {
			update_post_meta( $id, '_amz_price_label', $product['price'] );
		}
	}

	update_option( 'amz_prints_seeded', 1 );
}

/**
 * Contact / quote form handlers (emails site admin)
 */
function amz_prints_handle_contact() {
	if ( ! isset( $_POST['amz_contact_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['amz_contact_nonce'] ) ), 'amz_contact' ) ) {
		wp_die( esc_html__( 'Security check failed.', 'amz-prints' ) );
	}
	$name    = sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) );
	$email   = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) );
	$phone   = sanitize_text_field( wp_unslash( $_POST['phone'] ?? '' ) );
	$message = sanitize_textarea_field( wp_unslash( $_POST['message'] ?? '' ) );
	$to      = amz_prints_mod( 'amz_email', get_option( 'admin_email' ) );
	$subject = sprintf( '[%s] Contact from %s', amz_prints_mod( 'amz_company_name', 'AMZ Prints' ), $name );
	$body    = "Name: $name\nEmail: $email\nPhone: $phone\n\n$message";
	wp_mail( $to, $subject, $body, array( 'Reply-To: ' . $email ) );
	wp_safe_redirect( add_query_arg( 'sent', '1', wp_get_referer() ?: home_url( '/contact/' ) ) );
	exit;
}
add_action( 'admin_post_amz_contact_form', 'amz_prints_handle_contact' );
add_action( 'admin_post_nopriv_amz_contact_form', 'amz_prints_handle_contact' );

function amz_prints_handle_quote() {
	if ( ! isset( $_POST['amz_quote_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['amz_quote_nonce'] ) ), 'amz_quote' ) ) {
		wp_die( esc_html__( 'Security check failed.', 'amz-prints' ) );
	}
	$fields = array( 'name', 'company', 'email', 'phone', 'product', 'quantity', 'needed_by', 'details' );
	$lines  = array();
	foreach ( $fields as $field ) {
		$val = isset( $_POST[ $field ] ) ? sanitize_text_field( wp_unslash( $_POST[ $field ] ) ) : '';
		if ( 'details' === $field && isset( $_POST['details'] ) ) {
			$val = sanitize_textarea_field( wp_unslash( $_POST['details'] ) );
		}
		$lines[] = ucfirst( str_replace( '_', ' ', $field ) ) . ': ' . $val;
	}
	$to      = amz_prints_mod( 'amz_email', get_option( 'admin_email' ) );
	$name    = sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) );
	$email   = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) );
	$subject = sprintf( '[%s] Quote request from %s', amz_prints_mod( 'amz_company_name', 'AMZ Prints' ), $name );
	wp_mail( $to, $subject, implode( "\n", $lines ), array( 'Reply-To: ' . $email ) );
	wp_safe_redirect( add_query_arg( 'sent', '1', wp_get_referer() ?: home_url( '/quote/' ) ) );
	exit;
}
add_action( 'admin_post_amz_quote_form', 'amz_prints_handle_quote' );
add_action( 'admin_post_nopriv_amz_quote_form', 'amz_prints_handle_quote' );
