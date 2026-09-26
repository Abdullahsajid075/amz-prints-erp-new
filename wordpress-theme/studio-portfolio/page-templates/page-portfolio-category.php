<?php
/**
 * Template Name: Portfolio Category Hub
 * Template Post Type: page
 *
 * Mega-menu sub-page: editable intro + automatic project grid.
 *
 * @package Studio_Portfolio
 */

get_header();

$page_id   = get_the_ID();
$term_names = studio_get_hub_page_terms( $page_id );
$term_slugs = array();

foreach ( $term_names as $name ) {
	$term = get_term_by( 'name', $name, 'portfolio_category' );
	if ( $term && ! is_wp_error( $term ) ) {
		$term_slugs[] = $term->slug;
	} else {
		$term_slugs[] = sanitize_title( $name );
	}
}

$query_args = array(
	'post_type'      => 'portfolio',
	'posts_per_page' => -1,
	'orderby'        => 'menu_order date',
	'order'          => 'ASC',
	'post_status'    => 'publish',
);

if ( ! empty( $term_slugs ) ) {
	$query_args['tax_query'] = array(
		array(
			'taxonomy' => 'portfolio_category',
			'field'    => 'slug',
			'terms'    => $term_slugs,
		),
	);
}

$projects = new WP_Query( $query_args );
$thumb_id = get_post_thumbnail_id( $page_id );
?>

<main class="studio-page-content studio-hub-page">
	<section class="hub-hero">
		<div class="container hub-hero-grid">
			<div class="hub-hero-copy">
				<p class="section-label"><?php esc_html_e( 'Portfolio', 'studio-portfolio' ); ?></p>
				<h1 class="display-md"><?php the_title(); ?></h1>
				<div class="hub-hero-text text-muted">
					<?php
					while ( have_posts() ) :
						the_post();
						the_content();
					endwhile;
					?>
				</div>
				<p class="hub-edit-hint">
					<?php if ( current_user_can( 'edit_post', $page_id ) ) : ?>
						<a href="<?php echo esc_url( get_edit_post_link( $page_id ) ); ?>">
							<?php esc_html_e( 'Edit this page (title, photo, text) →', 'studio-portfolio' ); ?>
						</a>
					<?php endif; ?>
				</p>
			</div>
			<?php if ( $thumb_id ) : ?>
				<div class="hub-hero-photo premium-card-glow">
					<?php echo wp_get_attachment_image( $thumb_id, 'large', false, array( 'class' => 'hub-hero-image' ) ); ?>
				</div>
			<?php endif; ?>
		</div>
	</section>

	<section class="section hub-projects">
		<div class="container">
			<div class="section-header">
				<p class="section-label"><?php esc_html_e( 'Projects', 'studio-portfolio' ); ?></p>
				<h2 class="display-md"><?php esc_html_e( 'Work in this category', 'studio-portfolio' ); ?></h2>
				<p class="text-muted"><?php esc_html_e( 'Items you add in Portfolio → Add New (with this category) appear here automatically.', 'studio-portfolio' ); ?></p>
			</div>

			<?php if ( $projects->have_posts() ) : ?>
				<div class="portfolio-grid-work hub-project-grid">
					<?php
					$index = 1;
					while ( $projects->have_posts() ) :
						$projects->the_post();
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
			<?php else : ?>
				<div class="portfolio-empty glass">
					<p><?php esc_html_e( 'No projects in this category yet.', 'studio-portfolio' ); ?></p>
					<?php if ( current_user_can( 'edit_posts' ) ) : ?>
						<p><a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=portfolio' ) ); ?>"><?php esc_html_e( 'Add a portfolio item →', 'studio-portfolio' ); ?></a></p>
					<?php endif; ?>
				</div>
			<?php endif; ?>

			<p style="margin-top:2.5rem;">
				<a class="btn btn-outline" href="<?php echo esc_url( studio_get_page_url( 'portfolio_page_id', home_url( '/portfolio/' ) ) ); ?>">← <?php esc_html_e( 'All Portfolio', 'studio-portfolio' ); ?></a>
			</p>
		</div>
	</section>
</main>

<?php
get_footer();
