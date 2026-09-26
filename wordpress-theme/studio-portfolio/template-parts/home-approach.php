<?php
/**
 * Home — design approach teaser (links to How I Work)
 *
 * @package Studio_Portfolio
 */

$blocks = array_slice( studio_get_how_i_work_blocks(), 0, 6 );
?>

<section class="section home-approach premium-section-alt">
	<div class="container">
		<div class="section-header center">
			<p class="section-label"><?php echo esc_html( studio_get_option( 'approach_label', 'My Creative Process' ) ); ?></p>
			<h2 class="display-md"><?php echo esc_html( studio_get_option( 'approach_title', 'How I build brands' ) ); ?></h2>
			<p class="process-flow"><?php echo esc_html( studio_get_option( 'hiw_flow', 'DISCOVER → STRATEGIZE → EXPLORE → DESIGN → REFINE → DELIVER' ) ); ?></p>
			<p class="text-muted home-lead" style="margin-left:auto;margin-right:auto;">
				<?php echo esc_html( studio_get_option( 'approach_text', 'A thoughtful process. A strategic approach. A brand designed to make an impact.' ) ); ?>
			</p>
		</div>
		<div class="approach-pills">
			<?php foreach ( $blocks as $block ) : ?>
				<div class="approach-pill">
					<span><?php echo esc_html( $block['step'] ); ?></span>
					<strong><?php echo esc_html( $block['title'] ); ?></strong>
				</div>
			<?php endforeach; ?>
		</div>
		<p class="center" style="margin-top:2rem;">
			<a class="btn btn-outline" href="<?php echo esc_url( studio_get_page_url( 'how_i_work_page_id', home_url( '/how-i-work/' ) ) ); ?>">
				<?php esc_html_e( 'See the full process →', 'studio-portfolio' ); ?>
			</a>
		</p>
	</div>
</section>
