<?php
/**
 * Template Name: Customer Login
 *
 * Login, signup, Google continue, and email password reset.
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
$tab           = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : 'login';
if ( ! in_array( $tab, array( 'login', 'register', 'forgot' ), true ) ) {
	$tab = 'login';
}
$is_login    = ( 'login' === $tab );
$is_register = ( 'register' === $tab );
$is_forgot   = ( 'forgot' === $tab );
?>

<section class="page-hero page-hero--light">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php echo $is_register ? esc_html__( 'Sign up', 'amz-prints' ) : ( $is_forgot ? esc_html__( 'Reset password', 'amz-prints' ) : esc_html__( 'Customer login', 'amz-prints' ) ); ?></h1>
		<p class="page-hero__lead">
			<?php
			if ( $is_register ) {
				esc_html_e( 'Create an account with email, or continue with Google (Google verifies your email).', 'amz-prints' );
			} elseif ( $is_forgot ) {
				esc_html_e( 'We will send a verification code to your email so you can set a new password.', 'amz-prints' );
			} else {
				esc_html_e( 'Log in with your email and password, or continue with Google if you already have an account.', 'amz-prints' );
			}
			?>
		</p>
	</div>
</section>

<section class="section">
	<div class="container customer-auth-layout">
		<div class="customer-auth-card reveal" data-reveal data-auth-root data-auth-tab="<?php echo esc_attr( $tab ); ?>">
			<div class="auth-tabs" data-auth-tabs <?php echo $is_forgot ? 'hidden' : ''; ?>>
				<button type="button" class="<?php echo $is_login ? 'is-active' : ''; ?>" data-auth-tab="login"><?php esc_html_e( 'Log in', 'amz-prints' ); ?></button>
				<button type="button" class="<?php echo $is_register ? 'is-active' : ''; ?>" data-auth-tab="register"><?php esc_html_e( 'Sign up', 'amz-prints' ); ?></button>
			</div>

			<form class="amz-form" id="amz-customer-login-form" data-auth-panel="login" <?php echo $is_login ? '' : 'hidden'; ?>>
				<input type="hidden" name="redirect" value="<?php echo esc_attr( $redirect ); ?>">
				<label>
					<span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span>
					<input type="email" name="email" required autocomplete="username" placeholder="you@example.com">
				</label>
				<label>
					<span><?php esc_html_e( 'Password', 'amz-prints' ); ?></span>
					<input type="password" name="password" required autocomplete="current-password" minlength="6">
				</label>
				<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Log in', 'amz-prints' ); ?></button>
				<p class="form-note"><button type="button" class="linkish" data-auth-tab="forgot"><?php esc_html_e( 'Forgot password?', 'amz-prints' ); ?></button></p>
				<p class="form-note" id="amz-customer-login-msg" hidden></p>
			</form>

			<form class="amz-form" id="amz-customer-register-form" data-auth-panel="register" <?php echo $is_register ? '' : 'hidden'; ?>>
				<input type="hidden" name="redirect" value="<?php echo esc_attr( $redirect ); ?>">
				<label>
					<span><?php esc_html_e( 'Full name', 'amz-prints' ); ?></span>
					<input type="text" name="name" required autocomplete="name">
				</label>
				<label>
					<span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span>
					<input type="email" name="email" required autocomplete="email" placeholder="you@example.com">
				</label>
				<label>
					<span><?php esc_html_e( 'Phone', 'amz-prints' ); ?></span>
					<input type="tel" name="phone" autocomplete="tel" placeholder="03xx...">
				</label>
				<label>
					<span><?php esc_html_e( 'Password', 'amz-prints' ); ?></span>
					<input type="password" name="password" required autocomplete="new-password" minlength="6">
				</label>
				<label>
					<span><?php esc_html_e( 'Address (optional)', 'amz-prints' ); ?></span>
					<textarea name="address" rows="2"></textarea>
				</label>
				<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Sign up', 'amz-prints' ); ?></button>
				<p class="form-note"><?php esc_html_e( 'New accounts are added to AMZ Prints CRM automatically.', 'amz-prints' ); ?></p>
				<p class="form-note" id="amz-customer-register-msg" hidden></p>
			</form>

			<div class="customer-auth-forgot" data-auth-panel="forgot" <?php echo $is_forgot ? '' : 'hidden'; ?>>
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

			<div class="customer-google-box" data-auth-google <?php echo $is_forgot ? 'hidden' : ''; ?>>
				<div class="customer-auth-divider"><span><?php esc_html_e( 'or', 'amz-prints' ); ?></span></div>
				<h3 data-google-login-copy><?php esc_html_e( 'Continue with Google', 'amz-prints' ); ?></h3>
				<p data-google-login-copy><?php esc_html_e( 'Use the Google account you already signed up with.', 'amz-prints' ); ?></p>
				<h3 data-google-register-copy hidden><?php esc_html_e( 'Continue with Google', 'amz-prints' ); ?></h3>
				<p data-google-register-copy hidden><?php esc_html_e( 'Google will verify your email (code / 2-step on your Google account), then we create your AMZ account.', 'amz-prints' ); ?></p>

				<?php if ( $google_client ) : ?>
					<div id="amz-google-btn" class="amz-google-btn"></div>
					<p class="form-note" id="amz-customer-google-msg" hidden></p>
				<?php else : ?>
					<p class="form-note"><?php esc_html_e( 'Ask admin to set Google Client ID in Appearance → Customize → Customer Portal.', 'amz-prints' ); ?></p>
				<?php endif; ?>
			</div>
		</div>

		<aside class="customer-auth-aside reveal" data-reveal>
			<h2><?php esc_html_e( 'Customer account includes', 'amz-prints' ); ?></h2>
			<ul class="check-list">
				<li><?php esc_html_e( 'Shop and place orders online', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Track your orders', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Order history', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Invoice PDFs (view / print)', 'amz-prints' ); ?></li>
			</ul>
		</aside>
	</div>
</section>

<?php get_footer(); ?>
