<?php
/**
 * Template Name: Work Page (legacy)
 * Template Post Type: page
 *
 * @package Studio_Portfolio
 */

get_header();
?>

<main class="studio-page-content studio-portfolio-page" style="padding-top:7rem;">
	<?php
	while ( have_posts() ) :
		the_post();
		get_template_part( 'template-parts/portfolio', null, array( 'mode' => 'portfolio' ) );
	endwhile;
	?>
</main>

<?php
get_footer();
