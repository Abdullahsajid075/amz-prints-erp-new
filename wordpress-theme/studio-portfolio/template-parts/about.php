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
					<p class="section-label"><?php esc_html_e( 'About Me', 'studio-portfolio' ); ?></p>
					<h2 class="display-md"><?php echo esc_html( studio_get_option( 'about_title', 'Design is my language' ) ); ?></h2>
				</div>
				<div class="about-text">
					<p class="lead"><?php echo esc_html( studio_get_option( 'about_text', 'With over 5 years of experience in visual design, I help startups and established brands create identities that resonate and interfaces that convert.' ) ); ?></p>
					<p><?php esc_html_e( 'My approach blends strategic thinking with bold aesthetics. I believe great design is not just about looking good — it is about solving problems, telling stories, and creating emotional connections.', 'studio-portfolio' ); ?></p>
				</div>

				<div class="stats-grid">
					<div class="stat-card">
						<p class="stat-value text-gradient-gold"><?php echo esc_html( studio_get_option( 'stat_projects', '50+' ) ); ?></p>
						<p class="text-muted"><?php esc_html_e( 'Projects Delivered', 'studio-portfolio' ); ?></p>
					</div>
					<div class="stat-card">
						<p class="stat-value text-gradient"><?php echo esc_html( studio_get_option( 'stat_clients', '30+' ) ); ?></p>
						<p class="text-muted"><?php esc_html_e( 'Happy Clients', 'studio-portfolio' ); ?></p>
					</div>
					<div class="stat-card">
						<p class="stat-value text-gradient-gold"><?php echo esc_html( studio_get_option( 'stat_experience', '5' ) ); ?></p>
						<p class="text-muted"><?php esc_html_e( 'Years Experience', 'studio-portfolio' ); ?></p>
					</div>
					<div class="stat-card">
						<p class="stat-value text-gradient"><?php echo esc_html( studio_get_option( 'stat_awards', '12' ) ); ?></p>
						<p class="text-muted"><?php esc_html_e( 'Awards Won', 'studio-portfolio' ); ?></p>
					</div>
				</div>
			</div>

			<div class="fade-in">
				<p class="section-label"><?php esc_html_e( 'What I Do', 'studio-portfolio' ); ?></p>
				<h3 class="display-md" style="font-size:1.75rem;margin-bottom:2rem;"><?php esc_html_e( 'Services tailored to your vision', 'studio-portfolio' ); ?></h3>

				<?php
				$services = array(
					array( 'icon' => '🎨', 'title' => __( 'Brand Identity', 'studio-portfolio' ), 'desc' => __( 'Logos, visual systems, brand guidelines, and everything that makes your brand unforgettable.', 'studio-portfolio' ) ),
					array( 'icon' => '📐', 'title' => __( 'UI/UX Design', 'studio-portfolio' ), 'desc' => __( 'Intuitive interfaces for web and mobile — wireframes, prototypes, and pixel-perfect designs.', 'studio-portfolio' ) ),
					array( 'icon' => '🧩', 'title' => __( 'Design Systems', 'studio-portfolio' ), 'desc' => __( 'Scalable component libraries and token-based systems that keep teams aligned.', 'studio-portfolio' ) ),
					array( 'icon' => '✨', 'title' => __( 'Creative Direction', 'studio-portfolio' ), 'desc' => __( 'Campaign concepts, art direction, and visual storytelling that captivates.', 'studio-portfolio' ) ),
				);
				foreach ( $services as $service ) :
					?>
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
