<?php
/**
 * Template Name: Products
 *
 * @package AMZ_Prints
 */

get_header();

$accents = array( 'orange', 'ink', 'forest', 'slate', 'ember', 'steel' );
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
