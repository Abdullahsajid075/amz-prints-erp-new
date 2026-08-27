<?php
/**
 * About section
 *
 * @package Studio_Portfolio
 */
?>

<section id="about" class="section about-section">
	<div class="container">
		<div class="about-grid">
			<div class="fade-in">
				<div class="section-header">
					<p class="section-label"><?php echo esc_html( studio_get_option( 'about_label', 'About Me' ) ); ?></p>
					<h2 class="display-md about-title"><?php echo esc_html( studio_get_option( 'about_title', 'Design is my language' ) ); ?></h2>
				</div>
				<div class="about-text">
					<p class="lead"><?php echo esc_html( studio_get_option( 'about_text', 'With over 5 years of experience in visual design, I help startups and established brands create identities that resonate and interfaces that convert.' ) ); ?></p>
					<?php if ( studio_get_option( 'about_text2', '' ) ) : ?>
						<p><?php echo esc_html( studio_get_option( 'about_text2', '' ) ); ?></p>
					<?php endif; ?>
				</div>

				<div class="stats-grid">
					<div class="stat-card">
						<p class="stat-value text-gradient-gold"><?php echo esc_html( studio_get_option( 'stat_projects', '50+' ) ); ?></p>
						<p class="text-muted"><?php echo esc_html( studio_get_option( 'stat_projects_label', 'Projects Delivered' ) ); ?></p>
					</div>
					<div class="stat-card">
						<p class="stat-value text-gradient"><?php echo esc_html( studio_get_option( 'stat_clients', '30+' ) ); ?></p>
						<p class="text-muted"><?php echo esc_html( studio_get_option( 'stat_clients_label', 'Happy Clients' ) ); ?></p>
					</div>
					<div class="stat-card">
						<p class="stat-value text-gradient-gold"><?php echo esc_html( studio_get_option( 'stat_experience', '5' ) ); ?></p>
						<p class="text-muted"><?php echo esc_html( studio_get_option( 'stat_experience_label', 'Years Experience' ) ); ?></p>
					</div>
					<div class="stat-card">
						<p class="stat-value text-gradient"><?php echo esc_html( studio_get_option( 'stat_awards', '12' ) ); ?></p>
						<p class="text-muted"><?php echo esc_html( studio_get_option( 'stat_awards_label', 'Awards Won' ) ); ?></p>
					</div>
				</div>
			</div>

			<div class="fade-in">
				<p class="section-label"><?php echo esc_html( studio_get_option( 'services_label', 'What I Do' ) ); ?></p>
				<h3 class="display-md" style="font-size:1.75rem;margin-bottom:2rem;"><?php echo esc_html( studio_get_option( 'services_title', 'Services tailored to your vision' ) ); ?></h3>

				<?php foreach ( studio_get_services() as $service ) : ?>
					<div class="service-card">
						<div class="service-icon"><?php echo esc_html( $service['icon'] ); ?></div>
						<div>
							<h4 class="service-title"><?php echo esc_html( $service['title'] ); ?></h4>
							<p class="service-desc"><?php echo esc_html( $service['desc'] ); ?></p>
						</div>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
	</div>
</section>
