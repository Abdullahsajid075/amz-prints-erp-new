<?php
/**
 * Template Name: Customer Account
 *
 * @package AMZ_Prints
 */

get_header();
?>
<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'Login or create an account to complete checkout. Your profile syncs with ERP customers.', 'amz-prints' ); ?></p>
	</div>
</section>
<section class="section">
	<div class="container">
		<div data-account-panel></div>
		<p class="shop-account-msg" data-account-msg hidden></p>
		<div class="shop-account-grid" data-auth-logged-out>
			<form class="shop-account-form shop-auth-card" data-login-form>
				<h2><?php esc_html_e( 'Login', 'amz-prints' ); ?></h2>
				<label><?php esc_html_e( 'Email or phone', 'amz-prints' ); ?>
					<input type="text" name="email" required autocomplete="username">
				</label>
				<label><?php esc_html_e( 'Password', 'amz-prints' ); ?>
					<input type="password" name="password" required autocomplete="current-password">
				</label>
				<button type="submit" class="btn btn--primary"><?php esc_html_e( 'Login', 'amz-prints' ); ?></button>
			</form>
			<form class="shop-account-form shop-auth-card" data-register-form>
				<h2><?php esc_html_e( 'Register', 'amz-prints' ); ?></h2>
				<label><?php esc_html_e( 'Full name', 'amz-prints' ); ?>
					<input type="text" name="name" required>
				</label>
				<label><?php esc_html_e( 'Phone', 'amz-prints' ); ?>
					<input type="text" name="phone" required>
				</label>
				<label><?php esc_html_e( 'Email', 'amz-prints' ); ?>
					<input type="email" name="email" required>
				</label>
				<label><?php esc_html_e( 'Password (min 6)', 'amz-prints' ); ?>
					<input type="password" name="password" required minlength="6">
				</label>
				<label><?php esc_html_e( 'Address', 'amz-prints' ); ?>
					<textarea name="address" rows="2"></textarea>
				</label>
				<button type="submit" class="btn btn--primary"><?php esc_html_e( 'Create account', 'amz-prints' ); ?></button>
			</form>
		</div>
	</div>
</section>
<?php
get_footer();
