<?php
/**
 * Template Name: Gallery
 *
 * @package AMZ_Prints
 */

get_header();
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'A look at recent print work and finishes.', 'amz-prints' ); ?></p>
	</div>
</section>

<section class="section">
	<div class="container">
		<?php
		while ( have_posts() ) :
			the_post();
			if ( trim( get_the_content() ) ) {
				echo '<div class="gallery-content reveal" data-reveal>';
				the_content();
				echo '</div>';
			} else {
				?>
				<p class="section-intro reveal" data-reveal>
					<?php esc_html_e( 'Add a WordPress gallery block or image blocks to this page. Until then, here’s a sample mosaic — replace it with your real work.', 'amz-prints' ); ?>
				</p>
				<div class="gallery-mosaic">
					<?php for ( $i = 1; $i <= 8; $i++ ) : ?>
						<figure class="gallery-mosaic__item gallery-mosaic__item--<?php echo esc_attr( $i ); ?> reveal" data-reveal>
							<div class="gallery-mosaic__fill" aria-hidden="true"></div>
							<figcaption><?php printf( esc_html__( 'Project %d', 'amz-prints' ), $i ); ?></figcaption>
						</figure>
					<?php endfor; ?>
				</div>
				<?php
			}
		endwhile;
		?>
	</div>
</section>

<?php get_footer(); ?>
