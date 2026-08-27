<footer class="site-footer">
	<div class="container footer-inner">
		<div class="site-logo">
			<span class="logo-mark">S</span>
			<span class="logo-text"><?php bloginfo( 'name' ); ?></span>
		</div>

		<p class="footer-copy">
			&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. <?php esc_html_e( 'Crafted with passion.', 'studio-portfolio' ); ?>
		</p>

		<div class="footer-links">
			<a href="#"><?php esc_html_e( 'Dribbble', 'studio-portfolio' ); ?></a>
			<a href="#"><?php esc_html_e( 'Behance', 'studio-portfolio' ); ?></a>
			<a href="#"><?php esc_html_e( 'Instagram', 'studio-portfolio' ); ?></a>
			<a href="#"><?php esc_html_e( 'LinkedIn', 'studio-portfolio' ); ?></a>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
