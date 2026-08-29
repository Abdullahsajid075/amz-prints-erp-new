<?php
/**
 * Main template
 *
 * @package Studio_Portfolio
 */

get_header();
?>

<main class="section" style="padding-top:8rem;">
	<div class="container">
		<?php if ( have_posts() ) : ?>
			<?php while ( have_posts() ) : the_post(); ?>
				<article <?php post_class(); ?>>
					<h1 class="display-md"><?php the_title(); ?></h1>
					<div class="about-text" style="margin-top:2rem;">
						<?php the_content(); ?>
					</div>
				</article>
			<?php endwhile; ?>
		<?php else : ?>
			<p><?php esc_html_e( 'No content found.', 'studio-portfolio' ); ?></p>
		<?php endif; ?>
	</div>
</main>

<?php
get_footer();
