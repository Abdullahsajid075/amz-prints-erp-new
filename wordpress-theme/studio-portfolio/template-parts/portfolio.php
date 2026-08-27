<?php
/**
 * Portfolio section with hover auto-scroll
 *
 * @package Studio_Portfolio
 */

$portfolio = new WP_Query( array(
	'post_type'      => 'portfolio',
	'posts_per_page' => -1,
	'orderby'        => 'menu_order',
	'order'          => 'ASC',
) );
?>

<section id="work" class="section portfolio-section">
	<div class="container">
		<div class="section-header fade-in">
			<p class="section-label"><?php esc_html_e( 'Selected Work', 'studio-portfolio' ); ?></p>
			<h2 class="display-md"><?php esc_html_e( 'Projects that speak louder than words', 'studio-portfolio' ); ?></h2>
			<p class="text-muted" style="margin-top:1rem;font-size:1.125rem;">
				<?php esc_html_e( 'Hover over the gallery to auto-scroll through my portfolio.', 'studio-portfolio' ); ?>
			</p>
		</div>
	</div>

	<?php if ( $portfolio->have_posts() ) : ?>
		<div class="portfolio-scroll-wrapper">
			<div class="portfolio-scroll-container" aria-label="<?php esc_attr_e( 'Portfolio gallery', 'studio-portfolio' ); ?>">
				<div class="portfolio-scroll-track">
					<?php
					$index = 1;
					while ( $portfolio->have_posts() ) :
						$portfolio->the_post();
						$number = get_post_meta( get_the_ID(), '_portfolio_number', true );
						if ( ! $number ) {
							$number = str_pad( (string) $index, 2, '0', STR_PAD_LEFT );
						}
						$year  = get_post_meta( get_the_ID(), '_portfolio_year', true );
						$tags  = studio_get_portfolio_tags( get_the_ID() );
						$terms = get_the_terms( get_the_ID(), 'portfolio_category' );
						$category = ( $terms && ! is_wp_error( $terms ) ) ? $terms[0]->name : '';
						?>
						<article class="portfolio-card fade-in">
							<a href="<?php the_permalink(); ?>" class="portfolio-card-link">
								<div class="portfolio-card-image">
									<?php if ( has_post_thumbnail() ) : ?>
										<?php the_post_thumbnail( 'portfolio-card' ); ?>
									<?php endif; ?>
									<span class="portfolio-card-number"><?php echo esc_html( $number ); ?></span>
									<div class="portfolio-card-overlay">
										<span style="color:var(--color-gold);font-weight:600;"><?php esc_html_e( 'View Project →', 'studio-portfolio' ); ?></span>
									</div>
								</div>
								<div class="portfolio-card-body">
									<p class="portfolio-card-meta">
										<?php echo esc_html( $category ); ?>
										<?php if ( $year ) echo ' · ' . esc_html( $year ); ?>
									</p>
									<h3 class="portfolio-card-title"><?php the_title(); ?></h3>
									<?php if ( has_excerpt() ) : ?>
										<p class="portfolio-card-desc"><?php echo esc_html( get_the_excerpt() ); ?></p>
									<?php endif; ?>
									<?php if ( ! empty( $tags ) ) : ?>
										<div class="portfolio-card-tags">
											<?php foreach ( array_slice( $tags, 0, 3 ) as $tag ) : ?>
												<span class="badge badge-blue"><?php echo esc_html( $tag ); ?></span>
											<?php endforeach; ?>
										</div>
									<?php endif; ?>
								</div>
							</a>
						</article>
						<?php
						$index++;
					endwhile;
					wp_reset_postdata();
					?>
				</div>
			</div>
		</div>

		<div class="portfolio-scroll-hint">
			<span class="hint-icon">→</span>
			<span><?php esc_html_e( 'Hover to auto-scroll · Drag to explore', 'studio-portfolio' ); ?></span>
		</div>
	<?php else : ?>
		<div class="container">
			<div class="portfolio-empty glass" style="border-radius:1.5rem;padding:4rem;">
				<p style="font-size:1.125rem;margin-bottom:1rem;"><?php esc_html_e( 'No portfolio items yet.', 'studio-portfolio' ); ?></p>
				<?php if ( current_user_can( 'edit_posts' ) ) : ?>
					<p>
						<a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=portfolio' ) ); ?>">
							<?php esc_html_e( 'Add your first portfolio item in the WordPress admin →', 'studio-portfolio' ); ?>
						</a>
					</p>
				<?php endif; ?>
			</div>
		</div>
	<?php endif; ?>
</section>

<style>
.portfolio-card-link { display: block; color: inherit; }
</style>
