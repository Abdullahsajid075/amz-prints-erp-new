<?php
/**
 * Template Name: Sign Up
 *
 * Standalone sign up form only (login lives on its own page).
 *
 * @package AMZ_Prints
 */

$redirect = isset( $_GET['redirect_to'] ) ? esc_url_raw( wp_unslash( $_GET['redirect_to'] ) ) : home_url( '/free-cv/' );

if ( is_user_logged_in() ) {
	wp_safe_redirect( amz_prints_safe_redirect_target( $redirect ) );
	exit;
}

$error     = isset( $_GET['signup_error'] ) ? sanitize_text_field( wp_unslash( $_GET['signup_error'] ) ) : '';
$old_email = isset( $_GET['email'] ) ? sanitize_email( wp_unslash( $_GET['email'] ) ) : '';

get_header();
?>

<section class="section auth-section">
	<div class="container auth-wrap">
		<div class="auth-card reveal" data-reveal>
			<div class="auth-card__head">
				<span class="auth-card__badge">Free CV Portal</span>
				<h1>Create your account</h1>
				<p>Sign up free to access the CV builder and save your CV.</p>
			</div>

			<?php if ( $error ) : ?>
				<div class="auth-alert auth-alert--error"><?php echo esc_html( $error ); ?></div>
			<?php endif; ?>

			<form class="amz-form auth-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="amz_register">
				<input type="hidden" name="redirect_to" value="<?php echo esc_attr( $redirect ); ?>">
				<?php wp_nonce_field( 'amz_signup', 'amz_signup_nonce' ); ?>

				<label>
					<span>Full Name</span>
					<input type="text" name="name" autocomplete="name" required>
				</label>
				<label>
					<span>Email</span>
					<input type="email" name="email" autocomplete="email" value="<?php echo esc_attr( $old_email ); ?>" required>
				</label>
				<label>
					<span>Password</span>
					<input type="password" name="pwd" autocomplete="new-password" minlength="6" required>
				</label>
				<button type="submit" class="btn btn--primary btn--lg auth-submit">Sign Up</button>
			</form>

			<p class="auth-switch">
				Already have an account? <a href="<?php echo esc_url( add_query_arg( 'redirect_to', rawurlencode( $redirect ), home_url( '/login/' ) ) ); ?>">Log in</a>
			</p>
		</div>
	</div>
</section>

<?php get_footer(); ?>
