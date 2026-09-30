<?php
/**
 * Site footer — creative multi-column layout
 *
 * @package Studio_Portfolio
 */

$footer_services = studio_get_footer_services();
$start_url       = studio_get_start_project_url();
?>

<footer class="site-footer site-footer-creative">
	<div class="footer-top-accent" aria-hidden="true"></div>
	<div class="container">
		<div class="footer-creative-grid">
			<div class="footer-brand-col">
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-logo footer-logo">
					<span class="logo-mark"><?php echo esc_html( studio_get_option( 'logo_letter', 'S' ) ); ?></span>
					<span class="logo-text"><?php bloginfo( 'name' ); ?></span>
				</a>
				<h2 class="footer-headline"><?php echo esc_html( studio_get_option( 'footer_headline', 'Design that builds bold brands.' ) ); ?></h2>
				<p class="footer-description"><?php echo esc_html( studio_get_option( 'footer_description', 'Premium brand identity, print, packaging, digital & corporate design — crafted with strategy and creativity.' ) ); ?></p>
				<a href="<?php echo esc_url( $start_url ); ?>" class="btn btn-primary footer-cta-btn">
					<?php echo esc_html( studio_get_option( 'footer_cta_btn', 'Start a Project →' ) ); ?>
				</a>
			</div>

			<div class="footer-col">
				<h3 class="footer-col-title"><?php esc_html_e( 'Quick Links', 'studio-portfolio' ); ?></h3>
				<ul class="footer-link-list">
					<li><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_home', 'Home' ) ); ?></a></li>
					<li><a href="<?php echo esc_url( studio_get_page_url( 'about_page_id', '#' ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_about', 'About' ) ); ?></a></li>
					<li><a href="<?php echo esc_url( studio_get_page_url( 'services_page_id', '#' ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_services', 'Services' ) ); ?></a></li>
					<li><a href="<?php echo esc_url( studio_get_page_url( 'portfolio_page_id', '#' ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_portfolio', 'Portfolio' ) ); ?></a></li>
					<li><a href="<?php echo esc_url( studio_get_page_url( 'how_i_work_page_id', '#' ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_how_i_work', 'How I Work' ) ); ?></a></li>
					<li><a href="<?php echo esc_url( studio_get_page_url( 'contact_page_id', '#' ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_contact', 'Contact' ) ); ?></a></li>
				</ul>
			</div>

			<div class="footer-col">
				<h3 class="footer-col-title"><?php echo esc_html( studio_get_option( 'footer_services_title', 'Services' ) ); ?></h3>
				<ul class="footer-service-list">
					<?php foreach ( $footer_services as $service ) : ?>
						<li><?php echo esc_html( $service ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>

			<div class="footer-col">
				<h3 class="footer-col-title"><?php esc_html_e( 'Connect', 'studio-portfolio' ); ?></h3>
				<?php if ( studio_get_option( 'contact_email', '' ) ) : ?>
					<p class="footer-contact-line">
						<a href="mailto:<?php echo esc_attr( studio_get_option( 'contact_email', '' ) ); ?>">
							<?php echo esc_html( studio_get_option( 'contact_email', '' ) ); ?>
						</a>
					</p>
				<?php endif; ?>
				<div class="footer-social-links">
					<?php foreach ( studio_get_social_links() as $link ) : ?>
						<a href="<?php echo esc_url( $link['url'] ); ?>" target="_blank" rel="noopener noreferrer">
							<?php echo esc_html( $link['label'] ); ?>
						</a>
					<?php endforeach; ?>
				</div>
			</div>
		</div>

		<div class="footer-bottom-bar">
			<p class="footer-copy">
				&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>.
				<?php echo esc_html( studio_get_option( 'footer_tagline', 'Designed with passion in Pakistan.' ) ); ?>
			</p>
		</div>
	</div>
</footer>

<?php get_template_part( 'template-parts/floating-contact' ); ?>

<?php wp_footer(); ?>
</body>
</html>
