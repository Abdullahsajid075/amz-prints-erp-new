<?php
/**
 * Page template — falls back to About / How I Work theme sections
 *
 * @package Studio_Portfolio
 */

get_header();

$page_id = get_queried_object_id();
$role    = $page_id ? studio_detect_page_role( $page_id ) : '';
?>

<main class="studio-page-content <?php echo studio_is_elementor_page() ? 'studio-elementor-content' : ''; ?>">
	<?php
	if ( 'about' === $role ) {
		get_template_part( 'template-parts/about' );
	} elseif ( 'how-i-work' === $role ) {
		get_template_part( 'template-parts/how-i-work' );
	} elseif ( 'portfolio' === $role ) {
		get_template_part( 'template-parts/portfolio', null, array( 'mode' => 'portfolio' ) );
	} elseif ( 'services' === $role ) {
		get_template_part( 'template-parts/home-services' );
		get_template_part( 'template-parts/services-detailed' );
	} elseif ( 'contact' === $role ) {
		get_template_part( 'template-parts/contact' );
	} else {
		while ( have_posts() ) :
			the_post();
			if ( studio_is_elementor_page() ) {
				the_content();
			} else {
				?>
				<div class="section" style="padding-top:8rem;">
					<div class="container">
						<article <?php post_class(); ?>>
							<h1 class="display-md"><?php the_title(); ?></h1>
							<div class="about-text" style="margin-top:2rem;">
								<?php the_content(); ?>
							</div>
						</article>
					</div>
				</div>
				<?php
			}
		endwhile;
	}
	?>
</main>

<?php
get_footer();
