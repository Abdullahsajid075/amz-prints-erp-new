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

	protected function render() {
		$this->render_template_part( 'marquee' );
	}
}
