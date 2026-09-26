<?php
/**
 * Elementor Floating Contact widget — fully editable
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Studio_Floating_Contact_Widget extends Studio_Portfolio_Elementor_Widget_Base {

	public function get_name() {
		return 'studio_floating_contact';
	}

	public function get_title() {
		return __( 'Floating Contact Buttons', 'studio-portfolio' );
	}

	public function get_icon() {
		return 'eicon-button';
	}

	protected function register_controls() {
		$this->start_controls_section(
			'content_section',
			array(
				'label' => __( 'Buttons', 'studio-portfolio' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'show_float_buttons',
			array(
				'label'   => __( 'Show Floating Buttons', 'studio-portfolio' ),
				'type'    => \Elementor\Controls_Manager::SWITCHER,
				'default' => 'yes',
			)
		);

		$this->add_control(
			'contact_email',
			array(
				'label'     => __( 'Email Address', 'studio-portfolio' ),
				'type'      => \Elementor\Controls_Manager::TEXT,
				'default'   => 'hello@studio.design',
				'condition' => array( 'show_float_buttons' => 'yes' ),
			)
		);

		$this->add_control(
			'whatsapp_number',
			array(
				'label'       => __( 'WhatsApp Number', 'studio-portfolio' ),
				'type'        => \Elementor\Controls_Manager::TEXT,
				'default'     => '923001234567',
				'description' => __( 'Country code + number, digits only.', 'studio-portfolio' ),
				'condition'   => array( 'show_float_buttons' => 'yes' ),
			)
		);

		$this->add_control(
			'whatsapp_message',
			array(
				'label'     => __( 'WhatsApp Pre-filled Message', 'studio-portfolio' ),
				'type'      => \Elementor\Controls_Manager::TEXTAREA,
				'default'   => __( 'Hello! I found your portfolio and would like to connect.', 'studio-portfolio' ),
				'rows'      => 2,
				'condition' => array( 'show_float_buttons' => 'yes' ),
			)
		);

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();

		$this->render_template_part(
			'floating-contact',
			array(
				'show_float_buttons' => 'yes' === $settings['show_float_buttons'],
				'contact_email'      => $settings['contact_email'],
				'whatsapp_number'    => $settings['whatsapp_number'],
				'whatsapp_message'   => $settings['whatsapp_message'],
			)
		);
	}
}
