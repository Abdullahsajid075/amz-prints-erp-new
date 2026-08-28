<?php
/**
 * Elementor Portfolio widget
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

	protected function render() {
		$this->render_template_part( 'portfolio' );
	}
}
