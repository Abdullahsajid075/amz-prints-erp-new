<?php
/**
 * Template Name: Customer Login
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
if ( ! in_array( $tab, array( 'login', 'register' ), true ) ) {
	$tab = 'login';
}
?>

<section class="page-hero page-hero--light">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'Log in or create a customer account to shop, track orders, and view invoices.', 'amz-prints' ); ?></p>
	</div>
</section>

<section class="section">
	<div class="container customer-auth-layout">
		<div class="customer-auth-card reveal" data-reveal>
			<div class="auth-tabs" data-auth-tabs>
				<button type="button" class="<?php echo 'login' === $tab ? 'is-active' : ''; ?>" data-auth-tab="login"><?php esc_html_e( 'Log in', 'amz-prints' ); ?></button>
				<button type="button" class="<?php echo 'register' === $tab ? 'is-active' : ''; ?>" data-auth-tab="register"><?php esc_html_e( 'Create account', 'amz-prints' ); ?></button>
			</div>

			<form class="amz-form" id="amz-customer-login-form" <?php echo 'register' === $tab ? 'hidden' : ''; ?>>
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
				<p class="form-note" id="amz-customer-login-msg" hidden></p>
			</form>

			<form class="amz-form" id="amz-customer-register-form" <?php echo 'login' === $tab ? 'hidden' : ''; ?>>
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
				<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Create account', 'amz-prints' ); ?></button>
				<p class="form-note"><?php esc_html_e( 'New accounts are added to AMZ Prints CRM automatically.', 'amz-prints' ); ?></p>
				<p class="form-note" id="amz-customer-register-msg" hidden></p>
			</form>

			<div class="customer-auth-divider"><span><?php esc_html_e( 'or', 'amz-prints' ); ?></span></div>

			<div class="customer-google-box">
				<h3><?php esc_html_e( 'Forgot password? Verify with Google', 'amz-prints' ); ?></h3>
				<p><?php esc_html_e( 'Sign in with the same Google/Gmail address on your customer account. Then set a new password.', 'amz-prints' ); ?></p>

				<?php if ( $google_client ) : ?>
					<div id="amz-google-btn" class="amz-google-btn"></div>
					<form class="amz-form" id="amz-customer-reset-form" hidden>
						<label>
							<span><?php esc_html_e( 'New password', 'amz-prints' ); ?></span>
							<input type="password" name="new_password" minlength="6" required autocomplete="new-password">
						</label>
						<button type="submit" class="btn btn--ghost btn--lg"><?php esc_html_e( 'Save password & continue', 'amz-prints' ); ?></button>
					</form>
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
