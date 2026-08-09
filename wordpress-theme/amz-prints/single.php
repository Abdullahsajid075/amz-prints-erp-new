<?php
/**
 * Single post / product / service
 *
 * @package AMZ_Prints
 */

get_header();

$type = get_post_type();
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<?php if ( 'amz_service' === $type ) : ?>
			<p class="page-hero__kicker"><?php esc_html_e( 'Service', 'amz-prints' ); ?></p>
		<?php elseif ( 'amz_product' === $type ) : ?>
			<p class="page-hero__kicker"><?php esc_html_e( 'Product', 'amz-prints' ); ?></p>
		<?php endif; ?>
		<h1><?php the_title(); ?></h1>
		<?php
		if ( 'amz_product' === $type ) {
			$price = get_post_meta( get_the_ID(), '_amz_price_label', true );
			if ( $price ) {
				echo '<p class="page-hero__lead">' . esc_html( $price ) . '</p>';
			}
		}
		?>
	</div>
</section>

<section class="section">
	<div class="container single-layout">
		<?php
		while ( have_posts() ) :
			the_post();
			?>
			<article <?php post_class( 'single-article' ); ?>>
				<?php if ( has_post_thumbnail() ) : ?>
					<div class="single-article__media"><?php the_post_thumbnail( 'amz-card' ); ?></div>
				<?php endif; ?>
				<div class="single-article__content content-narrow">
					<?php the_content(); ?>
				</div>
				<div class="single-article__actions">
					<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/quote/' ) ); ?>"><?php esc_html_e( 'Get a Quote', 'amz-prints' ); ?></a>
					<a class="btn btn--ghost" href="<?php echo esc_url( wp_get_referer() ?: home_url( '/' ) ); ?>"><?php esc_html_e( 'Back', 'amz-prints' ); ?></a>
				</div>
			</article>
			<?php
		endwhile;
		?>
	</div>
</section>

<?php get_footer(); ?>
