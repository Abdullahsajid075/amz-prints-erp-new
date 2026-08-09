<?php
/**
 * 404
 *
 * @package AMZ_Prints
 */

get_header();
?>

<section class="page-hero page-hero--center">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php esc_html_e( 'Page not found', 'amz-prints' ); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'That sheet didn’t come off the press. Let’s get you back on track.', 'amz-prints' ); ?></p>
		<a class="btn btn--primary btn--lg" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to home', 'amz-prints' ); ?></a>
	</div>
</section>

<?php get_footer(); ?>
