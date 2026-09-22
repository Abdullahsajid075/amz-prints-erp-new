<?php
/**
 * Promo / popup image (Customizer-driven).
 *
 * @package AMZ_Prints
 */

if ( ! function_exists( 'amz_prints_popup_should_show' ) || ! amz_prints_popup_should_show() ) {
	return;
}

$image_id = absint( amz_prints_mod( 'amz_popup_image', 0 ) );
$url      = $image_id ? wp_get_attachment_image_url( $image_id, 'full' ) : '';
if ( ! $url ) {
	return;
}

$style      = sanitize_html_class( amz_prints_mod( 'amz_popup_style', 'center-card' ) );
$show_close = (bool) amz_prints_mod( 'amz_popup_show_close', true );
$delay      = absint( amz_prints_mod( 'amz_popup_delay', 1200 ) );
$link       = esc_url( amz_prints_mod( 'amz_popup_link', '' ) );
$key        = 'img_' . $image_id . '_' . $style;
?>
<div
	class="promo-popup promo-popup--<?php echo esc_attr( $style ); ?>"
	data-promo-popup
	data-popup-key="<?php echo esc_attr( $key ); ?>"
	data-delay="<?php echo esc_attr( $delay ); ?>"
	hidden
	role="dialog"
	aria-modal="true"
	aria-label="<?php esc_attr_e( 'Promotion', 'amz-prints' ); ?>"
>
	<button type="button" class="promo-popup__backdrop" data-popup-close aria-label="<?php esc_attr_e( 'Close', 'amz-prints' ); ?>"></button>
	<div class="promo-popup__dialog">
		<?php if ( $show_close ) : ?>
			<button type="button" class="promo-popup__close" data-popup-close aria-label="<?php esc_attr_e( 'Close popup', 'amz-prints' ); ?>">×</button>
		<?php endif; ?>
		<div class="promo-popup__media">
			<?php if ( $link ) : ?>
				<a href="<?php echo esc_url( $link ); ?>">
					<img src="<?php echo esc_url( $url ); ?>" alt="<?php esc_attr_e( 'Promotion', 'amz-prints' ); ?>">
				</a>
			<?php else : ?>
				<img src="<?php echo esc_url( $url ); ?>" alt="<?php esc_attr_e( 'Promotion', 'amz-prints' ); ?>">
			<?php endif; ?>
		</div>
	</div>
</div>
