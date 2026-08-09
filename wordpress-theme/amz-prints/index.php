<?php
/**
 * Main fallback template
 *
 * @package AMZ_Prints
 */

get_header();
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php esc_html_e( 'Latest', 'amz-prints' ); ?></h1>
	</div>
</section>

<section class="section">
	<div class="container blog-grid">
		<?php if ( have_posts() ) : ?>
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<article <?php post_class( 'blog-card reveal' ); ?> data-reveal>
					<a href="<?php the_permalink(); ?>">
						<?php if ( has_post_thumbnail() ) : ?>
							<?php the_post_thumbnail( 'amz-card' ); ?>
						<?php endif; ?>
						<h2><?php the_title(); ?></h2>
						<p><?php echo esc_html( get_the_excerpt() ); ?></p>
					</a>
				</article>
				<?php
			endwhile;
			the_posts_pagination();
			?>
		<?php else : ?>
			<p><?php esc_html_e( 'No posts found.', 'amz-prints' ); ?></p>
		<?php endif; ?>
	</div>
</section>

<?php get_footer(); ?>
