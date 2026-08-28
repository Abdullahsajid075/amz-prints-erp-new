<?php
/**
 * Template Name: How I Work
 * Template Post Type: page
 *
 * @package Studio_Portfolio
 */

get_header();
?>

<main class="studio-page-content studio-how-i-work-page" style="padding-top:7rem;">
	<?php
	while ( have_posts() ) :
		the_post();
		if ( studio_is_elementor_page() ) {
			the_content();
		} else {
			get_template_part( 'template-parts/how-i-work' );
		}
	endwhile;
	?>
</main>

<?php
get_footer();
