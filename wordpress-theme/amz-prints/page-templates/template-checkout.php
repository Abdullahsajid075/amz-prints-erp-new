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
?>

<section class="page-hero page-hero--compact">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'Confirm details, accept the policy, choose payment, and place your order.', 'amz-prints' ); ?></p>
	</div>
</section>

<section class="section section--checkout">
	<div class="container commerce-layout" data-amz-checkout data-logged-in="<?php echo $logged_in ? '1' : '0'; ?>">
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
						<p><?php esc_html_e( 'You can browse and fill your cart as a guest. To complete checkout, log in with your customer account.', 'amz-prints' ); ?></p>
						<a class="btn btn--primary" href="<?php echo esc_url( amz_prints_customer_login_url( amz_prints_checkout_url() ) ); ?>"><?php esc_html_e( 'Log in to continue', 'amz-prints' ); ?></a>
					</div>
				<?php else : ?>
					<form class="checkout-form" id="amz-checkout-form">
						<div class="checkout-block">
							<h2><?php esc_html_e( 'Customer', 'amz-prints' ); ?></h2>
							<p class="checkout-customer">
								<strong><?php echo esc_html( $customer['name'] ?? '' ); ?></strong><br>
								<?php echo esc_html( $customer['email'] ?? '' ); ?>
								<?php if ( ! empty( $customer['phone'] ) ) : ?>
									<br><?php echo esc_html( $customer['phone'] ); ?>
								<?php endif; ?>
							</p>
							<label>
								<span><?php esc_html_e( 'Phone (for this order)', 'amz-prints' ); ?></span>
								<input type="tel" name="customer_phone" value="<?php echo esc_attr( $customer['phone'] ?? '' ); ?>" required>
							</label>
							<label>
								<span><?php esc_html_e( 'Delivery address', 'amz-prints' ); ?></span>
								<textarea name="delivery_address" rows="3" required><?php echo esc_textarea( $customer['address'] ?? '' ); ?></textarea>
							</label>
							<label>
								<span><?php esc_html_e( 'Order note (optional)', 'amz-prints' ); ?></span>
								<textarea name="customer_note" rows="2"></textarea>
							</label>
						</div>

						<div class="checkout-block">
							<h2><?php esc_html_e( 'Payment method', 'amz-prints' ); ?></h2>
							<div class="pay-cards">
								<?php foreach ( $pay_methods as $i => $method ) : ?>
									<label class="pay-card <?php echo 'bank' === $method['type'] ? 'pay-card--bank' : ''; ?>">
										<input type="radio" name="payment_method" value="<?php echo esc_attr( $method['id'] ); ?>" <?php checked( 0 === $i ); ?>>
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
							<p class="form-note"><?php esc_html_e( 'Bank cards are added in Appearance → Customize → Store & Checkout.', 'amz-prints' ); ?></p>
						</div>

						<div class="checkout-block checkout-policy">
							<h2><?php esc_html_e( 'Order Processing Policy', 'amz-prints' ); ?></h2>
							<p><?php echo esc_html( $policy ); ?></p>
							<label class="policy-accept">
								<input type="checkbox" name="policy_accepted" value="1" required>
								<span><?php esc_html_e( 'I have read and accept the Order Processing Policy.', 'amz-prints' ); ?></span>
							</label>
						</div>

						<p class="checkout-msg" data-checkout-msg hidden></p>
						<button type="submit" class="btn btn--primary btn--lg btn--block" data-place-order>
							<?php esc_html_e( 'Place order', 'amz-prints' ); ?>
						</button>
					</form>

					<div class="checkout-success" data-checkout-success hidden>
						<h2><?php esc_html_e( 'Order placed', 'amz-prints' ); ?></h2>
						<p data-success-msg></p>
						<p><strong><?php esc_html_e( 'Order ID:', 'amz-prints' ); ?></strong> <span data-success-order></span></p>
						<p><strong><?php esc_html_e( 'Payment:', 'amz-prints' ); ?></strong> <span data-success-pay></span></p>
						<div class="hero__actions">
							<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/my-account/' ) ); ?>"><?php esc_html_e( 'My Account', 'amz-prints' ); ?></a>
							<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Keep shopping', 'amz-prints' ); ?></a>
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
						<div><dt><?php esc_html_e( 'Subtotal', 'amz-prints' ); ?></dt><dd><?php echo esc_html( amz_prints_money( $cart['subtotal'] ) ); ?></dd></div>
						<div><dt><?php esc_html_e( 'Discount', 'amz-prints' ); ?></dt><dd><?php echo esc_html( amz_prints_money( $cart['discount'] ) ); ?></dd></div>
						<div><dt><?php esc_html_e( 'Delivery', 'amz-prints' ); ?></dt><dd><?php echo esc_html( amz_prints_money( $cart['deliveryCharges'] ) ); ?></dd></div>
						<div class="is-grand"><dt><?php esc_html_e( 'Total', 'amz-prints' ); ?></dt><dd><?php echo esc_html( amz_prints_money( $cart['total'] ) ); ?></dd></div>
					</dl>
					<a class="text-link" href="<?php echo esc_url( amz_prints_cart_url() ); ?>"><?php esc_html_e( 'Edit cart', 'amz-prints' ); ?></a>
				</div>
			</aside>
		<?php endif; ?>
	</div>
</section>

<?php get_footer(); ?>
