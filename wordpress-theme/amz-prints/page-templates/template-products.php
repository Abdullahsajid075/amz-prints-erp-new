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

<section class="page-hero page-hero--compact page-hero--shop">
	<div class="container">
		<p class="shop-head__eyebrow"><?php esc_html_e( 'Products', 'amz-prints' ); ?></p>
		<h1><?php echo esc_html( amz_prints_mod( 'amz_products_title', 'Our Products' ) ); ?></h1>
		<p class="page-hero__lead"><?php echo esc_html( amz_prints_mod( 'amz_products_sub', 'Browse print products and open any item for full details.' ) ); ?></p>
	</div>
</section>

<section class="section section--shop section--products-page">
	<div class="container">
		<?php if ( empty( $erp_products ) ) : ?>
			<p class="form-note">
				<?php esc_html_e( 'Live ERP catalog unavailable right now. Redeploy latest Code.gs (public/products) to sync ERP items.', 'amz-prints' ); ?>
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
