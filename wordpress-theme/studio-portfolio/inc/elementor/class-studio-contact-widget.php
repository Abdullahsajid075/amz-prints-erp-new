<?php
/**
 * Elementor Contact widget — fully editable
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Studio_Contact_Widget extends Studio_Portfolio_Elementor_Widget_Base {

	public function get_name() {
		return 'studio_contact';
	}

	public function get_title() {
		return __( 'Contact Section', 'studio-portfolio' );
	}

	public function get_icon() {
		return 'eicon-form-horizontal';
	}

	protected function register_controls() {
		$this->start_controls_section(
			'header_section',
			array(
				'label' => __( 'Section Header', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_section_header_controls(
			'contact',
			array(
				'label'       => __( 'Get in Touch', 'studio-portfolio' ),
				'title'       => __( "Let's create something amazing together", 'studio-portfolio' ),
				'description' => __( 'Have a project in mind? Drop me a message and let us start a conversation.', 'studio-portfolio' ),
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'info_section',
			array(
				'label' => __( 'Contact Info', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'contact_email',
			array(
				'label'   => __( 'Email Address', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => 'hello@studio.design',
			)
		);

		$this->add_control(
			'contact_location',
			array(
				'label'   => __( 'Location Text', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => __( 'Available Worldwide · Remote', 'studio-portfolio' ),
			)
		);

		$social_repeater = new \Elementor\Repeater();
		$social_repeater->add_control(
			'label',
			array(
				'label'   => __( 'Label', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => 'LinkedIn',
			)
		);
		$social_repeater->add_control(
			'url',
			array(
				'label'   => __( 'URL', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::URL,
				'default' => array( 'url' => '#' ),
			)
		);

		$this->add_control(
			'social_links',
			array(
				'label'       => __( 'Social Links', 'studio-portfolio' ),
				'type'        => \Elementor\Controls_Manager::REPEATER,
				'fields'      => $social_repeater->get_controls(),
				'default'     => array(
					array( 'label' => 'Dribbble', 'url' => array( 'url' => '#' ) ),
					array( 'label' => 'Behance', 'url' => array( 'url' => '#' ) ),
					array( 'label' => 'Instagram', 'url' => array( 'url' => '#' ) ),
					array( 'label' => 'LinkedIn', 'url' => array( 'url' => '#' ) ),
				),
				'title_field' => '{{{ label }}}',
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'form_section',
			array(
				'label' => __( 'Contact Form', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'show_form',
			array(
				'label'   => __( 'Show Contact Form', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::SWITCHER,
				'default' => 'yes',
			)
		);

		$this->add_control(
			'contact_btn_text',
			array(
				'label'     => __( 'Submit Button Text', 'studio-portfolio' ),
				'type'      => \Elementor\Controls_Manager::TEXT,
				'default'   => __( 'Send Message', 'studio-portfolio' ),
				'condition' => array( 'show_form' => 'yes' ),
			)
		);

		$this->add_control(
			'contact_success',
			array(
				'label'     => __( 'Success Message', 'studio-portfolio' ),
				'type'      => \Elementor\Controls_Manager::TEXT,
				'default'   => __( 'Thank you! Your message has been sent.', 'studio-portfolio' ),
				'condition' => array( 'show_form' => 'yes' ),
			)
		);

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();

		$this->render_template_part(
			'contact',
			array(
				'contact_label'       => $settings['contact_label'],
				'contact_title'       => $settings['contact_title'],
				'contact_description' => $settings['contact_description'],
				'contact_email'       => $settings['contact_email'],
				'contact_location'    => $settings['contact_location'],
				'social_links'        => $this->map_social_links( $settings['social_links'] ),
				'show_form'           => 'yes' === $settings['show_form'],
				'contact_btn_text'    => $settings['contact_btn_text'],
				'contact_success'     => $settings['contact_success'],
			)
		);
	}
}
