<?php
/**
 * Footer — Press Atelier 3.0
 *
 * @package AMZ_Prints
 */

$legal   = amz_prints_mod( 'amz_legal_name', 'Amazon Printings (Pvt) Ltd' );
$company = amz_prints_mod( 'amz_company_name', 'AMZ Prints' );
$cart_n  = function_exists( 'amz_prints_cart_count' ) ? (int) amz_prints_cart_count() : 0;
?>
</main><!-- #main -->

<footer class="site-footer site-footer--atelier">
	<div class="site-footer__glow" aria-hidden="true"></div>
	<div class="container site-footer__grid">
		<div class="site-footer__brand">
			<a class="site-brand__text" href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<span class="site-brand__mark" aria-hidden="true"></span>
				<span class="site-brand__name"><?php echo esc_html( $company ); ?></span>
			</a>
			<p class="site-footer__legal"><?php echo esc_html( $legal ); ?></p>
			<p class="site-footer__tagline"><?php echo esc_html( amz_prints_mod( 'amz_company_tagline', 'Professional Printing & Advertising Services' ) ); ?></p>
		</div>

		<div class="site-footer__col">
			<h4>Explore</h4>
			<ul class="footer-menu">
				<li><a href="<?php echo esc_url( home_url( '/create-free-cv/' ) ); ?>"><?php esc_html_e( 'Create Free CV', 'amz-prints' ); ?></a></li>
				<li><a href="<?php echo esc_url( home_url( '/services/' ) ); ?>">Services</a></li>
				<li><a href="<?php echo esc_url( home_url( '/digital-services/' ) ); ?>">Digital Services</a></li>
				<li><a href="<?php echo esc_url( home_url( '/company-profile/' ) ); ?>">Company Profile</a></li>
				<li><a href="<?php echo esc_url( home_url( '/products/' ) ); ?>">Products</a></li>
				<li><a href="<?php echo esc_url( home_url( '/pricing/' ) ); ?>">Pricing</a></li>
				<li><a href="<?php echo esc_url( home_url( '/nadra-e-services/' ) ); ?>">NADRA</a></li>
				<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>">About</a></li>
				<li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Contact</a></li>
			</ul>
		</div>

		<div class="site-footer__col">
			<h4>Our Branches</h4>
			<ul class="footer-branches">
				<li>
					<strong>Bahria Town Phase 8</strong>
					<span>Rawalpindi <em>(Coming Soon)</em></span>
				</li>
				<li>
					<strong>Mandi Bahauddin</strong>
					<span>Punjab, Pakistan</span>
				</li>
				<li>
					<strong>Johar Town</strong>
					<span>Lahore</span>
				</li>
			</ul>
		</div>

		<div class="site-footer__col site-footer__cta-col">
			<p class="eyebrow">Start a project</p>
			<h4>Print with presence</h4>
			<p>Fast quotes, color-true output, and delivery you can track.</p>
			<a class="btn btn--primary btn--magnetic" href="<?php echo esc_url( home_url( '/quote/' ) ); ?>">Request a Quote</a>
		</div>
	</div>

	<div class="site-footer__bottom">
		<div class="container site-footer__bottom-inner">
			<p>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php echo esc_html( $legal ); ?>. All rights reserved.</p>
			<p class="powered-by">Press Atelier 3.0 · Powered By: <strong>Amazon Printings</strong></p>
		</div>
	</div>
</footer>

<aside class="amz-dock" aria-label="<?php esc_attr_e( 'Quick dock', 'amz-prints' ); ?>">
	<a class="amz-dock__btn amz-dock__btn--cart btn--magnetic" href="<?php echo esc_url( home_url( '/cart/' ) ); ?>">
		<span>Cart</span>
		<em data-cart-count <?php echo $cart_n ? '' : 'hidden'; ?>><?php echo esc_html( (string) $cart_n ); ?></em>
	</a>
	<a class="amz-dock__btn btn--magnetic" href="<?php echo esc_url( home_url( '/quote/' ) ); ?>">Quote</a>
	<button type="button" class="amz-dock__btn" id="amz-back-top" aria-label="<?php esc_attr_e( 'Back to top', 'amz-prints' ); ?>">Top</button>
</aside>

<?php get_template_part( 'template-parts/float', 'tools' ); ?>
<?php get_template_part( 'template-parts/promo', 'popup' ); ?>
<?php get_template_part( 'template-parts/product', 'modal' ); ?>

<?php wp_footer(); ?>
</body>
</html>
