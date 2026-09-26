<?php
/**
 * Template Name: Track Order
 *
 * Public tracking. A customer can look up an order without an account.
 *
 * @package AMZ_Prints
 */

get_header();

$code   = isset( $_GET['code'] ) ? sanitize_text_field( wp_unslash( $_GET['code'] ) ) : '';
$track  = null;
$error  = '';
if ( '' !== $code && function_exists( 'amz_prints_public_track' ) ) {
	$found = amz_prints_public_track( $code );
	if ( is_wp_error( $found ) ) {
		$error = $found->get_error_message();
	} else {
		$track = $found;
	}
}
?>

<section class="page-hero page-hero--compact page-hero--light">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php esc_html_e( 'Track order', 'amz-prints' ); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'Enter your Order ID or tracking number. No account is required.', 'amz-prints' ); ?></p>
	</div>
</section>

<section class="section">
	<div class="container track-layout">
		<form class="amz-form track-card" method="get" action="<?php echo esc_url( home_url( '/track-order/' ) ); ?>">
			<label>
				<span><?php esc_html_e( 'Order ID / Tracking number', 'amz-prints' ); ?></span>
				<input type="text" name="code" required value="<?php echo esc_attr( $code ); ?>" placeholder="WEB-… or ORD-…" autocomplete="off">
			</label>
			<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Track order', 'amz-prints' ); ?></button>
		</form>

		<?php if ( $error ) : ?>
			<div class="track-empty">
				<p><?php echo esc_html( $error ); ?></p>
			</div>
		<?php elseif ( $track ) : ?>
			<article class="track-card">
				<div class="track-card__top">
					<div>
						<p class="eyebrow"><?php esc_html_e( 'Order', 'amz-prints' ); ?></p>
						<h2><?php echo esc_html( $track['order_id'] ?: $track['tracking_number'] ); ?></h2>
					</div>
					<span class="track-status-pill<?php echo ! empty( $track['cancelled'] ) ? ' is-cancelled' : ''; ?>"><?php echo esc_html( $track['status'] ); ?></span>
				</div>
				<?php if ( ! empty( $track['customer'] ) ) : ?>
					<p><?php echo esc_html( $track['customer'] ); ?></p>
				<?php endif; ?>
				<?php if ( ! empty( $track['items'] ) ) : ?>
					<p><?php echo esc_html( $track['items'] ); ?></p>
				<?php endif; ?>
				<?php if ( ! empty( $track['timeline'] ) && is_array( $track['timeline'] ) ) : ?>
					<ol class="track-timeline">
						<?php foreach ( $track['timeline'] as $step ) : ?>
							<li class="track-timeline__item<?php echo ! empty( $step['current'] ) ? ' is-current' : ''; ?><?php echo ! empty( $step['done'] ) ? ' is-done' : ''; ?>">
								<span class="track-timeline__dot"></span>
								<span><?php echo esc_html( $step['status'] ?? '' ); ?></span>
							</li>
						<?php endforeach; ?>
					</ol>
				<?php endif; ?>
			</article>
		<?php else : ?>
			<div class="track-empty">
				<div class="track-empty__art" aria-hidden="true"></div>
				<p><?php esc_html_e( 'Use the order number from your confirmation. You can track it here without signing in.', 'amz-prints' ); ?></p>
			</div>
		<?php endif; ?>
	</div>
</section>

<?php
get_footer();
