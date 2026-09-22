<?php
/**
 * Footer
 *
 * @package AMZ_Prints
 */

$legal = amz_prints_mod( 'amz_legal_name', 'Amazon Printings (Pvt) Ltd' );
?>
</main><!-- #main -->

<footer class="site-footer site-footer--light">
	<div class="container site-footer__grid">
		<div class="site-footer__brand">
			<a class="site-brand__text" href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<span class="site-brand__name"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></span>
			</a>
			<p class="site-footer__legal"><?php echo esc_html( $legal ); ?></p>
			<p class="site-footer__tagline"><?php echo esc_html( amz_prints_mod( 'amz_company_tagline', 'Professional Printing & Advertising Services' ) ); ?></p>
		</div>

		<div class="site-footer__col">
			<h4>Explore</h4>
			<ul class="footer-menu">
				<li><a href="<?php echo esc_url( home_url( '/services/' ) ); ?>">Services</a></li>
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
			<h4>Start a project</h4>
			<p>Get pricing fast — WhatsApp or quote form.</p>
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/quote/' ) ); ?>">Request a Quote</a>
		</div>
	</div>

	<div class="site-footer__bottom">
		<div class="container site-footer__bottom-inner">
			<p>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php echo esc_html( $legal ); ?>. All rights reserved.</p>
			<p class="powered-by">Powered By: <strong>Amazon Printings</strong></p>
		</div>
	</div>
</footer>

<?php get_template_part( 'template-parts/float', 'tools' ); ?>
<?php get_template_part( 'template-parts/promo', 'popup' ); ?>

<?php wp_footer(); ?>
</body>
</html>
