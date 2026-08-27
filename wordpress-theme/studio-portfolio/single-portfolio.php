<?php
/**
 * Single Portfolio template
 *
 * @package Studio_Portfolio
 */

get_header();

while ( have_posts() ) :
	the_post();

	$year   = get_post_meta( get_the_ID(), '_portfolio_year', true );
	$client = get_post_meta( get_the_ID(), '_portfolio_client', true );
	$url    = get_post_meta( get_the_ID(), '_portfolio_url', true );
	$tags   = studio_get_portfolio_tags( get_the_ID() );
	$gallery = get_post_meta( get_the_ID(), '_portfolio_gallery', true );
	$terms  = get_the_terms( get_the_ID(), 'portfolio_category' );
	?>

<main class="single-portfolio">
	<div class="container">
		<article <?php post_class( 'single-portfolio-hero' ); ?>>
			<p class="section-label">
				<?php
				if ( $terms && ! is_wp_error( $terms ) ) {
					echo esc_html( $terms[0]->name );
				}
				if ( $year ) {
					echo ' · ' . esc_html( $year );
				}
				?>
			</p>

			<h1 class="display-lg" style="margin-bottom:1.5rem;"><?php the_title(); ?></h1>

			<?php if ( $client ) : ?>
				<p class="text-muted" style="margin-bottom:2rem;"><?php echo esc_html( sprintf( __( 'Client: %s', 'studio-portfolio' ), $client ) ); ?></p>
			<?php endif; ?>

			<?php if ( has_post_thumbnail() ) : ?>
				<div class="single-portfolio-image">
					<?php the_post_thumbnail( 'portfolio-hero' ); ?>
				</div>
			<?php endif; ?>

			<div class="about-text">
				<?php the_content(); ?>
			</div>

			<?php if ( ! empty( $tags ) ) : ?>
				<div class="portfolio-card-tags" style="margin-top:2rem;">
					<?php foreach ( $tags as $tag ) : ?>
						<span class="badge badge-gold"><?php echo esc_html( $tag ); ?></span>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>

			<?php if ( $url ) : ?>
				<p style="margin-top:2rem;">
					<a href="<?php echo esc_url( $url ); ?>" class="btn btn-primary" target="_blank" rel="noopener">
						<?php esc_html_e( 'View Live Project', 'studio-portfolio' ); ?> →
					</a>
				</p>
			<?php endif; ?>

			<?php if ( is_array( $gallery ) && ! empty( $gallery ) ) : ?>
				<div class="single-portfolio-gallery">
					<?php foreach ( $gallery as $image_id ) : ?>
						<?php echo wp_get_attachment_image( $image_id, 'portfolio-gallery' ); ?>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
		</article>

		<p style="margin-top:3rem;">
			<a href="<?php echo esc_url( home_url( '/#work' ) ); ?>" class="btn btn-outline">← <?php esc_html_e( 'Back to Portfolio', 'studio-portfolio' ); ?></a>
		</p>
	</div>
</main>

	<?php
endwhile;

get_footer();
