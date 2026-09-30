<?php
/**
 * Home — Call to action band
 *
 * @package Studio_Portfolio
 */

$schedule_url = studio_get_start_project_url();
?>

<section class="home-cta-band premium-section">
	<div class="container">
		<div class="home-cta-inner fade-in">
			<div class="home-cta-content">
				<p class="section-label"><?php echo esc_html( studio_get_option( 'home_cta_label', __( 'Let\'s Work Together', 'studio-portfolio' ) ) ); ?></p>
				<h2 class="display-md"><?php echo esc_html( studio_get_option( 'home_cta_title', __( 'Have a brand that needs a better identity?', 'studio-portfolio' ) ) ); ?></h2>
				<p class="text-muted home-lead"><?php echo esc_html( studio_get_option( 'home_cta_text', __( 'Let\'s talk about your next project.', 'studio-portfolio' ) ) ); ?></p>
			</div>
			<div class="home-cta-actions">
				<a href="<?php echo esc_url( $schedule_url ); ?>" class="btn btn-primary btn-lg">
					<?php echo esc_html( studio_get_option( 'home_cta_btn', __( 'Start a Project →', 'studio-portfolio' ) ) ); ?>
				</a>
				<a href="<?php echo esc_url( studio_get_page_url( 'portfolio_page_id', '#portfolio' ) ); ?>" class="btn btn-outline btn-lg">
					<?php echo esc_html( studio_get_option( 'home_cta_btn2', __( 'View Portfolio', 'studio-portfolio' ) ) ); ?>
				</a>
			</div>
		</div>
	</div>
</section>
