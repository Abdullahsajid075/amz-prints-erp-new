<?php
/**
 * Home — testimonials
 *
 * @package Studio_Portfolio
 */

$items = studio_get_testimonials();
if ( empty( $items ) ) {
	return;
}
?>

<section class="section home-testimonials premium-section">
	<div class="container">
		<div class="section-header center">
			<p class="section-label"><?php echo esc_html( studio_get_option( 'testimonials_label', 'What Clients Say' ) ); ?></p>
			<h2 class="display-md"><?php echo esc_html( studio_get_option( 'testimonials_title', 'Proof from real businesses' ) ); ?></h2>
		</div>
		<div class="testimonials-grid">
			<?php foreach ( $items as $item ) : ?>
				<blockquote class="testimonial-card premium-card-glow">
					<p>“<?php echo esc_html( $item['quote'] ); ?>”</p>
					<footer>
						<strong><?php echo esc_html( $item['name'] ); ?></strong>
						<?php if ( $item['company'] ) : ?>
							<span><?php echo esc_html( $item['company'] ); ?></span>
						<?php endif; ?>
					</footer>
				</blockquote>
			<?php endforeach; ?>
		</div>
	</div>
</section>
