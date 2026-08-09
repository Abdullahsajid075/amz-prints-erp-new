<?php
/**
 * Products archive
 *
 * @package AMZ_Prints
 */

get_header();
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php esc_html_e( 'Products', 'amz-prints' ); ?></h1>
	</div>
</section>

<section class="section">
	<div class="container product-grid product-grid--page">
		<?php
		if ( have_posts() ) :
			while ( have_posts() ) :
				the_post();
				$price = get_post_meta( get_the_ID(), '_amz_price_label', true );
				?>
				<article class="product-tile reveal" data-reveal>
					<a href="<?php the_permalink(); ?>">
						<div class="product-tile__media">
							<?php if ( has_post_thumbnail() ) : ?>
								<?php the_post_thumbnail( 'amz-product' ); ?>
							<?php else : ?>
								<div class="product-tile__placeholder" aria-hidden="true">
									<span><?php echo esc_html( mb_substr( get_the_title(), 0, 1 ) ); ?></span>
								</div>
							<?php endif; ?>
						</div>
						<div class="product-tile__body">
							<h3><?php the_title(); ?></h3>
							<p><?php echo esc_html( wp_trim_words( get_the_excerpt() ?: get_the_content(), 16 ) ); ?></p>
							<?php if ( $price ) : ?>
								<span class="product-tile__price"><?php echo esc_html( $price ); ?></span>
							<?php endif; ?>
						</div>
					</a>
				</article>
				<?php
			endwhile;
		endif;
		?>
	</div>
</section>

<?php get_footer(); ?>
