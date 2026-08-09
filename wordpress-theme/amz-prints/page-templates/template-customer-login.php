<?php
/**
 * Template Name: Customer Login
 *
 * @package AMZ_Prints
 */

if ( amz_prints_customer_is_logged_in() ) {
	wp_safe_redirect( amz_prints_customer_account_url() );
	exit;
}

get_header();

$google_client = trim( (string) amz_prints_mod( 'amz_google_client_id', '' ) );
$redirect      = isset( $_GET['redirect'] ) ? esc_url_raw( wp_unslash( $_GET['redirect'] ) ) : amz_prints_customer_account_url();
?>

<section class="page-hero page-hero--light">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'Sign in with your customer email to view orders, invoices, and discounts. Read-only access.', 'amz-prints' ); ?></p>
	</div>
</section>

<section class="section">
	<div class="container customer-auth-layout">
		<div class="customer-auth-card reveal" data-reveal>
			<form class="amz-form" id="amz-customer-login-form">
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

			<div class="customer-auth-divider"><span><?php esc_html_e( 'or', 'amz-prints' ); ?></span></div>

			<div class="customer-google-box">
				<h3><?php esc_html_e( 'Forgot password? Verify with Google', 'amz-prints' ); ?></h3>
				<p><?php esc_html_e( 'Sign in with the same Google/Gmail address on your customer account. Then set a new password. No account changes — view only.', 'amz-prints' ); ?></p>

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
			<h2><?php esc_html_e( 'My Account includes', 'amz-prints' ); ?></h2>
			<ul class="check-list">
				<li><?php esc_html_e( 'Track your orders', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Order history', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Invoice PDFs (view / print)', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Discounts on your invoices', 'amz-prints' ); ?></li>
			</ul>
			<p class="form-note"><?php esc_html_e( 'Only your related account data is shown. You cannot edit ERP records.', 'amz-prints' ); ?></p>
		</aside>
	</div>
</section>

<?php get_footer(); ?>
