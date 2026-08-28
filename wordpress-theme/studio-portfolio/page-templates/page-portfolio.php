<?php
/**
 * Template Name: Portfolio Page
 * Template Post Type: page
 *
 * Categories on top — portfolio gallery below with hover auto-scroll.
 *
 * @package Studio_Portfolio
 */

get_header();
?>

<main class="studio-page-content studio-portfolio-page" style="padding-top:7rem;">
	<?php
	while ( have_posts() ) :
		the_post();
		if ( studio_is_elementor_page() ) {
			the_content();
		} else {
			get_template_part(
				'template-parts/portfolio',
				null,
				array( 'mode' => 'portfolio' )
			);
		}
	endwhile;
	?>
</main>

<?php
get_footer();
