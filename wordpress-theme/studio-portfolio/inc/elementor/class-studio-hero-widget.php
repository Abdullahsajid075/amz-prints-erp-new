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

	protected function render() {
		$this->render_template_part( 'hero' );
	}
}
