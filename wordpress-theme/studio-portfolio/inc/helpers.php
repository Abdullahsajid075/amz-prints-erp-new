<?php
/**
 * Theme helper functions
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get theme mod value.
 *
 * @param string $key     Setting key without studio_ prefix.
 * @param mixed  $default Default value.
 * @return mixed
 */
function studio_get_option( $key, $default = '' ) {
	return get_theme_mod( 'studio_' . $key, $default );
}

/**
 * Get textarea setting as trimmed lines.
 *
 * @param string $key     Setting key.
 * @param string $default Default multiline string.
 * @return array
 */
function studio_get_lines( $key, $default = '' ) {
	$value = studio_get_option( $key, $default );
	if ( empty( $value ) ) {
		return array();
	}
	return array_values( array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', $value ) ) ) );
}

/**
 * Get configured services.
 *
 * @return array
 */
function studio_get_services() {
	$services = array();
	for ( $i = 1; $i <= 4; $i++ ) {
		$title = studio_get_option( "service_{$i}_title", '' );
		$desc  = studio_get_option( "service_{$i}_desc", '' );
		$icon  = studio_get_option( "service_{$i}_icon", '🎨' );
		if ( $title || $desc ) {
			$services[] = array(
				'icon'  => $icon,
				'title' => $title,
				'desc'  => $desc,
			);
		}
	}
	if ( empty( $services ) ) {
		$services = array(
			array( 'icon' => '🎨', 'title' => __( 'Brand Identity', 'studio-portfolio' ), 'desc' => __( 'Logos, visual systems, and brand guidelines.', 'studio-portfolio' ) ),
			array( 'icon' => '📐', 'title' => __( 'UI/UX Design', 'studio-portfolio' ), 'desc' => __( 'Intuitive interfaces for web and mobile.', 'studio-portfolio' ) ),
			array( 'icon' => '🧩', 'title' => __( 'Design Systems', 'studio-portfolio' ), 'desc' => __( 'Scalable component libraries and tokens.', 'studio-portfolio' ) ),
			array( 'icon' => '✨', 'title' => __( 'Creative Direction', 'studio-portfolio' ), 'desc' => __( 'Campaign concepts and visual storytelling.', 'studio-portfolio' ) ),
		);
	}
	return $services;
}

/**
 * Get marquee items.
 *
 * @return array
 */
function studio_get_marquee_items() {
	$default = "Brand Identity\nUI/UX Design\nDesign Systems\nPackaging\nArt Direction\nMotion Design\nTypography\nVisual Identity";
	$items   = studio_get_lines( 'marquee_items', $default );
	return apply_filters( 'studio_marquee_items', $items );
}

/**
 * Get social links for footer/contact.
 *
 * @return array
 */
function studio_get_social_links() {
	$links = array();
	for ( $i = 1; $i <= 4; $i++ ) {
		$label = studio_get_option( "social_{$i}_label", '' );
		$url   = studio_get_option( "social_{$i}_url", '' );
		if ( $label && $url ) {
			$links[] = array(
				'label' => $label,
				'url'   => $url,
			);
		}
	}
	if ( empty( $links ) ) {
		$links = array(
			array( 'label' => 'Dribbble', 'url' => '#' ),
			array( 'label' => 'Behance', 'url' => '#' ),
			array( 'label' => 'Instagram', 'url' => '#' ),
			array( 'label' => 'LinkedIn', 'url' => '#' ),
		);
	}
	return $links;
}

/**
 * Render primary navigation.
 */
function studio_render_nav( $class = 'main-nav' ) {
	if ( has_nav_menu( 'primary' ) ) {
		wp_nav_menu( array(
			'theme_location' => 'primary',
			'container'      => false,
			'menu_class'     => $class,
			'depth'          => 1,
			'fallback_cb'    => false,
		) );
		return;
	}

	$links = array(
		array( 'label' => studio_get_option( 'nav_work', __( 'Work', 'studio-portfolio' ) ), 'url' => '#work' ),
		array( 'label' => studio_get_option( 'nav_about', __( 'About', 'studio-portfolio' ) ), 'url' => '#about' ),
		array( 'label' => studio_get_option( 'nav_system', __( 'System', 'studio-portfolio' ) ), 'url' => '#design-system' ),
		array( 'label' => studio_get_option( 'nav_contact', __( 'Contact', 'studio-portfolio' ) ), 'url' => '#contact' ),
	);
	?>
	<nav class="<?php echo esc_attr( $class ); ?>" aria-label="<?php esc_attr_e( 'Primary', 'studio-portfolio' ); ?>">
		<?php foreach ( $links as $link ) : ?>
			<a href="<?php echo esc_url( $link['url'] ); ?>"><?php echo esc_html( $link['label'] ); ?></a>
		<?php endforeach; ?>
	</nav>
	<?php
}

/**
 * Check if a homepage section is enabled.
 *
 * @param string $section Section key.
 * @return bool
 */
function studio_section_enabled( $section ) {
	return (bool) get_theme_mod( 'studio_show_' . $section, true );
}

/**
 * Get WhatsApp chat URL with optional pre-filled message.
 *
 * @param string $number  Phone with country code, digits only.
 * @param string $message Prefilled message.
 * @return string
 */
function studio_get_whatsapp_url( $number, $message = '' ) {
	$number = preg_replace( '/\D+/', '', $number );
	if ( empty( $number ) ) {
		return '';
	}
	$url = 'https://wa.me/' . $number;
	if ( $message ) {
		$url .= '?text=' . rawurlencode( $message );
	}
	return $url;
}

/**
 * Get portfolio item link — opens PDF in new tab when uploaded.
 *
 * @param int $post_id Post ID.
 * @return array{url:string,target:string,is_pdf:bool}
 */
function studio_get_portfolio_link( $post_id ) {
	$pdf_id = absint( get_post_meta( $post_id, '_portfolio_pdf', true ) );
	if ( $pdf_id ) {
		$url = wp_get_attachment_url( $pdf_id );
		if ( $url ) {
			return array(
				'url'    => $url,
				'target' => '_blank',
				'is_pdf' => true,
			);
		}
	}

	return array(
		'url'    => get_permalink( $post_id ),
		'target' => '_self',
		'is_pdf' => false,
	);
}
