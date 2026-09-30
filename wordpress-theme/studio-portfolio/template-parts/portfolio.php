<?php
/**
 * Portfolio section — home preview OR full portfolio page with category tabs
 *
 * @package Studio_Portfolio
 *
 * @var array $args Optional overrides.
 */

$args = isset( $args ) ? $args : array();
$mode = studio_template_arg( $args, 'mode', '', 'home' );
$is_portfolio_page = in_array( $mode, array( 'portfolio', 'work' ), true );
$is_home           = ( 'home' === $mode );

$query_args = studio_get_portfolio_query_args( $args );
$portfolio  = new WP_Query( $query_args );

$label_key     = $is_portfolio_page ? 'portfolio_page_label' : 'work_label';
$title_key     = $is_portfolio_page ? 'portfolio_page_title' : 'work_title';
$desc_key      = $is_portfolio_page ? 'portfolio_page_description' : 'work_description';
$hint_key      = $is_portfolio_page ? 'portfolio_page_hint' : 'work_hint';
$default_label = $is_portfolio_page ? 'My Work' : 'Selected Work';
$default_title = $is_portfolio_page ? 'Selected brand work' : 'Featured projects';
$default_desc  = $is_portfolio_page ? 'Browse by category. Each project is a case study — challenge, approach, design, transformation, and result.' : '';

$view_all_url  = isset( $args['view_all_url'] ) ? $args['view_all_url'] : studio_get_page_url( 'portfolio_page_id', studio_get_page_url( 'work_page_id', '#portfolio' ) );
$show_view_all = ! $is_portfolio_page && studio_template_arg( $args, 'show_view_all', 'home_show_view_all', true );

$all_categories = get_terms(
	array(
		'taxonomy'   => 'portfolio_category',
		'hide_empty' => true,
	)
);
?>

<section id="<?php echo $is_portfolio_page ? 'portfolio-page' : 'work'; ?>" class="section portfolio-section <?php echo $is_portfolio_page ? 'portfolio-section-page premium-portfolio-page' : 'portfolio-section-home'; ?>">
	<div class="container">
		<div class="section-header <?php echo $is_portfolio_page ? 'center' : ''; ?>">
			<p class="section-label"><?php echo esc_html( studio_template_arg( $args, 'work_label', $label_key, $default_label ) ); ?></p>
			<h2 class="display-md"><?php echo esc_html( studio_template_arg( $args, 'work_title', $title_key, $default_title ) ); ?></h2>
			<?php
			$desc = studio_template_arg( $args, 'work_description', $desc_key, $default_desc );
			if ( $desc ) :
				?>
				<p class="text-muted portfolio-section-desc"><?php echo esc_html( $desc ); ?></p>
			<?php endif; ?>

			<?php if ( $show_view_all && $view_all_url ) : ?>
				<p style="margin-top:1.5rem;">
					<a href="<?php echo esc_url( $view_all_url ); ?>" class="btn btn-outline">
						<?php echo esc_html( studio_template_arg( $args, 'view_all_text', 'home_portfolio_btn', __( 'View Full Portfolio →', 'studio-portfolio' ) ) ); ?>
					</a>
				</p>
			<?php endif; ?>
		</div>

		<?php if ( $is_portfolio_page && ! is_wp_error( $all_categories ) && ! empty( $all_categories ) ) : ?>
			<div class="portfolio-category-tabs premium-tabs" role="tablist" aria-label="<?php esc_attr_e( 'Portfolio categories', 'studio-portfolio' ); ?>">
				<button type="button" class="portfolio-tab-btn is-active" data-filter="all" role="tab" aria-selected="true">
					<?php esc_html_e( 'All', 'studio-portfolio' ); ?>
				</button>
				<?php foreach ( $all_categories as $term ) : ?>
					<button type="button" class="portfolio-tab-btn" data-filter="<?php echo esc_attr( $term->slug ); ?>" role="tab" aria-selected="false">
						<?php echo esc_html( $term->name ); ?>
					</button>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>

	<?php if ( $portfolio->have_posts() ) : ?>
		<?php if ( $is_portfolio_page ) : ?>
			<div class="container">
				<div class="portfolio-grid-work">
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
									'premium' => true,
									'context' => 'default',
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
		<div class="portfolio-scroll-wrapper portfolio-scroll-premium">
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
						get_template_part(
							'template-parts/portfolio-card',
							null,
							array(
								'card' => array(
									'post_id' => get_the_ID(),
									'number'  => $number,
									'large'   => true,
									'premium' => true,
									'context' => 'home',
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
		<?php endif; ?>
	<?php else : ?>
		<div class="container">
			<div class="portfolio-empty glass">
				<p><?php esc_html_e( 'No portfolio items yet.', 'studio-portfolio' ); ?></p>
				<?php if ( $is_home ) : ?>
					<p class="text-muted"><?php esc_html_e( 'Add items under Portfolio → Add New. They appear here automatically.', 'studio-portfolio' ); ?></p>
				<?php endif; ?>
				<?php if ( current_user_can( 'edit_posts' ) ) : ?>
					<p><a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=portfolio' ) ); ?>"><?php esc_html_e( 'Add portfolio item →', 'studio-portfolio' ); ?></a></p>
				<?php endif; ?>
			</div>
		</div>
	<?php endif; ?>
</section>
