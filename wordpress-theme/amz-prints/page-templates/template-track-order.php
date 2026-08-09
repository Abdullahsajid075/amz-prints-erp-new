<?php
/**
 * Template Name: Track Order
 *
 * Live status from AMZ ERP (https://erp.amzprints.com/track).
 *
 * @package AMZ_Prints
 */

get_header();

$result = null;
$error  = '';

if ( isset( $_GET['amz_track'] ) && '1' === $_GET['amz_track'] ) {
	$order_id = isset( $_GET['order_id'] ) ? sanitize_text_field( wp_unslash( $_GET['order_id'] ) ) : '';
	$phone    = isset( $_GET['phone'] ) ? sanitize_text_field( wp_unslash( $_GET['phone'] ) ) : '';

	if ( ! $order_id && ! $phone ) {
		$error = __( 'Enter your Order ID or Tracking Number to track.', 'amz-prints' );
	} else {
		/**
		 * Filter track-order lookup result (ERP connected via inc/track-order.php).
		 *
		 * Expected keys: order_id, customer, status, status_index, items, timeline, message
		 */
		$result = apply_filters( 'amz_prints_track_order', null, $order_id, $phone );

		if ( is_wp_error( $result ) ) {
			$error  = $result->get_error_message();
			$result = null;
		} elseif ( null === $result || ! is_array( $result ) ) {
			$error  = __( 'Order not found. Check your Order ID / Tracking Number.', 'amz-prints' );
			$result = null;
		}
	}
}

$prefill = isset( $_GET['order_id'] ) ? sanitize_text_field( wp_unslash( $_GET['order_id'] ) ) : '';
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'Enter your Order ID or Tracking Number to see live status from our ERP.', 'amz-prints' ); ?></p>
	</div>
</section>

<section class="section">
	<div class="container track-layout">
		<div class="track-form-panel reveal" data-reveal>
			<form class="amz-form track-form" method="get" action="">
				<input type="hidden" name="amz_track" value="1">
				<label>
					<span><?php esc_html_e( 'Order ID / Tracking Number', 'amz-prints' ); ?></span>
					<input type="text" name="order_id" value="<?php echo esc_attr( $prefill ); ?>" placeholder="e.g. ORD-2026-001 or TRK-4821" required autocomplete="off">
				</label>
				<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Track Order', 'amz-prints' ); ?></button>
				<p class="form-note">
					<?php esc_html_e( 'Same live data as', 'amz-prints' ); ?>
					<a href="<?php echo esc_url( amz_prints_erp_track_page_url() ); ?>" target="_blank" rel="noopener noreferrer">erp.amzprints.com/track</a>
				</p>
			</form>
		</div>

		<div class="track-result-panel reveal" data-reveal>
			<?php if ( $error ) : ?>
				<div class="track-alert track-alert--error"><?php echo esc_html( $error ); ?></div>
			<?php elseif ( $result ) : ?>
				<div class="track-card">
					<div class="track-card__top">
						<div>
							<p class="track-card__label"><?php esc_html_e( 'Order', 'amz-prints' ); ?></p>
							<h2><?php echo esc_html( $result['order_id'] ); ?></h2>
							<?php if ( ! empty( $result['tracking_number'] ) && $result['tracking_number'] !== $result['order_id'] ) : ?>
								<p class="track-meta" style="margin-top:0.25rem;">
									<?php
									printf(
										/* translators: %s: tracking number */
										esc_html__( 'Tracking: %s', 'amz-prints' ),
										esc_html( $result['tracking_number'] )
									);
									?>
								</p>
							<?php endif; ?>
						</div>
						<span class="track-status-pill<?php echo ! empty( $result['cancelled'] ) ? ' is-cancelled' : ''; ?>">
							<?php echo esc_html( $result['status'] ); ?>
						</span>
					</div>

					<?php if ( ! empty( $result['customer'] ) ) : ?>
						<p class="track-meta">
							<?php
							printf(
								/* translators: %s: customer name */
								esc_html__( 'Customer: %s', 'amz-prints' ),
								esc_html( $result['customer'] )
							);
							?>
						</p>
					<?php endif; ?>

					<?php if ( ! empty( $result['products'] ) && is_array( $result['products'] ) ) : ?>
						<ul class="track-items-list">
							<?php foreach ( $result['products'] as $item_name ) : ?>
								<li><?php echo esc_html( $item_name ); ?></li>
							<?php endforeach; ?>
						</ul>
					<?php elseif ( ! empty( $result['items'] ) ) : ?>
						<p class="track-items"><?php echo esc_html( $result['items'] ); ?></p>
					<?php endif; ?>

					<?php if ( ! empty( $result['cancelled'] ) ) : ?>
						<p class="track-alert track-alert--error"><?php esc_html_e( 'This order was cancelled.', 'amz-prints' ); ?></p>
					<?php elseif ( ! empty( $result['timeline'] ) && is_array( $result['timeline'] ) ) : ?>
						<ol class="track-timeline">
							<?php foreach ( $result['timeline'] as $step ) : ?>
								<?php
								$class = 'track-timeline__item';
								if ( ! empty( $step['current'] ) ) {
									$class .= ' is-current';
								} elseif ( ! empty( $step['done'] ) ) {
									$class .= ' is-done';
								}
								$label = isset( $step['status'] ) ? $step['status'] : '';
								?>
								<li class="<?php echo esc_attr( $class ); ?>">
									<span class="track-timeline__dot"></span>
									<span class="track-timeline__label"><?php echo esc_html( $label ); ?></span>
								</li>
							<?php endforeach; ?>
						</ol>
					<?php endif; ?>

					<?php if ( ! empty( $result['message'] ) ) : ?>
						<p class="form-note"><?php echo esc_html( $result['message'] ); ?></p>
					<?php endif; ?>

					<?php if ( ! empty( $result['erp_track_url'] ) ) : ?>
						<p class="form-note">
							<a href="<?php echo esc_url( $result['erp_track_url'] ); ?>" target="_blank" rel="noopener noreferrer">
								<?php esc_html_e( 'Open this order on ERP Track', 'amz-prints' ); ?>
							</a>
						</p>
					<?php endif; ?>
				</div>
			<?php else : ?>
				<div class="track-empty">
					<div class="track-empty__art" aria-hidden="true"></div>
					<h3><?php esc_html_e( 'Track any print job', 'amz-prints' ); ?></h3>
					<p><?php esc_html_e( 'See whether your order is in design, on press, finishing, or ready for pickup — live from our system.', 'amz-prints' ); ?></p>
				</div>
			<?php endif; ?>
		</div>
	</div>
</section>

<section class="section section--muted">
	<div class="container values-grid">
		<article class="reveal" data-reveal>
			<h3><?php esc_html_e( 'Real-time stages', 'amz-prints' ); ?></h3>
			<p><?php esc_html_e( 'Order Received → Designing → Proof → Printing → Finishing → Packing → Ready → Delivered.', 'amz-prints' ); ?></p>
		</article>
		<article class="reveal" data-reveal>
			<h3><?php esc_html_e( 'Need help?', 'amz-prints' ); ?></h3>
			<p><?php esc_html_e( 'Call our customer desk with your Order ID for instant assistance.', 'amz-prints' ); ?></p>
		</article>
		<article class="reveal" data-reveal>
			<h3><?php esc_html_e( 'WhatsApp updates', 'amz-prints' ); ?></h3>
			<p><?php esc_html_e( 'Ask us to enable WhatsApp status alerts for your job.', 'amz-prints' ); ?></p>
		</article>
	</div>
</section>

<?php get_footer(); ?>
