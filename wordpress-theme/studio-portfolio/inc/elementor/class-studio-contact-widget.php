<?php
/**
 * Elementor Contact widget
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

	protected function render() {
		$this->render_template_part( 'contact' );
	}
}
