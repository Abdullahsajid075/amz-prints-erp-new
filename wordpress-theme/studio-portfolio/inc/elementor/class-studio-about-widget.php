<?php
/**
 * Elementor About widget
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

	protected function render() {
		$this->render_template_part( 'about' );
	}
}
