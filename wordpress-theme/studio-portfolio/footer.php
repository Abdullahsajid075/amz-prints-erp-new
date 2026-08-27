<footer class="site-footer">
	<div class="container footer-inner">
		<div class="site-logo">
			<span class="logo-mark"><?php echo esc_html( studio_get_option( 'logo_letter', 'S' ) ); ?></span>
			<span class="logo-text"><?php bloginfo( 'name' ); ?></span>
		</div>

		<p class="footer-copy">
			&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>.
			<?php echo esc_html( studio_get_option( 'footer_tagline', 'Crafted with passion.' ) ); ?>
		</p>

		<div class="footer-links">
			<?php foreach ( studio_get_social_links() as $link ) : ?>
				<a href="<?php echo esc_url( $link['url'] ); ?>" target="_blank" rel="noopener noreferrer">
					<?php echo esc_html( $link['label'] ); ?>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</footer>

<?php get_template_part( 'template-parts/floating-contact' ); ?>

<?php wp_footer(); ?>
</body>
</html>
