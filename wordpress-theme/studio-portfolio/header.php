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
				<span class="logo-mark">S</span>
				<span class="logo-text"><?php bloginfo( 'name' ); ?></span>
			<?php endif; ?>
		</a>

		<nav class="main-nav" aria-label="<?php esc_attr_e( 'Primary', 'studio-portfolio' ); ?>">
			<a href="#work"><?php esc_html_e( 'Work', 'studio-portfolio' ); ?></a>
			<a href="#about"><?php esc_html_e( 'About', 'studio-portfolio' ); ?></a>
			<a href="#design-system"><?php esc_html_e( 'System', 'studio-portfolio' ); ?></a>
			<a href="#contact"><?php esc_html_e( 'Contact', 'studio-portfolio' ); ?></a>
		</nav>

		<div class="header-cta">
			<a href="#contact" class="btn btn-gold btn-sm"><?php esc_html_e( "Let's Talk", 'studio-portfolio' ); ?></a>
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
		<a href="#work"><?php esc_html_e( 'Work', 'studio-portfolio' ); ?></a>
		<a href="#about"><?php esc_html_e( 'About', 'studio-portfolio' ); ?></a>
		<a href="#design-system"><?php esc_html_e( 'System', 'studio-portfolio' ); ?></a>
		<a href="#contact"><?php esc_html_e( 'Contact', 'studio-portfolio' ); ?></a>
		<a href="#contact" class="btn btn-gold" style="margin-top:2rem;display:inline-flex;"><?php esc_html_e( "Let's Talk", 'studio-portfolio' ); ?></a>
	</div>
</nav>
