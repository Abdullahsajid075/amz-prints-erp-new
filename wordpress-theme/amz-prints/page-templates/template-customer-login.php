<?php
/**
 * Template Name: Customer Login
 *
 * Log in only. Sign up lives on its own page.
 *
 * @package AMZ_Prints
 */

$redirect = isset( $_GET['redirect'] ) ? esc_url_raw( wp_unslash( $_GET['redirect'] ) ) : '';
$redirect = $redirect ? wp_validate_redirect( $redirect, amz_prints_customer_account_url() ) : amz_prints_customer_account_url();

if ( isset( $_GET['tab'] ) && 'register' === sanitize_key( wp_unslash( $_GET['tab'] ) ) ) {
	wp_safe_redirect( home_url( '/customer-signup/' ) );
	exit;
}

if ( amz_prints_customer_is_logged_in() ) {
	wp_safe_redirect( $redirect );
	exit;
}

get_header();

$google_client = trim( (string) amz_prints_mod( 'amz_google_client_id', '' ) );
$prefill       = isset( $_GET['email'] ) ? sanitize_email( wp_unslash( $_GET['email'] ) ) : '';
$signup_url    = $prefill ? add_query_arg( 'email', rawurlencode( $prefill ), home_url( '/customer-signup/' ) ) : home_url( '/customer-signup/' );
?>

<section class="auth-screen auth-screen--login">
	<div class="auth-screen__visual" aria-hidden="true">
		<p><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<strong><?php esc_html_e( 'Log in', 'amz-prints' ); ?></strong>
		<span><?php esc_html_e( 'For customers who already have an account. New here? Use Sign up — it is a separate page.', 'amz-prints' ); ?></span>
	</div>
	<div class="auth-screen__panel">
		<div class="customer-auth-card" data-auth-root data-auth-tab="login">
			<form class="amz-form" id="amz-customer-login-form" data-auth-panel="login">
				<p class="eyebrow"><?php esc_html_e( 'Existing account', 'amz-prints' ); ?></p>
				<h1><?php esc_html_e( 'Log in', 'amz-prints' ); ?></h1>
				<input type="hidden" name="redirect" value="<?php echo esc_attr( $redirect ); ?>">
				<label>
					<span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span>
					<input type="email" name="email" required autocomplete="username" placeholder="you@example.com" value="<?php echo esc_attr( $prefill ); ?>">
				</label>
				<label>
					<span><?php esc_html_e( 'Password', 'amz-prints' ); ?></span>
					<input type="password" name="password" required autocomplete="current-password" minlength="6">
				</label>
				<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Log in', 'amz-prints' ); ?></button>
				<p class="form-note"><button type="button" class="linkish" data-auth-tab="forgot"><?php esc_html_e( 'Forgot password?', 'amz-prints' ); ?></button></p>
				<p class="form-note" id="amz-customer-login-msg" hidden></p>
				<p class="auth-switch" id="amz-login-signup-hint">
					<a class="btn btn--ghost" id="amz-login-signup-link" href="<?php echo esc_url( $signup_url ); ?>"><?php esc_html_e( 'Create an account', 'amz-prints' ); ?></a>
				</p>
			</form>

			<div data-auth-panel="forgot" hidden>
				<p class="eyebrow"><?php esc_html_e( 'Password reset', 'amz-prints' ); ?></p>
				<h1><?php esc_html_e( 'Reset password', 'amz-prints' ); ?></h1>
				<form class="amz-form" id="amz-customer-forgot-form">
					<label>
						<span><?php esc_html_e( 'Account email', 'amz-prints' ); ?></span>
						<input type="email" name="email" required autocomplete="email" value="<?php echo esc_attr( $prefill ); ?>">
					</label>
					<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Send verification code', 'amz-prints' ); ?></button>
					<p class="form-note" id="amz-customer-forgot-msg" hidden></p>
				</form>
				<form class="amz-form" id="amz-customer-reset-confirm-form" hidden>
					<input type="hidden" name="email" value="">
					<label>
						<span><?php esc_html_e( 'Verification code', 'amz-prints' ); ?></span>
						<input type="text" name="code" required inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6-digit code">
					</label>
					<label>
						<span><?php esc_html_e( 'New password', 'amz-prints' ); ?></span>
						<input type="password" name="new_password" required minlength="6" autocomplete="new-password">
					</label>
					<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Save new password', 'amz-prints' ); ?></button>
					<p class="form-note" id="amz-customer-reset-msg" hidden></p>
				</form>
				<p class="form-note"><button type="button" class="linkish" data-auth-tab="login"><?php esc_html_e( 'Back to log in', 'amz-prints' ); ?></button></p>
			</div>

			<div class="customer-google-box" data-auth-google>
				<div class="customer-auth-divider"><span><?php esc_html_e( 'or', 'amz-prints' ); ?></span></div>
				<h3><?php esc_html_e( 'Continue with Google', 'amz-prints' ); ?></h3>
				<p><?php esc_html_e( 'Google verifies this email. An existing account is signed in. A new Google email is not registered here — use Create an account.', 'amz-prints' ); ?></p>
				<?php if ( $google_client ) : ?>
					<div id="amz-google-btn" class="amz-google-btn"></div>
					<p class="form-note" id="amz-customer-google-msg" hidden></p>
				<?php else : ?>
					<p class="form-note"><?php esc_html_e( 'Google sign-in needs a Client ID in Appearance → Customize → Customer Portal.', 'amz-prints' ); ?></p>
				<?php endif; ?>
			</div>
		</div>
	</div>
</section>

<?php get_footer(); ?>
