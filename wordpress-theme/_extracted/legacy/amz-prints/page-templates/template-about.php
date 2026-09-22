<?php
/**
 * Template Name: About
 *
 * @package AMZ_Prints
 */

get_header();
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php echo esc_html( amz_prints_mod( 'amz_company_tagline', 'Professional Printing & Advertising Services' ) ); ?></p>
	</div>
</section>

<section class="section">
	<div class="container content-narrow reveal" data-reveal>
		<?php
		while ( have_posts() ) :
			the_post();
			if ( trim( get_the_content() ) ) {
				the_content();
			} else {
				?>
				<p><?php echo esc_html( amz_prints_mod( 'amz_about_blurb', 'AMZ Prints is a full-service print house built for speed, color fidelity, and finishes that feel premium.' ) ); ?></p>
				<p><?php esc_html_e( 'We partner with businesses, agencies, and creators who need print that looks sharp and arrives on time — from business cards to vehicle wraps, packaging to large-format campaigns.', 'amz-prints' ); ?></p>
				<p><?php esc_html_e( 'Edit this page in WordPress to tell your real story, add team photos, and showcase milestones. Every section of this theme is designed to be customized.', 'amz-prints' ); ?></p>
				<?php
			}
		endwhile;
		?>
	</div>
</section>

<section class="section section--muted">
	<div class="container values-grid">
		<article class="reveal" data-reveal>
			<h3><?php esc_html_e( 'Color that matches', 'amz-prints' ); ?></h3>
			<p><?php esc_html_e( 'Calibrated workflows so your brand colors stay consistent across jobs and substrates.', 'amz-prints' ); ?></p>
		</article>
		<article class="reveal" data-reveal>
			<h3><?php esc_html_e( 'Deadlines kept', 'amz-prints' ); ?></h3>
			<p><?php esc_html_e( 'Transparent timelines and proactive updates from proof through delivery.', 'amz-prints' ); ?></p>
		</article>
		<article class="reveal" data-reveal>
			<h3><?php esc_html_e( 'Finishes that feel premium', 'amz-prints' ); ?></h3>
			<p><?php esc_html_e( 'Lamination, foil, emboss, die-cut — details that make work worth picking up.', 'amz-prints' ); ?></p>
		</article>
	</div>
</section>

<?php get_footer(); ?>
