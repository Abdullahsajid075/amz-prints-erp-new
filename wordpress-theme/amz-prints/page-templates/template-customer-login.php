<?php
/**
 * Template Name: Customer Login
 *
 * Email check first. Log in and Sign up are separate screens — never both at once.
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
?>

<section class="auth-screen">
	<div class="auth-screen__visual" aria-hidden="true">
		<p><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<strong><?php esc_html_e( 'One customer. One account.', 'amz-prints' ); ?></strong>
		<span><?php esc_html_e( 'We check your email first. Existing customers log in. New customers sign up. No duplicate accounts.', 'amz-prints' ); ?></span>
	</div>
	<div class="auth-screen__panel">
		<div class="customer-auth-card" data-auth-root data-auth-tab="email">
			<form class="amz-form" id="amz-customer-email-form" data-auth-panel="email">
				<p class="eyebrow"><?php esc_html_e( 'Customer access', 'amz-prints' ); ?></p>
				<h1><?php esc_html_e( 'Continue with email', 'amz-prints' ); ?></h1>
				<p class="form-note"><?php esc_html_e( 'Enter the email on your AMZ Prints account. If it exists you will log in. If it does not, you will create an account.', 'amz-prints' ); ?></p>
				<label>
					<span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span>
					<input type="email" name="email" required autocomplete="email" placeholder="you@example.com">
				</label>
				<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Continue', 'amz-prints' ); ?></button>
				<p class="form-note" id="amz-customer-email-msg" hidden></p>
			</form>

			<form class="amz-form" id="amz-customer-login-form" data-auth-panel="login" hidden>
				<input type="hidden" name="redirect" value="<?php echo esc_attr( $redirect ); ?>">
				<p class="eyebrow"><?php esc_html_e( 'Existing account', 'amz-prints' ); ?></p>
				<h1><?php esc_html_e( 'Log in', 'amz-prints' ); ?></h1>
				<label>
					<span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span>
					<input type="email" name="email" required readonly autocomplete="username">
				</label>
				<label>
					<span><?php esc_html_e( 'Password', 'amz-prints' ); ?></span>
					<input type="password" name="password" required autocomplete="current-password" minlength="6">
				</label>
				<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Log in', 'amz-prints' ); ?></button>
				<p class="form-note">
					<button type="button" class="linkish" data-auth-tab="forgot"><?php esc_html_e( 'Forgot password?', 'amz-prints' ); ?></button>
					<button type="button" class="linkish" data-auth-tab="email"><?php esc_html_e( 'Use a different email', 'amz-prints' ); ?></button>
				</p>
				<p class="form-note" id="amz-customer-login-msg" hidden></p>
			</form>

			<form class="amz-form" id="amz-customer-register-form" data-auth-panel="register" hidden>
				<input type="hidden" name="redirect" value="<?php echo esc_attr( $redirect ); ?>">
				<p class="eyebrow"><?php esc_html_e( 'New customer', 'amz-prints' ); ?></p>
				<h1><?php esc_html_e( 'Sign up', 'amz-prints' ); ?></h1>
				<label>
					<span><?php esc_html_e( 'Full name', 'amz-prints' ); ?></span>
					<input type="text" name="name" required autocomplete="name">
				</label>
				<label>
					<span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span>
					<input type="email" name="email" required readonly autocomplete="email">
				</label>
				<label>
					<span><?php esc_html_e( 'Phone', 'amz-prints' ); ?></span>
					<input type="tel" name="phone" required autocomplete="tel" placeholder="03xx...">
				</label>
				<label>
					<span><?php esc_html_e( 'Password', 'amz-prints' ); ?></span>
					<input type="password" name="password" required autocomplete="new-password" minlength="6">
				</label>
				<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Create account', 'amz-prints' ); ?></button>
				<p class="form-note"><button type="button" class="linkish" data-auth-tab="email"><?php esc_html_e( 'Use a different email', 'amz-prints' ); ?></button></p>
				<p class="form-note" id="amz-customer-register-msg" hidden></p>
			</form>

			<div data-auth-panel="forgot" hidden>
				<p class="eyebrow"><?php esc_html_e( 'Password reset', 'amz-prints' ); ?></p>
				<h1><?php esc_html_e( 'Reset password', 'amz-prints' ); ?></h1>
				<form class="amz-form" id="amz-customer-forgot-form">
					<label>
						<span><?php esc_html_e( 'Account email', 'amz-prints' ); ?></span>
						<input type="email" name="email" required autocomplete="email" placeholder="you@example.com">
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

			<div class="customer-google-box" data-auth-google hidden>
				<div class="customer-auth-divider"><span><?php esc_html_e( 'or', 'amz-prints' ); ?></span></div>
				<h3 data-google-login-copy><?php esc_html_e( 'Continue with Google', 'amz-prints' ); ?></h3>
				<p data-google-login-copy><?php esc_html_e( 'Only if this Google email is already signed up.', 'amz-prints' ); ?></p>
				<h3 data-google-register-copy hidden><?php esc_html_e( 'Continue with Google', 'amz-prints' ); ?></h3>
				<p data-google-register-copy hidden><?php esc_html_e( 'Creates one account for this Google email if it is new.', 'amz-prints' ); ?></p>
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
