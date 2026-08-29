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
		'services_page_id'   => 'page-templates/page-services.php',
		'how_i_work_page_id' => 'page-templates/page-how-i-work.php',
		'contact_page_id'    => 'page-templates/page-contact.php',
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
		'services_page_id'   => 'services',
		'how_i_work_page_id' => 'how-i-work',
		'contact_page_id'    => 'contact',
		'schedule_page_id'   => 'start-a-project',
	);
}

/**
 * Page roles with slug/title aliases so About and How I Work never share Portfolio.
 *
 * @return array
 */
function studio_get_page_role_defs() {
	return array(
		'portfolio_page_id'  => array(
			'role'      => 'portfolio',
			'title'     => __( 'Portfolio', 'studio-portfolio' ),
			'titles'    => array( 'Portfolio', 'My Work', 'Work' ),
			'slug'      => 'portfolio',
			'slugs'     => array( 'portfolio', 'work', 'my-work' ),
			'template'  => 'page-templates/page-portfolio.php',
			'shortcode' => '',
		),
		'about_page_id'      => array(
			'role'      => 'about',
			'title'     => __( 'About Me', 'studio-portfolio' ),
			'titles'    => array( 'About Me', 'About' ),
			'slug'      => 'about-me',
			'slugs'     => array( 'about-me', 'about', 'about-us' ),
			'template'  => 'page-templates/page-about.php',
			'shortcode' => '[studio_about]',
		),
		'services_page_id'   => array(
			'role'      => 'services',
			'title'     => __( 'Services', 'studio-portfolio' ),
			'titles'    => array( 'Services' ),
			'slug'      => 'services',
			'slugs'     => array( 'services' ),
			'template'  => 'page-templates/page-services.php',
			'shortcode' => '',
		),
		'how_i_work_page_id' => array(
			'role'      => 'how-i-work',
			'title'     => __( 'How I Work', 'studio-portfolio' ),
			'titles'    => array( 'How I Work', 'How We Work', 'My Creative Process' ),
			'slug'      => 'how-i-work',
			'slugs'     => array( 'how-i-work', 'how-we-work', 'my-creative-process', 'process' ),
			'template'  => 'page-templates/page-how-i-work.php',
			'shortcode' => '[studio_how_i_work]',
		),
		'contact_page_id'    => array(
			'role'      => 'contact',
			'title'     => __( 'Contact', 'studio-portfolio' ),
			'titles'    => array( 'Contact' ),
			'slug'      => 'contact',
			'slugs'     => array( 'contact' ),
			'template'  => 'page-templates/page-contact.php',
			'shortcode' => '[studio_contact]',
		),
		'schedule_page_id'   => array(
			'role'      => 'schedule',
			'title'     => __( 'Start a Project', 'studio-portfolio' ),
			'titles'    => array( 'Start a Project', 'Schedule Meeting' ),
			'slug'      => 'start-a-project',
			'slugs'     => array( 'start-a-project', 'schedule-meeting' ),
			'template'  => 'page-templates/page-schedule-meeting.php',
			'shortcode' => '',
		),
	);
}

/**
 * Find a published page by slug aliases or titles.
 *
 * @param array $slugs  Slug aliases.
 * @param array $titles Title aliases.
 * @param array $exclude_ids Page IDs to skip.
 * @return int
 */
function studio_find_page_by_aliases( $slugs = array(), $titles = array(), $exclude_ids = array() ) {
	$exclude_ids = array_filter( array_map( 'intval', (array) $exclude_ids ) );

	foreach ( (array) $slugs as $slug ) {
		$page = get_page_by_path( $slug );
		if ( $page && 'publish' === $page->post_status && ! in_array( (int) $page->ID, $exclude_ids, true ) ) {
			return (int) $page->ID;
		}
	}

	foreach ( (array) $titles as $title ) {
		$found = get_posts(
			array(
				'post_type'      => 'page',
				'title'          => $title,
				'post_status'    => 'publish',
				'posts_per_page' => 5,
			)
		);
		foreach ( $found as $page ) {
			if ( ! in_array( (int) $page->ID, $exclude_ids, true ) ) {
				return (int) $page->ID;
			}
		}
	}

	return 0;
}

/**
 * IDs already claimed by other page roles.
 *
 * @param string $except_mod Theme mod key to skip.
 * @return array
 */
function studio_claimed_page_ids( $except_mod = '' ) {
	$claimed = array();
	$home_id = (int) get_option( 'page_on_front' );
	if ( $home_id ) {
		$claimed[] = $home_id;
	}

	foreach ( array_keys( studio_get_page_role_defs() ) as $key ) {
		if ( $key === $except_mod ) {
			continue;
		}
		$id = (int) get_theme_mod( 'studio_' . $key, 0 );
		if ( $id ) {
			$claimed[] = $id;
		}
	}

	return array_values( array_unique( array_filter( $claimed ) ) );
}

/**
 * Turn off an empty Elementor canvas so theme templates can render.
 *
 * @param int $page_id Page ID.
 */
function studio_strip_empty_elementor( $page_id ) {
	$page_id = (int) $page_id;
	if ( ! $page_id ) {
		return;
	}

	$data = get_post_meta( $page_id, '_elementor_data', true );
	$empty = ( '' === $data || '[]' === $data || 'null' === $data || empty( $data ) );

	if ( ! $empty && is_string( $data ) ) {
		$decoded = json_decode( $data, true );
		if ( is_array( $decoded ) ) {
			$json = wp_json_encode( $decoded );
			$empty = ( false === strpos( $json, '"widgetType"' ) && false === strpos( $json, '"shortcode"' ) );
		}
	}

	if ( $empty ) {
		delete_post_meta( $page_id, '_elementor_edit_mode' );
		delete_post_meta( $page_id, '_elementor_template_type' );
		delete_post_meta( $page_id, '_elementor_data' );
	}
}

/**
 * Detect which theme role a page belongs to.
 *
 * @param int $page_id Page ID.
 * @return string Role slug or empty.
 */
function studio_detect_page_role( $page_id ) {
	$page_id = (int) $page_id;
	if ( ! $page_id ) {
		return '';
	}

	$slug     = (string) get_post_field( 'post_name', $page_id );
	$title    = (string) get_the_title( $page_id );
	$template = (string) get_post_meta( $page_id, '_wp_page_template', true );
	$counts   = array();

	foreach ( studio_get_page_role_defs() as $key => $def ) {
		$assigned = (int) get_theme_mod( 'studio_' . $key, 0 );
		if ( $assigned === $page_id ) {
			$counts[ $def['role'] ] = ( $counts[ $def['role'] ] ?? 0 ) + 3;
		}
		if ( $slug && in_array( $slug, $def['slugs'], true ) ) {
			$counts[ $def['role'] ] = ( $counts[ $def['role'] ] ?? 0 ) + 10;
		}
		if ( $template && $template === $def['template'] ) {
			$counts[ $def['role'] ] = ( $counts[ $def['role'] ] ?? 0 ) + 4;
		}
		if ( $title && in_array( $title, $def['titles'], true ) ) {
			$counts[ $def['role'] ] = ( $counts[ $def['role'] ] ?? 0 ) + 2;
		}
	}

	if ( empty( $counts ) ) {
		return '';
	}

	arsort( $counts );
	$roles = array_keys( $counts );
	return (string) $roles[0];
}

/**
 * Map a role to its PHP template file.
 *
 * @param string $role Role.
 * @return string Relative template path.
 */
function studio_template_for_role( $role ) {
	foreach ( studio_get_page_role_defs() as $def ) {
		if ( $def['role'] === $role ) {
			return $def['template'];
		}
	}
	return '';
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
	$claimed = studio_claimed_page_ids( $key );

	if ( $page_id && 'publish' === get_post_status( $page_id ) && ! in_array( $page_id, $claimed, true ) ) {
		return $page_id;
	}

	$templates = studio_get_page_template_map();
	if ( isset( $templates[ $key ] ) ) {
		$page_id = studio_find_page_by_template( $templates[ $key ] );
		if ( $page_id && ! in_array( $page_id, $claimed, true ) ) {
			set_theme_mod( 'studio_' . $key, $page_id );
			return $page_id;
		}
	}

	$defs = studio_get_page_role_defs();
	if ( isset( $defs[ $key ] ) ) {
		$page_id = studio_find_page_by_aliases( $defs[ $key ]['slugs'], $defs[ $key ]['titles'], $claimed );
		if ( $page_id ) {
			set_theme_mod( 'studio_' . $key, $page_id );
			update_post_meta( $page_id, '_wp_page_template', $defs[ $key ]['template'] );
			return $page_id;
		}
	}

	$slugs = studio_get_page_slug_map();
	if ( isset( $slugs[ $key ] ) ) {
		$page = get_page_by_path( $slugs[ $key ] );
		if ( $page && 'publish' === $page->post_status && ! in_array( (int) $page->ID, $claimed, true ) ) {
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
	$defs = studio_get_page_role_defs();

	foreach ( $defs as $mod => $data ) {
		$claimed = studio_claimed_page_ids( $mod );
		$page_id = (int) studio_get_option( $mod, 0 );

		if ( $page_id && in_array( $page_id, $claimed, true ) ) {
			$page_id = 0;
		}

		if ( $page_id && 'publish' !== get_post_status( $page_id ) ) {
			$page_id = 0;
		}

		if ( ! $page_id ) {
			$page_id = studio_find_page_by_aliases( $data['slugs'], $data['titles'], $claimed );
		}

		if ( ! $page_id ) {
			$page_id = wp_insert_post(
				array(
					'post_title'   => $data['title'],
					'post_name'    => $data['slug'],
					'post_status'  => 'publish',
					'post_type'    => 'page',
					'post_content' => $data['shortcode'],
				),
				true
			);
			if ( is_wp_error( $page_id ) ) {
				continue;
			}
		}

		$page_id = (int) $page_id;
		update_post_meta( $page_id, '_wp_page_template', $data['template'] );
		set_theme_mod( 'studio_' . $mod, $page_id );
		studio_strip_empty_elementor( $page_id );

		$page = get_post( $page_id );
		if ( $page && $data['shortcode'] && false === strpos( (string) $page->post_content, $data['shortcode'] ) ) {
			$new_content = trim( (string) $page->post_content );
			$is_empty_builder = function_exists( 'studio_is_elementor_page' ) && studio_is_elementor_page( $page_id );
			if ( '' === $new_content || $is_empty_builder ) {
				wp_update_post(
					array(
						'ID'           => $page_id,
						'post_content' => $data['shortcode'],
						'post_status'  => 'publish',
					)
				);
			}
		}
	}

	$portfolio_id = (int) studio_get_option( 'portfolio_page_id', 0 );
	if ( $portfolio_id ) {
		set_theme_mod( 'studio_work_page_id', $portfolio_id );
	}

	studio_ensure_home_page();
	if ( function_exists( 'studio_disable_portfolio_hub_pages' ) ) {
		studio_disable_portfolio_hub_pages();
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
function studio_pages_need_repair() {
	$about = (int) get_theme_mod( 'studio_about_page_id', 0 );
	$hiw   = (int) get_theme_mod( 'studio_how_i_work_page_id', 0 );
	$port  = (int) get_theme_mod( 'studio_portfolio_page_id', 0 );

	if ( ! $about || ! $hiw ) {
		return true;
	}
	if ( $about === $hiw || $about === $port || $hiw === $port ) {
		return true;
	}
	if ( 'publish' !== get_post_status( $about ) || 'publish' !== get_post_status( $hiw ) ) {
		return true;
	}
	if ( 'page-templates/page-about.php' !== get_post_meta( $about, '_wp_page_template', true ) ) {
		return true;
	}
	if ( 'page-templates/page-how-i-work.php' !== get_post_meta( $hiw, '_wp_page_template', true ) ) {
		return true;
	}

	return false;
}

/**
 * Auto-repair pages after theme update (without requiring re-activation).
 */
function studio_maybe_setup_site_pages() {
	$version_ok = get_option( 'studio_pages_setup_version' ) === STUDIO_PORTFOLIO_VERSION;
	if ( $version_ok && ! studio_pages_need_repair() ) {
		return;
	}

	studio_create_default_pages( true );
	flush_rewrite_rules( false );
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

	$required = array( 'portfolio_page_id', 'about_page_id', 'services_page_id', 'how_i_work_page_id', 'contact_page_id' );
	foreach ( $required as $key ) {
		if ( studio_resolve_page_id( $key ) ) {
			continue;
		}
		?>
		<div class="notice notice-warning">
			<p>
				<strong><?php esc_html_e( 'Studio Portfolio:', 'studio-portfolio' ); ?></strong>
				<?php esc_html_e( 'About Me and How I Work need their own pages. Click Repair, then save Permalinks.', 'studio-portfolio' ); ?>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=studio-portfolio-demo' ) ); ?>"><?php esc_html_e( 'Repair pages →', 'studio-portfolio' ); ?></a>
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

function studio_get_how_i_work_blocks() {
	$defaults = studio_get_hiw_defaults();
	$blocks   = array();

	foreach ( $defaults as $key => $data ) {
		$title    = studio_get_option( "hiw_{$key}_title", $data[0] );
		$subtitle = studio_get_option( "hiw_{$key}_subtitle", $data[2] );
		$content  = studio_get_option( "hiw_{$key}_content", $data[3] );

		// Ignore leftover v2.4 keys that described software instead of the process.
		$legacy = array( 'Software I Use', 'How I Create Design', 'How I Build Innovation', 'How I Redesign Old Design', "How I Read My Client's Mind", 'Design & Presentation Setup' );
		if ( in_array( $title, $legacy, true ) ) {
			$title    = $data[0];
			$subtitle = $data[2];
			$content  = $data[3];
		}

		$blocks[] = array(
			'step'     => studio_get_option( "hiw_{$key}_step", $data[1] ),
			'title'    => $title ? $title : $data[0],
			'subtitle' => $subtitle ? $subtitle : $data[2],
			'icon'     => $data[1],
			'content'  => $content ? $content : $data[3],
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
		"Complete brand systems for food, retail, and corporate clients\nPrint, packaging, and signage that stay consistent with the identity\nFounded and led creative businesses\nWorked with businesses across multiple industries"
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

	$role = studio_detect_page_role( $page_id );
	if ( $role ) {
		$relative = studio_template_for_role( $role );
		if ( $relative ) {
			$file = STUDIO_PORTFOLIO_DIR . '/' . $relative;
			if ( file_exists( $file ) ) {
				return $file;
			}
		}
	}

	return $template;
}
add_filter( 'template_include', 'studio_force_page_templates', PHP_INT_MAX );

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
