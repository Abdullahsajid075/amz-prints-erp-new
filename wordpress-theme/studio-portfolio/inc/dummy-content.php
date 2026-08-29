<?php
/**
 * Dummy / demo content — editable later in Customizer & WordPress admin
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Set theme mod only when empty.
 *
 * @param string $key     Without studio_ prefix.
 * @param mixed  $value   Value.
 * @param bool   $force   Overwrite existing.
 */
function studio_seed_mod( $key, $value, $force = false ) {
	if ( $force || '' === studio_get_option( $key, '' ) || null === get_theme_mod( 'studio_' . $key, null ) ) {
		set_theme_mod( 'studio_' . $key, $value );
	}
}

/**
 * Sideload an image into the media library.
 *
 * @param string $url     Image URL.
 * @param int    $post_id Optional post ID.
 * @return int Attachment ID or 0.
 */
function studio_sideload_image( $url, $post_id = 0 ) {
	if ( ! function_exists( 'media_sideload_image' ) ) {
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
	}

	$attachment_id = media_sideload_image( esc_url_raw( $url ), $post_id, null, 'id' );
	if ( is_wp_error( $attachment_id ) ) {
		return 0;
	}
	return (int) $attachment_id;
}

/**
 * All default text content for Customizer.
 *
 * @return array
 */
function studio_get_dummy_theme_mods() {
	return array(
		// Hero
		'hero_status'         => 'Available for freelance & full-time projects',
		'hero_name'           => 'Muhammad Ali',
		'hero_role'           => 'Brand Designer · UI/UX · Creative Director',
		'hero_title_line1'    => 'I design brands that',
		'hero_title_line2'    => 'people remember',
		'hero_title_line3'    => 'and businesses grow',
		'hero_description'    => 'Welcome! I am a creative designer helping startups and established brands build stunning visual identities, websites, and marketing materials.',
		'hero_btn1_text'      => 'View Portfolio',
		'hero_btn2_text'      => 'About Me',
		'hero_photo_caption'  => 'Nice to meet you!',

		// Marquee
		'marquee_items'       => "Brand Identity\nUI/UX Design\nLogo Design\nPackaging\nSocial Media\nWeb Design\nPrint Design\nMotion Graphics",
		'marquee_text_color'  => '#6B7280',
		'marquee_sep_color'   => '#059669',
		'marquee_bg_color'    => '#ECFDF5',

		// Home about
		'home_about_label'    => 'About Me',
		'home_about_title'    => 'Passionate designer with 5+ years of experience',
		'home_about_text'     => 'I combine strategy, creativity, and attention to detail to deliver designs that not only look beautiful but also solve real business problems. From logos to full brand systems — I have got you covered.',
		'home_about_btn'      => 'Read Full Story →',

		// Home services
		'home_services_label' => 'Services',
		'home_services_title' => 'What I can do for you',

		// Home portfolio
		'home_portfolio_label' => 'Portfolio',
		'home_portfolio_title' => 'Featured work',
		'home_portfolio_btn'   => 'See All Projects →',

		// About full
		'about_page_intro'    => 'I am a multidisciplinary designer based in Pakistan, working with clients worldwide. Here is my complete story.',
		'about_text'          => 'I started my design journey with a passion for visual storytelling. Today I help brands communicate clearly and stand out in crowded markets.',
		'about_experience'    => "Senior Brand Designer — Creative Studio (2022–Present)\nLead designer for 20+ brand identity projects.\n\nFreelance Designer — Self employed (2019–2022)\nWorked with startups across tech, food, and fashion.",
		'about_education'     => "Bachelor of Fine Arts — National College of Arts\nGraphic Design Specialization — 2019\n\nUI/UX Certificate — Google Coursera",
		'about_companies'     => "Worked with brands including: TechFlow, GreenLeaf Organics, Urban Coffee Co., StyleHub Fashion, and 30+ startups.",
		'about_goal'          => 'My goal is to build a world-class design studio that helps Pakistani brands compete globally with premium visual identity and digital experiences.',
		'about_struggles'     => 'Starting without connections was hard. I learned to build my portfolio piece by piece, take feedback gracefully, and never stop learning new tools and trends.',

		// Services
		'service_1_title'     => 'Brand Identity',
		'service_1_desc'      => 'Logo, color palette, typography, brand guidelines, and stationery.',
		'service_1_icon'      => '🎨',
		'service_2_title'     => 'UI/UX Design',
		'service_2_desc'      => 'Websites, mobile apps, dashboards — user-focused and modern.',
		'service_2_icon'      => '📱',
		'service_3_title'     => 'Print & Packaging',
		'service_3_desc'      => 'Business cards, brochures, product packaging, and labels.',
		'service_3_icon'      => '📦',
		'service_4_title'     => 'Social Media Design',
		'service_4_desc'      => 'Posts, stories, banners, and campaign creatives.',
		'service_4_icon'      => '✨',

		// Stats
		'stat_projects'       => '80+',
		'stat_clients'        => '45+',
		'stat_experience'     => '5+',
		'stat_awards'         => '8',

		// Footer / contact
		'footer_tagline'      => 'Designed with passion in Pakistan.',
		'footer_headline'     => 'Design that builds bold brands.',
		'footer_description'  => 'Premium brand identity, print, packaging, digital & corporate design — crafted with strategy and creativity.',
		'footer_cta_btn'      => 'Start a Project →',
		'contact_email'       => 'hello@yourbrand.com',
		'whatsapp_number'     => '923471136415',
		'schedule_whatsapp'   => '923471136415',

		// Visibility
		'show_marquee'        => true,
		'show_marquee_home'   => true,

		// Stats labels
		'stat_projects_label'   => 'Projects Completed',
		'stat_clients_label'    => 'Happy Clients',
		'stat_experience_label' => 'Years Experience',
		'stat_awards_label'     => 'Awards Won',

		// Home CTA
		'home_cta_label' => 'Let\'s Work Together',
		'home_cta_title' => 'Ready to start your next project?',
		'home_cta_text'  => 'Book a free consultation — I\'ll reply on WhatsApp within 24 hours.',
		'home_cta_btn'   => 'Schedule Meeting →',
		'home_cta_btn2'  => 'View Portfolio',

		// Social
		'social_1_label' => 'Behance',
		'social_1_url'   => 'https://behance.net',
		'social_2_label' => 'Dribbble',
		'social_2_url'   => 'https://dribbble.com',
		'social_3_label' => 'Instagram',
		'social_3_url'   => 'https://instagram.com',
		'social_4_label' => 'LinkedIn',
		'social_4_url'   => 'https://linkedin.com',
	);
}

/**
 * Seed portfolio demo projects.
 *
 * @param bool $force Recreate if empty only unless forced.
 */
function studio_seed_portfolio_items( $force = false ) {
	$existing = wp_count_posts( 'portfolio' );
	if ( ! $force && ( $existing->publish ?? 0 ) > 0 ) {
		return;
	}

	$projects = array(
		array( 'title' => 'Nova Tech Brand Identity', 'cat' => 'Branding', 'year' => '2025', 'featured' => true, 'img' => 'https://picsum.photos/seed/nova-brand/1000/750' ),
		array( 'title' => 'Pulse Fitness App UI', 'cat' => 'UI/UX Design', 'year' => '2025', 'featured' => true, 'img' => 'https://picsum.photos/seed/pulse-app/1000/750' ),
		array( 'title' => 'GreenLeaf Organic Packaging', 'cat' => 'Packaging', 'year' => '2024', 'featured' => true, 'img' => 'https://picsum.photos/seed/greenleaf/1000/750' ),
		array( 'title' => 'Urban Coffee Shop Branding', 'cat' => 'Branding', 'year' => '2024', 'featured' => true, 'img' => 'https://picsum.photos/seed/urban-coffee/1000/750' ),
		array( 'title' => 'StyleHub Fashion Campaign', 'cat' => 'Social Media', 'year' => '2024', 'featured' => false, 'img' => 'https://picsum.photos/seed/stylehub/1000/750' ),
		array( 'title' => 'Meridian Analytics Dashboard', 'cat' => 'UI/UX Design', 'year' => '2023', 'featured' => false, 'img' => 'https://picsum.photos/seed/meridian/1000/750' ),
	);

	foreach ( $projects as $i => $project ) {
		$post_id = wp_insert_post(
			array(
				'post_title'   => $project['title'],
				'post_content' => 'Demo project description — edit this in Portfolio → All Items. Replace the image with your own work.',
				'post_excerpt' => 'A showcase project demonstrating ' . strtolower( $project['cat'] ) . ' work. Fully editable from WordPress admin.',
				'post_status'  => 'publish',
				'post_type'    => 'portfolio',
				'menu_order'   => $i + 1,
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			continue;
		}

		update_post_meta( $post_id, '_portfolio_year', $project['year'] );
		update_post_meta( $post_id, '_portfolio_number', str_pad( (string) ( $i + 1 ), 2, '0', STR_PAD_LEFT ) );
		update_post_meta( $post_id, '_portfolio_tags', $project['cat'] . ', Design, Creative' );
		update_post_meta( $post_id, '_portfolio_featured_home', $project['featured'] ? '1' : '0' );
		update_post_meta( $post_id, '_portfolio_home_description', 'Demo project — edit title, image & description in Portfolio admin.' );

		if ( ! term_exists( $project['cat'], 'portfolio_category' ) ) {
			wp_insert_term( $project['cat'], 'portfolio_category' );
		}
		wp_set_object_terms( $post_id, $project['cat'], 'portfolio_category' );

		$thumb_id = studio_sideload_image( $project['img'], $post_id );
		if ( $thumb_id ) {
			set_post_thumbnail( $post_id, $thumb_id );
		}
	}
}

/**
 * Seed all demo content.
 *
 * @param bool $force Overwrite existing theme mods and recreate portfolio.
 */
function studio_seed_dummy_content( $force = false ) {
	// Text content
	foreach ( studio_get_dummy_theme_mods() as $key => $value ) {
		studio_seed_mod( $key, $value, $force );
	}

	// Hero photo
	$hero_url = 'https://picsum.photos/seed/designer-hero-v2/900/1100';

	if ( $force || ! studio_get_option( 'hero_personal_photo', 0 ) ) {
		$hero_id = studio_sideload_image( $hero_url );
		if ( $hero_id ) {
			set_theme_mod( 'studio_hero_personal_photo', $hero_id );
		}
	}

	if ( $force || ! studio_get_option( 'home_about_photo', 0 ) ) {
		$home_about_id = studio_sideload_image( 'https://picsum.photos/seed/about-home-v3/700/900' );
		if ( $home_about_id ) {
			set_theme_mod( 'studio_home_about_photo', $home_about_id );
		}
	}

	if ( $force || ! studio_get_option( 'about_page_photo', 0 ) ) {
		$about_page_id = studio_sideload_image( 'https://picsum.photos/seed/about-page-v3/800/1000' );
		if ( $about_page_id ) {
			set_theme_mod( 'studio_about_page_photo', $about_page_id );
		}
	}

	studio_seed_portfolio_items( $force );
	studio_create_default_pages( true );
	if ( function_exists( 'studio_create_portfolio_hub_pages' ) ) {
		studio_create_portfolio_hub_pages();
	}
	studio_seed_page_urls( $force );

	update_option( 'studio_dummy_seeded', STUDIO_PORTFOLIO_VERSION );
}

/**
 * Wire hero buttons to real page URLs after pages exist.
 *
 * @param bool $force Overwrite existing URLs.
 */
function studio_seed_page_urls( $force = false ) {
	studio_seed_mod( 'hero_btn1_url', studio_get_page_url( 'portfolio_page_id', home_url( '/portfolio/' ) ), $force );
	studio_seed_mod( 'hero_btn2_url', studio_get_page_url( 'about_page_id', home_url( '/about-me/' ) ), $force );
}

/**
 * Auto-seed on theme activation.
 */
function studio_on_dummy_content_activation() {
	studio_seed_dummy_content( false );
}
add_action( 'after_switch_theme', 'studio_on_dummy_content_activation', 30 );

/**
 * Seed demo content after update if site is empty.
 */
function studio_maybe_seed_dummy_content() {
	if ( get_option( 'studio_dummy_seeded' ) === STUDIO_PORTFOLIO_VERSION ) {
		return;
	}

	$portfolio_count = (int) ( wp_count_posts( 'portfolio' )->publish ?? 0 );
	$hero_name       = studio_get_option( 'hero_name', '' );

	if ( $portfolio_count > 0 && $hero_name ) {
		update_option( 'studio_dummy_seeded', STUDIO_PORTFOLIO_VERSION );
		return;
	}

	studio_seed_dummy_content( false );
}
add_action( 'init', 'studio_maybe_seed_dummy_content', 25 );

/**
 * Admin: Load Demo Content button handler.
 */
function studio_admin_load_demo_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Unauthorized', 'studio-portfolio' ) );
	}

	if ( isset( $_GET['studio_load_demo'] ) && check_admin_referer( 'studio_load_demo' ) ) {
		studio_seed_dummy_content( true );
		wp_safe_redirect( add_query_arg( 'studio_demo_loaded', '1', admin_url( 'admin.php?page=studio-portfolio' ) ) );
		exit;
	}

	$loaded = isset( $_GET['studio_demo_loaded'] );
	?>
	<div class="wrap">
		<h1><? esc_html_e( 'Studio Portfolio — Demo Content', 'studio-portfolio' ); ?></h1>
		<?php if ( $loaded ) : ?>
			<div class="notice notice-success"><p><? esc_html_e( 'Demo content loaded! Edit everything in Customize Theme or Portfolio admin.', 'studio-portfolio' ); ?></p></div>
		<?php endif; ?>
		<p><? esc_html_e( 'Load sample text, images, and portfolio projects. You can edit or replace everything later.', 'studio-portfolio' ); ?></p>
		<a class="button button-primary button-hero" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin.php?page=studio-portfolio-demo&studio_load_demo=1' ), 'studio_load_demo' ) ); ?>">
			<? esc_html_e( 'Load Demo Content Now', 'studio-portfolio' ); ?>
		</a>
		<p style="margin-top:1.5rem;"><a href="<?php echo esc_url( studio_get_customize_url() ); ?>"><? esc_html_e( 'Open Customizer →', 'studio-portfolio' ); ?></a></p>
	</div>
	<?php
}

/**
 * Register demo content admin page.
 */
function studio_admin_demo_menu() {
	add_submenu_page(
		'studio-portfolio',
		__( 'Load Demo Content', 'studio-portfolio' ),
		__( 'Load Demo Content', 'studio-portfolio' ),
		'manage_options',
		'studio-portfolio-demo',
		'studio_admin_load_demo_page'
	);
}
add_action( 'admin_menu', 'studio_admin_demo_menu', 20 );
