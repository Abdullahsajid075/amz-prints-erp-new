<?php
/**
 * About section — Experience, Education, Goals, Awards, Detailed Services
 *
 * @package Studio_Portfolio
 *
 * @var array $args Optional Elementor overrides.
 */

$args         = isset( $args ) ? $args : array();
$story_blocks = studio_get_about_story_blocks( $args );
$stats        = studio_get_about_stats( $args );
$awards       = studio_get_about_awards();
$about_intro  = studio_template_arg( $args, 'about_text', 'about_page_intro', studio_get_option( 'about_text', '' ) );
$about_close  = studio_template_arg( $args, 'about_text2', 'about_text2', '' );
$page_label   = studio_template_arg( $args, 'about_label', 'about_page_label', studio_get_option( 'about_label', 'About Me' ) );
$page_title   = studio_template_arg( $args, 'about_title', 'about_page_title', studio_get_option( 'about_title', 'More Than a Designer. A Brand Builder.' ) );
$photo_id     = (int) studio_get_option( 'about_page_photo', 0 );
if ( ! $photo_id && get_the_ID() ) {
	$photo_id = (int) get_post_thumbnail_id( get_the_ID() );
}
if ( ! $photo_id ) {
	$about_page = studio_resolve_page_id( 'about_page_id' );
	if ( $about_page ) {
		$photo_id = (int) get_post_thumbnail_id( $about_page );
	}
}
?>

<section id="about" class="section about-section premium-section">
	<div class="container">
		<div class="about-page-hero">
			<?php if ( $photo_id ) : ?>
				<div class="about-page-photo-wrap premium-card-glow">
					<?php echo wp_get_attachment_image( $photo_id, 'large', false, array( 'class' => 'about-page-photo' ) ); ?>
				</div>
			<?php endif; ?>
			<div class="about-page-intro-block">
				<p class="section-label"><?php echo esc_html( $page_label ); ?></p>
				<h1 class="display-md about-title"><?php echo esc_html( $page_title ); ?></h1>
				<?php if ( $about_intro ) : ?>
					<p class="text-muted about-intro home-lead"><?php echo esc_html( $about_intro ); ?></p>
				<?php endif; ?>
			</div>
		</div>

		<?php if ( ! empty( $stats ) ) : ?>
			<div class="stats-grid fade-in" style="margin:3rem 0;">
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

		<?php get_template_part( 'template-parts/services-detailed' ); ?>

		<?php
		$journey = studio_get_journey_steps();
		if ( ! empty( $journey ) ) :
			?>
			<div class="about-journey" style="margin-top:4rem;">
				<p class="section-label"><?php esc_html_e( 'My Creative Journey', 'studio-portfolio' ); ?></p>
				<ol class="journey-timeline">
					<?php foreach ( $journey as $step ) : ?>
						<li><?php echo esc_html( $step ); ?></li>
					<?php endforeach; ?>
				</ol>
			</div>
		<?php endif; ?>

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

		<p class="center" style="margin-top:3rem;">
			<a class="btn btn-primary btn-lg" href="<?php echo esc_url( studio_get_start_project_url() ); ?>">
				<?php echo esc_html( studio_get_option( 'nav_schedule', 'Start a Project' ) ); ?> →
			</a>
		</p>
	</div>
</section>
