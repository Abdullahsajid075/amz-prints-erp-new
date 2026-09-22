<?php
/**
 * Template Name: Cart
 *
 * @package AMZ_Prints
 */

get_header();
?>
<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'Review items, update quantities, then checkout.', 'amz-prints' ); ?></p>
	</div>
</section>
<section class="section">
	<div class="container" data-cart-root>
		<p><?php esc_html_e( 'Loading cart…', 'amz-prints' ); ?></p>
	</div>
</section>
<?php
get_footer();
