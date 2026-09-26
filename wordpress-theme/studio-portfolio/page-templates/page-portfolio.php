<?php
/**
 * Template Name: Portfolio Page
 * Template Post Type: page
 *
 * @package Studio_Portfolio
 */

get_header();
?>

<main class="studio-page-content studio-portfolio-page">
	<?php
	get_template_part(
		'template-parts/portfolio',
		null,
		array( 'mode' => 'portfolio' )
	);
	?>
</main>

<?php
get_footer();
