<?php
/**
 * Theme helper functions
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get theme mod value.
 *
 * @param string $key     Setting key without studio_ prefix.
 * @param mixed  $default Default value.
 * @return mixed
 */
function studio_get_option( $key, $default = '' ) {
	$value = get_theme_mod( 'studio_' . $key, null );
	if ( null === $value || ( is_string( $value ) && '' === trim( $value ) ) ) {
		return $default;
	}
	return $value;
}

/**
 * Resolve template argument with Customizer fallback.
 *
 * @param array  $args        Template args from Elementor widget.
 * @param string $key         Arg key.
 * @param string $option_key  Customizer key without studio_ prefix.
 * @param mixed  $default     Default when neither arg nor option is set.
 * @return mixed
 */
function studio_template_arg( $args, $key, $option_key = '', $default = '' ) {
	if ( is_array( $args ) && array_key_exists( $key, $args ) && '' !== $args[ $key ] && null !== $args[ $key ] ) {
		return $args[ $key ];
	}
	if ( $option_key ) {
		return studio_get_option( $option_key, $default );
	}
	return $default;
}

/**
 * Get textarea setting as trimmed lines.
 *
 * @param string $key     Setting key.
 * @param string $default Default multiline string.
 * @return array
 */
function studio_get_lines( $key, $default = '' ) {
	$value = studio_get_option( $key, $default );
	if ( empty( $value ) ) {
		return array();
	}
	return array_values( array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', $value ) ) ) );
}

/**
 * Get configured services.
 *
 * @param array $args Optional Elementor overrides.
 * @return array
 */
function studio_get_services( $args = array() ) {
	if ( ! empty( $args['services'] ) && is_array( $args['services'] ) ) {
		return $args['services'];
	}

	$services = array();
	for ( $i = 1; $i <= 4; $i++ ) {
		$title = studio_get_option( "service_{$i}_title", '' );
		$desc  = studio_get_option( "service_{$i}_desc", '' );
		$icon  = studio_get_option( "service_{$i}_icon", '🎨' );
		if ( $title || $desc ) {
			$services[] = array(
				'icon'  => $icon,
				'title' => $title,
				'desc'  => $desc,
			);
		}
	}
	if ( empty( $services ) ) {
		$services = array(
			array( 'icon' => '🎨', 'title' => __( 'Brand Identity', 'studio-portfolio' ), 'desc' => __( 'Logo, visual identity, brand guidelines, brand kits.', 'studio-portfolio' ) ),
			array( 'icon' => '✏️', 'title' => __( 'Graphic Design', 'studio-portfolio' ), 'desc' => __( 'Marketing materials, posters, brochures, presentations.', 'studio-portfolio' ) ),
			array( 'icon' => '📦', 'title' => __( 'Packaging Design', 'studio-portfolio' ), 'desc' => __( 'Boxes, labels, pouches, product packaging.', 'studio-portfolio' ) ),
			array( 'icon' => '🖨️', 'title' => __( 'Print Design', 'studio-portfolio' ), 'desc' => __( 'Business cards, stationery, catalogues, flyers.', 'studio-portfolio' ) ),
		);
	}
	return $services;
}

/**
 * Get marquee items.
 *
 * @return array
 */
function studio_get_marquee_items() {
	$default = "Brand Identity\nLogo Design\nPackaging\nPrint Design\nSocial Media\nCorporate Branding\nSignage\nDigital Design";
	$items   = studio_get_lines( 'marquee_items', $default );
	return apply_filters( 'studio_marquee_items', $items );
}

/**
 * Get social links for footer/contact.
 *
 * @param array $args Optional Elementor overrides.
 * @return array
 */
function studio_get_social_links( $args = array() ) {
	if ( ! empty( $args['social_links'] ) && is_array( $args['social_links'] ) ) {
		return $args['social_links'];
	}

	$links = array();
	for ( $i = 1; $i <= 4; $i++ ) {
		$label = studio_get_option( "social_{$i}_label", '' );
		$url   = studio_get_option( "social_{$i}_url", '' );
		if ( $label && $url ) {
			$links[] = array(
				'label' => $label,
				'url'   => $url,
			);
		}
	}
	if ( empty( $links ) ) {
		$links = array(
			array( 'label' => 'Dribbble', 'url' => '#' ),
			array( 'label' => 'Behance', 'url' => '#' ),
			array( 'label' => 'Instagram', 'url' => '#' ),
			array( 'label' => 'LinkedIn', 'url' => '#' ),
		);
	}
	return $links;
}

/**
 * Get about story blocks.
 *
 * @param array $args Optional Elementor overrides.
 * @return array
 */
function studio_get_about_story_blocks( $args = array() ) {
	if ( ! empty( $args['story_blocks'] ) && is_array( $args['story_blocks'] ) ) {
		return $args['story_blocks'];
	}

	return array(
		array(
			'icon'    => '💼',
			'title'   => studio_get_option( 'about_experience_title', __( 'Experience', 'studio-portfolio' ) ),
			'content' => studio_get_option( 'about_experience', "I work as a brand designer and brand builder — helping businesses look more professional, feel more consistent, and stand out in crowded markets.\n\nFrom identity systems to packaging, print, social, and signage, I design work that is meant to be used in the real world." ),
		),
		array(
			'icon'    => '🧭',
			'title'   => studio_get_option( 'about_education_title', __( 'Design Philosophy', 'studio-portfolio' ) ),
			'content' => studio_get_option( 'about_education', "I don't just design. I build brands.\n\nEvery project starts with the business: audience, goals, competitors, and what the brand needs to communicate. The visuals come after the strategy." ),
		),
		array(
			'icon'    => '🏢',
			'title'   => studio_get_option( 'about_companies_title', __( 'Industries & Businesses', 'studio-portfolio' ) ),
			'content' => studio_get_option( 'about_companies', 'I have worked with businesses across food, retail, hospitality, fashion, corporate, and digital — building identities that work on packaging, signage, stationery, and screens.' ),
		),
		array(
			'icon'    => '🎯',
			'title'   => studio_get_option( 'about_goal_title', __( 'My Role as a Brand Designer', 'studio-portfolio' ) ),
			'content' => studio_get_option( 'about_goal', 'My role is to turn a business into a brand people remember — logo, color, typography, applications, and a system the team can actually use.' ),
		),
		array(
			'icon'    => '🏗️',
			'title'   => studio_get_option( 'about_founded_title', __( 'Companies & Businesses I Have Founded', 'studio-portfolio' ) ),
			'content' => studio_get_option( 'about_founded', 'I have founded and led creative businesses — applying the same brand-building process I use for clients to my own companies.' ),
		),
		array(
			'icon'    => '🚀',
			'title'   => studio_get_option( 'about_struggles_title', __( 'The Journey', 'studio-portfolio' ) ),
			'content' => studio_get_option( 'about_struggles', "Started in graphic design → worked with local businesses → expanded into branding and corporate design → founded and led creative businesses → now helping brands grow through design and strategy." ),
		),
	);
}

/**
 * Get about stats.
 *
 * @param array $args Optional Elementor overrides.
 * @return array
 */
function studio_get_about_stats( $args = array() ) {
	if ( ! empty( $args['stats'] ) && is_array( $args['stats'] ) ) {
		return $args['stats'];
	}

	return array(
		array(
			'value' => studio_get_option( 'stat_projects', '50+' ),
			'label' => studio_get_option( 'stat_projects_label', __( 'Projects', 'studio-portfolio' ) ),
		),
		array(
			'value' => studio_get_option( 'stat_clients', '30+' ),
			'label' => studio_get_option( 'stat_clients_label', __( 'Clients', 'studio-portfolio' ) ),
		),
		array(
			'value' => studio_get_option( 'stat_experience', '5' ),
			'label' => studio_get_option( 'stat_experience_label', __( 'Years Experience', 'studio-portfolio' ) ),
		),
		array(
			'value' => studio_get_option( 'stat_awards', '12' ),
			'label' => studio_get_option( 'stat_awards_label', __( 'Achievements', 'studio-portfolio' ) ),
		),
	);
}

/**
 * Render primary navigation.
 */
function studio_render_nav( $class = 'main-nav' ) {
	$links = array(
		array( studio_get_option( 'nav_home', __( 'Home', 'studio-portfolio' ) ), home_url( '/' ) ),
		array( studio_get_option( 'nav_about', __( 'About', 'studio-portfolio' ) ), studio_get_page_url( 'about_page_id', home_url( '/about-me/' ) ) ),
		array( studio_get_option( 'nav_services', __( 'Services', 'studio-portfolio' ) ), studio_get_page_url( 'services_page_id', home_url( '/services/' ) ) ),
		array( studio_get_option( 'nav_portfolio', __( 'Portfolio', 'studio-portfolio' ) ), studio_get_page_url( 'portfolio_page_id', home_url( '/portfolio/' ) ) ),
		array( studio_get_option( 'nav_how_i_work', __( 'How I Work', 'studio-portfolio' ) ), studio_get_page_url( 'how_i_work_page_id', home_url( '/how-i-work/' ) ) ),
		array( studio_get_option( 'nav_contact', __( 'Contact', 'studio-portfolio' ) ), studio_get_page_url( 'contact_page_id', home_url( '/contact/' ) ) ),
	);
	?>
	<nav class="<?php echo esc_attr( $class ); ?>" aria-label="<?php esc_attr_e( 'Primary', 'studio-portfolio' ); ?>">
		<?php foreach ( $links as $link ) : ?>
			<a href="<?php echo esc_url( $link[1] ); ?>"><?php echo esc_html( $link[0] ); ?></a>
		<?php endforeach; ?>
	</nav>
	<?php
}

/**
 * Primary conversion URL — Contact form ("Start a Project").
 *
 * @return string
 */
function studio_get_start_project_url() {
	return studio_get_page_url( 'contact_page_id', studio_get_page_url( 'schedule_page_id', home_url( '/contact/' ) ) );
}

/**
 * Check if a homepage section is enabled.
 *
 * @param string $section Section key.
 * @return bool
 */
function studio_section_enabled( $section ) {
	return (bool) get_theme_mod( 'studio_show_' . $section, true );
}

/**
 * Get WhatsApp chat URL with optional pre-filled message.
 *
 * @param string $number  Phone with country code, digits only.
 * @param string $message Prefilled message.
 * @return string
 */
function studio_get_whatsapp_url( $number, $message = '' ) {
	$number = preg_replace( '/\D+/', '', $number );
	if ( empty( $number ) ) {
		return '';
	}
	$url = 'https://wa.me/' . $number;
	if ( $message ) {
		$url .= '?text=' . rawurlencode( $message );
	}
	return $url;
}

/**
 * Get portfolio item link — opens PDF in new tab when uploaded.
 *
 * @param int $post_id Post ID.
 * @return array{url:string,target:string,is_pdf:bool}
 */
function studio_get_portfolio_link( $post_id ) {
	$pdf_id = absint( get_post_meta( $post_id, '_portfolio_pdf', true ) );
	if ( $pdf_id ) {
		$url = wp_get_attachment_url( $pdf_id );
		if ( $url ) {
			return array(
				'url'    => $url,
				'target' => '_blank',
				'is_pdf' => true,
			);
		}
	}

	return array(
		'url'    => get_permalink( $post_id ),
		'target' => '_self',
		'is_pdf' => false,
	);
}

/**
 * Get best thumbnail attachment ID for a portfolio item.
 *
 * @param int    $post_id Post ID.
 * @param string $context Display context: default|home.
 * @return int
 */
function studio_get_portfolio_thumbnail_id( $post_id, $context = 'default' ) {
	if ( 'home' === $context ) {
		$home_image = absint( get_post_meta( $post_id, '_portfolio_home_image', true ) );
		if ( $home_image ) {
			return $home_image;
		}
	}

	if ( has_post_thumbnail( $post_id ) ) {
		return (int) get_post_thumbnail_id( $post_id );
	}

	$pdf_cover = absint( get_post_meta( $post_id, '_portfolio_pdf_cover', true ) );
	if ( $pdf_cover ) {
		return $pdf_cover;
	}

	$gallery = get_post_meta( $post_id, '_portfolio_gallery', true );
	if ( is_array( $gallery ) && ! empty( $gallery[0] ) ) {
		return (int) $gallery[0];
	}

	return 0;
}

/**
 * Get portfolio card description for homepage.
 *
 * @param int $post_id Post ID.
 * @return string
 */
function studio_get_portfolio_home_description( $post_id ) {
	$home_desc = get_post_meta( $post_id, '_portfolio_home_description', true );
	if ( $home_desc ) {
		return $home_desc;
	}
	return get_the_excerpt( $post_id );
}

/**
 * Get all portfolio category names for a post.
 *
 * @param int $post_id Post ID.
 * @return array
 */
function studio_get_portfolio_categories( $post_id ) {
	$terms = get_the_terms( $post_id, 'portfolio_category' );
	if ( ! $terms || is_wp_error( $terms ) ) {
		return array();
	}
	return wp_list_pluck( $terms, 'name' );
}

/**
 * Get portfolio category slugs for filtering.
 *
 * @param int $post_id Post ID.
 * @return array
 */
function studio_get_portfolio_category_slugs( $post_id ) {
	$terms = get_the_terms( $post_id, 'portfolio_category' );
	if ( ! $terms || is_wp_error( $terms ) ) {
		return array();
	}
	return wp_list_pluck( $terms, 'slug' );
}
