<?php
/**
 * Front page — theme sections OR full Elementor page
 *
 * @package Studio_Portfolio
 */

get_header();

$front_id = (int) get_option( 'page_on_front' );

if ( $front_id && studio_is_elementor_page( $front_id ) ) {
	?>
	<main class="studio-elementor-content">
		<?php
		while ( have_posts() ) :
			the_post();
			the_content();
		endwhile;
		?>
	</main>
	<?php
} else {
	get_template_part( 'template-parts/hero' );

	if ( studio_section_enabled( 'marquee' ) ) {
		get_template_part( 'template-parts/marquee' );
	}
	if ( studio_section_enabled( 'portfolio' ) ) {
		get_template_part(
			'template-parts/portfolio',
			null,
			array( 'mode' => 'home' )
		);
	}
	if ( studio_section_enabled( 'about' ) ) {
		get_template_part( 'template-parts/about' );
	}
	if ( studio_section_enabled( 'design_system' ) ) {
		get_template_part( 'template-parts/design-system' );
	}
	if ( studio_section_enabled( 'contact' ) ) {
		get_template_part( 'template-parts/contact' );
	}
}

get_footer();
