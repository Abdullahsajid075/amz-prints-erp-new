<?php
/**
 * Template Name: About Page
 * Template Post Type: page
 *
 * @package Studio_Portfolio
 */

get_header();
?>

<main class="studio-page-content studio-about-page" style="padding-top:7rem;">
	<?php
	while ( have_posts() ) :
		the_post();
		if ( studio_is_elementor_page() ) {
			the_content();
		} else {
			get_template_part( 'template-parts/about' );
		}
	endwhile;
	?>
</main>

<?php
get_footer();
