<?php
/**
 * Dummy / demo content — editable later in Customizer & WordPress admin
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'STUDIO_CONTENT_PACK', 'brand-builder-v251' );

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
	$hiw = function_exists( 'studio_get_hiw_defaults' ) ? studio_get_hiw_defaults() : array();
	$mods = array(
		'hero_status'        => 'Brand Design Expert · Brand Builder',
		'hero_name'          => 'Abdullah',
		'hero_role'          => 'Brand Designer & Brand Builder',
		'hero_title_line1'   => 'Welcome to My Creative World',
		'hero_title_line2'   => 'I Don’t Just Design.',
		'hero_title_line3'   => 'I Build Brands.',
		'hero_description'   => 'I help businesses look more professional, feel more consistent, and stand out — through identity, packaging, print, social, signage, and digital design.',
		'hero_btn1_text'     => 'View My Work',
		'hero_btn2_text'     => 'About Me',
		'hero_photo_caption' => 'Nice to meet you!',

		'marquee_items'      => "Brand Identity\nLogo Design\nPackaging\nPrint Design\nSocial Media\nCorporate Branding\nSignage\nDigital Design",
		'marquee_text_color' => '#6B7280',
		'marquee_sep_color'  => '#059669',
		'marquee_bg_color'   => '#ECFDF5',

		'home_about_label' => 'Who I Am',
		'home_about_title' => 'More than a designer. A brand builder.',
		'home_about_text'  => 'I don’t just design files. I build brands — strategy first, then a visual system your team can actually use across print, packaging, digital, and signage.',
		'home_about_btn'   => 'Read Full Story →',

		'home_services_label' => 'What I Do',
		'home_services_title' => 'Services built around real brand work',

		'home_portfolio_label' => 'My Work',
		'home_portfolio_title' => 'Featured projects',
		'home_portfolio_btn'   => 'View all work →',

		'approach_label' => 'How I Work',
		'approach_title' => 'My Creative Process',
		'approach_text'  => 'A thoughtful process. A strategic approach. A brand designed to make an impact.',

		'why_label'  => 'Why Work With Me',
		'why_title'  => 'Strategy, systems, and real-world brand applications',
		'why_points' => "Strategy before decoration\nComplete brand systems, not one-off files\nPrint, packaging, digital and signage that stay consistent\nA clear process from discovery to delivery\nBuilt for real businesses, not just portfolios",

		'clients_label' => "Brands I've Helped Build",
		'clients_title' => 'Selected clients & industries',
		'clients_list'  => "Fireway Pizza|Food & QSR|Brand transformation\nGreenLeaf Organics|FMCG|Packaging & identity\nUrban Coffee Co.|Hospitality|Cafe branding\nStyleHub|Fashion|Campaign & social\nMeridian Analytics|Tech|Corporate identity\nNova Tech|SaaS|Logo & digital",

		'testimonials_label' => 'What Clients Say',
		'testimonials_title' => 'Proof from real businesses',
		'testimonials'       => "The new branding completely changed how our business looks and feels. Abdullah understood what we needed and transformed the brand into something we are proud to represent.|Restaurant Owner|Fireway Pizza\nHe didn't just design a logo — he built a system we can use everywhere, from packaging to signage.|Marketing Lead|GreenLeaf Organics\nProfessional, strategic, and easy to work with. Our company profile and stationery finally feel like one brand.|Director|Urban Coffee Co.",

		'about_page_label' => 'About Me',
		'about_page_title' => 'More Than a Designer. A Brand Builder.',
		'about_page_intro' => 'This is my story — who I am, how I work, and why I build brands rather than just designing files.',
		'about_text'       => 'I am a brand designer and brand builder. I help businesses communicate clearly, look more professional, and stand out in crowded markets.',
		'about_experience_title' => 'Experience',
		'about_experience'       => "I work as a brand designer and brand builder — helping businesses look more professional, feel more consistent, and stand out in crowded markets.\n\nFrom identity systems to packaging, print, social, and signage, I design work that is meant to be used in the real world.",
		'about_education_title'  => 'Design Philosophy',
		'about_education'        => "I don't just design. I build brands.\n\nEvery project starts with the business: audience, goals, competitors, and what the brand needs to communicate. The visuals come after the strategy.",
		'about_companies_title'  => 'Industries & Businesses',
		'about_companies'        => 'I have worked with businesses across food, retail, hospitality, fashion, corporate, and digital — building identities that work on packaging, signage, stationery, and screens.',
		'about_goal_title'       => 'My Role as a Brand Designer',
		'about_goal'             => 'My role is to turn a business into a brand people remember — logo, color, typography, applications, and a system the team can actually use.',
		'about_founded_title'    => 'Companies & Businesses I Have Founded',
		'about_founded'          => 'I have founded and led creative businesses — applying the same brand-building process I use for clients to my own companies.',
		'about_struggles_title'  => 'The Journey',
		'about_struggles'        => "Started in graphic design → worked with local businesses → expanded into branding and corporate design → founded and led creative businesses → now helping brands grow through design and strategy.",
		'about_journey'          => "Started graphic design with a focus on visual storytelling\nWorked with local businesses to solve real branding problems\nExpanded into brand identity and corporate design\nFounded and led creative businesses\nWorked across food, retail, corporate and digital industries\nNow building brands through design and strategy",
		'about_text2'            => 'Have a brand that needs a better identity? Let’s talk about your next project.',
		'about_awards_title'     => 'Key Achievements',
		'about_awards'           => "Complete brand systems for food, retail, and corporate clients\nPrint, packaging, and signage that stay consistent with the identity\nFounded and led creative businesses\nWorked with businesses across multiple industries",

		'hiw_label'       => 'My Creative Process',
		'hiw_title'       => 'How I Work',
		'hiw_description' => 'A thoughtful process. A strategic approach. A brand designed to make an impact.',
		'hiw_flow'        => 'DISCOVER → STRATEGIZE → EXPLORE → DESIGN → REFINE → DELIVER',

		'portfolio_page_label'       => 'My Work',
		'portfolio_page_title'       => 'Selected brand work',
		'portfolio_page_description' => 'Browse by category. Each project is a case study — challenge, approach, design, transformation, and result.',
		'portfolio_page_hint'        => 'Open a project to read the full case study',

		'service_1_title' => 'Brand Identity',
		'service_1_desc'  => 'Logo, visual identity, brand guidelines, brand kits',
		'service_1_icon'  => '🎨',
		'service_2_title' => 'Graphic Design',
		'service_2_desc'  => 'Marketing materials, posters, brochures, presentations',
		'service_2_icon'  => '✏️',
		'service_3_title' => 'Packaging Design',
		'service_3_desc'  => 'Boxes, labels, pouches, product packaging',
		'service_3_icon'  => '📦',
		'service_4_title' => 'Print Design',
		'service_4_desc'  => 'Business cards, stationery, catalogues, flyers',
		'service_4_icon'  => '🖨️',

		'stat_projects'         => '80+',
		'stat_clients'          => '45+',
		'stat_experience'       => '5+',
		'stat_awards'           => '8',
		'stat_projects_label'   => 'Projects Completed',
		'stat_clients_label'    => 'Happy Clients',
		'stat_experience_label' => 'Years Experience',
		'stat_awards_label'     => 'Key Achievements',

		'footer_tagline'     => 'Designed with passion in Pakistan.',
		'footer_headline'    => 'I don’t just design. I build brands.',
		'footer_description' => 'Brand identity, packaging, print, social, signage, and digital — crafted with strategy and a clear process.',
		'footer_cta_btn'     => 'Start a Project →',
		'contact_email'      => 'hello@yourbrand.com',
		'whatsapp_number'    => '923471136415',
		'schedule_whatsapp'  => '923471136415',
		'nav_schedule'       => 'Start a Project',

		'show_marquee'      => true,
		'show_marquee_home' => true,

		'home_cta_label' => "Let's Work Together",
		'home_cta_title' => 'Have a Brand That Needs a Better Identity?',
		'home_cta_text'  => "Let's talk about your next project.",
		'home_cta_btn'   => 'Start a Project →',
		'home_cta_btn2'  => 'View Portfolio',

		'contact_label'       => 'Contact',
		'contact_title'       => 'Have a Brand That Needs a Better Identity?',
		'contact_description' => "Let's talk about your next project.",
		'contact_location'    => 'Available Worldwide · Remote',
		'contact_btn_text'    => 'Start a Project',
		'contact_success'     => 'Thank you — I will get back to you shortly.',
		'contact_project_types' => "Brand Identity\nGraphic Design\nPackaging Design\nPrint Design\nSocial Media Design\nCorporate Branding\nSignage & Advertising\nDigital Design\nUI / Website Design\nOther",

		'social_1_label' => 'LinkedIn',
		'social_1_url'   => 'https://linkedin.com',
		'social_2_label' => 'Instagram',
		'social_2_url'   => 'https://instagram.com',
		'social_3_label' => 'Behance',
		'social_3_url'   => 'https://behance.net',
		'social_4_label' => 'WhatsApp',
		'social_4_url'   => 'https://wa.me/923471136415',
	);

	foreach ( $hiw as $key => $data ) {
		$mods[ "hiw_{$key}_title" ]    = $data[0];
		$mods[ "hiw_{$key}_step" ]     = $data[1];
		$mods[ "hiw_{$key}_subtitle" ] = $data[2];
		$mods[ "hiw_{$key}_content" ]  = $data[3];
	}

	$home_services = function_exists( 'studio_get_default_home_services' ) ? studio_get_default_home_services() : array();
	foreach ( $home_services as $i => $service ) {
		$n = $i + 1;
		$mods[ "home_service_{$n}_icon" ]  = $service['icon'];
		$mods[ "home_service_{$n}_title" ] = $service['title'];
		$mods[ "home_service_{$n}_desc" ]  = $service['desc'];
	}

	return $mods;
}

/**
 * Default portfolio category names.
 *
 * @return array
 */
function studio_get_default_portfolio_categories() {
	return array(
		'Brand Identity',
		'Logo Design',
		'Packaging',
		'Print Design',
		'Social Media',
		'Corporate Branding',
		'Signage & Large Format',
		'Digital Design',
		'UI/Website Design',
	);
}

/**
 * Find a portfolio item by title.
 *
 * @param string $title Title.
 * @return int
 */
function studio_find_portfolio_by_title( $title ) {
	$by_slug = get_page_by_path( sanitize_title( $title ), OBJECT, 'portfolio' );
	if ( $by_slug ) {
		return (int) $by_slug->ID;
	}

	$posts = get_posts(
		array(
			'post_type'      => 'portfolio',
			'title'          => $title,
			'post_status'    => 'any',
			'posts_per_page' => 1,
		)
	);
	return ! empty( $posts[0] ) ? (int) $posts[0]->ID : 0;
}

/**
 * Demo portfolio / case-study projects.
 *
 * @return array
 */
function studio_get_demo_portfolio_projects() {
	return array(
		array(
			'title'          => 'Fireway Pizza — Brand Transformation',
			'cat'            => 'Brand Identity',
			'year'           => '2025',
			'featured'       => true,
			'client'         => 'Fireway Pizza',
			'img'            => 'https://picsum.photos/seed/fireway-pizza/1000/750',
			'excerpt'        => 'A full brand transformation — from a tired QSR look to a system the business is proud to represent.',
			'content'        => "Fireway Pizza needed more than a new logo. The existing branding felt dated, inconsistent, and weak next to competitors.\n\nThis case study walks through the challenge, the strategy, the design system, and the before/after transformation.",
			'challenge'      => 'The existing branding looked dated and inconsistent. Packaging, signage, and social posts each felt like a different business. Customers could not recognize the brand at a glance, and the company did not look as premium as the food it served.',
			'approach'       => 'I started by understanding the business, audience, and competitors — then defined a clearer position: fast, warm, and proudly local. The recommendation was a complete visual system (not a logo-only refresh) so every touchpoint could speak with one voice.',
			'design'         => 'The new identity includes a refined logo, a warmer color palette, bold typography, stationery, pizza boxes and labels, menu boards, shop signage, and social templates. Every application was designed to work in print and on screen.',
			'transformation' => 'Before: mixed fonts, weak color, and signage that did not match the packaging. After: one recognizable system — from the storefront to the delivery box to Instagram.',
			'result'         => 'The new branding changed how the business looks and feels. Staff and owners now have assets they are proud to represent, and customers meet a clearer, more professional brand at every step.',
		),
		array(
			'title'          => 'GreenLeaf Organics — Packaging System',
			'cat'            => 'Packaging',
			'year'           => '2024',
			'featured'       => true,
			'client'         => 'GreenLeaf Organics',
			'img'            => 'https://picsum.photos/seed/greenleaf-pack/1000/750',
			'excerpt'        => 'Pouches, labels, and boxes that feel natural, premium, and consistent on the shelf.',
			'content'        => 'A packaging system for an organic FMCG brand — designed to stand out on shelf while staying honest to the product.',
			'challenge'      => 'Existing packs looked generic and did not communicate “organic” or “premium” clearly next to bigger competitors.',
			'approach'       => 'We defined a calm, natural visual direction and a structure that could scale across SKUs without redesigning each pack from scratch.',
			'design'         => 'Color, typography, and a flexible label system for pouches, boxes, and stickers — plus mockups ready for production.',
			'transformation' => 'From mixed, low-impact packaging to a family of packs that read as one brand from across the aisle.',
			'result'         => 'A system the team can extend to new products without losing consistency.',
		),
		array(
			'title'          => 'Urban Coffee Co. — Cafe Branding',
			'cat'            => 'Corporate Branding',
			'year'           => '2024',
			'featured'       => true,
			'client'         => 'Urban Coffee Co.',
			'img'            => 'https://picsum.photos/seed/urban-cafe/1000/750',
			'excerpt'        => 'Identity, stationery, and in-store graphics for a hospitality brand.',
			'content'        => 'Hospitality branding that works on cups, menus, and the shop front.',
			'challenge'      => 'The cafe had a name, but no system — menus, cups, and social each looked different.',
			'approach'       => 'Build a warm, urban identity that feels as good in print as it does on a storefront.',
			'design'         => 'Logo, color, typography, menus, cups, and interior signage.',
			'transformation' => 'A loose collection of files became a complete cafe brand.',
			'result'         => 'Guests now experience one brand from the first Instagram post to the last sip.',
		),
		array(
			'title'          => 'Nova Tech — Logo & Visual Identity',
			'cat'            => 'Logo Design',
			'year'           => '2025',
			'featured'       => true,
			'client'         => 'Nova Tech',
			'img'            => 'https://picsum.photos/seed/nova-logo/1000/750',
			'excerpt'        => 'A precise logo and identity kit for a SaaS company.',
			'content'        => 'Logo, color, and digital-ready identity for a technology brand.',
			'challenge'      => 'The previous mark felt generic and did not scale well in app icons or presentations.',
			'approach'       => 'A simple, geometric direction that stays clear at small sizes.',
			'design'         => 'Primary logo, icon, color, type, and a compact brand kit.',
			'transformation' => 'From a clip-art style mark to a professional identity system.',
			'result'         => 'A logo the company can use confidently across product and sales materials.',
		),
		array(
			'title'          => 'StyleHub — Social Campaign',
			'cat'            => 'Social Media',
			'year'           => '2024',
			'featured'       => false,
			'client'         => 'StyleHub',
			'img'            => 'https://picsum.photos/seed/stylehub-social/1000/750',
			'excerpt'        => 'Campaign posts, ads, and banners with a consistent fashion voice.',
			'content'        => 'A social system for a fashion retailer — templates, ads, and campaign key visuals.',
			'challenge'      => 'Posts looked handmade each week and did not match the store branding.',
			'approach'       => 'A campaign look with reusable templates so the team can stay on-brand.',
			'design'         => 'Feed posts, stories, ads, and cover banners.',
			'transformation' => 'Scattered creatives became a recognizable fashion campaign.',
			'result'         => 'Faster production and a clearer brand on every platform.',
		),
		array(
			'title'          => 'Meridian — Company Profile & Print',
			'cat'            => 'Print Design',
			'year'           => '2023',
			'featured'       => false,
			'client'         => 'Meridian Analytics',
			'img'            => 'https://picsum.photos/seed/meridian-print/1000/750',
			'excerpt'        => 'Corporate stationery, catalogue, and presentation design.',
			'content'        => 'Print collateral that finally matches the company’s digital presence.',
			'challenge'      => 'Business cards, proposals, and the company profile all used different layouts.',
			'approach'       => 'One print system aligned with the corporate identity.',
			'design'         => 'Stationery, catalogue spreads, and a presentation template.',
			'transformation' => 'Inconsistent print files became a professional collateral set.',
			'result'         => 'Sales materials now look like they belong to the same company.',
		),
		array(
			'title'          => 'Horizon Stores — Signage & Vehicle',
			'cat'            => 'Signage & Large Format',
			'year'           => '2024',
			'featured'       => false,
			'client'         => 'Horizon Stores',
			'img'            => 'https://picsum.photos/seed/horizon-sign/1000/750',
			'excerpt'        => 'Shop fronts, boards, and vehicle graphics at real-world scale.',
			'content'        => 'Large-format branding that holds up on the street and on the road.',
			'challenge'      => 'Store signage and delivery vans did not match the indoor brand.',
			'approach'       => 'Adapt the identity for distance, light, and large format production.',
			'design'         => 'Fascia boards, window graphics, and vehicle wraps.',
			'transformation' => 'The brand finally reads clearly from the street.',
			'result'         => 'A consistent public-facing identity at scale.',
		),
		array(
			'title'          => 'Pulse Fitness — Website UI',
			'cat'            => 'UI/Website Design',
			'year'           => '2025',
			'featured'       => false,
			'client'         => 'Pulse Fitness',
			'img'            => 'https://picsum.photos/seed/pulse-ui/1000/750',
			'excerpt'        => 'Landing pages and digital banners aligned with the brand.',
			'content'        => 'Digital design for a fitness brand — UI that matches print and social.',
			'challenge'      => 'The website looked unrelated to the gym’s physical branding.',
			'approach'       => 'Bring the identity online with clear hierarchy and conversion-focused layouts.',
			'design'         => 'Landing page UI, digital banners, and email header designs.',
			'transformation' => 'A generic template site became a branded digital experience.',
			'result'         => 'Online and offline now feel like the same brand.',
		),
	);
}

/**
 * Seed portfolio demo projects (update by title, do not duplicate).
 *
 * @param bool $force Recreate images / meta even when the post exists.
 */
function studio_seed_portfolio_items( $force = false ) {
	foreach ( studio_get_default_portfolio_categories() as $cat ) {
		if ( ! term_exists( $cat, 'portfolio_category' ) ) {
			wp_insert_term( $cat, 'portfolio_category' );
		}
	}

	foreach ( studio_get_demo_portfolio_projects() as $i => $project ) {
		$post_id = studio_find_portfolio_by_title( $project['title'] );

		if ( ! $post_id ) {
			$post_id = wp_insert_post(
				array(
					'post_title'   => $project['title'],
					'post_content' => $project['content'],
					'post_excerpt' => $project['excerpt'],
					'post_status'  => 'publish',
					'post_type'    => 'portfolio',
					'menu_order'   => $i + 1,
				),
				true
			);
			if ( is_wp_error( $post_id ) ) {
				continue;
			}
		} elseif ( $force ) {
			wp_update_post(
				array(
					'ID'           => $post_id,
					'post_content' => $project['content'],
					'post_excerpt' => $project['excerpt'],
					'post_status'  => 'publish',
					'menu_order'   => $i + 1,
				)
			);
		}

		update_post_meta( $post_id, '_portfolio_year', $project['year'] );
		update_post_meta( $post_id, '_portfolio_client', $project['client'] );
		update_post_meta( $post_id, '_portfolio_number', str_pad( (string) ( $i + 1 ), 2, '0', STR_PAD_LEFT ) );
		update_post_meta( $post_id, '_portfolio_tags', $project['cat'] . ', Brand, Design' );
		update_post_meta( $post_id, '_portfolio_featured_home', $project['featured'] ? '1' : '0' );
		update_post_meta( $post_id, '_portfolio_home_description', $project['excerpt'] );
		update_post_meta( $post_id, '_portfolio_challenge', $project['challenge'] );
		update_post_meta( $post_id, '_portfolio_approach', $project['approach'] );
		update_post_meta( $post_id, '_portfolio_design', $project['design'] );
		update_post_meta( $post_id, '_portfolio_transformation', $project['transformation'] );
		update_post_meta( $post_id, '_portfolio_result', $project['result'] );

		if ( ! term_exists( $project['cat'], 'portfolio_category' ) ) {
			wp_insert_term( $project['cat'], 'portfolio_category' );
		}
		wp_set_object_terms( $post_id, $project['cat'], 'portfolio_category' );

		if ( $force || ! has_post_thumbnail( $post_id ) ) {
			$thumb_id = studio_sideload_image( $project['img'], $post_id );
			if ( $thumb_id ) {
				set_post_thumbnail( $post_id, $thumb_id );
			}
		}
	}
}

/**
 * Seed all demo content.
 *
 * @param bool $force Overwrite existing theme mods and recreate portfolio.
 */
function studio_seed_dummy_content( $force = false ) {
	foreach ( studio_get_dummy_theme_mods() as $key => $value ) {
		studio_seed_mod( $key, $value, $force );
	}

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
	if ( function_exists( 'studio_disable_portfolio_hub_pages' ) ) {
		studio_disable_portfolio_hub_pages();
	}
	studio_seed_page_urls( $force );

	update_option( 'studio_dummy_seeded', STUDIO_PORTFOLIO_VERSION );
	update_option( 'studio_content_pack', STUDIO_CONTENT_PACK );
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
 * Apply brand-builder copy once (fixes stale dummy text / mega-menu era content).
 */
function studio_apply_brand_builder_pack() {
	if ( get_option( 'studio_content_pack' ) === STUDIO_CONTENT_PACK ) {
		return;
	}

	foreach ( studio_get_dummy_theme_mods() as $key => $value ) {
		set_theme_mod( 'studio_' . $key, $value );
	}

	studio_create_default_pages( true );
	if ( function_exists( 'studio_disable_portfolio_hub_pages' ) ) {
		studio_disable_portfolio_hub_pages();
	}
	studio_seed_portfolio_items( false );
	studio_seed_page_urls( true );

	update_option( 'studio_content_pack', STUDIO_CONTENT_PACK );
	update_option( 'studio_dummy_seeded', STUDIO_PORTFOLIO_VERSION );
}

/**
 * Auto-seed on theme activation.
 */
function studio_on_dummy_content_activation() {
	studio_seed_dummy_content( false );
	studio_apply_brand_builder_pack();
}
add_action( 'after_switch_theme', 'studio_on_dummy_content_activation', 30 );

/**
 * Seed demo content after update if site is empty, and apply the content pack once.
 */
function studio_maybe_seed_dummy_content() {
	studio_apply_brand_builder_pack();

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
		wp_safe_redirect( add_query_arg( 'studio_demo_loaded', '1', admin_url( 'admin.php?page=studio-portfolio-demo' ) ) );
		exit;
	}

	if ( isset( $_GET['studio_repair_pages'] ) && check_admin_referer( 'studio_repair_pages' ) ) {
		studio_create_default_pages( true );
		flush_rewrite_rules( false );
		update_option( 'studio_pages_setup_version', STUDIO_PORTFOLIO_VERSION );
		wp_safe_redirect( add_query_arg( 'studio_pages_repaired', '1', admin_url( 'admin.php?page=studio-portfolio-demo' ) ) );
		exit;
	}

	$loaded   = isset( $_GET['studio_demo_loaded'] );
	$repaired = isset( $_GET['studio_pages_repaired'] );
	$about_id = studio_resolve_page_id( 'about_page_id' );
	$hiw_id   = studio_resolve_page_id( 'how_i_work_page_id' );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Studio Portfolio — Demo Content', 'studio-portfolio' ); ?></h1>
		<?php if ( $loaded ) : ?>
			<div class="notice notice-success"><p><?php esc_html_e( 'Demo content loaded! Edit everything in Customize Theme or Portfolio admin.', 'studio-portfolio' ); ?></p></div>
		<?php endif; ?>
		<?php if ( $repaired ) : ?>
			<div class="notice notice-success"><p><?php esc_html_e( 'About Me and How I Work pages were created and assigned. Save Permalinks once, then view those two pages.', 'studio-portfolio' ); ?></p></div>
		<?php endif; ?>

		<h2><?php esc_html_e( 'Fix About & How I Work', 'studio-portfolio' ); ?></h2>
		<p><?php esc_html_e( 'This creates two separate pages and locks the correct templates: About = your story, How I Work = the 6-step process (not the portfolio).', 'studio-portfolio' ); ?></p>
		<p>
			<?php if ( $about_id ) : ?>
				<a href="<?php echo esc_url( get_permalink( $about_id ) ); ?>" target="_blank"><?php esc_html_e( 'View About Me', 'studio-portfolio' ); ?></a>
			<?php else : ?>
				<em><?php esc_html_e( 'About page is not assigned yet.', 'studio-portfolio' ); ?></em>
			<?php endif; ?>
			&nbsp;·&nbsp;
			<?php if ( $hiw_id ) : ?>
				<a href="<?php echo esc_url( get_permalink( $hiw_id ) ); ?>" target="_blank"><?php esc_html_e( 'View How I Work', 'studio-portfolio' ); ?></a>
			<?php else : ?>
				<em><?php esc_html_e( 'How I Work page is not assigned yet.', 'studio-portfolio' ); ?></em>
			<?php endif; ?>
		</p>
		<p>
			<a class="button button-primary" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin.php?page=studio-portfolio-demo&studio_repair_pages=1' ), 'studio_repair_pages' ) ); ?>">
				<?php esc_html_e( 'Repair About & How I Work Pages', 'studio-portfolio' ); ?>
			</a>
		</p>

		<hr />
		<p><?php esc_html_e( 'Load sample text, images, and portfolio case studies. You can edit or replace everything later.', 'studio-portfolio' ); ?></p>
		<a class="button" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin.php?page=studio-portfolio-demo&studio_load_demo=1' ), 'studio_load_demo' ) ); ?>">
			<?php esc_html_e( 'Load Demo Content Now', 'studio-portfolio' ); ?>
		</a>
		<p style="margin-top:1.5rem;"><a href="<?php echo esc_url( studio_get_customize_url() ); ?>"><?php esc_html_e( 'Open Customizer →', 'studio-portfolio' ); ?></a></p>
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
