<?php
/**
 * Minimal product card (ERP product array).
 *
 * Expects $args['product'] array.
 *
 * @package AMZ_Prints
 */

$product = isset( $args['product'] ) ? $args['product'] : ( isset( $product ) ? $product : null );
if ( ! $product || empty( $product['name'] ) ) {
	return;
}

$purl     = function_exists( 'amz_prints_erp_product_url' ) ? amz_prints_erp_product_url( $product['id'] ) : home_url( '/products/' );
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
?>
<article class="shop-card" data-category="<?php echo esc_attr( $category ); ?>">
	<a class="shop-card__link" href="<?php echo esc_url( $purl ); ?>">
		<div class="shop-card__media">
			<?php if ( $img ) : ?>
				<img src="<?php echo function_exists( 'amz_prints_product_img_src' ) ? amz_prints_product_img_src( $img ) : esc_url( $img ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>" alt="<?php echo esc_attr( $product['name'] ); ?>" loading="lazy">
			<?php else : ?>
				<span class="shop-card__letter" aria-hidden="true"><?php echo esc_html( mb_substr( $product['name'], 0, 1 ) ); ?></span>
			<?php endif; ?>
		</div>
		<div class="shop-card__body">
			<h3 class="shop-card__title"><?php echo esc_html( $product['name'] ); ?></h3>
			<p class="shop-card__desc"><?php echo esc_html( $excerpt ); ?></p>
			<span class="shop-card__rule" aria-hidden="true"></span>
			<span class="shop-card__price"><?php echo esc_html( $price ); ?></span>
		</div>
	</a>
</article>
