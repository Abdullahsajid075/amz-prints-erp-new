<?php
/**
 * Products archive — ERP catalog only. No-photo products stay delisted.
 *
 * @package AMZ_Prints
 */

get_header();

$erp_products = function_exists( 'amz_prints_erp_get_products' ) ? amz_prints_erp_get_products() : array();
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php esc_html_e( 'Products', 'amz-prints' ); ?></h1>
	</div>
</section>

<section class="section">
	<div class="container product-grid product-grid--page">
		<?php if ( ! empty( $erp_products ) ) : ?>
			<?php foreach ( $erp_products as $product ) : ?>
				<?php
				$purl    = function_exists( 'amz_prints_product_url' ) ? amz_prints_product_url( $product ) : home_url( '/products/' );
				$gallery = function_exists( 'amz_prints_product_gallery' ) ? amz_prints_product_gallery( $product ) : array();
				$img     = ! empty( $gallery[0] ) ? $gallery[0] : ( ! empty( $product['image'] ) ? $product['image'] : '' );
				if ( ! $img || ( function_exists( 'amz_prints_is_real_product_photo' ) && ! amz_prints_is_real_product_photo( $img ) ) ) {
					continue;
				}
				$price_html = function_exists( 'amz_prints_erp_product_price_html' )
					? amz_prints_erp_product_price_html( $product )
					: '';
				$excerpt = ! empty( $product['description'] ) ? wp_trim_words( $product['description'], 16 ) : '';
				?>
				<article class="product-tile reveal" data-reveal>
					<a href="<?php echo esc_url( $purl ); ?>">
						<div class="product-tile__media">
							<img src="<?php echo esc_attr( $img ); ?>" alt="<?php echo esc_attr( $product['name'] ); ?>" loading="lazy" referrerpolicy="no-referrer">
						</div>
						<div class="product-tile__body">
							<h3><?php echo esc_html( $product['name'] ); ?></h3>
							<?php if ( $excerpt ) : ?>
								<p><?php echo esc_html( $excerpt ); ?></p>
							<?php endif; ?>
							<?php if ( $price_html ) : ?>
								<span class="product-tile__price"><?php echo $price_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
							<?php endif; ?>
						</div>
					</a>
				</article>
			<?php endforeach; ?>
		<?php else : ?>
			<p class="shop-empty"><?php esc_html_e( 'Only products with photos are listed. Incomplete items have been removed from the website.', 'amz-prints' ); ?></p>
		<?php endif; ?>
	</div>
</section>

<?php get_footer(); ?>
