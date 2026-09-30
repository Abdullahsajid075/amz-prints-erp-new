<?php
/**
 * Elementor Marquee widget
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Studio_Marquee_Widget extends Studio_Portfolio_Elementor_Widget_Base {

	public function get_name() {
		return 'studio_marquee';
	}

	public function get_title() {
		return __( 'Marquee Banner', 'studio-portfolio' );
	}

	public function get_icon() {
		return 'eicon-animation-text';
	}

	protected function register_controls() {
		$this->start_controls_section(
			'content_section',
			array(
				'label' => __( 'Content', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'marquee_items',
			array(
				'label'       => __( 'Marquee Items', 'studio-portfolio' ),
				'type'        => \Elementor\Controls_Manager::TEXTAREA,
				'default'     => "Brand Identity\nUI/UX Design\nDesign Systems\nPackaging\nArt Direction\nMotion Design\nTypography\nVisual Identity",
				'description' => __( 'One item per line.', 'studio-portfolio' ),
				'rows'        => 8,
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'style_section',
			array(
				'label' => __( 'Colors', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_control(
			'text_color',
			array(
				'label'   => __( 'Text Color', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::COLOR,
				'default' => '#B8B8B8',
				'selectors' => array(
					'{{WRAPPER}} .marquee-item' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'sep_color',
			array(
				'label'   => __( 'Separator (✦) Color', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::COLOR,
				'default' => '#059669',
				'selectors' => array(
					'{{WRAPPER}} .marquee-sep' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'bg_color',
			array(
				'label'   => __( 'Background Color', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::COLOR,
				'default' => '#F7FAF7',
				'selectors' => array(
					'{{WRAPPER}} .marquee-section' => 'background-color: {{VALUE}};',
				),
			)
		);

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();
		$items    = $this->parse_textarea_lines( $settings['marquee_items'] );

		if ( empty( $items ) ) {
			return;
		}

		$this->render_template_part(
			'marquee',
			array(
				'items'      => $items,
				'text_color' => $settings['text_color'],
				'sep_color'  => $settings['sep_color'],
				'bg_color'   => $settings['bg_color'],
			)
		);
	}
}
