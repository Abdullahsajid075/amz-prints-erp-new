<?php
/**
 * Template Name: Customer Sign Up
 *
 * Sign up only. Log in lives on its own page.
 *
 * @package AMZ_Prints
 */

$redirect = isset( $_GET['redirect'] ) ? esc_url_raw( wp_unslash( $_GET['redirect'] ) ) : '';
$redirect = $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();

if ( amz_prints_customer_is_logged_in() ) {
	wp_safe_redirect( $redirect );
	exit;
}

get_header();

$google_client = trim( (string) amz_prints_mod( 'amz_google_client_id', '' ) );
$prefill       = isset( $_GET['email'] ) ? sanitize_email( wp_unslash( $_GET['email'] ) ) : '';
$login_url     = $prefill ? add_query_arg( 'email', rawurlencode( $prefill ), home_url( '/customer-login/' ) ) : home_url( '/customer-login/' );
?>

<section class="auth-screen auth-screen--signup">
	<div class="auth-screen__visual" aria-hidden="true">
		<p><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<strong><?php esc_html_e( 'Sign up', 'amz-prints' ); ?></strong>
		<span><?php esc_html_e( 'Create one customer account. If this email is already registered, we will send you to Log in.', 'amz-prints' ); ?></span>
	</div>
	<div class="auth-screen__panel">
		<div class="customer-auth-card" data-auth-root data-auth-tab="register">
			<form class="amz-form" id="amz-customer-register-form" data-auth-panel="register">
				<p class="eyebrow"><?php esc_html_e( 'New customer', 'amz-prints' ); ?></p>
				<h1><?php esc_html_e( 'Create account', 'amz-prints' ); ?></h1>
				<input type="hidden" name="redirect" value="<?php echo esc_attr( $redirect ); ?>">
				<label>
					<span><?php esc_html_e( 'Full name', 'amz-prints' ); ?></span>
					<input type="text" name="name" required autocomplete="name">
				</label>
				<label>
					<span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span>
					<input type="email" name="email" required autocomplete="email" placeholder="you@example.com" value="<?php echo esc_attr( $prefill ); ?>">
				</label>
				<label>
					<span><?php esc_html_e( 'Mobile number with country code', 'amz-prints' ); ?></span>
					<input type="tel" name="phone" required autocomplete="tel" inputmode="tel" placeholder="+923001234567" pattern="^\+[1-9][0-9]{7,14}$">
				</label>
				<label>
					<span><?php esc_html_e( 'Delivery address', 'amz-prints' ); ?></span>
					<textarea name="address" required rows="3" autocomplete="street-address" placeholder="<?php esc_attr_e( 'Street, area, city', 'amz-prints' ); ?>"></textarea>
				</label>
				<label>
					<span><?php esc_html_e( 'Password', 'amz-prints' ); ?></span>
					<input type="password" name="password" required autocomplete="new-password" minlength="6">
				</label>
				<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Sign up', 'amz-prints' ); ?></button>
				<p class="form-note" id="amz-customer-register-msg" hidden></p>
				<p class="auth-switch" id="amz-signup-login-hint">
					<?php esc_html_e( 'Already have an account?', 'amz-prints' ); ?>
					<a id="amz-signup-login-link" href="<?php echo esc_url( $login_url ); ?>"><?php esc_html_e( 'Sign in', 'amz-prints' ); ?></a>
				</p>
			</form>

			<?php if ( $google_client ) : ?>
			<div class="customer-google-box" data-auth-google>
				<div class="customer-auth-divider"><span><?php esc_html_e( 'or', 'amz-prints' ); ?></span></div>
				<h3><?php esc_html_e( 'Continue with Google', 'amz-prints' ); ?></h3>
				<p><?php esc_html_e( 'Press Continue with Google. You do not need to fill the form first. Google checks the email and signs you in. Add your mobile number and delivery address before you order.', 'amz-prints' ); ?></p>
				<div id="amz-google-btn" class="amz-google-btn"></div>
				<p class="form-note" id="amz-customer-google-msg" hidden></p>
			</div>
			<?php endif; ?>
		</div>
	</div>
</section>

<?php get_footer(); ?>
