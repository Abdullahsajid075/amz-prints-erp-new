<?php
/**
 * Elementor widgets for theme sections
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Base widget helper.
 */
abstract class Studio_Portfolio_Elementor_Widget_Base extends \Elementor\Widget_Base {

	public function get_categories() {
		return array( 'studio-portfolio' );
	}

	/**
	 * Render a template part with optional overrides.
	 *
	 * @param string $slug Template part slug.
	 * @param array  $args Optional template arguments.
	 */
	protected function render_template_part( $slug, $args = array() ) {
		get_template_part( 'template-parts/' . $slug, null, $args );
	}

	/**
	 * Parse textarea lines into a trimmed array.
	 *
	 * @param string $value Multiline string.
	 * @return array
	 */
	protected function parse_textarea_lines( $value ) {
		if ( empty( $value ) ) {
			return array();
		}
		return array_values( array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', $value ) ) ) );
	}

	/**
	 * Get URL from Elementor URL control value.
	 *
	 * @param array|string $setting URL control value.
	 * @return string
	 */
	protected function get_url_from_setting( $setting ) {
		if ( is_array( $setting ) && ! empty( $setting['url'] ) ) {
			return $setting['url'];
		}
		return is_string( $setting ) ? $setting : '#';
	}

	/**
	 * Add standard section header controls.
	 *
	 * @param string $prefix  Setting prefix (e.g. about, contact).
	 * @param array  $defaults Default values keyed by suffix.
	 */
	protected function add_section_header_controls( $prefix, $defaults = array() ) {
		$this->add_control(
			"{$prefix}_label",
			array(
				'label'   => __( 'Section Label', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => $defaults['label'] ?? '',
			)
		);

		$this->add_control(
			"{$prefix}_title",
			array(
				'label'   => __( 'Section Title', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => $defaults['title'] ?? '',
			)
		);

		if ( isset( $defaults['description'] ) ) {
			$this->add_control(
				"{$prefix}_description",
				array(
					'label'   => __( 'Section Description', 'studio-portfolio' ),
					'type'    => \Elementor\Controls_Manager::TEXTAREA,
					'default' => $defaults['description'],
					'rows'    => 3,
				)
			);
		}
	}

	/**
	 * Map repeater stats to template format.
	 *
	 * @param array $items Repeater items.
	 * @return array
	 */
	protected function map_stats( $items ) {
		$stats = array();
		foreach ( (array) $items as $item ) {
			if ( empty( $item['value'] ) && empty( $item['label'] ) ) {
				continue;
			}
			$stats[] = array(
				'value' => $item['value'] ?? '',
				'label' => $item['label'] ?? '',
			);
		}
		return $stats;
	}

	/**
	 * Map repeater story blocks.
	 *
	 * @param array $items Repeater items.
	 * @return array
	 */
	protected function map_story_blocks( $items ) {
		$blocks = array();
		foreach ( (array) $items as $item ) {
			if ( empty( $item['content'] ) ) {
				continue;
			}
			$blocks[] = array(
				'icon'    => $item['icon'] ?? '📝',
				'title'   => $item['title'] ?? '',
				'content' => $item['content'] ?? '',
			);
		}
		return $blocks;
	}

	/**
	 * Map repeater services.
	 *
	 * @param array $items Repeater items.
	 * @return array
	 */
	protected function map_services( $items ) {
		$services = array();
		foreach ( (array) $items as $item ) {
			if ( empty( $item['title'] ) && empty( $item['desc'] ) ) {
				continue;
			}
			$services[] = array(
				'icon'  => $item['icon'] ?? '🎨',
				'title' => $item['title'] ?? '',
				'desc'  => $item['desc'] ?? '',
			);
		}
		return $services;
	}

	/**
	 * Map repeater social links.
	 *
	 * @param array $items Repeater items.
	 * @return array
	 */
	protected function map_social_links( $items ) {
		$links = array();
		foreach ( (array) $items as $item ) {
			if ( empty( $item['label'] ) || empty( $item['url']['url'] ) ) {
				continue;
			}
			$links[] = array(
				'label' => $item['label'],
				'url'   => $item['url']['url'],
			);
		}
		return $links;
	}

	/**
	 * Map repeater color swatches.
	 *
	 * @param array $items Repeater items.
	 * @return array
	 */
	protected function map_colors( $items ) {
		$colors = array();
		foreach ( (array) $items as $item ) {
			if ( empty( $item['hex'] ) ) {
				continue;
			}
			$colors[] = array(
				'name' => $item['name'] ?? '',
				'hex'  => $item['hex'],
				'bg'   => $item['hex'],
			);
		}
		return $colors;
	}

	/**
	 * Get portfolio category options for select control.
	 *
	 * @return array
	 */
	protected function get_portfolio_category_options() {
		$options = array( '' => __( 'All Categories', 'studio-portfolio' ) );
		$terms   = get_terms(
			array(
				'taxonomy'   => 'portfolio_category',
				'hide_empty' => false,
			)
		);
		if ( ! is_wp_error( $terms ) ) {
			foreach ( $terms as $term ) {
				$options[ $term->slug ] = $term->name;
			}
		}
		return $options;
	}
}

require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-hero-widget.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-marquee-widget.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-portfolio-widget.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-about-widget.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-contact-widget.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-design-system-widget.php';
require_once STUDIO_PORTFOLIO_DIR . '/inc/elementor/class-studio-floating-contact-widget.php';

/**
 * Register widgets with Elementor.
 *
 * @param \Elementor\Widgets_Manager $widgets_manager Widgets manager.
 */
function studio_register_elementor_widgets( $widgets_manager ) {
	$widgets_manager->register( new Studio_Hero_Widget() );
	$widgets_manager->register( new Studio_Marquee_Widget() );
	$widgets_manager->register( new Studio_Portfolio_Widget() );
	$widgets_manager->register( new Studio_About_Widget() );
	$widgets_manager->register( new Studio_Contact_Widget() );
	$widgets_manager->register( new Studio_Design_System_Widget() );
	$widgets_manager->register( new Studio_Floating_Contact_Widget() );
}
add_action( 'elementor/widgets/register', 'studio_register_elementor_widgets' );
