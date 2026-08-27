<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
	<div class="container header-inner">
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-logo">
			<?php if ( has_custom_logo() ) : ?>
				<?php the_custom_logo(); ?>
			<?php else : ?>
				<span class="logo-mark"><?php echo esc_html( studio_get_option( 'logo_letter', 'S' ) ); ?></span>
				<span class="logo-text"><?php bloginfo( 'name' ); ?></span>
			<?php endif; ?>
		</a>

		<?php studio_render_nav( 'main-nav' ); ?>

		<div class="header-cta">
			<a href="<?php echo esc_url( studio_get_option( 'header_cta_url', '#contact' ) ); ?>" class="btn btn-gold btn-sm">
				<?php echo esc_html( studio_get_option( 'header_cta_text', "Let's Talk" ) ); ?>
			</a>
		</div>

		<button class="nav-toggle" aria-label="<?php esc_attr_e( 'Toggle menu', 'studio-portfolio' ); ?>" aria-expanded="false">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="3" y1="6" x2="21" y2="6"></line>
				<line x1="3" y1="12" x2="21" y2="12"></line>
				<line x1="3" y1="18" x2="21" y2="18"></line>
			</svg>
		</button>
	</div>
</header>

<nav class="mobile-nav" aria-label="<?php esc_attr_e( 'Mobile', 'studio-portfolio' ); ?>">
	<div class="container">
		<?php if ( has_nav_menu( 'primary' ) ) : ?>
			<?php
			wp_nav_menu( array(
				'theme_location' => 'primary',
				'container'      => false,
				'menu_class'     => 'mobile-menu-list',
				'depth'          => 1,
			) );
			?>
		<?php else : ?>
			<a href="#work"><?php echo esc_html( studio_get_option( 'nav_work', 'Work' ) ); ?></a>
			<a href="#about"><?php echo esc_html( studio_get_option( 'nav_about', 'About' ) ); ?></a>
			<a href="#design-system"><?php echo esc_html( studio_get_option( 'nav_system', 'System' ) ); ?></a>
			<a href="#contact"><?php echo esc_html( studio_get_option( 'nav_contact', 'Contact' ) ); ?></a>
		<?php endif; ?>
		<a href="<?php echo esc_url( studio_get_option( 'header_cta_url', '#contact' ) ); ?>" class="btn btn-gold" style="margin-top:2rem;display:inline-flex;">
			<?php echo esc_html( studio_get_option( 'header_cta_text', "Let's Talk" ) ); ?>
		</a>
	</div>
</nav>
