<?php
/**
 * Template Name: Login
 *
 * Standalone login form only (sign up lives on its own page).
 *
 * @package AMZ_Prints
 */

$redirect = isset( $_GET['redirect_to'] ) ? esc_url_raw( wp_unslash( $_GET['redirect_to'] ) ) : home_url( '/free-cv/' );

if ( is_user_logged_in() ) {
	wp_safe_redirect( amz_prints_safe_redirect_target( $redirect ) );
	exit;
}

$error = isset( $_GET['login_error'] ) ? sanitize_text_field( wp_unslash( $_GET['login_error'] ) ) : '';

get_header();
?>

<section class="section auth-section">
	<div class="container auth-wrap">
		<div class="auth-card reveal" data-reveal>
			<div class="auth-card__head">
				<span class="auth-card__badge">Free CV Portal</span>
				<h1>Welcome back</h1>
				<p>Log in to build and download your free professional CV.</p>
			</div>

			<?php if ( $error ) : ?>
				<div class="auth-alert auth-alert--error"><?php echo esc_html( $error ); ?></div>
			<?php endif; ?>

			<form class="amz-form auth-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="amz_login">
				<input type="hidden" name="redirect_to" value="<?php echo esc_attr( $redirect ); ?>">
				<?php wp_nonce_field( 'amz_login', 'amz_login_nonce' ); ?>

				<label>
					<span>Email or Username</span>
					<input type="text" name="log" autocomplete="username" required>
				</label>
				<label>
					<span>Password</span>
					<input type="password" name="pwd" autocomplete="current-password" required>
				</label>
				<label class="auth-remember">
					<input type="checkbox" name="rememberme" value="1"> <span>Remember me</span>
				</label>
				<button type="submit" class="btn btn--primary btn--lg auth-submit">Log In</button>
			</form>

			<p class="auth-switch">
				New here? <a href="<?php echo esc_url( add_query_arg( 'redirect_to', rawurlencode( $redirect ), home_url( '/signup/' ) ) ); ?>">Create a free account</a>
			</p>
		</div>
	</div>
</section>

<?php get_footer(); ?>
