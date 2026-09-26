<?php
/**
 * Elementor About widget — fully editable
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Studio_About_Widget extends Studio_Portfolio_Elementor_Widget_Base {

	public function get_name() {
		return 'studio_about';
	}

	public function get_title() {
		return __( 'About Section', 'studio-portfolio' );
	}

	public function get_icon() {
		return 'eicon-info-box';
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
			'about_label',
			array(
				'label'   => __( 'Section Label', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'About Me', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'about_title',
			array(
				'label'   => __( 'Section Title', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Everything about me', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'about_text',
			array(
				'label'   => __( 'Introduction', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXTAREA,
				'default' => __( 'This is my personal brand portfolio — a space where I share who I am, what I have done, and where I am heading.', 'studio-portfolio' ),
				'rows'    => 4,
			)
		);

		$this->add_control(
			'about_text2',
			array(
				'label'   => __( 'Closing Paragraph', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXTAREA,
				'rows'    => 3,
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'stats_section',
			array(
				'label' => __( 'Stats', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'show_stats',
			array(
				'label'   => __( 'Show Stats', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::SWITCHER,
				'default' => 'yes',
			)
		);

		$repeater = new \Elementor\Repeater();
		$repeater->add_control(
			'value',
			array(
				'label'   => __( 'Value', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => '50+',
			)
		);
		$repeater->add_control(
			'label',
			array(
				'label'   => __( 'Label', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Projects', 'studio-portfolio' ),
			)
		);

		$this->add_control(
			'stats',
			array(
				'label'       => __( 'Stat Cards', 'studio-portfolio' ),
				'type'        => \Elementor\Controls_Manager::REPEATER,
				'fields'      => $repeater->get_controls(),
				'default'     => array(
					array( 'value' => '50+', 'label' => __( 'Projects Delivered', 'studio-portfolio' ) ),
					array( 'value' => '30+', 'label' => __( 'Happy Clients', 'studio-portfolio' ) ),
					array( 'value' => '5', 'label' => __( 'Years Experience', 'studio-portfolio' ) ),
					array( 'value' => '12', 'label' => __( 'Achievements', 'studio-portfolio' ) ),
				),
				'title_field' => '{{{ value }}} — {{{ label }}}',
				'condition'   => array( 'show_stats' => 'yes' ),
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'story_section',
			array(
				'label' => __( 'Story Blocks', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'show_story',
			array(
				'label'   => __( 'Show Story Blocks', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::SWITCHER,
				'default' => 'yes',
			)
		);

		$story_repeater = new \Elementor\Repeater();
		$story_repeater->add_control(
			'icon',
			array(
				'label'   => __( 'Icon (emoji)', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => '💼',
			)
		);
		$story_repeater->add_control(
			'title',
			array(
				'label'   => __( 'Title', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Experience', 'studio-portfolio' ),
			)
		);
		$story_repeater->add_control(
			'content',
			array(
				'label'   => __( 'Content', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXTAREA,
				'rows'    => 4,
			)
		);

		$this->add_control(
			'story_blocks',
			array(
				'label'       => __( 'Story Cards', 'studio-portfolio' ),
				'type'        => \Elementor\Controls_Manager::REPEATER,
				'fields'      => $story_repeater->get_controls(),
				'default'     => array(
					array( 'icon' => '💼', 'title' => __( 'Experience', 'studio-portfolio' ), 'content' => '' ),
					array( 'icon' => '🎓', 'title' => __( 'Education', 'studio-portfolio' ), 'content' => '' ),
					array( 'icon' => '🏢', 'title' => __( 'Companies & Brands', 'studio-portfolio' ), 'content' => '' ),
					array( 'icon' => '🎯', 'title' => __( 'My Goal', 'studio-portfolio' ), 'content' => '' ),
					array( 'icon' => '💪', 'title' => __( 'My Journey & Struggles', 'studio-portfolio' ), 'content' => '' ),
				),
				'title_field' => '{{{ icon }}} {{{ title }}}',
				'condition'   => array( 'show_story' => 'yes' ),
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'services_section',
			array(
				'label' => __( 'Services', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'show_services',
			array(
				'label'   => __( 'Show Services', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::SWITCHER,
				'default' => 'yes',
			)
		);

		$this->add_control(
			'services_label',
			array(
				'label'     => __( 'Services Label', 'studio-portfolio' ),
				'type'      => \Elementor\Controls_Manager::TEXT,
				'default'   => __( 'What I Do', 'studio-portfolio' ),
				'condition' => array( 'show_services' => 'yes' ),
			)
		);

		$this->add_control(
			'services_title',
			array(
				'label'     => __( 'Services Title', 'studio-portfolio' ),
				'type'      => \Elementor\Controls_Manager::TEXT,
				'default'   => __( 'My Skills & Services', 'studio-portfolio' ),
				'condition' => array( 'show_services' => 'yes' ),
			)
		);

		$service_repeater = new \Elementor\Repeater();
		$service_repeater->add_control(
			'icon',
			array(
				'label'   => __( 'Icon (emoji)', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => '🎨',
			)
		);
		$service_repeater->add_control(
			'title',
			array(
				'label'   => __( 'Title', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Brand Identity', 'studio-portfolio' ),
			)
		);
		$service_repeater->add_control(
			'desc',
			array(
				'label'   => __( 'Description', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXTAREA,
				'default' => __( 'Logos, visual systems, and brand guidelines.', 'studio-portfolio' ),
				'rows'    => 2,
			)
		);

		$this->add_control(
			'services',
			array(
				'label'       => __( 'Service Cards', 'studio-portfolio' ),
				'type'        => \Elementor\Controls_Manager::REPEATER,
				'fields'      => $service_repeater->get_controls(),
				'default'     => array(
					array( 'icon' => '🎨', 'title' => __( 'Brand Identity', 'studio-portfolio' ), 'desc' => __( 'Logos, visual systems, and brand guidelines.', 'studio-portfolio' ) ),
					array( 'icon' => '📐', 'title' => __( 'UI/UX Design', 'studio-portfolio' ), 'desc' => __( 'Intuitive interfaces for web and mobile.', 'studio-portfolio' ) ),
					array( 'icon' => '🧩', 'title' => __( 'Design Systems', 'studio-portfolio' ), 'desc' => __( 'Scalable component libraries and tokens.', 'studio-portfolio' ) ),
					array( 'icon' => '✨', 'title' => __( 'Creative Direction', 'studio-portfolio' ), 'desc' => __( 'Campaign concepts and visual storytelling.', 'studio-portfolio' ) ),
				),
				'title_field' => '{{{ icon }}} {{{ title }}}',
				'condition'   => array( 'show_services' => 'yes' ),
			)
		);

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();

		$this->render_template_part(
			'about',
			array(
				'about_label'    => $settings['about_label'],
				'about_title'    => $settings['about_title'],
				'about_text'     => $settings['about_text'],
				'about_text2'    => $settings['about_text2'],
				'show_stats'     => 'yes' === $settings['show_stats'],
				'stats'          => $this->map_stats( $settings['stats'] ),
				'show_story'     => 'yes' === $settings['show_story'],
				'story_blocks'   => $this->map_story_blocks( $settings['story_blocks'] ),
				'show_services'  => 'yes' === $settings['show_services'],
				'services_label' => $settings['services_label'],
				'services_title' => $settings['services_title'],
				'services'       => $this->map_services( $settings['services'] ),
			)
		);
	}
}
