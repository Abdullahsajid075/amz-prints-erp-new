<?php
/**
 * Services archive
 *
 * @package AMZ_Prints
 */

get_header();
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php esc_html_e( 'Services', 'amz-prints' ); ?></h1>
	</div>
</section>

<section class="section">
	<div class="container service-grid service-grid--page">
		<?php
		if ( have_posts() ) :
			while ( have_posts() ) :
				the_post();
				$icon = get_post_meta( get_the_ID(), '_amz_icon', true ) ?: 'printer';
				?>
				<article class="service-item reveal" data-reveal>
					<a href="<?php the_permalink(); ?>" class="service-item__link">
						<span class="service-item__icon"><?php echo amz_prints_icon_svg( $icon ); // phpcs:ignore ?></span>
						<h3><?php the_title(); ?></h3>
						<p><?php echo esc_html( wp_trim_words( get_the_excerpt() ?: get_the_content(), 24 ) ); ?></p>
					</a>
				</article>
				<?php
			endwhile;
		endif;
		?>
	</div>
</section>

<?php get_footer(); ?>
