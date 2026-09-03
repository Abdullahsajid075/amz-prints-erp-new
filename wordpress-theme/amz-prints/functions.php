<?php
/**
 * AMZ Prints Theme Functions
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AMZ_PRINTS_VERSION', '2.2.0' );
define( 'AMZ_PRINTS_DIR', get_template_directory() );
define( 'AMZ_PRINTS_URI', get_template_directory_uri() );

require_once AMZ_PRINTS_DIR . '/inc/enqueue.php';
require_once AMZ_PRINTS_DIR . '/inc/customizer.php';
require_once AMZ_PRINTS_DIR . '/inc/post-types.php';
require_once AMZ_PRINTS_DIR . '/inc/i18n.php';
require_once AMZ_PRINTS_DIR . '/inc/services-catalog.php';
require_once AMZ_PRINTS_DIR . '/inc/track-order.php';
require_once AMZ_PRINTS_DIR . '/inc/erp-api.php';

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
		'gallery'          => array( 'title' => 'Gallery', 'template' => 'page-templates/template-gallery.php' ),
		'quote'            => array( 'title' => 'Get a Quote', 'template' => 'page-templates/template-quote.php' ),
		'contact'          => array( 'title' => 'Contact', 'template' => 'page-templates/template-contact.php' ),
		'free-cv'          => array( 'title' => 'Free CV', 'template' => 'page-templates/template-free-cv.php' ),
		'login'            => array( 'title' => 'Login', 'template' => 'page-templates/template-login.php' ),
		'signup'           => array( 'title' => 'Sign Up', 'template' => 'page-templates/template-signup.php' ),
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
	if ( get_option( 'amz_prints_pages_ver' ) === '1.4.0' ) {
		return;
	}
	amz_prints_ensure_pages();
	flush_rewrite_rules( false );
	update_option( 'amz_prints_pages_ver', '1.4.0' );
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

/**
 * Account pages helper — safe redirect target within the site.
 */
function amz_prints_safe_redirect_target( $requested = '' ) {
	$default = home_url( '/free-cv/' );
	$requested = trim( (string) $requested );
	if ( ! $requested ) {
		return $default;
	}
	$target = wp_validate_redirect( $requested, $default );
	return $target ? $target : $default;
}

/**
 * Handle custom LOGIN form (separate login page).
 */
function amz_prints_handle_login() {
	if ( ! isset( $_POST['amz_login_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['amz_login_nonce'] ) ), 'amz_login' ) ) {
		wp_die( esc_html__( 'Security check failed.', 'amz-prints' ) );
	}
	$login    = sanitize_text_field( wp_unslash( $_POST['log'] ?? '' ) );
	$password = (string) ( $_POST['pwd'] ?? '' );
	$redirect = amz_prints_safe_redirect_target( wp_unslash( $_POST['redirect_to'] ?? '' ) );

	$user = wp_signon( array(
		'user_login'    => $login,
		'user_password' => $password,
		'remember'      => ! empty( $_POST['rememberme'] ),
	), is_ssl() );

	if ( is_wp_error( $user ) ) {
		$url = add_query_arg( 'login_error', rawurlencode( $user->get_error_message() ), home_url( '/login/' ) );
		if ( ! empty( $_POST['redirect_to'] ) ) {
			$url = add_query_arg( 'redirect_to', rawurlencode( wp_unslash( $_POST['redirect_to'] ) ), $url );
		}
		wp_safe_redirect( $url );
		exit;
	}

	wp_safe_redirect( $redirect );
	exit;
}
add_action( 'admin_post_nopriv_amz_login', 'amz_prints_handle_login' );
add_action( 'admin_post_amz_login', 'amz_prints_handle_login' );

/**
 * Handle custom SIGN UP form (separate signup page). Creates + logs in the user.
 */
function amz_prints_handle_register() {
	if ( ! isset( $_POST['amz_signup_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['amz_signup_nonce'] ) ), 'amz_signup' ) ) {
		wp_die( esc_html__( 'Security check failed.', 'amz-prints' ) );
	}
	$name     = sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) );
	$email    = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) );
	$password = (string) ( $_POST['pwd'] ?? '' );
	$redirect = amz_prints_safe_redirect_target( wp_unslash( $_POST['redirect_to'] ?? '' ) );

	$fail = function ( $msg ) use ( $email ) {
		$url = add_query_arg( array(
			'signup_error' => rawurlencode( $msg ),
			'email'        => rawurlencode( $email ),
		), home_url( '/signup/' ) );
		wp_safe_redirect( $url );
		exit;
	};

	if ( ! $email || ! is_email( $email ) ) {
		$fail( __( 'Please enter a valid email address.', 'amz-prints' ) );
	}
	if ( strlen( $password ) < 6 ) {
		$fail( __( 'Password must be at least 6 characters.', 'amz-prints' ) );
	}
	if ( email_exists( $email ) ) {
		$fail( __( 'An account with this email already exists. Please log in.', 'amz-prints' ) );
	}

	$username = sanitize_user( current( explode( '@', $email ) ), true );
	$base     = $username ? $username : 'user';
	$try      = $base;
	$i        = 1;
	while ( username_exists( $try ) ) {
		$try = $base . $i;
		$i++;
	}

	$user_id = wp_insert_user( array(
		'user_login'   => $try,
		'user_email'   => $email,
		'user_pass'    => $password,
		'display_name' => $name ? $name : $try,
		'first_name'   => $name,
		'role'         => 'subscriber',
	) );

	if ( is_wp_error( $user_id ) ) {
		$fail( $user_id->get_error_message() );
	}

	wp_set_current_user( $user_id );
	wp_set_auth_cookie( $user_id, true, is_ssl() );
	wp_safe_redirect( $redirect );
	exit;
}
add_action( 'admin_post_nopriv_amz_register', 'amz_prints_handle_register' );
add_action( 'admin_post_amz_register', 'amz_prints_handle_register' );

/**
 * Handle logout link (from Free CV portal).
 */
function amz_prints_handle_logout() {
	if ( ! isset( $_GET['amz_logout_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['amz_logout_nonce'] ) ), 'amz_logout' ) ) {
		wp_die( esc_html__( 'Security check failed.', 'amz-prints' ) );
	}
	wp_logout();
	wp_safe_redirect( home_url( '/login/' ) );
	exit;
}
add_action( 'admin_post_amz_logout', 'amz_prints_handle_logout' );
add_action( 'admin_post_nopriv_amz_logout', 'amz_prints_handle_logout' );

/**
 * Resolve a Customizer media attachment ID to a URL (empty string if none).
 */
function amz_prints_attachment_url( $id, $size = 'large' ) {
	$id = absint( $id );
	if ( ! $id ) {
		return '';
	}
	$url = wp_get_attachment_image_url( $id, $size );
	return $url ? $url : '';
}

/**
 * Hero product parts (4 rotating tiles) from Customizer, with sensible fallbacks.
 *
 * @return array List of { image, label, url }.
 */
function amz_prints_hero_parts() {
	$defaults = array(
		array( 'Business Cards', 'https://images.unsplash.com/photo-1611095973763-414019e72400?auto=format&fit=crop&w=600&q=80' ),
		array( 'Banners & Signage', 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' ),
		array( 'Packaging & Boxes', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=600&q=80' ),
		array( 'Custom Apparel', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80' ),
	);
	$parts = array();
	for ( $i = 1; $i <= 4; $i++ ) {
		$image = amz_prints_attachment_url( amz_prints_mod( "amz_hero_part_{$i}_image", 0 ), 'amz-card' );
		$label = trim( (string) amz_prints_mod( "amz_hero_part_{$i}_label", '' ) );
		$url   = trim( (string) amz_prints_mod( "amz_hero_part_{$i}_url", '' ) );
		if ( ! $image ) {
			$image = $defaults[ $i - 1 ][1];
		}
		if ( ! $label ) {
			$label = $defaults[ $i - 1 ][0];
		}
		if ( ! $url ) {
			$url = home_url( '/products/' );
		}
		$parts[] = array(
			'image' => $image,
			'label' => $label,
			'url'   => $url,
		);
	}
	return $parts;
}

/**
 * CV portal rotating advertisement images from Customizer.
 *
 * @return array { images: string[], url: string }
 */
function amz_prints_cv_ads() {
	$images = array();
	for ( $i = 1; $i <= 3; $i++ ) {
		$url = amz_prints_attachment_url( amz_prints_mod( "amz_cv_ad_{$i}", 0 ), 'large' );
		if ( $url ) {
			$images[] = $url;
		}
	}
	if ( empty( $images ) ) {
		$images = array(
			'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=900&q=80',
			'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
			'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80',
		);
	}
	return array(
		'images' => $images,
		'url'    => trim( (string) amz_prints_mod( 'amz_cv_ad_url', '' ) ),
	);
}

/**
 * CV portal vertical side banner (image + link to a Store product).
 *
 * @return array { image: string, url: string }
 */
function amz_prints_cv_banner() {
	$image  = amz_prints_attachment_url( amz_prints_mod( 'amz_cv_banner_image', 0 ), 'large' );
	$custom = trim( (string) amz_prints_mod( 'amz_cv_banner_url', '' ) );
	$url    = $custom;
	if ( ! $url ) {
		$pid = absint( amz_prints_mod( 'amz_cv_banner_product', 0 ) );
		if ( $pid ) {
			$permalink = get_permalink( $pid );
			$url       = $permalink ? $permalink : '';
		}
	}
	if ( ! $image ) {
		$image = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=500&q=80';
	}
	if ( ! $url ) {
		$url = home_url( '/products/' );
	}
	return array(
		'image' => $image,
		'url'   => $url,
	);
}
