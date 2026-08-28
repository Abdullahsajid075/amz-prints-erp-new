<?php
/**
 * Elementor Hero widget
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Studio_Hero_Widget extends Studio_Portfolio_Elementor_Widget_Base {

	public function get_name() {
		return 'studio_hero';
	}

	public function get_title() {
		return __( 'Hero Section', 'studio-portfolio' );
	}

	public function get_icon() {
		return 'eicon-person';
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
			'hero_photo',
			array(
				'label' => __( 'Personal Photo (PNG)', 'studio-portfolio' ),
				'type'  => \Elementor\Controls_Manager::MEDIA,
				'default' => array(
					'url' => '',
				),
			)
		);

		$this->add_control(
			'hero_status',
			array(
				'label'   => __( 'Status Label', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Available for projects', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'hero_name',
			array(
				'label'   => __( 'Name', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => get_bloginfo( 'name' ),
			)
		);

		$this->add_control(
			'hero_title_line1',
			array(
				'label'   => __( 'Title Line 1', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Hi, I am', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'hero_title_line2',
			array(
				'label'   => __( 'Title Line 2 (highlighted)', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'a Designer', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'hero_title_line3',
			array(
				'label'   => __( 'Title Line 3', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'building my brand', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'hero_role',
			array(
				'label'   => __( 'Role / Tagline', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Brand & UI Designer', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'hero_description',
			array(
				'label'   => __( 'Description', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXTAREA,
				'default' => __( 'Welcome to my personal portfolio. Here I share my work, my story, and everything about my creative journey.', 'studio-portfolio' ),
				'rows'    => 4,
			)
		);

		$this->add_control(
			'hero_btn1_text',
			array(
				'label'   => __( 'Primary Button Text', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'View My Work', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'hero_btn1_url',
			array(
				'label'   => __( 'Primary Button Link', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::URL,
				'default' => array(
					'url' => '#work',
				),
			)
		);

		$this->add_control(
			'hero_btn2_text',
			array(
				'label'   => __( 'Secondary Button Text', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'About Me', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'hero_btn2_url',
			array(
				'label'   => __( 'Secondary Button Link', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::URL,
				'default' => array(
					'url' => '#about',
				),
			)
		);

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();

		$this->render_template_part(
			'hero',
			array(
				'personal_photo' => ! empty( $settings['hero_photo']['id'] ) ? (int) $settings['hero_photo']['id'] : 0,
				'photo_url'      => ! empty( $settings['hero_photo']['url'] ) ? $settings['hero_photo']['url'] : '',
				'status'         => $settings['hero_status'],
				'name'           => $settings['hero_name'],
				'title_line1'    => $settings['hero_title_line1'],
				'title_line2'    => $settings['hero_title_line2'],
				'title_line3'    => $settings['hero_title_line3'],
				'role'           => $settings['hero_role'],
				'description'    => $settings['hero_description'],
				'btn1_text'      => $settings['hero_btn1_text'],
				'btn1_url'       => $this->get_url_from_setting( $settings['hero_btn1_url'] ),
				'btn2_text'      => $settings['hero_btn2_text'],
				'btn2_url'       => $this->get_url_from_setting( $settings['hero_btn2_url'] ),
			)
		);
	}
}
