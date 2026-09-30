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

<?php
if ( function_exists( 'amz_prints_page_banner' ) ) {
	amz_prints_page_banner( 'track' );
}
?>

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
				<?php if ( ! empty( $track['payment_status'] ) || isset( $track['total_amount'] ) ) : ?>
					<p>
						<?php
						$money = array();
						if ( ! empty( $track['payment_status'] ) ) {
							$money[] = sprintf(
								/* translators: %s payment status */
								__( 'Payment: %s', 'amz-prints' ),
								$track['payment_status']
							);
						}
						if ( isset( $track['total_amount'] ) && null !== $track['total_amount'] ) {
							$money[] = sprintf(
								/* translators: %s amount */
								__( 'Total: Rs. %s', 'amz-prints' ),
								number_format_i18n( (float) $track['total_amount'], 0 )
							);
						}
						if ( isset( $track['balance_amount'] ) && null !== $track['balance_amount'] ) {
							$money[] = sprintf(
								/* translators: %s amount */
								__( 'Balance: Rs. %s', 'amz-prints' ),
								number_format_i18n( (float) $track['balance_amount'], 0 )
							);
						}
						echo esc_html( implode( ' · ', $money ) );
						?>
					</p>
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
