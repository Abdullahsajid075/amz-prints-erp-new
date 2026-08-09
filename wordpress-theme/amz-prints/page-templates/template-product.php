<?php
/**
 * Template Name: Product Detail (ERP)
 *
 * @package AMZ_Prints
 */

get_header();

$product_id = isset( $_GET['id'] ) ? sanitize_text_field( wp_unslash( $_GET['id'] ) ) : '';
$product    = $product_id && function_exists( 'amz_prints_erp_get_product' )
	? amz_prints_erp_get_product( $product_id )
	: null;
$images     = array();
if ( $product ) {
	$images = ! empty( $product['images'] ) ? $product['images'] : array_filter( array( $product['image'] ) );
}
?>
<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php echo $product ? esc_html( $product['name'] ) : esc_html__( 'Product', 'amz-prints' ); ?></h1>
	</div>
</section>
<section class="section">
	<div class="container">
		<?php if ( ! $product ) : ?>
			<div class="shop-empty">
				<p><?php esc_html_e( 'Product not found. Browse the catalog instead.', 'amz-prints' ); ?></p>
				<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Products', 'amz-prints' ); ?></a>
			</div>
		<?php else : ?>
			<?php
			$price_label = amz_prints_erp_product_price_label( $product );
			$primary     = ! empty( $images[0] ) ? $images[0] : '';
			?>
			<article class="product-detail">
				<div class="product-detail__gallery">
					<img
						src="<?php echo esc_attr( amz_prints_product_image_src( $primary ) ); ?>"
						alt="<?php echo esc_attr( $product['name'] ); ?>"
						data-main-image
						<?php echo $primary ? '' : 'hidden'; ?>
					>
					<?php if ( ! $primary ) : ?>
						<div class="product-card__placeholder" aria-hidden="true">
							<span class="product-card__letter"><?php echo esc_html( mb_substr( $product['name'], 0, 1 ) ); ?></span>
						</div>
					<?php endif; ?>
					<?php if ( count( $images ) > 1 ) : ?>
						<div class="product-detail__thumbs">
							<?php foreach ( $images as $i => $img ) : ?>
								<button type="button" class="<?php echo 0 === $i ? 'is-active' : ''; ?>" data-thumb="<?php echo esc_attr( amz_prints_product_image_src( $img ) ); ?>">
									<img src="<?php echo esc_attr( amz_prints_product_image_src( $img ) ); ?>" alt="">
								</button>
							<?php endforeach; ?>
						</div>
					<?php endif; ?>
				</div>
				<div class="product-detail__body">
					<p class="page-hero__brand"><?php echo esc_html( $product['category'] ?: $product['productType'] ); ?></p>
					<h2><?php echo esc_html( $product['name'] ); ?></h2>
					<p class="product-card__price" style="font-size:1.25rem;font-weight:800;"><?php echo esc_html( $price_label ); ?></p>
					<?php if ( ! empty( $product['description'] ) ) : ?>
						<p><?php echo esc_html( $product['description'] ); ?></p>
					<?php endif; ?>
					<ul class="check-list">
						<?php if ( ! empty( $product['size'] ) ) : ?><li><?php echo esc_html( 'Size: ' . $product['size'] ); ?></li><?php endif; ?>
						<?php if ( ! empty( $product['material'] ) ) : ?><li><?php echo esc_html( 'Material: ' . $product['material'] ); ?></li><?php endif; ?>
						<li><?php echo esc_html( sprintf( __( 'Min quantity: %s', 'amz-prints' ), $product['minQuantity'] ?: 1 ) ); ?></li>
					</ul>
					<div class="product-detail__actions">
						<label>
							<?php esc_html_e( 'Qty', 'amz-prints' ); ?>
							<input type="number" min="<?php echo esc_attr( $product['minQuantity'] ?: 1 ); ?>" value="<?php echo esc_attr( $product['minQuantity'] ?: 1 ); ?>" data-product-qty style="width:5rem;margin-left:0.35rem;">
						</label>
						<button
							type="button"
							class="btn btn--primary"
							data-add-to-cart
							data-label="<?php esc_attr_e( 'Add to cart', 'amz-prints' ); ?>"
							data-id="<?php echo esc_attr( $product['id'] ); ?>"
							data-name="<?php echo esc_attr( $product['name'] ); ?>"
							data-price="<?php echo esc_attr( $product['basePrice'] ); ?>"
							data-image="<?php echo esc_attr( $primary ); ?>"
							data-unit="<?php echo esc_attr( $product['unit'] ); ?>"
							data-min="<?php echo esc_attr( $product['minQuantity'] ?: 1 ); ?>"
						><?php esc_html_e( 'Add to cart', 'amz-prints' ); ?></button>
						<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/cart/' ) ); ?>"><?php esc_html_e( 'View cart', 'amz-prints' ); ?></a>
					</div>
				</div>
			</article>
			<script>
			document.addEventListener('DOMContentLoaded', function () {
				var main = document.querySelector('[data-main-image]');
				document.querySelectorAll('[data-thumb]').forEach(function (btn) {
					btn.addEventListener('click', function () {
						document.querySelectorAll('[data-thumb]').forEach(function (b) { b.classList.remove('is-active'); });
						btn.classList.add('is-active');
						if (main) { main.src = btn.getAttribute('data-thumb'); main.hidden = false; }
					});
				});
			});
			</script>
		<?php endif; ?>
	</div>
</section>
<?php
get_footer();
