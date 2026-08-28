<?php
/**
 * Elementor Portfolio widget — fully editable
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Studio_Portfolio_Widget extends Studio_Portfolio_Elementor_Widget_Base {

	public function get_name() {
		return 'studio_portfolio';
	}

	public function get_title() {
		return __( 'Portfolio Gallery', 'studio-portfolio' );
	}

	public function get_icon() {
		return 'eicon-gallery-grid';
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
			'work_label',
			array(
				'label'   => __( 'Section Label', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Selected Work', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'work_title',
			array(
				'label'   => __( 'Section Title', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Projects that speak louder than words', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'work_description',
			array(
				'label'   => __( 'Section Description', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXTAREA,
				'default' => __( 'Hover over the gallery to auto-scroll through my portfolio.', 'studio-portfolio' ),
				'rows'    => 3,
			)
		);

		$this->add_control(
			'work_hint',
			array(
				'label'   => __( 'Scroll Hint Text', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Hover to auto-scroll · Drag to explore', 'studio-portfolio' ),
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'query_section',
			array(
				'label' => __( 'Portfolio Query', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'category',
			array(
				'label'   => __( 'Filter by Category', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::SELECT,
				'default' => '',
				'options' => $this->get_portfolio_category_options(),
			)
		);

		$this->add_control(
			'posts_per_page',
			array(
				'label'   => __( 'Number of Projects', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::NUMBER,
				'default' => -1,
				'min'     => -1,
				'description' => __( '-1 shows all projects. Projects are managed under Portfolio in WordPress admin.', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'orderby',
			array(
				'label'   => __( 'Order By', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::SELECT,
				'default' => 'menu_order',
				'options' => array(
					'menu_order' => __( 'Custom Order', 'studio-portfolio' ),
					'date'       => __( 'Date', 'studio-portfolio' ),
					'title'      => __( 'Title', 'studio-portfolio' ),
				),
			)
		);

		$this->add_control(
			'order',
			array(
				'label'   => __( 'Order', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::SELECT,
				'default' => 'ASC',
				'options' => array(
					'ASC'  => __( 'Ascending', 'studio-portfolio' ),
					'DESC' => __( 'Descending', 'studio-portfolio' ),
				),
			)
		);

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();

		$this->render_template_part(
			'portfolio',
			array(
				'work_label'       => $settings['work_label'],
				'work_title'       => $settings['work_title'],
				'work_description' => $settings['work_description'],
				'work_hint'        => $settings['work_hint'],
				'category'         => $settings['category'],
				'posts_per_page'   => $settings['posts_per_page'],
				'orderby'          => $settings['orderby'],
				'order'            => $settings['order'],
			)
		);
	}
}
