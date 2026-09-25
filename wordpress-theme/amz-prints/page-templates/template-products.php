<?php
/**
 * Template Name: Products
 *
 * Live catalog from ERP only. Products without photos are never listed.
 *
 * @package AMZ_Prints
 */

get_header();

$accents      = array( 'orange', 'ink', 'forest', 'slate', 'ember', 'steel' );
$erp_products = function_exists( 'amz_prints_erp_get_products' ) ? amz_prints_erp_get_products() : array();
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php echo esc_html( amz_prints_mod( 'amz_products_sub', 'Ready to order — customize finishes, quantities, and turnaround.' ) ); ?></p>
	</div>
</section>

<section class="section section--products-page">
	<div class="container">
		<?php
		while ( have_posts() ) :
			the_post();
			if ( trim( get_the_content() ) ) :
				?>
				<div class="content-narrow reveal" data-reveal><?php the_content(); ?></div>
				<?php
			endif;
		endwhile;
		?>

		<div class="product-cards">
			<?php if ( ! empty( $erp_products ) ) : ?>
				<?php foreach ( $erp_products as $i => $product ) : ?>
					<?php
					$accent   = $accents[ $i % count( $accents ) ];
					$purl     = amz_prints_product_url( $product );
					$price_html = function_exists( 'amz_prints_erp_product_price_html' )
						? amz_prints_erp_product_price_html( $product )
						: esc_html( amz_prints_erp_product_price_label( $product ) );
					$effective = function_exists( 'amz_prints_erp_product_effective_price' )
						? amz_prints_erp_product_effective_price( $product )
						: (float) ( $product['basePrice'] ?? 0 );
					$excerpt  = $product['description'] ? wp_trim_words( $product['description'], 18 ) : ( $product['category'] ? $product['category'] : __( 'Professional print product', 'amz-prints' ) );
					$tag      = ! empty( $product['showOnTop'] )
						? __( 'Featured', 'amz-prints' )
						: ( ! empty( $product['productType'] ) ? $product['productType'] : __( 'Print Product', 'amz-prints' ) );
					$letter   = mb_substr( $product['name'], 0, 1 );
					$gallery  = function_exists( 'amz_prints_product_gallery' ) ? amz_prints_product_gallery( $product ) : array();
					$img      = ! empty( $gallery[0] ) ? $gallery[0] : ( ! empty( $product['image'] ) ? amz_prints_product_image_src( $product['image'] ) : '' );
					if ( ! $img || ( function_exists( 'amz_prints_is_real_product_photo' ) && ! amz_prints_is_real_product_photo( $img ) ) ) {
						continue;
					}
					?>
					<article class="product-card product-card--<?php echo esc_attr( $accent ); ?><?php echo ! empty( $product['showOnTop'] ) ? ' product-card--top' : ''; ?> reveal" data-reveal>
						<a href="<?php echo esc_url( $purl ); ?>" class="product-card__link">
							<div class="product-card__media">
								<?php if ( $img ) : ?>
									<img src="<?php echo esc_attr( $img ); ?>" alt="<?php echo esc_attr( $product['name'] ); ?>" loading="lazy" referrerpolicy="no-referrer">
								<?php else : ?>
									<div class="product-card__placeholder" aria-hidden="true">
										<span class="product-card__letter"><?php echo esc_html( $letter ); ?></span>
										<span class="product-card__shine"></span>
									</div>
								<?php endif; ?>
								<?php if ( count( $gallery ) > 1 ) : ?>
									<div class="product-card__thumbs" aria-hidden="true">
										<?php foreach ( array_slice( $gallery, 0, 4 ) as $thumb ) : ?>
											<span class="product-card__thumb" style="background-image:url('<?php echo esc_attr( $thumb ); ?>')"></span>
										<?php endforeach; ?>
									</div>
								<?php endif; ?>
								<span class="product-card__tag"><?php echo esc_html( $tag ); ?></span>
								<?php if ( ! empty( $product['salePrice'] ) && (float) $product['salePrice'] > 0 ) : ?>
									<span class="product-card__sale-badge"><?php esc_html_e( 'Sale', 'amz-prints' ); ?></span>
								<?php endif; ?>
							</div>
							<div class="product-card__body">
								<h3><?php echo esc_html( $product['name'] ); ?></h3>
								<p><?php echo esc_html( $excerpt ); ?></p>
								<div class="product-card__meta">
									<span class="product-card__price"><?php echo $price_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
									<span class="product-card__cta"><?php esc_html_e( 'View / Buy', 'amz-prints' ); ?></span>
								</div>
								<div class="product-card__actions" onclick="event.preventDefault();">
									<button
										type="button"
										class="btn btn--primary btn--sm"
										data-add-to-cart
										data-label="<?php esc_attr_e( 'Add to cart', 'amz-prints' ); ?>"
										data-id="<?php echo esc_attr( $product['id'] ); ?>"
										data-name="<?php echo esc_attr( $product['name'] ); ?>"
										data-price="<?php echo esc_attr( $effective ); ?>"
										data-selected-price="<?php echo esc_attr( $effective ); ?>"
										data-image="<?php echo esc_attr( $img ); ?>"
										data-unit="<?php echo esc_attr( $product['unit'] ); ?>"
										data-min="<?php echo esc_attr( $product['minQuantity'] ?: 1 ); ?>"
									><?php esc_html_e( 'Add to cart', 'amz-prints' ); ?></button>
								</div>
							</div>
						</a>
					</article>
				<?php endforeach; ?>
			<?php else : ?>
				<div class="shop-empty">
					<p><?php esc_html_e( 'Only products with photos are listed. Incomplete items have been removed from the website.', 'amz-prints' ); ?></p>
				</div>
			<?php endif; ?>
		</div>
	</div>
</section>

<section class="section section--cta">
	<div class="container cta-band reveal" data-reveal>
		<div class="cta-band__copy">
			<h2><?php esc_html_e( 'Need a custom product?', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Tell us the size, quantity, and finish — we’ll quote fast.', 'amz-prints' ); ?></p>
		</div>
		<a class="btn btn--primary btn--lg" href="<?php echo esc_url( home_url( '/quote/' ) ); ?>"><?php esc_html_e( 'Get a Quote', 'amz-prints' ); ?></a>
	</div>
</section>

<?php get_footer(); ?>
