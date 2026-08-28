<?php
/**
 * Portfolio section — home featured scroll OR full work page grid
 *
 * @package Studio_Portfolio
 *
 * @var array $args Optional overrides.
 */

$args = isset( $args ) ? $args : array();
$mode = studio_template_arg( $args, 'mode', '', 'home' );
$is_work_page = ( 'work' === $mode );

$query_args = studio_get_portfolio_query_args( $args );
if ( $is_work_page ) {
	$query_args['posts_per_page'] = -1;
	unset( $query_args['meta_query'] );
}

$portfolio = new WP_Query( $query_args );

$label_key       = $is_work_page ? 'work_page_label' : 'work_label';
$title_key       = $is_work_page ? 'work_page_title' : 'work_title';
$desc_key        = $is_work_page ? 'work_page_description' : 'work_description';
$hint_key        = $is_work_page ? 'work_page_hint' : 'work_hint';
$default_label   = $is_work_page ? 'All Work' : 'Selected Work';
$default_title   = $is_work_page ? 'Full portfolio' : 'Featured projects';
$default_desc    = $is_work_page ? 'Browse every project by category.' : 'A selection of my best work — hover to auto-scroll.';
$show_filter     = $is_work_page && studio_template_arg( $args, 'show_category_filter', 'work_page_show_categories', true );
$show_view_all   = ! $is_work_page && studio_template_arg( $args, 'show_view_all', 'home_show_view_all', true );
$work_page_url   = studio_get_page_url( 'work_page_id', '#work' );

$all_categories = get_terms(
	array(
		'taxonomy'   => 'portfolio_category',
		'hide_empty' => true,
	)
);
?>

<section id="<?php echo $is_work_page ? 'work-page' : 'work'; ?>" class="section portfolio-section <?php echo $is_work_page ? 'portfolio-section-work' : 'portfolio-section-home'; ?>">
	<div class="container">
		<div class="section-header fade-in <?php echo $is_work_page ? '' : 'section-header-portfolio-home'; ?>">
			<p class="section-label"><?php echo esc_html( studio_template_arg( $args, 'work_label', $label_key, $default_label ) ); ?></p>
			<h2 class="display-md"><?php echo esc_html( studio_template_arg( $args, 'work_title', $title_key, $default_title ) ); ?></h2>
			<p class="text-muted portfolio-section-desc">
				<?php echo esc_html( studio_template_arg( $args, 'work_description', $desc_key, $default_desc ) ); ?>
			</p>

			<?php if ( $show_view_all && $work_page_url ) : ?>
				<p style="margin-top:1.5rem;">
					<a href="<?php echo esc_url( $work_page_url ); ?>" class="btn btn-outline">
						<?php echo esc_html( studio_template_arg( $args, 'view_all_text', 'home_view_all_text', __( 'View All Work →', 'studio-portfolio' ) ) ); ?>
					</a>
				</p>
			<?php endif; ?>
		</div>

		<?php if ( $show_filter && ! is_wp_error( $all_categories ) && ! empty( $all_categories ) ) : ?>
			<div class="portfolio-category-filter fade-in" role="tablist" aria-label="<?php esc_attr_e( 'Filter by category', 'studio-portfolio' ); ?>">
				<button type="button" class="portfolio-filter-btn is-active" data-filter="all">
					<?php esc_html_e( 'All', 'studio-portfolio' ); ?>
				</button>
				<?php foreach ( $all_categories as $term ) : ?>
					<button type="button" class="portfolio-filter-btn" data-filter="<?php echo esc_attr( $term->slug ); ?>">
						<?php echo esc_html( $term->name ); ?>
					</button>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>

	<?php if ( $portfolio->have_posts() ) : ?>
		<?php if ( $is_work_page ) : ?>
			<div class="container">
				<div class="portfolio-grid portfolio-grid-work">
					<?php
					$index = 1;
					while ( $portfolio->have_posts() ) :
						$portfolio->the_post();
						$number = get_post_meta( get_the_ID(), '_portfolio_number', true );
						if ( ! $number ) {
							$number = str_pad( (string) $index, 2, '0', STR_PAD_LEFT );
						}
						get_template_part(
							'template-parts/portfolio-card',
							null,
							array(
								'card' => array(
									'post_id' => get_the_ID(),
									'number'  => $number,
									'large'   => true,
								),
							)
						);
						$index++;
					endwhile;
					wp_reset_postdata();
					?>
				</div>
			</div>
		<?php else : ?>
			<div class="portfolio-scroll-wrapper">
				<div class="portfolio-scroll-container" aria-label="<?php esc_attr_e( 'Featured portfolio gallery', 'studio-portfolio' ); ?>">
					<div class="portfolio-scroll-track">
						<?php
						$index = 1;
						while ( $portfolio->have_posts() ) :
							$portfolio->the_post();
							$number = get_post_meta( get_the_ID(), '_portfolio_number', true );
							if ( ! $number ) {
								$number = str_pad( (string) $index, 2, '0', STR_PAD_LEFT );
							}
							get_template_part(
								'template-parts/portfolio-card',
								null,
								array(
									'card' => array(
										'post_id' => get_the_ID(),
										'number'  => $number,
										'large'   => true,
									),
								)
							);
							$index++;
						endwhile;
						wp_reset_postdata();
						?>
					</div>
				</div>
			</div>

			<div class="portfolio-scroll-hint">
				<span class="hint-icon">→</span>
				<span><?php echo esc_html( studio_template_arg( $args, 'work_hint', $hint_key, __( 'Hover to auto-scroll · Drag to explore', 'studio-portfolio' ) ) ); ?></span>
			</div>
		<?php endif; ?>
	<?php else : ?>
		<div class="container">
			<div class="portfolio-empty glass">
				<p><?php esc_html_e( 'No portfolio items yet.', 'studio-portfolio' ); ?></p>
				<?php if ( ! $is_work_page ) : ?>
					<p class="text-muted"><?php esc_html_e( 'Mark projects as "Show on Homepage" in Portfolio → Edit, or visit the Work page for all projects.', 'studio-portfolio' ); ?></p>
				<?php endif; ?>
				<?php if ( current_user_can( 'edit_posts' ) ) : ?>
					<p>
						<a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=portfolio' ) ); ?>">
							<?php esc_html_e( 'Add portfolio item →', 'studio-portfolio' ); ?>
						</a>
					</p>
				<?php endif; ?>
			</div>
		</div>
	<?php endif; ?>
</section>
