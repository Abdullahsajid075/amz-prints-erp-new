<?php
/**
 * How I Work — design process sections
 *
 * @package Studio_Portfolio
 */

$blocks = studio_get_how_i_work_blocks();
if ( empty( $blocks ) ) {
	// Load defaults from customizer keys even if content empty on first install.
	$keys = array( 'software', 'create', 'innovation', 'redesign', 'client_mind', 'presentation' );
	foreach ( $keys as $key ) {
		$blocks[] = array(
			'icon'    => studio_get_option( "hiw_{$key}_icon", '📝' ),
			'title'   => studio_get_option( "hiw_{$key}_title", '' ),
			'content' => studio_get_option( "hiw_{$key}_content", '' ),
		);
	}
	$blocks = array_filter( $blocks, function ( $b ) {
		return ! empty( $b['content'] );
	} );
}
?>

<section class="section how-i-work-section premium-section">
	<div class="container">
		<div class="section-header center fade-in">
			<p class="section-label"><?php echo esc_html( studio_get_option( 'hiw_label', 'Process' ) ); ?></p>
			<h1 class="display-md"><?php echo esc_html( studio_get_option( 'hiw_title', 'How I Work' ) ); ?></h1>
			<p class="text-muted home-lead" style="max-width:720px;margin:1rem auto 0;">
				<?php echo esc_html( studio_get_option( 'hiw_description', '' ) ); ?>
			</p>
		</div>

		<div class="hiw-timeline fade-in">
			<?php foreach ( $blocks as $i => $block ) : ?>
				<?php if ( empty( $block['content'] ) ) continue; ?>
				<article class="hiw-step premium-card-glow">
					<div class="hiw-step-number"><?php echo esc_html( str_pad( (string) ( $i + 1 ), 2, '0', STR_PAD_LEFT ) ); ?></div>
					<div class="hiw-step-icon"><?php echo esc_html( $block['icon'] ); ?></div>
					<h3 class="hiw-step-title"><?php echo esc_html( $block['title'] ); ?></h3>
					<p class="hiw-step-content"><?php echo nl2br( esc_html( $block['content'] ) ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>

		<div class="hiw-cta center fade-in" style="margin-top:3rem;">
			<a href="<?php echo esc_url( studio_get_page_url( 'schedule_page_id', '#' ) ); ?>" class="btn btn-primary btn-lg">
				<?php echo esc_html( studio_get_option( 'nav_schedule', 'Schedule Meeting' ) ); ?> →
			</a>
		</div>
	</div>
</section>
