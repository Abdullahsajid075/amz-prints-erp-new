<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header premium-header">
	<div class="container header-inner">
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-logo">
			<?php if ( has_custom_logo() ) : ?>
				<?php the_custom_logo(); ?>
			<?php else : ?>
				<span class="logo-mark"><?php echo esc_html( studio_get_option( 'logo_letter', 'A' ) ); ?></span>
				<span class="logo-text"><?php bloginfo( 'name' ); ?></span>
			<?php endif; ?>
		</a>

		<?php studio_render_nav( 'main-nav' ); ?>

		<div class="header-cta">
			<a href="<?php echo esc_url( studio_get_start_project_url() ); ?>" class="btn btn-gold btn-sm btn-schedule">
				<?php echo esc_html( studio_get_option( 'nav_schedule', 'Start a Project' ) ); ?>
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
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_home', 'Home' ) ); ?></a>
		<a href="<?php echo esc_url( studio_get_page_url( 'about_page_id', home_url( '/about-me/' ) ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_about', 'About' ) ); ?></a>
		<a href="<?php echo esc_url( studio_get_page_url( 'services_page_id', home_url( '/services/' ) ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_services', 'Services' ) ); ?></a>
		<a href="<?php echo esc_url( studio_get_page_url( 'portfolio_page_id', home_url( '/portfolio/' ) ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_portfolio', 'Portfolio' ) ); ?></a>
		<a href="<?php echo esc_url( studio_get_page_url( 'how_i_work_page_id', home_url( '/how-i-work/' ) ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_how_i_work', 'How I Work' ) ); ?></a>
		<a href="<?php echo esc_url( studio_get_page_url( 'contact_page_id', home_url( '/contact/' ) ) ); ?>"><?php echo esc_html( studio_get_option( 'nav_contact', 'Contact' ) ); ?></a>
		<a href="<?php echo esc_url( studio_get_start_project_url() ); ?>" class="btn btn-gold btn-schedule" style="margin-top:2rem;display:inline-flex;">
			<?php echo esc_html( studio_get_option( 'nav_schedule', 'Start a Project' ) ); ?>
		</a>
	</div>
</nav>
