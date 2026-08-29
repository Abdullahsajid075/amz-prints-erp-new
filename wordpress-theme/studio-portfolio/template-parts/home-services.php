<?php
/**
 * Home — Services overview (short cards)
 *
 * @package Studio_Portfolio
 */

$services = studio_get_home_services();
?>

<section class="section home-services premium-section-alt">
	<div class="container">
		<div class="section-header center fade-in">
			<p class="section-label"><?php echo esc_html( studio_get_option( 'home_services_label', 'What I Offer' ) ); ?></p>
			<h2 class="display-md"><?php echo esc_html( studio_get_option( 'home_services_title', 'Premium design services' ) ); ?></h2>
		</div>
		<div class="services-grid home-services-grid fade-in">
			<?php foreach ( $services as $service ) : ?>
				<div class="service-card premium-service-card home-service-card">
					<div class="service-icon"><?php echo esc_html( $service['icon'] ); ?></div>
					<div>
						<h4 class="service-title"><?php echo esc_html( $service['title'] ); ?></h4>
						<p class="service-desc"><?php echo esc_html( $service['desc'] ); ?></p>
					</div>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>
