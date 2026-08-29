<?php
/**
 * How I Work — Discover → Deliver (not a portfolio page)
 *
 * @package Studio_Portfolio
 */

$blocks = studio_get_how_i_work_blocks();
$flow   = studio_get_option( 'hiw_flow', 'DISCOVER → STRATEGIZE → EXPLORE → DESIGN → REFINE → DELIVER' );
?>

<section class="section how-i-work-section premium-section">
	<div class="container">
		<div class="section-header center">
			<p class="section-label"><?php echo esc_html( studio_get_option( 'hiw_label', 'My Creative Process' ) ); ?></p>
			<h1 class="display-md"><?php echo esc_html( studio_get_option( 'hiw_title', 'How I Work' ) ); ?></h1>
			<p class="process-flow"><?php echo esc_html( $flow ); ?></p>
			<p class="text-muted home-lead" style="max-width:720px;margin:1rem auto 0;">
				<?php echo esc_html( studio_get_option( 'hiw_description', 'A thoughtful process. A strategic approach. A brand designed to make an impact.' ) ); ?>
			</p>
		</div>

		<div class="hiw-timeline process-steps">
			<?php foreach ( $blocks as $block ) : ?>
				<article class="hiw-step premium-card-glow">
					<div class="hiw-step-number">Step <?php echo esc_html( $block['step'] ); ?></div>
					<h3 class="hiw-step-title"><?php echo esc_html( $block['title'] ); ?></h3>
					<p class="hiw-step-subtitle"><?php echo esc_html( $block['subtitle'] ); ?></p>
					<p class="hiw-step-content"><?php echo nl2br( esc_html( $block['content'] ) ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>

		<div class="hiw-cta center" style="margin-top:3rem;">
			<a href="<?php echo esc_url( studio_get_start_project_url() ); ?>" class="btn btn-primary btn-lg">
				<?php echo esc_html( studio_get_option( 'nav_schedule', 'Start a Project' ) ); ?> →
			</a>
		</div>
	</div>
</section>
