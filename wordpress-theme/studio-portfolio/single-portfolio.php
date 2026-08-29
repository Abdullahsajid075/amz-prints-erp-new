<?php
/**
 * Single Portfolio — case study
 *
 * @package Studio_Portfolio
 */

get_header();

while ( have_posts() ) :
	the_post();

	$year    = get_post_meta( get_the_ID(), '_portfolio_year', true );
	$client  = get_post_meta( get_the_ID(), '_portfolio_client', true );
	$url     = get_post_meta( get_the_ID(), '_portfolio_url', true );
	$tags    = studio_get_portfolio_tags( get_the_ID() );
	$gallery = get_post_meta( get_the_ID(), '_portfolio_gallery', true );
	$terms   = get_the_terms( get_the_ID(), 'portfolio_category' );
	$fields  = studio_get_case_study_fields();
	?>

<main class="single-portfolio">
	<div class="container">
		<article <?php post_class( 'single-portfolio-hero' ); ?>>
			<p class="section-label">
				<?php
				esc_html_e( 'Case Study', 'studio-portfolio' );
				if ( $terms && ! is_wp_error( $terms ) ) {
					echo ' · ' . esc_html( $terms[0]->name );
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

			<?php
			$pdf_id = get_post_meta( get_the_ID(), '_portfolio_pdf', true );
			if ( $pdf_id ) :
				$pdf_url = wp_get_attachment_url( $pdf_id );
				if ( $pdf_url ) :
					?>
					<p style="margin-top:1rem;margin-bottom:2rem;">
						<a href="<?php echo esc_url( $pdf_url ); ?>" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
							<?php esc_html_e( 'View Project PDF →', 'studio-portfolio' ); ?>
						</a>
					</p>
					<?php
				endif;
			endif;
			?>

			<?php if ( has_post_thumbnail() ) : ?>
				<div class="single-portfolio-image">
					<?php the_post_thumbnail( 'portfolio-hero' ); ?>
				</div>
			<?php endif; ?>

			<?php if ( get_the_content() ) : ?>
				<div class="about-text case-study-intro">
					<?php the_content(); ?>
				</div>
			<?php endif; ?>

			<div class="case-study-flow">
				<?php foreach ( $fields as $key => $label ) : ?>
					<?php
					$body = get_post_meta( get_the_ID(), '_portfolio_' . $key, true );
					if ( ! $body ) {
						continue;
					}
					?>
					<section class="case-study-block premium-card-glow">
						<p class="section-label"><?php echo esc_html( $label ); ?></p>
						<div class="case-study-body"><?php echo nl2br( esc_html( $body ) ); ?></div>
					</section>
				<?php endforeach; ?>
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
			<a href="<?php echo esc_url( studio_get_page_url( 'portfolio_page_id', home_url( '/portfolio/' ) ) ); ?>" class="btn btn-outline">← <?php esc_html_e( 'Back to Portfolio', 'studio-portfolio' ); ?></a>
			<a href="<?php echo esc_url( studio_get_start_project_url() ); ?>" class="btn btn-primary" style="margin-left:0.75rem;">
				<?php echo esc_html( studio_get_option( 'nav_schedule', 'Start a Project' ) ); ?> →
			</a>
		</p>
	</div>
</main>

	<?php
endwhile;

get_footer();
