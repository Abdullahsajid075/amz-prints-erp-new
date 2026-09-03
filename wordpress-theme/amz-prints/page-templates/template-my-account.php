<?php
/**
 * Template Name: My Account
 *
 * Read-only customer portal.
 *
 * @package AMZ_Prints
 */

if ( ! amz_prints_customer_is_logged_in() ) {
	wp_safe_redirect( amz_prints_customer_login_url( amz_prints_customer_account_url() ) );
	exit;
}

$session = amz_prints_customer_fetch_session();
if ( is_wp_error( $session ) ) {
	wp_safe_redirect( amz_prints_customer_login_url( amz_prints_customer_account_url() ) );
	exit;
}

$customer  = isset( $session['customer'] ) && is_array( $session['customer'] ) ? $session['customer'] : array();
$orders    = isset( $session['orders'] ) && is_array( $session['orders'] ) ? $session['orders'] : array();
$invoices  = isset( $session['invoices'] ) && is_array( $session['invoices'] ) ? $session['invoices'] : array();
$discounts = isset( $session['discounts'] ) && is_array( $session['discounts'] ) ? $session['discounts'] : array();

get_header();
?>

<section class="page-hero page-hero--light">
	<div class="container customer-account-hero">
		<div>
			<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
			<h1><?php esc_html_e( 'My Account', 'amz-prints' ); ?></h1>
			<p class="page-hero__lead">
				<?php
				printf(
					/* translators: %s customer name */
					esc_html__( 'Welcome, %s — view-only access to your orders and invoices.', 'amz-prints' ),
					esc_html( $customer['name'] ? $customer['name'] : $customer['email'] )
				);
				?>
			</p>
		</div>
		<button type="button" class="btn btn--ghost" id="amz-customer-logout"><?php esc_html_e( 'Log out', 'amz-prints' ); ?></button>
	</div>
</section>

<section class="section">
	<div class="container customer-account">
		<div class="customer-account__grid">
			<article class="customer-panel reveal" data-reveal id="track">
				<h2><?php esc_html_e( 'Track order', 'amz-prints' ); ?></h2>
				<p><?php esc_html_e( 'Enter an Order ID or Tracking Number from your account.', 'amz-prints' ); ?></p>
				<form class="amz-form track-form" id="amz-customer-track-form">
					<label>
						<span><?php esc_html_e( 'Order ID / Tracking', 'amz-prints' ); ?></span>
						<input type="text" name="code" required placeholder="ORD-… or TRK-…">
					</label>
					<button type="submit" class="btn btn--primary"><?php esc_html_e( 'Track', 'amz-prints' ); ?></button>
				</form>
				<div id="amz-customer-track-result" class="customer-track-result" hidden></div>
			</article>

			<article class="customer-panel reveal" data-reveal>
				<h2><?php esc_html_e( 'Account', 'amz-prints' ); ?></h2>
				<ul class="customer-meta">
					<li><span><?php esc_html_e( 'Name', 'amz-prints' ); ?></span><strong><?php echo esc_html( $customer['name'] ?: '—' ); ?></strong></li>
					<li><span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span><strong><?php echo esc_html( $customer['email'] ?: '—' ); ?></strong></li>
					<li><span><?php esc_html_e( 'Phone', 'amz-prints' ); ?></span><strong><?php echo esc_html( $customer['phone'] ?: '—' ); ?></strong></li>
				</ul>
				<p class="form-note"><?php esc_html_e( 'Read-only. Contact AMZ Prints to update your profile.', 'amz-prints' ); ?></p>
			</article>
		</div>

		<article class="customer-panel reveal" data-reveal>
			<h2><?php esc_html_e( 'Order history', 'amz-prints' ); ?></h2>
			<?php if ( empty( $orders ) ) : ?>
				<p class="form-note"><?php esc_html_e( 'No orders found for this account yet.', 'amz-prints' ); ?></p>
			<?php else : ?>
				<div class="customer-table-wrap">
					<table class="customer-table">
						<thead>
							<tr>
								<th><?php esc_html_e( 'Order', 'amz-prints' ); ?></th>
								<th><?php esc_html_e( 'Date', 'amz-prints' ); ?></th>
								<th><?php esc_html_e( 'Status', 'amz-prints' ); ?></th>
								<th><?php esc_html_e( 'Items', 'amz-prints' ); ?></th>
								<th><?php esc_html_e( 'Total', 'amz-prints' ); ?></th>
							</tr>
						</thead>
						<tbody>
							<?php foreach ( $orders as $order ) : ?>
								<tr>
									<td>
										<strong><?php echo esc_html( $order['orderId'] ?: $order['id'] ); ?></strong>
										<?php if ( ! empty( $order['trackingNumber'] ) ) : ?>
											<br><small><?php echo esc_html( $order['trackingNumber'] ); ?></small>
										<?php endif; ?>
									</td>
									<td><?php echo esc_html( $order['date'] ?: '—' ); ?></td>
									<td><span class="track-status-pill"><?php echo esc_html( $order['status'] ?: '—' ); ?></span></td>
									<td><?php echo esc_html( ! empty( $order['items'] ) ? implode( ', ', $order['items'] ) : '—' ); ?></td>
									<td><?php echo esc_html( number_format_i18n( (float) ( $order['totalAmount'] ?? 0 ), 0 ) ); ?></td>
								</tr>
							<?php endforeach; ?>
						</tbody>
					</table>
				</div>
			<?php endif; ?>
		</article>

		<article class="customer-panel reveal" data-reveal>
			<h2><?php esc_html_e( 'Invoices / PDFs', 'amz-prints' ); ?></h2>
			<?php if ( empty( $invoices ) ) : ?>
				<p class="form-note"><?php esc_html_e( 'No invoices found.', 'amz-prints' ); ?></p>
			<?php else : ?>
				<div class="customer-table-wrap">
					<table class="customer-table">
						<thead>
							<tr>
								<th><?php esc_html_e( 'Invoice', 'amz-prints' ); ?></th>
								<th><?php esc_html_e( 'Date', 'amz-prints' ); ?></th>
								<th><?php esc_html_e( 'Status', 'amz-prints' ); ?></th>
								<th><?php esc_html_e( 'Total', 'amz-prints' ); ?></th>
								<th><?php esc_html_e( 'PDF', 'amz-prints' ); ?></th>
							</tr>
						</thead>
						<tbody>
							<?php foreach ( $invoices as $inv ) : ?>
								<tr>
									<td><strong><?php echo esc_html( $inv['invoiceNumber'] ?: $inv['id'] ); ?></strong></td>
									<td><?php echo esc_html( $inv['date'] ?: '—' ); ?></td>
									<td><?php echo esc_html( $inv['status'] ?: '—' ); ?></td>
									<td><?php echo esc_html( number_format_i18n( (float) ( $inv['totalAmount'] ?? 0 ), 0 ) ); ?></td>
									<td>
										<?php if ( ! empty( $inv['pdfUrl'] ) ) : ?>
											<a class="btn btn--ghost btn--sm" href="<?php echo esc_url( $inv['pdfUrl'] ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'View / Print PDF', 'amz-prints' ); ?></a>
										<?php else : ?>
											—
										<?php endif; ?>
									</td>
								</tr>
							<?php endforeach; ?>
						</tbody>
					</table>
				</div>
			<?php endif; ?>
		</article>

		<article class="customer-panel reveal" data-reveal>
			<h2><?php esc_html_e( 'Discounts', 'amz-prints' ); ?></h2>
			<p>
				<?php
				printf(
					/* translators: %s amount */
					esc_html__( 'Total discounts on your invoices: Rs. %s', 'amz-prints' ),
					esc_html( number_format_i18n( (float) ( $discounts['totalDiscount'] ?? 0 ), 0 ) )
				);
				?>
			</p>
			<?php if ( empty( $discounts['items'] ) ) : ?>
				<p class="form-note"><?php esc_html_e( 'No invoice discounts recorded yet.', 'amz-prints' ); ?></p>
			<?php else : ?>
				<ul class="customer-discount-list">
					<?php foreach ( $discounts['items'] as $row ) : ?>
						<li>
							<strong><?php echo esc_html( $row['invoiceNumber'] ); ?></strong>
							— Rs. <?php echo esc_html( number_format_i18n( (float) $row['discount'], 0 ) ); ?>
							<?php if ( ! empty( $row['pdfUrl'] ) ) : ?>
								<a href="<?php echo esc_url( $row['pdfUrl'] ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'PDF', 'amz-prints' ); ?></a>
							<?php endif; ?>
						</li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
			<p class="form-note"><?php echo esc_html( $discounts['note'] ?? __( 'View only.', 'amz-prints' ) ); ?></p>
		</article>
	</div>
</section>

<?php get_footer(); ?>
