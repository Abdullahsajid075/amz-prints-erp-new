<?php
/**
 * Multi-page site setup — v2.0
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Map theme mod keys to page templates.
 *
 * @return array
 */
function studio_get_page_template_map() {
	return array(
		'portfolio_page_id'  => 'page-templates/page-portfolio.php',
		'work_page_id'       => 'page-templates/page-portfolio.php',
		'about_page_id'      => 'page-templates/page-about.php',
		'how_i_work_page_id' => 'page-templates/page-how-i-work.php',
		'schedule_page_id'   => 'page-templates/page-schedule-meeting.php',
	);
}

/**
 * Map theme mod keys to default page slugs.
 *
 * @return array
 */
function studio_get_page_slug_map() {
	return array(
		'portfolio_page_id'  => 'portfolio',
		'work_page_id'       => 'portfolio',
		'about_page_id'      => 'about-me',
		'how_i_work_page_id' => 'how-i-work',
		'schedule_page_id'   => 'schedule-meeting',
	);
}

/**
 * Find a published page using a theme template.
 *
 * @param string $template Template path relative to theme root.
 * @return int Page ID or 0.
 */
function studio_find_page_by_template( $template ) {
	$pages = get_posts(
		array(
			'post_type'      => 'page',
			'posts_per_page' => 1,
			'post_status'    => 'publish',
			'meta_key'       => '_wp_page_template',
			'meta_value'     => $template,
			'fields'         => 'ids',
		)
	);
	return ! empty( $pages[0] ) ? (int) $pages[0] : 0;
}

/**
 * Resolve and cache a page ID for a theme mod key.
 *
 * @param string $key Theme mod key without studio_ prefix.
 * @return int
 */
function studio_resolve_page_id( $key ) {
	$page_id = (int) studio_get_option( $key, 0 );
	if ( $page_id && 'publish' === get_post_status( $page_id ) ) {
		return $page_id;
	}

	$templates = studio_get_page_template_map();
	if ( isset( $templates[ $key ] ) ) {
		$page_id = studio_find_page_by_template( $templates[ $key ] );
		if ( $page_id ) {
			set_theme_mod( 'studio_' . $key, $page_id );
			return $page_id;
		}
	}

	$slugs = studio_get_page_slug_map();
	if ( isset( $slugs[ $key ] ) ) {
		$page = get_page_by_path( $slugs[ $key ] );
		if ( $page && 'publish' === $page->post_status ) {
			set_theme_mod( 'studio_' . $key, $page->ID );
			if ( isset( $templates[ $key ] ) ) {
				update_post_meta( $page->ID, '_wp_page_template', $templates[ $key ] );
			}
			return (int) $page->ID;
		}
	}

	return 0;
}

/**
 * Get permalink for a theme-assigned page.
 *
 * @param string $key      Theme mod key without studio_ prefix.
 * @param string $fallback Fallback URL.
 * @return string
 */
function studio_get_page_url( $key, $fallback = '#' ) {
	$page_id = studio_resolve_page_id( $key );
	if ( $page_id ) {
		return get_permalink( $page_id );
	}

	$slugs = studio_get_page_slug_map();
	if ( isset( $slugs[ $key ] ) ) {
		return home_url( '/' . $slugs[ $key ] . '/' );
	}

	return $fallback;
}

/**
 * Ensure Home is set as the static front page.
 */
function studio_ensure_home_page() {
	$home = get_page_by_path( 'home' );
	if ( ! $home ) {
		$home_id = wp_insert_post(
			array(
				'post_title'  => 'Home',
				'post_name'   => 'home',
				'post_status' => 'publish',
				'post_type'   => 'page',
			),
			true
		);
		if ( is_wp_error( $home_id ) ) {
			return;
		}
		$home = get_post( $home_id );
	}

	if ( $home && 'publish' === $home->post_status ) {
		update_option( 'page_on_front', $home->ID );
		update_option( 'show_on_front', 'page' );
	}
}

/**
 * Create or repair all required site pages.
 *
 * @param bool $force Recreate links even when mods exist but pages are missing.
 */
function studio_create_default_pages( $force = false ) {
	$pages = array(
		array(
			'mod'      => 'portfolio_page_id',
			'title'    => __( 'Portfolio', 'studio-portfolio' ),
			'slug'     => 'portfolio',
			'template' => 'page-templates/page-portfolio.php',
		),
		array(
			'mod'      => 'about_page_id',
			'title'    => __( 'About Me', 'studio-portfolio' ),
			'slug'     => 'about-me',
			'template' => 'page-templates/page-about.php',
		),
		array(
			'mod'      => 'how_i_work_page_id',
			'title'    => __( 'How I Work', 'studio-portfolio' ),
			'slug'     => 'how-i-work',
			'template' => 'page-templates/page-how-i-work.php',
		),
		array(
			'mod'      => 'schedule_page_id',
			'title'    => __( 'Schedule Meeting', 'studio-portfolio' ),
			'slug'     => 'schedule-meeting',
			'template' => 'page-templates/page-schedule-meeting.php',
		),
	);

	foreach ( $pages as $data ) {
		$page_id = (int) studio_get_option( $data['mod'], 0 );

		if ( ! $force && $page_id && get_post( $page_id ) && 'publish' === get_post_status( $page_id ) ) {
			update_post_meta( $page_id, '_wp_page_template', $data['template'] );
			continue;
		}

		if ( ! $page_id || ! get_post( $page_id ) ) {
			$page_id = studio_find_page_by_template( $data['template'] );
		}

		if ( ! $page_id ) {
			$existing = get_page_by_path( $data['slug'] );
			if ( $existing ) {
				$page_id = (int) $existing->ID;
			}
		}

		if ( ! $page_id ) {
			$page_id = wp_insert_post(
				array(
					'post_title'  => $data['title'],
					'post_name'   => $data['slug'],
					'post_status' => 'publish',
					'post_type'   => 'page',
				),
				true
			);
			if ( is_wp_error( $page_id ) ) {
				continue;
			}
		}

		update_post_meta( $page_id, '_wp_page_template', $data['template'] );
		set_theme_mod( 'studio_' . $data['mod'], (int) $page_id );
	}

	$portfolio_id = (int) studio_get_option( 'portfolio_page_id', 0 );
	if ( $portfolio_id ) {
		set_theme_mod( 'studio_work_page_id', $portfolio_id );
	}

	studio_ensure_home_page();
	if ( function_exists( 'studio_create_portfolio_hub_pages' ) ) {
		studio_create_portfolio_hub_pages();
	}
}

/**
 * Run page setup on theme activation.
 */
function studio_on_theme_activation() {
	studio_create_default_pages( true );
	flush_rewrite_rules();
	update_option( 'studio_pages_setup_version', STUDIO_PORTFOLIO_VERSION );
}
add_action( 'after_switch_theme', 'studio_on_theme_activation', 20 );

/**
 * Auto-repair pages after theme update (without requiring re-activation).
 */
function studio_maybe_setup_site_pages() {
	if ( get_option( 'studio_pages_setup_version' ) === STUDIO_PORTFOLIO_VERSION ) {
		return;
	}

	studio_create_default_pages( true );
	flush_rewrite_rules();
	update_option( 'studio_pages_setup_version', STUDIO_PORTFOLIO_VERSION );
}
add_action( 'init', 'studio_maybe_setup_site_pages', 20 );

/**
 * Admin notice when pages are missing.
 */
function studio_missing_pages_admin_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$required = array( 'portfolio_page_id', 'about_page_id', 'how_i_work_page_id', 'schedule_page_id' );
	foreach ( $required as $key ) {
		if ( studio_resolve_page_id( $key ) ) {
			continue;
		}
		?>
		<div class="notice notice-warning">
			<p>
				<strong><?php esc_html_e( 'Studio Portfolio:', 'studio-portfolio' ); ?></strong>
				<?php esc_html_e( 'Some pages are missing. Saving Permalinks or re-activating the theme will fix this.', 'studio-portfolio' ); ?>
				<a href="<?php echo esc_url( admin_url( 'options-permalink.php' ) ); ?>"><?php esc_html_e( 'Go to Permalinks →', 'studio-portfolio' ); ?></a>
			</p>
		</div>
		<?php
		return;
	}
}
add_action( 'admin_notices', 'studio_missing_pages_admin_notice' );

/**
 * Build portfolio query args.
 *
 * @param array $args Template arguments.
 * @return array
 */
function studio_get_portfolio_query_args( $args = array() ) {
	$mode = studio_template_arg( $args, 'mode', '', 'home' );

	$query_args = array(
		'post_type'      => 'portfolio',
		'post_status'    => 'publish',
		'posts_per_page' => (int) studio_template_arg( $args, 'posts_per_page', 'home_portfolio_count', 8 ),
		'orderby'        => studio_template_arg( $args, 'orderby', '', 'menu_order' ),
		'order'          => studio_template_arg( $args, 'order', '', 'ASC' ),
	);

	// Homepage + full portfolio page both show published items.
	// Featured flag is optional — never hide new admin items.
	if ( 'home' !== $mode ) {
		$query_args['posts_per_page'] = -1;
	}

	if ( 'portfolio' === $mode || 'work' === $mode ) {
		$query_args['posts_per_page'] = -1;
	}

	$category = studio_template_arg( $args, 'category', '', '' );
	if ( $category && 'all' !== $category ) {
		$query_args['tax_query'] = array(
			array(
				'taxonomy' => 'portfolio_category',
				'field'    => 'slug',
				'terms'    => sanitize_title( $category ),
			),
		);
	}

	return apply_filters( 'studio_portfolio_query_args', $query_args, $args );
}

/**
 * Default How I Work blocks.
 *
 * @return array
 */
function studio_get_hiw_defaults() {
	return array(
		'software'     => array( 'Software I Use', '🖥️', 'Adobe Illustrator, Photoshop, Figma, InDesign, After Effects — and AI tools for rapid prototyping.' ),
		'create'       => array( 'How I Create Design', '✏️', 'I start with research and mood boards, sketch concepts, then refine in digital tools until every detail feels intentional.' ),
		'innovation'   => array( 'How I Build Innovation', '💡', 'I push beyond templates — combining trends with timeless principles to create designs that feel fresh and ownable.' ),
		'redesign'     => array( 'How I Redesign Old Design', '🔄', 'I audit what works, preserve brand equity, and modernize typography, color, and layout without losing recognition.' ),
		'client_mind'  => array( "How I Read My Client's Mind", '🧠', 'Deep discovery calls, questionnaires, and iterative feedback loops help me translate vision into visuals before the first draft.' ),
		'presentation' => array( 'Design & Presentation Setup', '📊', 'Every deliverable is packaged professionally — mockups, brand guidelines, and presentation decks ready for stakeholders.' ),
	);
}

/**
 * Get How I Work process blocks.
 *
 * @return array
 */
function studio_get_how_i_work_blocks() {
	$defaults = studio_get_hiw_defaults();
	$blocks   = array();

	foreach ( $defaults as $key => $data ) {
		$blocks[] = array(
			'icon'    => studio_get_option( "hiw_{$key}_icon", $data[1] ),
			'title'   => studio_get_option( "hiw_{$key}_title", $data[0] ),
			'content' => studio_get_option( "hiw_{$key}_content", $data[2] ),
		);
	}

	return $blocks;
}

/**
 * Get meeting platform options.
 *
 * @return array
 */
function studio_get_meeting_platforms() {
	$default = "Zoom\nGoogle Meet\nWhatsApp Call\nPhone Call\nIn Person";
	return studio_get_lines( 'schedule_platforms', $default );
}

/**
 * Get about awards as array.
 *
 * @return array
 */
function studio_get_about_awards() {
	return studio_get_lines(
		'about_awards',
		"Best Brand Design — Design Awards 2024\nUI/UX Excellence — Creative Summit 2023\nFeatured Designer — Behance 2022"
	);
}

/**
 * Give the Portfolio PAGE priority over the portfolio CPT at /portfolio/.
 *
 * @param WP_Query $query Query.
 */
function studio_portfolio_page_query_fix( $query ) {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}

	if ( ! $query->is_page() ) {
		return;
	}

	$pagename = $query->get( 'pagename' );
	if ( ! $pagename && $query->get( 'page_id' ) ) {
		$page = get_post( (int) $query->get( 'page_id' ) );
		$pagename = $page ? $page->post_name : '';
	}

	if ( 'portfolio' === $pagename || 'work' === $pagename ) {
		$query->set( 'post_type', 'page' );
	}
}
add_action( 'pre_get_posts', 'studio_portfolio_page_query_fix' );

/**
 * Always load the correct page template even if WP template meta is missing.
 *
 * @param string $template Template path.
 * @return string
 */
function studio_force_page_templates( $template ) {
	if ( is_singular( 'portfolio' ) ) {
		$file = STUDIO_PORTFOLIO_DIR . '/single-portfolio.php';
		return file_exists( $file ) ? $file : $template;
	}

	if ( ! is_page() ) {
		return $template;
	}

	$page_id = get_queried_object_id();
	if ( ! $page_id ) {
		return $template;
	}

	if ( get_post_meta( $page_id, '_studio_hub_page', true ) ) {
		$file = STUDIO_PORTFOLIO_DIR . '/page-templates/page-portfolio-category.php';
		return file_exists( $file ) ? $file : $template;
	}

	foreach ( studio_get_page_template_map() as $key => $relative ) {
		if ( (int) studio_resolve_page_id( $key ) === (int) $page_id ) {
			$file = STUDIO_PORTFOLIO_DIR . '/' . $relative;
			if ( file_exists( $file ) ) {
				return $file;
			}
		}
	}

	$slug = get_post_field( 'post_name', $page_id );
	$by_slug = array(
		'portfolio'         => 'page-templates/page-portfolio.php',
		'about-me'          => 'page-templates/page-about.php',
		'how-i-work'        => 'page-templates/page-how-i-work.php',
		'schedule-meeting'  => 'page-templates/page-schedule-meeting.php',
	);
	if ( isset( $by_slug[ $slug ] ) ) {
		$file = STUDIO_PORTFOLIO_DIR . '/' . $by_slug[ $slug ];
		if ( file_exists( $file ) ) {
			return $file;
		}
	}

	return $template;
}
add_filter( 'template_include', 'studio_force_page_templates', 99 );

/**
 * Sync About / Home featured images into Customizer photo settings.
 *
 * @param int $post_id Post ID.
 */
function studio_sync_page_photos( $post_id ) {
	if ( wp_is_post_revision( $post_id ) || 'page' !== get_post_type( $post_id ) ) {
		return;
	}

	$thumb = get_post_thumbnail_id( $post_id );
	if ( ! $thumb ) {
		return;
	}

	if ( (int) get_option( 'page_on_front' ) === (int) $post_id ) {
		set_theme_mod( 'studio_home_about_photo', (int) $thumb );
	}

	if ( (int) studio_resolve_page_id( 'about_page_id' ) === (int) $post_id ) {
		set_theme_mod( 'studio_about_page_photo', (int) $thumb );
	}
}
add_action( 'save_post_page', 'studio_sync_page_photos' );
