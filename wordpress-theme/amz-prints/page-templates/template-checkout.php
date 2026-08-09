<?php
/**
 * Template Name: Checkout
 *
 * @package AMZ_Prints
 */

get_header();
?>
<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'Login required to place an order. Choose COD or Online Payment.', 'amz-prints' ); ?></p>
	</div>
</section>
<section class="section">
	<div class="container" data-checkout-root>
		<p><?php esc_html_e( 'Loading checkout…', 'amz-prints' ); ?></p>
	</div>
</section>
<?php
get_footer();
