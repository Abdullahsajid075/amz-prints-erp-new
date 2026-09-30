<?php
/**
 * Template Name: Products
 *
 * @package AMZ_Prints
 */

get_header();

$erp_products = function_exists( 'amz_prints_erp_get_products' ) ? amz_prints_erp_get_products() : array();
$cats         = array();
foreach ( $erp_products as $p ) {
	$c = trim( (string) ( $p['category'] ?? '' ) );
	if ( $c ) {
		$cats[ sanitize_title( $c ) ] = $c;
	}
}
?>

<?php
if ( function_exists( 'amz_prints_page_banner' ) ) {
	amz_prints_page_banner( 'products' );
}
?>

<section class="section section--shop section--products-page">
	<div class="container container--banner">
		<?php if ( empty( $erp_products ) ) : ?>
			<p class="form-note">
				<?php esc_html_e( 'Products are updating. Please check again in a moment.', 'amz-prints' ); ?>
			</p>
		<?php else : ?>
			<nav class="shop-cats" data-shop-cats aria-label="<?php esc_attr_e( 'Product categories', 'amz-prints' ); ?>">
				<button type="button" class="is-active" data-cat="all"><?php esc_html_e( 'All Product', 'amz-prints' ); ?></button>
				<?php foreach ( $cats as $slug => $label ) : ?>
					<button type="button" data-cat="<?php echo esc_attr( $slug ); ?>"><?php echo esc_html( $label ); ?></button>
				<?php endforeach; ?>
			</nav>

			<div class="shop-grid" data-shop-grid>
				<?php foreach ( $erp_products as $product ) : ?>
					<?php get_template_part( 'template-parts/product', 'card', array( 'product' => $product ) ); ?>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>
</section>

<section class="section section--cta">
	<div class="container cta-band reveal" data-reveal>
		<div class="cta-band__copy">
			<h2><?php esc_html_e( 'Need a custom product?', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Tell us the size, quantity, and finish — we’ll quote fast.', 'amz-prints' ); ?></p>
		</div>
		<a class="btn btn--primary btn--lg" href="<?php echo esc_url( home_url( '/quote/' ) ); ?>"><?php esc_html_e( 'Get a Quote', 'amz-prints' ); ?></a>
	</div>
</section>

<?php get_footer(); ?>
