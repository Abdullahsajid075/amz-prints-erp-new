<?php
/**
 * About section — full personal story
 *
 * @package Studio_Portfolio
 *
 * @var array $args Optional Elementor overrides.
 */

$args         = isset( $args ) ? $args : array();
$story_blocks = studio_get_about_story_blocks( $args );
$stats        = studio_get_about_stats( $args );
$services     = studio_get_services( $args );
$about_intro  = studio_template_arg( $args, 'about_text', 'about_text', '' );
$about_close  = studio_template_arg( $args, 'about_text2', 'about_text2', '' );
$show_stats   = studio_template_arg( $args, 'show_stats', '', true );
$show_story   = studio_template_arg( $args, 'show_story', '', true );
$show_services = studio_template_arg( $args, 'show_services', '', true );
?>

<section id="about" class="section about-section">
	<div class="container">
		<div class="section-header center fade-in">
			<p class="section-label"><?php echo esc_html( studio_template_arg( $args, 'about_label', 'about_label', 'About Me' ) ); ?></p>
			<h2 class="display-md about-title"><?php echo esc_html( studio_template_arg( $args, 'about_title', 'about_title', 'Everything about me' ) ); ?></h2>
			<?php if ( $about_intro ) : ?>
				<p class="text-muted about-intro" style="margin-top:1rem;font-size:1.125rem;max-width:720px;margin-left:auto;margin-right:auto;">
					<?php echo esc_html( $about_intro ); ?>
				</p>
			<?php endif; ?>
		</div>

		<?php if ( $show_stats && ! empty( $stats ) ) : ?>
			<div class="stats-grid fade-in" style="margin-bottom:3rem;">
				<?php foreach ( $stats as $stat ) : ?>
					<?php if ( empty( $stat['value'] ) && empty( $stat['label'] ) ) continue; ?>
					<div class="stat-card">
						<p class="stat-value text-gradient"><?php echo esc_html( $stat['value'] ); ?></p>
						<p class="text-muted"><?php echo esc_html( $stat['label'] ); ?></p>
					</div>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>

		<?php if ( $show_story ) : ?>
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
		<?php endif; ?>

		<?php if ( $about_close ) : ?>
			<div class="about-closing glass fade-in">
				<p><?php echo nl2br( esc_html( $about_close ) ); ?></p>
			</div>
		<?php endif; ?>

		<?php if ( $show_services && ! empty( $services ) ) : ?>
			<div class="about-services fade-in" style="margin-top:4rem;">
				<p class="section-label"><?php echo esc_html( studio_template_arg( $args, 'services_label', 'services_label', 'What I Do' ) ); ?></p>
				<h3 class="display-md" style="font-size:1.75rem;margin-bottom:2rem;"><?php echo esc_html( studio_template_arg( $args, 'services_title', 'services_title', 'My Skills & Services' ) ); ?></h3>
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
