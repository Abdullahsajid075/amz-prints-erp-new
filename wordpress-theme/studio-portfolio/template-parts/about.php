<?php
/**
 * About section — Experience, Education, Goals, Awards
 *
 * @package Studio_Portfolio
 *
 * @var array $args Optional Elementor overrides.
 */

$args         = isset( $args ) ? $args : array();
$story_blocks = studio_get_about_story_blocks( $args );
$stats        = studio_get_about_stats( $args );
$services     = studio_get_services( $args );
$awards       = studio_get_about_awards();
$about_intro  = studio_template_arg( $args, 'about_text', 'about_page_intro', studio_get_option( 'about_text', '' ) );
$about_close  = studio_template_arg( $args, 'about_text2', 'about_text2', '' );
$page_label   = studio_template_arg( $args, 'about_label', 'about_page_label', studio_get_option( 'about_label', 'About Me' ) );
$page_title   = studio_template_arg( $args, 'about_title', 'about_page_title', studio_get_option( 'about_title', 'Everything about me' ) );
?>

<section id="about" class="section about-section premium-section">
	<div class="container">
		<div class="section-header center fade-in">
			<p class="section-label"><?php echo esc_html( $page_label ); ?></p>
			<h1 class="display-md about-title"><?php echo esc_html( $page_title ); ?></h1>
			<?php if ( $about_intro ) : ?>
				<p class="text-muted about-intro home-lead"><?php echo esc_html( $about_intro ); ?></p>
			<?php endif; ?>
		</div>

		<?php if ( ! empty( $stats ) ) : ?>
			<div class="stats-grid fade-in" style="margin-bottom:3rem;">
				<?php foreach ( $stats as $stat ) : ?>
					<div class="stat-card premium-stat-card">
						<p class="stat-value text-gradient"><?php echo esc_html( $stat['value'] ); ?></p>
						<p class="text-muted"><?php echo esc_html( $stat['label'] ); ?></p>
					</div>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>

		<div class="about-story-grid fade-in">
			<?php foreach ( $story_blocks as $block ) : ?>
				<?php if ( empty( $block['content'] ) ) continue; ?>
				<div class="about-story-card premium-card-glow">
					<div class="about-story-icon"><?php echo esc_html( $block['icon'] ); ?></div>
					<h3 class="about-story-title"><?php echo esc_html( $block['title'] ); ?></h3>
					<div class="about-story-content"><?php echo nl2br( esc_html( $block['content'] ) ); ?></div>
				</div>
			<?php endforeach; ?>
		</div>

		<?php if ( ! empty( $awards ) ) : ?>
			<div class="about-awards premium-card-glow fade-in" style="margin-top:3rem;">
				<h3 class="display-md" style="font-size:1.75rem;margin-bottom:1.5rem;">
					<?php echo esc_html( studio_get_option( 'about_awards_title', 'My Awards & Achievements' ) ); ?>
				</h3>
				<ul class="awards-list">
					<?php foreach ( $awards as $award ) : ?>
						<li><span class="award-icon">🏆</span> <?php echo esc_html( $award ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>
		<?php endif; ?>

		<?php if ( $about_close ) : ?>
			<div class="about-closing glass fade-in">
				<p><?php echo nl2br( esc_html( $about_close ) ); ?></p>
			</div>
		<?php endif; ?>

		<?php if ( ! empty( $services ) ) : ?>
			<div class="about-services fade-in" style="margin-top:4rem;">
				<p class="section-label"><?php echo esc_html( studio_get_option( 'services_label', 'What I Do' ) ); ?></p>
				<h3 class="display-md" style="font-size:1.75rem;margin-bottom:2rem;"><?php echo esc_html( studio_get_option( 'services_title', 'My Skills & Services' ) ); ?></h3>
				<div class="services-grid premium-services-grid">
					<?php foreach ( $services as $service ) : ?>
						<div class="service-card premium-service-card">
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
