<?php
/**
 * Portfolio hub — 5 mega-menu sub-pages + auto-display of admin projects
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Definition of the 5 Portfolio mega-menu pages.
 *
 * @return array
 */
function studio_get_portfolio_hub_defs() {
	return array(
		array(
			'slug'       => 'brand-identity',
			'title'      => __( 'Brand Identity', 'studio-portfolio' ),
			'icon'       => '🎨',
			'terms'      => array( 'Branding', 'Logo Design' ),
			'excerpt'    => __( 'Logos, brand guidelines, color systems and visual identity kits.', 'studio-portfolio' ),
			'content'    => "<p>I build complete brand identities — from the first logo sketch to a full visual system your team can actually use.</p>\n<ul>\n<li>Logo Design</li>\n<li>Brand Guidelines</li>\n<li>Color &amp; Typography Systems</li>\n<li>Brand Kits</li>\n<li>Visual Identity</li>\n</ul>\n<p><em>Edit this text in Pages → Brand Identity. Projects in Branding / Logo Design appear below automatically.</em></p>",
			'image'      => 'https://picsum.photos/seed/hub-brand/1200/800',
		),
		array(
			'slug'       => 'graphic-design',
			'title'      => __( 'Graphic Design', 'studio-portfolio' ),
			'icon'       => '✏️',
			'terms'      => array( 'Graphic Design' ),
			'excerpt'    => __( 'Marketing materials, posters, presentations and campaign creatives.', 'studio-portfolio' ),
			'content'    => "<p>Campaign visuals, print-ready marketing and presentation design that looks premium on every platform.</p>\n<ul>\n<li>Brochures &amp; Flyers</li>\n<li>Posters &amp; Banners</li>\n<li>Social Media Designs</li>\n<li>Presentations &amp; Corporate Profiles</li>\n</ul>\n<p><em>Edit this page anytime in WordPress. New Graphic Design projects show here automatically.</em></p>",
			'image'      => 'https://picsum.photos/seed/hub-graphic/1200/800',
		),
		array(
			'slug'       => 'print-packaging',
			'title'      => __( 'Print & Packaging', 'studio-portfolio' ),
			'icon'       => '📦',
			'terms'      => array( 'Print Design', 'Packaging' ),
			'excerpt'    => __( 'Business stationery, catalogues, product packaging and labels.', 'studio-portfolio' ),
			'content'    => "<p>Print and packaging that feels tactile, branded and ready for production.</p>\n<ul>\n<li>Business Cards &amp; Letterheads</li>\n<li>Catalogues &amp; Magazines</li>\n<li>Product Packaging &amp; Pouches</li>\n<li>Labels &amp; Stickers</li>\n</ul>\n<p><em>Assign a project to Print Design or Packaging and it appears on this page.</em></p>",
			'image'      => 'https://picsum.photos/seed/hub-packaging/1200/800',
		),
		array(
			'slug'       => 'digital-social',
			'title'      => __( 'Digital & Social', 'studio-portfolio' ),
			'icon'       => '📱',
			'terms'      => array( 'UI/UX Design', 'Social Media' ),
			'excerpt'    => __( 'Social posts, web UI, landing pages, ads and email templates.', 'studio-portfolio' ),
			'content'    => "<p>Digital and social design for brands that live online — posts, ads, UI and landing pages.</p>\n<ul>\n<li>Social Media Posts &amp; Campaigns</li>\n<li>Website &amp; Landing Page UI</li>\n<li>App UI Design</li>\n<li>Digital Ads &amp; Email Templates</li>\n</ul>\n<p><em>Projects tagged UI/UX Design or Social Media land here automatically.</em></p>",
			'image'      => 'https://picsum.photos/seed/hub-digital/1200/800',
		),
		array(
			'slug'       => 'corporate-signage',
			'title'      => __( 'Corporate & Signage', 'studio-portfolio' ),
			'icon'       => '🪧',
			'terms'      => array( 'Corporate Branding', 'Signage' ),
			'excerpt'    => __( 'Company profiles, stationery, shop branding and outdoor advertising.', 'studio-portfolio' ),
			'content'    => "<p>Corporate branding and large-format work — from company profiles to shop fronts and vehicle graphics.</p>\n<ul>\n<li>Company Profiles &amp; Presentations</li>\n<li>Corporate Stationery</li>\n<li>Sign Boards &amp; Shop Branding</li>\n<li>Vehicle Graphics &amp; Exhibitions</li>\n</ul>\n<p><em>Edit copy, title and featured image in Pages → Corporate &amp; Signage.</em></p>",
			'image'      => 'https://picsum.photos/seed/hub-signage/1200/800',
		),
	);
}

/**
 * Create / repair the 5 portfolio mega-menu pages as children of Portfolio.
 */
function studio_create_portfolio_hub_pages() {
	$parent_id = studio_resolve_page_id( 'portfolio_page_id' );
	if ( ! $parent_id ) {
		return;
	}

	foreach ( studio_get_portfolio_hub_defs() as $def ) {
		foreach ( $def['terms'] as $term_name ) {
			if ( ! term_exists( $term_name, 'portfolio_category' ) ) {
				wp_insert_term( $term_name, 'portfolio_category' );
			}
		}

		$page = get_page_by_path( $def['slug'] );
		if ( ! $page ) {
			$page_id = wp_insert_post(
				array(
					'post_title'   => $def['title'],
					'post_name'    => $def['slug'],
					'post_status'  => 'publish',
					'post_type'    => 'page',
					'post_parent'  => $parent_id,
					'post_excerpt' => $def['excerpt'],
					'post_content' => $def['content'],
					'menu_order'   => 0,
				),
				true
			);
			if ( is_wp_error( $page_id ) ) {
				continue;
			}
		} else {
			$page_id = (int) $page->ID;
			wp_update_post(
				array(
					'ID'          => $page_id,
					'post_parent' => $parent_id,
					'post_status' => 'publish',
				)
			);
			if ( empty( $page->post_content ) ) {
				wp_update_post(
					array(
						'ID'           => $page_id,
						'post_content' => $def['content'],
						'post_excerpt' => $def['excerpt'],
					)
				);
			}
		}

		update_post_meta( $page_id, '_wp_page_template', 'page-templates/page-portfolio-category.php' );
		update_post_meta( $page_id, '_studio_hub_page', '1' );
		update_post_meta( $page_id, '_studio_hub_terms', $def['terms'] );
		update_post_meta( $page_id, '_studio_hub_icon', $def['icon'] );

		if ( ! has_post_thumbnail( $page_id ) && function_exists( 'studio_sideload_image' ) ) {
			$img_id = studio_sideload_image( $def['image'], $page_id );
			if ( $img_id ) {
				set_post_thumbnail( $page_id, $img_id );
			}
		}
	}
}

/**
 * Published hub pages for the mega menu.
 *
 * @return array
 */
function studio_get_portfolio_hub_pages() {
	$parent_id = studio_resolve_page_id( 'portfolio_page_id' );
	$query     = new WP_Query(
		array(
			'post_type'      => 'page',
			'post_status'    => 'publish',
			'post_parent'    => $parent_id ? $parent_id : 0,
			'meta_key'       => '_studio_hub_page',
			'meta_value'     => '1',
			'orderby'        => 'menu_order title',
			'order'          => 'ASC',
			'posts_per_page' => 8,
		)
	);

	$pages = array();
	$defs  = studio_get_portfolio_hub_defs();
	$by_slug = array();
	foreach ( $defs as $def ) {
		$by_slug[ $def['slug'] ] = $def;
	}

	if ( $query->have_posts() ) {
		foreach ( $query->posts as $page ) {
			$def = isset( $by_slug[ $page->post_name ] ) ? $by_slug[ $page->post_name ] : array();
			$pages[] = array(
				'ID'      => $page->ID,
				'title'   => get_the_title( $page ),
				'url'     => get_permalink( $page ),
				'excerpt' => $page->post_excerpt ? $page->post_excerpt : wp_trim_words( wp_strip_all_tags( $page->post_content ), 16 ),
				'icon'    => get_post_meta( $page->ID, '_studio_hub_icon', true ) ?: ( $def['icon'] ?? '✦' ),
				'image'   => get_the_post_thumbnail_url( $page->ID, 'medium_large' ),
			);
		}
	}

	wp_reset_postdata();

	if ( empty( $pages ) ) {
		foreach ( $defs as $def ) {
			$pages[] = array(
				'ID'      => 0,
				'title'   => $def['title'],
				'url'     => home_url( '/' . $def['slug'] . '/' ),
				'excerpt' => $def['excerpt'],
				'icon'    => $def['icon'],
				'image'   => '',
			);
		}
	}

	return $pages;
}

/**
 * Term names stored on a hub page.
 *
 * @param int $page_id Page ID.
 * @return array
 */
function studio_get_hub_page_terms( $page_id ) {
	$terms = get_post_meta( $page_id, '_studio_hub_terms', true );
	if ( is_array( $terms ) && ! empty( $terms ) ) {
		return $terms;
	}

	foreach ( studio_get_portfolio_hub_defs() as $def ) {
		$page = get_post( $page_id );
		if ( $page && $page->post_name === $def['slug'] ) {
			return $def['terms'];
		}
	}

	return array();
}
