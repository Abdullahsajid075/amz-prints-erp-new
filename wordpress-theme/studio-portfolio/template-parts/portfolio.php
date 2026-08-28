<?php
/**
 * Portfolio section with hover auto-scroll
 *
 * @package Studio_Portfolio
 *
 * @var array $args Optional Elementor overrides.
 */

$args = isset( $args ) ? $args : array();

$query_args = array(
	'post_type'      => 'portfolio',
	'posts_per_page' => (int) studio_template_arg( $args, 'posts_per_page', '', -1 ),
	'orderby'        => studio_template_arg( $args, 'orderby', '', 'menu_order' ),
	'order'          => studio_template_arg( $args, 'order', '', 'ASC' ),
);

$category = studio_template_arg( $args, 'category', '', '' );
if ( $category ) {
	$query_args['tax_query'] = array(
		array(
			'taxonomy' => 'portfolio_category',
			'field'    => 'slug',
			'terms'    => sanitize_title( $category ),
		),
	);
}

$portfolio = new WP_Query( $query_args );
?>

<section id="work" class="section portfolio-section">
	<div class="container">
		<div class="section-header fade-in">
			<p class="section-label"><?php echo esc_html( studio_template_arg( $args, 'work_label', 'work_label', 'Selected Work' ) ); ?></p>
			<h2 class="display-md"><?php echo esc_html( studio_template_arg( $args, 'work_title', 'work_title', 'Projects that speak louder than words' ) ); ?></h2>
			<p class="text-muted" style="margin-top:1rem;font-size:1.125rem;">
				<?php echo esc_html( studio_template_arg( $args, 'work_description', 'work_description', 'Hover over the gallery to auto-scroll through my portfolio.' ) ); ?>
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
						$category_name = ( $terms && ! is_wp_error( $terms ) ) ? $terms[0]->name : '';
						$link          = studio_get_portfolio_link( get_the_ID() );
						?>
						<article class="portfolio-card fade-in">
							<a href="<?php echo esc_url( $link['url'] ); ?>" class="portfolio-card-link" target="<?php echo esc_attr( $link['target'] ); ?>"<?php echo $link['is_pdf'] ? ' rel="noopener noreferrer"' : ''; ?>>
								<div class="portfolio-card-image">
									<?php if ( has_post_thumbnail() ) : ?>
										<?php the_post_thumbnail( 'portfolio-card' ); ?>
									<?php endif; ?>
									<span class="portfolio-card-number"><?php echo esc_html( $number ); ?></span>
									<?php if ( $link['is_pdf'] ) : ?>
										<span class="portfolio-pdf-badge">PDF</span>
									<?php endif; ?>
									<div class="portfolio-card-overlay">
										<span style="color:var(--color-green-light);font-weight:600;">
											<?php echo $link['is_pdf'] ? esc_html__( 'View PDF →', 'studio-portfolio' ) : esc_html__( 'View Project →', 'studio-portfolio' ); ?>
										</span>
									</div>
								</div>
								<div class="portfolio-card-body">
									<p class="portfolio-card-meta">
										<?php echo esc_html( $category_name ); ?>
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
			<span><?php echo esc_html( studio_template_arg( $args, 'work_hint', 'work_hint', 'Hover to auto-scroll · Drag to explore' ) ); ?></span>
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
