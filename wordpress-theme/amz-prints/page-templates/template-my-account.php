<?php
/**
 * Template Name: My Account
 *
 * Customer portal — card, QR, ledger, orders, payments.
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

$customer = isset( $session['customer'] ) && is_array( $session['customer'] ) ? $session['customer'] : array();
$orders   = isset( $session['orders'] ) && is_array( $session['orders'] ) ? $session['orders'] : array();
$invoices = isset( $session['invoices'] ) && is_array( $session['invoices'] ) ? $session['invoices'] : array();
$discounts = isset( $session['discounts'] ) && is_array( $session['discounts'] ) ? $session['discounts'] : array();
$ledger   = isset( $session['ledger'] ) && is_array( $session['ledger'] ) ? $session['ledger'] : array();
$pending  = isset( $session['pendingPayments'] ) && is_array( $session['pendingPayments'] ) ? $session['pendingPayments'] : array();

$card_no  = (string) ( $customer['cardNumber'] ?? '' );
$name     = (string) ( $customer['name'] ?? '' );
$email    = (string) ( $customer['email'] ?? '' );
$phone    = (string) ( $customer['phone'] ?? '' );
$street   = (string) ( $customer['street'] ?? '' );
if ( '' === $street ) {
	$street = (string) ( $customer['address'] ?? '' );
}
$area     = (string) ( $customer['area'] ?? '' );
$city     = (string) ( $customer['city'] ?? '' );
$postal   = (string) ( $customer['postal'] ?? '' );
$landmark = (string) ( $customer['landmark'] ?? '' );
$photo    = (string) ( $customer['photo'] ?? '' );
$address  = (string) ( $customer['address'] ?? '' );
$company  = amz_prints_mod( 'amz_company_name', 'AMZ Prints' );
$logo_id  = (int) get_theme_mod( 'custom_logo' );
$logo_url = $logo_id ? (string) wp_get_attachment_image_url( $logo_id, 'medium' ) : '';
$spent    = function_exists( 'amz_prints_loyalty_delivered_total' ) ? amz_prints_loyalty_delivered_total( $orders ) : 0;
$unlocked = $spent >= 1000;
$remain   = max( 0, 1000 - $spent );
$initial  = strtoupper( substr( $name ? $name : 'A', 0, 1 ) );

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
					esc_html__( 'Welcome, %s — shop, track orders, and manage your customer card.', 'amz-prints' ),
					esc_html( $name ? $name : $email )
				);
				?>
			</p>
		</div>
		<div class="customer-account-hero__actions">
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Shop now', 'amz-prints' ); ?></a>
			<button type="button" class="btn btn--ghost" id="amz-customer-logout"><?php esc_html_e( 'Log out', 'amz-prints' ); ?></button>
		</div>
	</div>
</section>

<section class="section">
	<div class="container customer-account">
		<article class="customer-panel" id="profile">
			<h2><?php esc_html_e( 'Your details', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'These details belong to the email you signed in with. Fill every field, add your photo, then save.', 'amz-prints' ); ?></p>
			<?php $profile_ready = function_exists( 'amz_prints_customer_profile_is_complete' ) && amz_prints_customer_profile_is_complete( $customer ); ?>
			<?php if ( ! $profile_ready ) : ?>
				<p class="form-note"><?php esc_html_e( 'Add a mobile number with country code and a complete delivery address before you add items to the cart.', 'amz-prints' ); ?></p>
			<?php endif; ?>
			<form class="amz-form profile-form" id="amz-customer-profile-form">
				<div class="profile-form__grid">
					<label>
						<span><?php esc_html_e( 'Full name', 'amz-prints' ); ?></span>
						<input type="text" name="name" required value="<?php echo esc_attr( $name ); ?>" autocomplete="name">
					</label>
					<label>
						<span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span>
						<input type="email" value="<?php echo esc_attr( $email ); ?>" readonly>
					</label>
					<label>
						<span><?php esc_html_e( 'Mobile number with country code', 'amz-prints' ); ?></span>
						<input type="tel" name="phone" required value="<?php echo esc_attr( $phone ); ?>" placeholder="+923001234567" autocomplete="tel" inputmode="tel">
					</label>
					<label>
						<span><?php esc_html_e( 'House / street', 'amz-prints' ); ?></span>
						<input type="text" name="street" required value="<?php echo esc_attr( $street ); ?>" autocomplete="address-line1" placeholder="<?php esc_attr_e( 'House no. and street', 'amz-prints' ); ?>">
					</label>
					<label>
						<span><?php esc_html_e( 'Area', 'amz-prints' ); ?></span>
						<input type="text" name="area" required value="<?php echo esc_attr( $area ); ?>" autocomplete="address-level3" placeholder="<?php esc_attr_e( 'Area or locality', 'amz-prints' ); ?>">
					</label>
					<label>
						<span><?php esc_html_e( 'City', 'amz-prints' ); ?></span>
						<input type="text" name="city" required value="<?php echo esc_attr( $city ); ?>" autocomplete="address-level2">
					</label>
					<label>
						<span><?php esc_html_e( 'Postal code', 'amz-prints' ); ?></span>
						<input type="text" name="postal" value="<?php echo esc_attr( $postal ); ?>" autocomplete="postal-code">
					</label>
					<label>
						<span><?php esc_html_e( 'Landmark', 'amz-prints' ); ?></span>
						<input type="text" name="landmark" value="<?php echo esc_attr( $landmark ); ?>" placeholder="<?php esc_attr_e( 'Near a known place', 'amz-prints' ); ?>">
					</label>
				</div>
				<label class="profile-photo">
					<span><?php esc_html_e( 'Profile picture', 'amz-prints' ); ?></span>
					<input type="file" name="photo" accept="image/jpeg,image/png,image/webp">
					<small><?php esc_html_e( 'JPG or PNG, up to 2 MB. This photo is printed on your loyalty card.', 'amz-prints' ); ?></small>
				</label>
				<button type="submit" class="btn btn--primary"><?php esc_html_e( 'Save profile', 'amz-prints' ); ?></button>
				<p class="form-note" id="amz-customer-profile-msg" hidden></p>
			</form>
		</article>

		<div class="customer-account__grid customer-account__grid--card">
			<article class="amz-member-card loyalty-card" id="amz-member-card" data-card-name="<?php echo esc_attr( $name ? $name : 'customer' ); ?>" data-loyalty="<?php echo $unlocked ? 'open' : 'locked'; ?>">
				<div class="loyalty-card__shine" aria-hidden="true"></div>
				<header class="loyalty-card__head">
					<div class="loyalty-card__brand">
						<?php if ( $logo_url ) : ?>
							<img class="loyalty-card__logo" src="<?php echo esc_url( $logo_url ); ?>" alt="">
						<?php else : ?>
							<span class="loyalty-card__mark" aria-hidden="true">AMZ</span>
						<?php endif; ?>
						<strong><?php echo esc_html( $company ); ?></strong>
					</div>
					<p class="loyalty-card__title"><?php esc_html_e( 'Loyalty Card', 'amz-prints' ); ?></p>
				</header>
				<div class="loyalty-card__mid">
					<div class="loyalty-chip" aria-hidden="true"><span></span><span></span><span></span></div>
					<div class="loyalty-card__photo">
						<?php if ( $photo ) : ?>
							<img src="<?php echo esc_url( $photo ); ?>" alt="<?php echo esc_attr( $name ); ?>">
						<?php else : ?>
							<span><?php echo esc_html( $initial ); ?></span>
						<?php endif; ?>
					</div>
				</div>
				<p class="loyalty-card__name"><?php echo esc_html( $name ?: '—' ); ?></p>
				<ul class="loyalty-card__details">
					<li><?php echo esc_html( $email ?: '—' ); ?></li>
					<li><?php echo esc_html( $phone ?: '—' ); ?></li>
					<li><?php echo esc_html( $address ?: '—' ); ?></li>
				</ul>
				<div class="loyalty-card__foot">
					<?php echo amz_prints_barcode_markup( $card_no ? $card_no : 'AMZ' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<p class="loyalty-card__no"><?php echo esc_html( $card_no ?: 'AMZ-CARD' ); ?></p>
				</div>
			</article>

			<article class="customer-panel">
				<h2><?php esc_html_e( 'Loyalty Card', 'amz-prints' ); ?></h2>
				<?php if ( $unlocked ) : ?>
					<p><?php esc_html_e( 'Your delivered online orders have reached Rs 1,000. Download or print your loyalty card.', 'amz-prints' ); ?></p>
					<div class="hero__actions" style="margin-top:0.85rem">
						<button type="button" class="btn btn--primary" id="amz-download-card-png"><?php esc_html_e( 'Download card', 'amz-prints' ); ?></button>
						<button type="button" class="btn btn--ghost" id="amz-download-card"><?php esc_html_e( 'Print card', 'amz-prints' ); ?></button>
					</div>
				<?php else : ?>
					<p><?php esc_html_e( 'Download opens after Rs 1,000 of online shopping, and only when that order is confirmed delivered.', 'amz-prints' ); ?></p>
					<p class="form-note">
						<?php
						printf(
							/* translators: 1: delivered amount, 2: amount still needed */
							esc_html__( 'Delivered so far: Rs %1$s. Rs %2$s of delivered orders still needed.', 'amz-prints' ),
							esc_html( number_format_i18n( $spent, 0 ) ),
							esc_html( number_format_i18n( $remain, 0 ) )
						);
						?>
					</p>
				<?php endif; ?>
				<ul class="customer-meta" style="margin-top:1rem">
					<li><span><?php esc_html_e( 'Name', 'amz-prints' ); ?></span><strong><?php echo esc_html( $name ?: '—' ); ?></strong></li>
					<li><span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span><strong><?php echo esc_html( $email ?: '—' ); ?></strong></li>
					<li><span><?php esc_html_e( 'Phone', 'amz-prints' ); ?></span><strong><?php echo esc_html( $phone ?: '—' ); ?></strong></li>
					<li><span><?php esc_html_e( 'Address', 'amz-prints' ); ?></span><strong><?php echo esc_html( $address ?: '—' ); ?></strong></li>
					<li><span><?php esc_html_e( 'Card no.', 'amz-prints' ); ?></span><strong><?php echo esc_html( $card_no ?: '—' ); ?></strong></li>
				</ul>
			</article>
		</div>

		<?php
		$cv_row  = function_exists( 'amz_prints_customer_cv_get' ) ? amz_prints_customer_cv_get( $email ) : null;
		$cv_url  = ( is_array( $cv_row ) && ! empty( $cv_row['token'] ) ) ? add_query_arg( 'amz_cv', rawurlencode( (string) $cv_row['token'] ), home_url( '/' ) ) : '';
		$cv_edit = home_url( '/create-free-cv/' );
		?>
		<article class="customer-panel" id="customer-cv">
			<h2><?php esc_html_e( "Customer's CV", 'amz-prints' ); ?></h2>
			<?php if ( $cv_url ) : ?>
				<p><?php esc_html_e( 'Your CV is saved on this account. Update it any time, or download it from the CV page.', 'amz-prints' ); ?></p>
				<div class="hero__actions" style="margin-top:0.85rem">
					<a class="btn btn--primary" href="<?php echo esc_url( $cv_edit ); ?>"><?php esc_html_e( 'Update CV', 'amz-prints' ); ?></a>
					<a class="btn btn--ghost" href="<?php echo esc_url( $cv_url ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'View CV', 'amz-prints' ); ?></a>
				</div>
			<?php else : ?>
				<p><?php esc_html_e( 'Create your CV, upload a photo, and it stays on this account so you can download or update it later.', 'amz-prints' ); ?></p>
				<div class="hero__actions" style="margin-top:0.85rem">
					<a class="btn btn--primary" href="<?php echo esc_url( $cv_edit ); ?>"><?php esc_html_e( 'Create Free CV', 'amz-prints' ); ?></a>
				</div>
			<?php endif; ?>
		</article>

		<div class="ledger-stats">
			<div class="ledger-stat">
				<span><?php esc_html_e( 'Billed', 'amz-prints' ); ?></span>
				<strong>Rs. <?php echo esc_html( number_format_i18n( (float) ( $ledger['totalBilled'] ?? 0 ), 0 ) ); ?></strong>
			</div>
			<div class="ledger-stat">
				<span><?php esc_html_e( 'Paid', 'amz-prints' ); ?></span>
				<strong>Rs. <?php echo esc_html( number_format_i18n( (float) ( $ledger['totalPaid'] ?? 0 ), 0 ) ); ?></strong>
			</div>
			<div class="ledger-stat ledger-stat--due">
				<span><?php esc_html_e( 'Pending / outstanding', 'amz-prints' ); ?></span>
				<strong>Rs. <?php echo esc_html( number_format_i18n( (float) ( $ledger['outstanding'] ?? 0 ), 0 ) ); ?></strong>
			</div>
		</div>

		<div class="customer-account__grid">
			<article class="customer-panel reveal" data-reveal id="track">
				<h2><?php esc_html_e( 'Track order', 'amz-prints' ); ?></h2>
				<p><?php esc_html_e( 'Enter an Order ID. You can also track from the Track page without signing in.', 'amz-prints' ); ?></p>
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
				<h2><?php esc_html_e( 'Pending payments', 'amz-prints' ); ?></h2>
				<?php if ( empty( $pending ) ) : ?>
					<p class="form-note"><?php esc_html_e( 'No pending payments on this account.', 'amz-prints' ); ?></p>
				<?php else : ?>
					<ul class="customer-discount-list">
						<?php foreach ( $pending as $row ) : ?>
							<li>
								<strong><?php echo esc_html( ( $row['source'] ?? '' ) . ' ' . ( $row['ref'] ?? '' ) ); ?></strong>
								— Rs. <?php echo esc_html( number_format_i18n( (float) ( $row['amount'] ?? 0 ), 0 ) ); ?>
								<em><?php echo esc_html( $row['status'] ?? '' ); ?></em>
							</li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			</article>
		</div>

		<article class="customer-panel reveal" data-reveal>
			<h2><?php esc_html_e( 'Ledger', 'amz-prints' ); ?></h2>
			<?php
			$pay_rows = isset( $ledger['payments'] ) && is_array( $ledger['payments'] ) ? $ledger['payments'] : array();
			if ( empty( $pay_rows ) ) :
				?>
				<p class="form-note"><?php esc_html_e( 'No payment ledger entries yet. New orders will appear here.', 'amz-prints' ); ?></p>
			<?php else : ?>
				<div class="customer-table-wrap">
					<table class="customer-table">
						<thead>
							<tr>
								<th><?php esc_html_e( 'Date', 'amz-prints' ); ?></th>
								<th><?php esc_html_e( 'Method', 'amz-prints' ); ?></th>
								<th><?php esc_html_e( 'Reference', 'amz-prints' ); ?></th>
								<th><?php esc_html_e( 'Amount', 'amz-prints' ); ?></th>
							</tr>
						</thead>
						<tbody>
							<?php foreach ( $pay_rows as $pay ) : ?>
								<tr>
									<td><?php echo esc_html( $pay['date'] ?: '—' ); ?></td>
									<td><?php echo esc_html( $pay['method'] ?: '—' ); ?></td>
									<td><?php echo esc_html( $pay['reference'] ?: '—' ); ?></td>
									<td><?php echo esc_html( number_format_i18n( (float) ( $pay['amount'] ?? 0 ), 0 ) ); ?></td>
								</tr>
							<?php endforeach; ?>
						</tbody>
					</table>
				</div>
			<?php endif; ?>
		</article>

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
								<th><?php esc_html_e( 'Balance', 'amz-prints' ); ?></th>
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
									<td><?php echo esc_html( $order['date'] ?: ( $order['createdAt'] ?? '—' ) ); ?></td>
									<td><span class="track-status-pill"><?php echo esc_html( $order['status'] ?: '—' ); ?></span></td>
									<td><?php
										$names = array();
										foreach ( (array) ( $order['items'] ?? array() ) as $it ) {
											$names[] = is_array( $it ) ? (string) ( $it['name'] ?? '' ) : (string) $it;
										}
										echo esc_html( $names ? implode( ', ', array_filter( $names ) ) : '—' );
									?></td>
									<td><?php echo esc_html( number_format_i18n( (float) ( $order['totalAmount'] ?? 0 ), 0 ) ); ?></td>
									<td><?php echo esc_html( number_format_i18n( (float) ( $order['balanceAmount'] ?? 0 ), 0 ) ); ?></td>
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
		</article>
	</div>
</section>

<?php get_footer(); ?>
