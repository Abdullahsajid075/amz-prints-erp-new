<?php
/**
 * Template Name: Checkout
 *
 * @package AMZ_Prints
 */

get_header();

$cart      = function_exists( 'amz_prints_cart_summary' ) ? amz_prints_cart_summary() : array( 'items' => array() );
$logged_in = function_exists( 'amz_prints_customer_is_logged_in' ) && amz_prints_customer_is_logged_in();
$policy    = function_exists( 'amz_prints_order_policy_text' ) ? amz_prints_order_policy_text() : '';
$session   = null;
if ( $logged_in && function_exists( 'amz_prints_customer_fetch_session' ) ) {
	$session = amz_prints_customer_fetch_session();
	if ( is_wp_error( $session ) ) {
		$session = null;
	}
}
$customer = ( $session && ! empty( $session['customer'] ) ) ? $session['customer'] : array();
$pay_methods = function_exists( 'amz_prints_payment_methods' ) ? amz_prints_payment_methods() : array();
$office      = function_exists( 'amz_prints_mod' ) ? trim( (string) amz_prints_mod( 'amz_address', '' ) ) : '';
$goods       = max( 0, (float) ( $cart['subtotal'] ?? 0 ) - (float) ( $cart['discount'] ?? 0 ) );
$checkout_token = function_exists( 'wp_generate_password' ) ? wp_generate_password( 24, false, false ) : bin2hex( random_bytes( 12 ) );
?>

<section class="page-hero page-hero--compact">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'Choose delivery, review the 50% advance, and place your order.', 'amz-prints' ); ?></p>
	</div>
</section>

<section class="section section--checkout">
	<div class="container commerce-layout" data-amz-checkout data-logged-in="<?php echo $logged_in ? '1' : '0'; ?>" data-subtotal="<?php echo esc_attr( (string) ( $cart['subtotal'] ?? 0 ) ); ?>" data-discount="<?php echo esc_attr( (string) ( $cart['discount'] ?? 0 ) ); ?>">
		<?php if ( empty( $cart['items'] ) ) : ?>
			<div class="commerce-empty">
				<p><?php esc_html_e( 'Your cart is empty.', 'amz-prints' ); ?></p>
				<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Browse products', 'amz-prints' ); ?></a>
			</div>
		<?php else : ?>
			<div class="commerce-main">
				<?php if ( ! $logged_in ) : ?>
					<div class="checkout-gate">
						<h2><?php esc_html_e( 'Login required to place order', 'amz-prints' ); ?></h2>
						<p><?php esc_html_e( 'Create an account with your email, a mobile number that includes the country code, and your delivery address. Then sign in to place the order.', 'amz-prints' ); ?></p>
						<a class="btn btn--primary" href="<?php echo esc_url( amz_prints_customer_login_url( amz_prints_checkout_url() ) ); ?>"><?php esc_html_e( 'Log in to continue', 'amz-prints' ); ?></a>
					</div>
				<?php else : ?>
					<form class="checkout-form" id="amz-checkout-form">
						<input type="hidden" name="checkout_token" value="<?php echo esc_attr( $checkout_token ); ?>">
						<div class="checkout-block">
							<h2><?php esc_html_e( 'Customer', 'amz-prints' ); ?></h2>
							<p class="checkout-note"><?php esc_html_e( 'Please ensure that your contact number and delivery information are correct. Our office representative will contact you to confirm your order. Incorrect contact information may delay order processing.', 'amz-prints' ); ?></p>
							<label>
								<span><?php esc_html_e( 'Full name', 'amz-prints' ); ?></span>
								<input type="text" name="customer_name" value="<?php echo esc_attr( $customer['name'] ?? '' ); ?>" required autocomplete="name">
							</label>
							<p class="form-note"><?php echo esc_html( $customer['email'] ?? '' ); ?></p>
							<label>
								<span><?php esc_html_e( 'Active WhatsApp number', 'amz-prints' ); ?></span>
								<input type="tel" name="customer_phone" value="<?php echo esc_attr( $customer['phone'] ?? '' ); ?>" required placeholder="+923001234567" inputmode="tel" autocomplete="tel">
							</label>
							<label>
								<span><?php esc_html_e( 'Alternative contact number (optional)', 'amz-prints' ); ?></span>
								<input type="tel" name="alt_phone" placeholder="+923001234567" inputmode="tel" autocomplete="tel">
							</label>
							<label>
								<span><?php esc_html_e( 'Order note (optional)', 'amz-prints' ); ?></span>
								<textarea name="customer_note" rows="2"></textarea>
							</label>
						</div>

						<div class="checkout-block">
							<h2><?php esc_html_e( 'Delivery method', 'amz-prints' ); ?></h2>
							<div class="delivery-choices">
								<label class="delivery-choice">
									<input type="radio" name="delivery_method" value="home">
									<span>
										<strong><?php esc_html_e( 'Home Delivery', 'amz-prints' ); ?></strong>
										<em><?php esc_html_e( 'PKR 250 inside the 10 km delivery area.', 'amz-prints' ); ?></em>
									</span>
								</label>
								<label class="delivery-choice">
									<input type="radio" name="delivery_method" value="pickup">
									<span>
										<strong><?php esc_html_e( 'Store Pickup', 'amz-prints' ); ?></strong>
										<em><?php esc_html_e( 'Collect from our office. No delivery charge.', 'amz-prints' ); ?></em>
									</span>
								</label>
							</div>
							<div class="delivery-panel" data-delivery-panel="home" hidden>
								<label>
									<span><?php esc_html_e( 'Complete delivery address', 'amz-prints' ); ?></span>
									<textarea name="delivery_address" rows="3"><?php echo esc_textarea( $customer['address'] ?? '' ); ?></textarea>
								</label>
								<fieldset class="delivery-zone">
									<legend><?php esc_html_e( 'Is this address within 10 km of our office?', 'amz-prints' ); ?></legend>
									<label><input type="radio" name="delivery_zone" value="inside"> <?php esc_html_e( 'Yes, within 10 km — PKR 250', 'amz-prints' ); ?></label>
									<label><input type="radio" name="delivery_zone" value="outside"> <?php esc_html_e( 'No, outside 10 km', 'amz-prints' ); ?></label>
								</fieldset>
								<p class="checkout-alert" data-outside-note hidden><?php esc_html_e( 'This address is outside the 10 km delivery area. The standard delivery charge of PKR 250 is not applied. Please choose Store Pickup or contact the office.', 'amz-prints' ); ?></p>
							</div>
							<div class="delivery-panel" data-delivery-panel="pickup" hidden>
								<p><?php esc_html_e( 'No delivery charge. Collect the order from our office after we confirm it.', 'amz-prints' ); ?></p>
								<?php if ( $office ) : ?>
									<p><strong><?php echo esc_html( $office ); ?></strong></p>
								<?php endif; ?>
							</div>
						</div>

						<div class="checkout-block">
							<h2><?php esc_html_e( 'Payment summary', 'amz-prints' ); ?></h2>
							<dl class="commerce-totals commerce-totals--inline">
								<div><dt><?php esc_html_e( 'Products subtotal', 'amz-prints' ); ?></dt><dd data-quote="subtotal"><?php echo esc_html( amz_prints_money( $cart['subtotal'] ?? 0 ) ); ?></dd></div>
								<?php if ( ! empty( $cart['discount'] ) ) : ?>
									<div><dt><?php esc_html_e( 'Discount', 'amz-prints' ); ?></dt><dd><?php echo esc_html( amz_prints_money( $cart['discount'] ) ); ?></dd></div>
								<?php endif; ?>
								<div><dt><?php esc_html_e( 'Delivery charges', 'amz-prints' ); ?></dt><dd data-quote="delivery"><?php esc_html_e( 'Select a method', 'amz-prints' ); ?></dd></div>
								<div class="is-grand"><dt><?php esc_html_e( 'Grand total', 'amz-prints' ); ?></dt><dd data-quote="grand"><?php echo esc_html( amz_prints_money( $goods ) ); ?></dd></div>
								<div><dt><?php esc_html_e( 'Minimum advance payment (50%)', 'amz-prints' ); ?></dt><dd data-quote="advance"><?php echo esc_html( amz_prints_money( round( $goods * 0.5, 2 ) ) ); ?></dd></div>
								<div><dt><?php esc_html_e( 'Remaining balance', 'amz-prints' ); ?></dt><dd data-quote="balance"><?php echo esc_html( amz_prints_money( round( $goods * 0.5, 2 ) ) ); ?></dd></div>
							</dl>
						</div>

						<div class="checkout-block">
							<p class="checkout-alert checkout-alert--important"><?php esc_html_e( 'Important: A minimum 50% advance payment is required to confirm your order. Our representative will contact you to verify your order and payment details.', 'amz-prints' ); ?></p>
							<h2><?php esc_html_e( 'Payment method', 'amz-prints' ); ?></h2>
							<div class="pay-cards">
								<?php foreach ( $pay_methods as $method ) : ?>
									<label class="pay-card <?php echo 'bank' === $method['type'] ? 'pay-card--bank' : ''; ?>">
										<input type="radio" name="payment_method" value="<?php echo esc_attr( $method['id'] ); ?>" data-pay-type="<?php echo esc_attr( $method['type'] ); ?>">
										<?php if ( ! empty( $method['image'] ) ) : ?>
											<img src="<?php echo esc_url( $method['image'] ); ?>" alt="<?php echo esc_attr( $method['label'] ); ?>">
										<?php else : ?>
											<span class="pay-card__badge"><?php echo 'cod' === $method['type'] ? 'COD' : 'BANK'; ?></span>
										<?php endif; ?>
										<span>
											<strong><?php echo esc_html( $method['label'] ); ?></strong>
											<em><?php echo nl2br( esc_html( $method['details'] ) ); ?></em>
										</span>
									</label>
								<?php endforeach; ?>
							</div>
							<p class="checkout-note" data-cod-note hidden><?php esc_html_e( 'Cash on Delivery applies only to the remaining balance after the 50% advance has been received and verified. Selecting COD does not remove the advance.', 'amz-prints' ); ?></p>
							<div class="bank-pay" data-bank-fields hidden>
								<p class="form-note"><?php esc_html_e( 'Transfer at least the 50% advance to the account above, then enter the details and upload the receipt.', 'amz-prints' ); ?></p>
								<label>
									<span><?php esc_html_e( 'Advance payment amount', 'amz-prints' ); ?></span>
									<input type="number" name="advance_amount" min="0" step="0.01" inputmode="decimal" data-advance-amount>
								</label>
								<label>
									<span><?php esc_html_e( 'Transaction reference number (optional)', 'amz-prints' ); ?></span>
									<input type="text" name="transaction_ref" autocomplete="off">
								</label>
								<label>
									<span><?php esc_html_e( 'Payment date', 'amz-prints' ); ?></span>
									<input type="date" name="payment_date">
								</label>
								<label>
									<span><?php esc_html_e( 'Upload payment receipt or screenshot', 'amz-prints' ); ?></span>
									<input type="file" name="payment_receipt" accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf">
								</label>
							</div>
						</div>

						<div class="checkout-block checkout-policy">
							<?php if ( $policy ) : ?>
								<p class="form-note"><?php echo esc_html( $policy ); ?></p>
							<?php endif; ?>
							<label class="policy-accept">
								<input type="checkbox" name="policy_accepted" value="1">
								<span><?php esc_html_e( 'I solemnly declare that all the information provided by me, including my name, contact number, delivery address, and payment details, is true and correct to the best of my knowledge. I understand that a minimum 50% advance payment is required for order confirmation.', 'amz-prints' ); ?></span>
							</label>
						</div>

						<p class="checkout-msg" data-checkout-msg hidden></p>
						<button type="submit" class="btn btn--primary btn--lg btn--block" data-place-order disabled>
							<?php esc_html_e( 'Place order', 'amz-prints' ); ?>
						</button>
					</form>

					<div class="checkout-success" data-checkout-success hidden>
						<p class="eyebrow"><?php esc_html_e( 'AMZ Prints', 'amz-prints' ); ?></p>
						<h2><?php esc_html_e( 'Thank You for Your Order!', 'amz-prints' ); ?></h2>
						<p><?php esc_html_e( 'Your order has been successfully received by AMZ Prints.', 'amz-prints' ); ?></p>
						<p><?php esc_html_e( 'Our office representative will contact you shortly to confirm your order, payment details, and delivery information.', 'amz-prints' ); ?></p>
						<p><?php esc_html_e( 'Please ensure that your provided contact number is active and correct so our team can reach you without any difficulty.', 'amz-prints' ); ?></p>
						<p><?php esc_html_e( 'Your order will be confirmed after verification of the required advance payment.', 'amz-prints' ); ?></p>
						<p><?php esc_html_e( 'Thank you for choosing AMZ Prints!', 'amz-prints' ); ?></p>
						<dl class="commerce-totals">
							<div><dt><?php esc_html_e( 'Order number', 'amz-prints' ); ?></dt><dd data-success-order></dd></div>
							<div><dt><?php esc_html_e( 'Payment verification', 'amz-prints' ); ?></dt><dd data-success-pay></dd></div>
							<div><dt><?php esc_html_e( 'Delivery', 'amz-prints' ); ?></dt><dd data-success-delivery></dd></div>
							<div><dt><?php esc_html_e( 'Delivery charges', 'amz-prints' ); ?></dt><dd data-success-fee></dd></div>
							<div><dt><?php esc_html_e( 'Total amount', 'amz-prints' ); ?></dt><dd data-success-total></dd></div>
							<div><dt><?php esc_html_e( 'Declared advance', 'amz-prints' ); ?></dt><dd data-success-advance></dd></div>
							<div><dt><?php esc_html_e( 'Remaining balance', 'amz-prints' ); ?></dt><dd data-success-balance></dd></div>
						</dl>
						<ul class="checkout-items" data-success-items></ul>
						<div class="hero__actions">
							<button type="button" class="btn btn--primary" data-download-summary><?php esc_html_e( 'Download order summary', 'amz-prints' ); ?></button>
							<a class="btn btn--ghost" data-success-track href="<?php echo esc_url( home_url( '/track-order/' ) ); ?>"><?php esc_html_e( 'Track this order', 'amz-prints' ); ?></a>
							<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/my-account/' ) ); ?>"><?php esc_html_e( 'My Account', 'amz-prints' ); ?></a>
						</div>
					</div>
				<?php endif; ?>
			</div>

			<aside class="commerce-aside">
				<div class="commerce-summary">
					<h2><?php esc_html_e( 'Your order', 'amz-prints' ); ?></h2>
					<ul class="checkout-items">
						<?php foreach ( $cart['items'] as $item ) : ?>
							<li>
								<?php if ( ! empty( $item['image'] ) ) : ?>
									<img src="<?php echo amz_prints_product_img_src( $item['image'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>" alt="" loading="lazy">
								<?php endif; ?>
								<span>
									<strong><?php echo esc_html( $item['name'] ); ?></strong>
									<em>× <?php echo esc_html( (string) $item['quantity'] ); ?></em>
								</span>
								<strong><?php echo esc_html( amz_prints_money( $item['lineTotal'] ) ); ?></strong>
							</li>
						<?php endforeach; ?>
					</ul>
					<dl class="commerce-totals">
						<div><dt><?php esc_html_e( 'Products subtotal', 'amz-prints' ); ?></dt><dd><?php echo esc_html( amz_prints_money( $cart['subtotal'] ) ); ?></dd></div>
						<div><dt><?php esc_html_e( 'Delivery charges', 'amz-prints' ); ?></dt><dd data-quote="delivery-side"><?php esc_html_e( 'Select a method', 'amz-prints' ); ?></dd></div>
						<div class="is-grand"><dt><?php esc_html_e( 'Grand total', 'amz-prints' ); ?></dt><dd data-quote="grand-side"><?php echo esc_html( amz_prints_money( $goods ) ); ?></dd></div>
						<div><dt><?php esc_html_e( 'Minimum advance (50%)', 'amz-prints' ); ?></dt><dd data-quote="advance-side"><?php echo esc_html( amz_prints_money( round( $goods * 0.5, 2 ) ) ); ?></dd></div>
					</dl>
					<a class="text-link" href="<?php echo esc_url( amz_prints_cart_url() ); ?>"><?php esc_html_e( 'Edit cart', 'amz-prints' ); ?></a>
				</div>
			</aside>
		<?php endif; ?>
	</div>
</section>

<?php get_footer(); ?>
