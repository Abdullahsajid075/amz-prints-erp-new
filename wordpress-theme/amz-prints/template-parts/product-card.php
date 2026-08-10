<?php
/**
 * Minimal product card — Press Atelier hover + detail popup
 *
 * @package AMZ_Prints
 */

$product = isset( $args['product'] ) ? $args['product'] : ( isset( $product ) ? $product : null );
if ( ! $product || empty( $product['name'] ) ) {
	return;
}

$price_n  = (float) ( $product['basePrice'] ?? 0 );
$price    = $price_n > 0
	? ( function_exists( 'amz_prints_money' ) ? amz_prints_money( $price_n ) : ( 'Rs. ' . number_format_i18n( $price_n, 0 ) ) )
	: __( 'Get a quote', 'amz-prints' );
$excerpt  = ! empty( $product['description'] )
	? wp_trim_words( $product['description'], 16 )
	: ( ! empty( $product['category'] ) ? $product['category'] : __( 'Professional print product for your brand.', 'amz-prints' ) );
$img      = ! empty( $product['image'] ) ? $product['image'] : '';
$category = sanitize_title( (string) ( $product['category'] ?? 'general' ) );
if ( ! $category ) {
	$category = 'general';
}
$pid = (string) ( $product['id'] ?? '' );
?>
<article class="shop-card has-tilt" data-category="<?php echo esc_attr( $category ); ?>" data-product-id="<?php echo esc_attr( $pid ); ?>">
	<button
		type="button"
		class="shop-card__link"
		data-open-product="<?php echo esc_attr( $pid ); ?>"
		data-product-name="<?php echo esc_attr( $product['name'] ); ?>"
		data-product-category="<?php echo esc_attr( (string) ( $product['category'] ?? '' ) ); ?>"
		data-product-desc="<?php echo esc_attr( $excerpt ); ?>"
		data-product-price="<?php echo esc_attr( (string) $price_n ); ?>"
		data-product-unit="<?php echo esc_attr( (string) ( $product['unit'] ?? '' ) ); ?>"
		data-product-material="<?php echo esc_attr( (string) ( $product['material'] ?? '' ) ); ?>"
		data-product-size="<?php echo esc_attr( (string) ( $product['size'] ?? '' ) ); ?>"
		data-product-min="<?php echo esc_attr( (string) max( 1, (int) ( $product['minQuantity'] ?? 1 ) ) ); ?>"
		aria-haspopup="dialog"
	>
		<div class="shop-card__media">
			<?php if ( $img ) : ?>
				<img src="<?php echo function_exists( 'amz_prints_product_img_src' ) ? amz_prints_product_img_src( $img ) : esc_url( $img ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>" alt="<?php echo esc_attr( $product['name'] ); ?>" loading="lazy">
			<?php else : ?>
				<span class="shop-card__letter" aria-hidden="true"><?php echo esc_html( mb_substr( $product['name'], 0, 1 ) ); ?></span>
			<?php endif; ?>
			<span class="shop-card__shine" aria-hidden="true"></span>
			<?php if ( ! empty( $product['category'] ) ) : ?>
				<span class="shop-card__tag"><?php echo esc_html( $product['category'] ); ?></span>
			<?php endif; ?>
		</div>
		<div class="shop-card__body">
			<h3 class="shop-card__title"><?php echo esc_html( $product['name'] ); ?></h3>
			<p class="shop-card__desc"><?php echo esc_html( $excerpt ); ?></p>
			<span class="shop-card__rule" aria-hidden="true"></span>
			<span class="shop-card__price"><?php echo esc_html( $price ); ?></span>
			<span class="shop-card__cta"><?php esc_html_e( 'View details', 'amz-prints' ); ?></span>
		</div>
	</button>
</article>
