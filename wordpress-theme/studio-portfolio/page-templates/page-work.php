<?php
/**
 * Template Name: Work Page
 * Template Post Type: page
 *
 * Full portfolio with category filters — separate from homepage.
 *
 * @package Studio_Portfolio
 */

get_header();
?>

<main class="studio-page-content studio-work-page" style="padding-top:7rem;">
	<?php
	while ( have_posts() ) :
		the_post();
		if ( studio_is_elementor_page() ) {
			the_content();
		} else {
			get_template_part(
				'template-parts/portfolio',
				null,
				array( 'mode' => 'work' )
			);
		}
	endwhile;
	?>
</main>

<?php
get_footer();
