<?php
/**
 * Template Name: Elementor Full Width
 * Template Post Type: page
 *
 * @package Studio_Portfolio
 */

get_header();
?>

<main class="studio-elementor-content studio-full-width">
	<?php
	while ( have_posts() ) :
		the_post();
		the_content();
	endwhile;
	?>
</main>

<?php
get_footer();
