<?php
/**
 * Page template — Elementor compatible
 *
 * @package Studio_Portfolio
 */

get_header();
?>

<main class="studio-page-content <?php echo studio_is_elementor_page() ? 'studio-elementor-content' : ''; ?>">
	<?php
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
	?>
</main>

<?php
get_footer();
