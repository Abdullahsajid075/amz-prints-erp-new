<?php
/**
 * Header — English only, NADRA in main, cart + full mobile nav
 *
 * @package AMZ_Prints
 */
$cart_count = function_exists( 'amz_prints_cart_count' ) ? amz_prints_cart_count() : 0;
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header" id="site-header">
	<div class="site-header__inner">
		<div class="site-brand">
			<?php if ( has_custom_logo() ) : ?>
				<?php the_custom_logo(); ?>
			<?php else : ?>
				<a class="site-brand__text" href="<?php echo esc_url( home_url( '/' ) ); ?>">
					<span class="site-brand__name"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></span>
				</a>
			<?php endif; ?>
		</div>

		<nav class="site-nav" id="site-nav" aria-label="Primary">
			<ul class="site-nav__list">
				<li><a class="nav-link-main" href="<?php echo esc_url( home_url( '/' ) ); ?>">Home</a></li>
				<li class="has-mega">
					<button type="button" class="nav-link-main mega-trigger" aria-expanded="false" aria-controls="mega-menu-services" id="mega-trigger-btn">
						Services
						<svg class="mega-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
					</button>
				</li>
				<li><a class="nav-link-main" href="<?php echo esc_url( home_url( '/products/' ) ); ?>">Products</a></li>
				<li><a class="nav-link-main" href="<?php echo esc_url( home_url( '/nadra-e-services/' ) ); ?>">NADRA</a></li>
				<li>
					<?php if ( function_exists( 'amz_prints_customer_is_logged_in' ) && amz_prints_customer_is_logged_in() ) : ?>
						<a class="nav-link-main" href="<?php echo esc_url( home_url( '/my-account/' ) ); ?>">My Account</a>
					<?php else : ?>
						<a class="nav-link-main" href="<?php echo esc_url( home_url( '/customer-login/' ) ); ?>">Login</a>
					<?php endif; ?>
				</li>
				<li class="nav-cart-item">
					<a class="nav-link-main nav-cart" href="<?php echo esc_url( home_url( '/cart/' ) ); ?>">
						Cart
						<span class="nav-cart__count" data-cart-count <?php echo $cart_count ? '' : 'hidden'; ?>><?php echo esc_html( (string) $cart_count ); ?></span>
					</a>
				</li>
				<li class="has-more">
					<button type="button" class="nav-link-main more-trigger" aria-expanded="false" aria-controls="more-menu">
						More
						<svg class="mega-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
					</button>
					<ul class="more-menu" id="more-menu">
						<li><a href="<?php echo esc_url( home_url( '/pricing/' ) ); ?>">Pricing</a></li>
						<li><a href="<?php echo esc_url( home_url( '/how-we-work/' ) ); ?>">How We Work</a></li>
						<li><a href="<?php echo esc_url( home_url( '/track-order/' ) ); ?>">Track Order</a></li>
						<li><a href="<?php echo esc_url( home_url( '/my-account/' ) ); ?>">My Account</a></li>
						<li><a href="<?php echo esc_url( home_url( '/cart/' ) ); ?>">Cart</a></li>
						<li><a href="<?php echo esc_url( home_url( '/checkout/' ) ); ?>">Checkout</a></li>
						<li><a href="<?php echo esc_url( home_url( '/gallery/' ) ); ?>">Gallery</a></li>
						<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>">About</a></li>
						<li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Contact</a></li>
						<li><a href="<?php echo esc_url( home_url( '/quote/' ) ); ?>">Get a Quote</a></li>
					</ul>
				</li>
			</ul>

			<!-- Mobile-only expanded links so every important item is one tap away -->
			<ul class="site-nav__mobile-extra" aria-label="More pages">
				<li><a href="<?php echo esc_url( home_url( '/services/' ) ); ?>">All Services</a></li>
				<li><a href="<?php echo esc_url( home_url( '/pricing/' ) ); ?>">Pricing</a></li>
				<li><a href="<?php echo esc_url( home_url( '/how-we-work/' ) ); ?>">How We Work</a></li>
				<li><a href="<?php echo esc_url( home_url( '/track-order/' ) ); ?>">Track Order</a></li>
				<li><a href="<?php echo esc_url( home_url( '/cart/' ) ); ?>">Cart</a></li>
				<li><a href="<?php echo esc_url( home_url( '/checkout/' ) ); ?>">Checkout</a></li>
				<li><a href="<?php echo esc_url( home_url( '/gallery/' ) ); ?>">Gallery</a></li>
				<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>">About</a></li>
				<li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Contact</a></li>
				<li><a href="<?php echo esc_url( home_url( '/quote/' ) ); ?>">Get a Quote</a></li>
			</ul>
		</nav>

		<div class="site-header__actions">
			<a class="btn btn--cart btn--sm" href="<?php echo esc_url( home_url( '/cart/' ) ); ?>" aria-label="<?php esc_attr_e( 'Cart', 'amz-prints' ); ?>">
				Cart
				<span class="nav-cart__count" data-cart-count <?php echo $cart_count ? '' : 'hidden'; ?>><?php echo esc_html( (string) $cart_count ); ?></span>
			</a>
			<?php if ( function_exists( 'amz_prints_customer_is_logged_in' ) && amz_prints_customer_is_logged_in() ) : ?>
				<a class="btn btn--login btn--sm" href="<?php echo esc_url( home_url( '/my-account/' ) ); ?>">Account</a>
			<?php else : ?>
				<a class="btn btn--login btn--sm" href="<?php echo esc_url( home_url( '/customer-login/' ) ); ?>">Login</a>
			<?php endif; ?>
			<a class="btn btn--primary btn--sm btn--quote-desk" href="<?php echo esc_url( home_url( '/products/' ) ); ?>">Shop</a>
			<button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav" type="button">
				<span class="nav-toggle__bar"></span>
				<span class="nav-toggle__bar"></span>
				<span class="nav-toggle__bar"></span>
			</button>
		</div>
	</div>
	<?php get_template_part( 'template-parts/mega-menu', 'services' ); ?>
</header>

<main id="main" class="site-main">
