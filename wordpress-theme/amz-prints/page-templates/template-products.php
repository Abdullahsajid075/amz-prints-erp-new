<?php
/**
 * Template Name: Products
 *
 * Live catalog from ERP when available; falls back to WP products.
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
					$accent  = $accents[ $i % count( $accents ) ];
					$purl    = amz_prints_product_url( $product );
					$price   = amz_prints_erp_product_price_label( $product );
					$excerpt = $product['description'] ? wp_trim_words( $product['description'], 18 ) : ( $product['category'] ? $product['category'] : __( 'Professional print product', 'amz-prints' ) );
					$tag     = ! empty( $product['productType'] ) ? $product['productType'] : __( 'Print Product', 'amz-prints' );
					$letter  = mb_substr( $product['name'], 0, 1 );
					$img     = ! empty( $product['image'] ) ? amz_prints_product_image_src( $product['image'] ) : '';
					?>
					<article class="product-card product-card--<?php echo esc_attr( $accent ); ?> reveal" data-reveal>
						<a href="<?php echo esc_url( $purl ); ?>" class="product-card__link">
							<div class="product-card__media">
								<?php if ( $img ) : ?>
									<img src="<?php echo esc_attr( $img ); ?>" alt="<?php echo esc_attr( $product['name'] ); ?>" loading="lazy">
								<?php else : ?>
									<div class="product-card__placeholder" aria-hidden="true">
										<span class="product-card__letter"><?php echo esc_html( $letter ); ?></span>
										<span class="product-card__shine"></span>
									</div>
								<?php endif; ?>
								<span class="product-card__tag"><?php echo esc_html( $tag ); ?></span>
							</div>
							<div class="product-card__body">
								<h3><?php echo esc_html( $product['name'] ); ?></h3>
								<p><?php echo esc_html( $excerpt ); ?></p>
								<div class="product-card__meta">
									<span class="product-card__price"><?php echo esc_html( $price ); ?></span>
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
										data-price="<?php echo esc_attr( $product['basePrice'] ); ?>"
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
				<?php
				$products = new WP_Query( array(
					'post_type'      => 'amz_product',
					'posts_per_page' => -1,
					'orderby'        => 'menu_order',
					'order'          => 'ASC',
				) );
				$i = 0;
				if ( $products->have_posts() ) :
					while ( $products->have_posts() ) :
						$products->the_post();
						$price  = get_post_meta( get_the_ID(), '_amz_price_label', true );
						$accent = $accents[ $i % count( $accents ) ];
						$i++;
						?>
						<article class="product-card product-card--<?php echo esc_attr( $accent ); ?> reveal" data-reveal>
							<a href="<?php the_permalink(); ?>" class="product-card__link">
								<div class="product-card__media">
									<?php if ( has_post_thumbnail() ) : ?>
										<?php the_post_thumbnail( 'amz-product' ); ?>
									<?php else : ?>
										<div class="product-card__placeholder" aria-hidden="true">
											<span class="product-card__letter"><?php echo esc_html( mb_substr( get_the_title(), 0, 1 ) ); ?></span>
											<span class="product-card__shine"></span>
										</div>
									<?php endif; ?>
									<span class="product-card__tag"><?php esc_html_e( 'Print Product', 'amz-prints' ); ?></span>
								</div>
								<div class="product-card__body">
									<h3><?php the_title(); ?></h3>
									<p><?php echo esc_html( wp_trim_words( get_the_excerpt() ?: get_the_content(), 18 ) ); ?></p>
									<div class="product-card__meta">
										<?php if ( $price ) : ?>
											<span class="product-card__price"><?php echo esc_html( $price ); ?></span>
										<?php endif; ?>
										<span class="product-card__cta"><?php esc_html_e( 'View details', 'amz-prints' ); ?></span>
									</div>
								</div>
							</a>
						</article>
						<?php
					endwhile;
					wp_reset_postdata();
				endif;
				?>
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
