<?php
/**
 * Template Name: ERP Product Detail
 *
 * @package AMZ_Prints
 */

get_header();

$product_id = isset( $_GET['id'] ) ? sanitize_text_field( wp_unslash( $_GET['id'] ) ) : '';
$product    = $product_id && function_exists( 'amz_prints_erp_find_product' ) ? amz_prints_erp_find_product( $product_id ) : null;
$images     = array();
if ( $product ) {
	$images = ! empty( $product['images'] ) && is_array( $product['images'] ) ? $product['images'] : array();
	if ( empty( $images ) && ! empty( $product['image'] ) ) {
		$images = array( $product['image'] );
	}
}
?>

<section class="page-hero page-hero--compact">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php echo $product ? esc_html( $product['name'] ) : esc_html__( 'Product', 'amz-prints' ); ?></h1>
	</div>
</section>

<section class="section section--product-detail">
	<div class="container">
		<?php if ( ! $product ) : ?>
			<p><?php esc_html_e( 'Product not found. Browse the catalog for available items.', 'amz-prints' ); ?></p>
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'All products', 'amz-prints' ); ?></a>
		<?php else : ?>
			<div class="product-detail">
				<div class="product-detail__gallery">
					<?php if ( ! empty( $images ) ) : ?>
						<div class="product-detail__main">
							<img src="<?php echo amz_prints_product_img_src( $images[0] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>" alt="<?php echo esc_attr( $product['name'] ); ?>" data-main-image>
						</div>
						<?php if ( count( $images ) > 1 ) : ?>
							<div class="product-detail__thumbs">
								<?php foreach ( $images as $i => $img ) : ?>
									<button type="button" class="product-thumb<?php echo 0 === $i ? ' is-active' : ''; ?>" data-thumb-src="<?php echo esc_attr( $img ); ?>">
										<img src="<?php echo amz_prints_product_img_src( $img ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>" alt="">
									</button>
								<?php endforeach; ?>
							</div>
						<?php endif; ?>
					<?php else : ?>
						<div class="product-detail__placeholder" aria-hidden="true">
							<span><?php echo esc_html( mb_substr( $product['name'], 0, 1 ) ); ?></span>
						</div>
					<?php endif; ?>
				</div>
				<div class="product-detail__info">
					<?php if ( ! empty( $product['category'] ) ) : ?>
						<p class="product-detail__cat"><?php echo esc_html( $product['category'] ); ?></p>
					<?php endif; ?>
					<h2><?php echo esc_html( $product['name'] ); ?></h2>
					<p class="product-detail__price"><?php echo esc_html( amz_prints_erp_product_price_label( $product ) ); ?></p>
					<?php if ( ! empty( $product['description'] ) ) : ?>
						<p><?php echo esc_html( $product['description'] ); ?></p>
					<?php endif; ?>
					<ul class="product-detail__meta">
						<?php if ( ! empty( $product['material'] ) ) : ?><li><strong><?php esc_html_e( 'Material', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $product['material'] ); ?></li><?php endif; ?>
						<?php if ( ! empty( $product['size'] ) ) : ?><li><strong><?php esc_html_e( 'Size', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $product['size'] ); ?></li><?php endif; ?>
						<?php if ( ! empty( $product['unit'] ) ) : ?><li><strong><?php esc_html_e( 'Unit', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $product['unit'] ); ?></li><?php endif; ?>
						<li><strong><?php esc_html_e( 'Min. qty', 'amz-prints' ); ?>:</strong> <?php echo esc_html( (string) max( 1, (int) ( $product['minQuantity'] ?? 1 ) ) ); ?></li>
					</ul>

					<?php if ( (float) ( $product['basePrice'] ?? 0 ) > 0 ) : ?>
						<div class="product-detail__actions" data-add-cart="<?php echo esc_attr( $product['id'] ); ?>">
							<div class="cart-line__qty">
								<button type="button" class="qty-btn" data-pd-qty="-1">−</button>
								<input type="number" class="qty-input" min="<?php echo esc_attr( max( 1, (int) ( $product['minQuantity'] ?? 1 ) ) ); ?>" value="<?php echo esc_attr( max( 1, (int) ( $product['minQuantity'] ?? 1 ) ) ); ?>" data-pd-qty-input>
								<button type="button" class="qty-btn" data-pd-qty="1">+</button>
							</div>
							<button type="button" class="btn btn--primary" data-add-to-cart><?php esc_html_e( 'Add to cart', 'amz-prints' ); ?></button>
							<a class="btn btn--ghost" href="<?php echo esc_url( amz_prints_cart_url() ); ?>"><?php esc_html_e( 'View cart', 'amz-prints' ); ?></a>
						</div>
						<p class="form-note" data-cart-feedback hidden></p>
					<?php else : ?>
						<p class="form-note"><?php esc_html_e( 'This product needs a custom quote.', 'amz-prints' ); ?></p>
						<a class="btn btn--primary" href="<?php echo esc_url( add_query_arg( 'service', $product['name'], home_url( '/quote/' ) ) ); ?>"><?php esc_html_e( 'Get a Quote', 'amz-prints' ); ?></a>
					<?php endif; ?>
				</div>
			</div>
		<?php endif; ?>
	</div>
</section>

<?php get_footer(); ?>
