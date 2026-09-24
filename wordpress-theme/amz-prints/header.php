<?php
/**
 * Header — Press Atelier 3.0
 *
 * @package AMZ_Prints
 */
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'amz-v3' ); ?>>
<?php wp_body_open(); ?>

<a class="skip-link" href="#main">Skip to content</a>
<div class="amz-progress" id="amz-progress" aria-hidden="true"></div>
<div class="amz-cursor" id="amz-cursor" aria-hidden="true"></div>

<header class="site-header" id="site-header">
	<div class="site-header__inner">
		<div class="site-brand">
			<?php if ( has_custom_logo() ) : ?>
				<?php the_custom_logo(); ?>
			<?php else : ?>
				<a class="site-brand__text" href="<?php echo esc_url( home_url( '/' ) ); ?>">
					<span class="site-brand__mark" aria-hidden="true"></span>
					<span class="site-brand__name"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></span>
				</a>
			<?php endif; ?>
		</div>

		<nav class="site-nav" id="site-nav" aria-label="Primary">
			<ul class="site-nav__list">
				<li><a class="nav-link-main" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'amz-prints' ); ?></a></li>
				<li><a class="nav-link-main" href="<?php echo esc_url( home_url( '/services/' ) ); ?>"><?php esc_html_e( 'Services', 'amz-prints' ); ?></a></li>
				<li><a class="nav-link-main" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Products', 'amz-prints' ); ?></a></li>
				<li><a class="nav-link-main" href="<?php echo esc_url( home_url( '/track-order/' ) ); ?>"><?php esc_html_e( 'Track', 'amz-prints' ); ?></a></li>
				<li><a class="nav-link-main" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Contact', 'amz-prints' ); ?></a></li>
			</ul>
		</nav>

		<div class="site-header__actions">
			<?php if ( function_exists( 'amz_prints_customer_is_logged_in' ) && amz_prints_customer_is_logged_in() ) : ?>
				<a class="btn btn--ghost btn--sm btn--magnetic" href="<?php echo esc_url( home_url( '/my-account/' ) ); ?>"><?php esc_html_e( 'Account', 'amz-prints' ); ?></a>
			<?php else : ?>
				<a class="btn btn--ghost btn--sm btn--magnetic" href="<?php echo esc_url( home_url( '/customer-login/' ) ); ?>"><?php esc_html_e( 'Log in', 'amz-prints' ); ?></a>
				<a class="btn btn--primary btn--sm btn--magnetic" href="<?php echo esc_url( home_url( '/customer-signup/' ) ); ?>"><?php esc_html_e( 'Sign up', 'amz-prints' ); ?></a>
			<?php endif; ?>
			<button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav" type="button" aria-label="Menu">
				<span class="nav-toggle__bar"></span>
				<span class="nav-toggle__bar"></span>
				<span class="nav-toggle__bar"></span>
			</button>
		</div>
	</div>
</header>

<main id="main" class="site-main">
