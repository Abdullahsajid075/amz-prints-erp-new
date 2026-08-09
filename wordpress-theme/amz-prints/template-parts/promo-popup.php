<?php
/**
 * Promotional popup — Customizer controlled.
 *
 * @package AMZ_Prints
 */

if ( ! amz_prints_mod( 'amz_popup_enabled', false ) ) {
	return;
}

$image_id = absint( amz_prints_mod( 'amz_popup_image', 0 ) );
if ( ! $image_id ) {
	return;
}
$image_url = wp_get_attachment_image_url( $image_id, 'large' );
if ( ! $image_url ) {
	return;
}

$show = false;
if ( amz_prints_mod( 'amz_popup_page_all', false ) ) {
	$show = true;
}
if ( amz_prints_mod( 'amz_popup_page_home', true ) && is_front_page() ) {
	$show = true;
}
if ( amz_prints_mod( 'amz_popup_page_products', false ) && ( is_page( 'products' ) || is_page_template( 'page-templates/template-products.php' ) ) ) {
	$show = true;
}
if ( amz_prints_mod( 'amz_popup_page_services', false ) && ( is_page( 'services' ) || is_page_template( 'page-templates/template-services.php' ) ) ) {
	$show = true;
}
if ( ! $show ) {
	return;
}

$style      = sanitize_key( (string) amz_prints_mod( 'amz_popup_style', 'centered' ) );
$allowed    = array( 'centered', 'banner', 'corner', 'fullscreen', 'card' );
if ( ! in_array( $style, $allowed, true ) ) {
	$style = 'centered';
}
$show_close = (bool) amz_prints_mod( 'amz_popup_show_close', true );
$link       = trim( (string) amz_prints_mod( 'amz_popup_link', '' ) );
$delay      = max( 0, (int) amz_prints_mod( 'amz_popup_delay', 800 ) );
$cookie_days = max( 1, (int) amz_prints_mod( 'amz_popup_cookie_days', 3 ) );
?>
<div
	class="amz-popup amz-popup--<?php echo esc_attr( $style ); ?>"
	id="amz-promo-popup"
	hidden
	data-popup
	data-delay="<?php echo esc_attr( (string) $delay ); ?>"
	data-cookie-days="<?php echo esc_attr( (string) $cookie_days ); ?>"
	role="dialog"
	aria-modal="true"
	aria-label="<?php esc_attr_e( 'Promotion', 'amz-prints' ); ?>"
>
	<div class="amz-popup__backdrop" data-popup-close tabindex="-1"></div>
	<div class="amz-popup__dialog">
		<?php if ( $show_close ) : ?>
			<button type="button" class="amz-popup__close" data-popup-close aria-label="<?php esc_attr_e( 'Close', 'amz-prints' ); ?>">×</button>
		<?php endif; ?>
		<?php if ( $link ) : ?>
			<a class="amz-popup__media" href="<?php echo esc_url( $link ); ?>">
				<img src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?>" loading="lazy">
			</a>
		<?php else : ?>
			<div class="amz-popup__media">
				<img src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?>" loading="lazy">
			</div>
		<?php endif; ?>
	</div>
</div>
