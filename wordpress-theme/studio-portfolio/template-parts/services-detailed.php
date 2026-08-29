<?php
/**
 * Detailed services grid — About page
 *
 * @package Studio_Portfolio
 */

$services = studio_get_detailed_services();
if ( empty( $services ) ) {
	return;
}
?>

<div class="services-detailed-section fade-in">
	<p class="section-label center"><?php echo esc_html( studio_get_option( 'detailed_services_label', 'My Services' ) ); ?></p>
	<h2 class="display-md center" style="margin-bottom:2.5rem;">
		<?php echo esc_html( studio_get_option( 'detailed_services_title', 'Everything I design for your brand' ) ); ?>
	</h2>

	<div class="services-detailed-grid">
		<?php foreach ( $services as $service ) : ?>
			<div class="service-detailed-card premium-card-glow">
				<div class="service-detailed-head">
					<span class="service-detailed-icon"><?php echo esc_html( $service['icon'] ); ?></span>
					<h3 class="service-detailed-title"><?php echo esc_html( $service['title'] ); ?></h3>
				</div>
				<?php if ( ! empty( $service['items'] ) ) : ?>
					<ul class="service-detailed-list">
						<?php foreach ( $service['items'] as $item ) : ?>
							<li><?php echo esc_html( $item ); ?></li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			</div>
		<?php endforeach; ?>
	</div>
</div>
