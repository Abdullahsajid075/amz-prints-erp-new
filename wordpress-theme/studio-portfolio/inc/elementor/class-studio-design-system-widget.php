<?php
/**
 * Elementor Design System widget — fully editable
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Studio_Design_System_Widget extends Studio_Portfolio_Elementor_Widget_Base {

	public function get_name() {
		return 'studio_design_system';
	}

	public function get_title() {
		return __( 'Design System', 'studio-portfolio' );
	}

	public function get_icon() {
		return 'eicon-palette';
	}

	protected function register_controls() {
		$this->start_controls_section(
			'header_section',
			array(
				'label' => __( 'Section Header', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'ds_label',
			array(
				'label'   => __( 'Section Label', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Design System', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'ds_title',
			array(
				'label'   => __( 'Section Title', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Built with intention', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'ds_description',
			array(
				'label'   => __( 'Section Description', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXTAREA,
				'default' => __( 'Green, black, white, and light — my personal brand design system.', 'studio-portfolio' ),
				'rows'    => 3,
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'palette_section',
			array(
				'label' => __( 'Color Palette', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'show_palette',
			array(
				'label'   => __( 'Show Color Palette', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::SWITCHER,
				'default' => 'yes',
			)
		);

		$color_repeater = new \Elementor\Repeater();
		$color_repeater->add_control(
			'name',
			array(
				'label'   => __( 'Color Name', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Green', 'studio-portfolio' ),
			)
		);
		$color_repeater->add_control(
			'hex',
			array(
				'label'   => __( 'Hex Color', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::COLOR,
				'default' => '#059669',
			)
		);

		$this->add_control(
			'colors',
			array(
				'label'       => __( 'Colors', 'studio-portfolio' ),
				'type'        => \Elementor\Controls_Manager::REPEATER,
				'fields'      => $color_repeater->get_controls(),
				'default'     => array(
					array( 'name' => __( 'Black', 'studio-portfolio' ), 'hex' => '#1A1A1A' ),
					array( 'name' => __( 'Green', 'studio-portfolio' ), 'hex' => '#059669' ),
					array( 'name' => __( 'Light', 'studio-portfolio' ), 'hex' => '#F7FAF7' ),
					array( 'name' => __( 'White', 'studio-portfolio' ), 'hex' => '#FFFFFF' ),
				),
				'title_field' => '{{{ name }}}',
				'condition'   => array( 'show_palette' => 'yes' ),
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'components_section',
			array(
				'label' => __( 'Components', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'show_components',
			array(
				'label'   => __( 'Show Button Showcase', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::SWITCHER,
				'default' => 'yes',
			)
		);

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();

		$this->render_template_part(
			'design-system',
			array(
				'ds_label'        => $settings['ds_label'],
				'ds_title'        => $settings['ds_title'],
				'ds_description'  => $settings['ds_description'],
				'show_palette'    => 'yes' === $settings['show_palette'],
				'colors'          => $this->map_colors( $settings['colors'] ),
				'show_components' => 'yes' === $settings['show_components'],
			)
		);
	}
}
