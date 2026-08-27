<?php
/**
 * About section — full personal story
 *
 * @package Studio_Portfolio
 */

$story_blocks = array(
	array(
		'key'   => 'about_experience',
		'icon'  => '💼',
		'title' => studio_get_option( 'about_experience_title', __( 'Experience', 'studio-portfolio' ) ),
		'content' => studio_get_option( 'about_experience', '' ),
	),
	array(
		'key'   => 'about_education',
		'icon'  => '🎓',
		'title' => studio_get_option( 'about_education_title', __( 'Education', 'studio-portfolio' ) ),
		'content' => studio_get_option( 'about_education', '' ),
	),
	array(
		'key'   => 'about_companies',
		'icon'  => '🏢',
		'title' => studio_get_option( 'about_companies_title', __( 'Companies & Brands', 'studio-portfolio' ) ),
		'content' => studio_get_option( 'about_companies', '' ),
	),
	array(
		'key'   => 'about_goal',
		'icon'  => '🎯',
		'title' => studio_get_option( 'about_goal_title', __( 'My Goal', 'studio-portfolio' ) ),
		'content' => studio_get_option( 'about_goal', '' ),
	),
	array(
		'key'   => 'about_struggles',
		'icon'  => '💪',
		'title' => studio_get_option( 'about_struggles_title', __( 'My Journey & Struggles', 'studio-portfolio' ) ),
		'content' => studio_get_option( 'about_struggles', '' ),
	),
);
?>

<section id="about" class="section about-section">
	<div class="container">
		<div class="section-header center fade-in">
			<p class="section-label"><?php echo esc_html( studio_get_option( 'about_label', 'About Me' ) ); ?></p>
			<h2 class="display-md about-title"><?php echo esc_html( studio_get_option( 'about_title', 'Everything about me' ) ); ?></h2>
			<?php if ( studio_get_option( 'about_text', '' ) ) : ?>
				<p class="text-muted about-intro" style="margin-top:1rem;font-size:1.125rem;max-width:720px;margin-left:auto;margin-right:auto;">
					<?php echo esc_html( studio_get_option( 'about_text', '' ) ); ?>
				</p>
			<?php endif; ?>
		</div>

		<div class="stats-grid fade-in" style="margin-bottom:3rem;">
			<div class="stat-card">
				<p class="stat-value text-gradient"><?php echo esc_html( studio_get_option( 'stat_projects', '50+' ) ); ?></p>
				<p class="text-muted"><?php echo esc_html( studio_get_option( 'stat_projects_label', 'Projects' ) ); ?></p>
			</div>
			<div class="stat-card">
				<p class="stat-value text-gradient"><?php echo esc_html( studio_get_option( 'stat_clients', '30+' ) ); ?></p>
				<p class="text-muted"><?php echo esc_html( studio_get_option( 'stat_clients_label', 'Clients' ) ); ?></p>
			</div>
			<div class="stat-card">
				<p class="stat-value text-gradient"><?php echo esc_html( studio_get_option( 'stat_experience', '5' ) ); ?></p>
				<p class="text-muted"><?php echo esc_html( studio_get_option( 'stat_experience_label', 'Years Experience' ) ); ?></p>
			</div>
			<div class="stat-card">
				<p class="stat-value text-gradient"><?php echo esc_html( studio_get_option( 'stat_awards', '12' ) ); ?></p>
				<p class="text-muted"><?php echo esc_html( studio_get_option( 'stat_awards_label', 'Achievements' ) ); ?></p>
			</div>
		</div>

		<div class="about-story-grid fade-in">
			<?php foreach ( $story_blocks as $block ) : ?>
				<?php if ( empty( $block['content'] ) ) continue; ?>
				<div class="about-story-card">
					<div class="about-story-icon"><?php echo esc_html( $block['icon'] ); ?></div>
					<h3 class="about-story-title"><?php echo esc_html( $block['title'] ); ?></h3>
					<div class="about-story-content"><?php echo nl2br( esc_html( $block['content'] ) ); ?></div>
				</div>
			<?php endforeach; ?>
		</div>

		<?php if ( studio_get_option( 'about_text2', '' ) ) : ?>
			<div class="about-closing glass fade-in">
				<p><?php echo nl2br( esc_html( studio_get_option( 'about_text2', '' ) ) ); ?></p>
			</div>
		<?php endif; ?>

		<?php
		$services = studio_get_services();
		if ( ! empty( $services ) ) :
			?>
			<div class="about-services fade-in" style="margin-top:4rem;">
				<p class="section-label"><?php echo esc_html( studio_get_option( 'services_label', 'What I Do' ) ); ?></p>
				<h3 class="display-md" style="font-size:1.75rem;margin-bottom:2rem;"><?php echo esc_html( studio_get_option( 'services_title', 'My Skills & Services' ) ); ?></h3>
				<div class="services-grid">
					<?php foreach ( $services as $service ) : ?>
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
		<?php endif; ?>
	</div>
</section>
