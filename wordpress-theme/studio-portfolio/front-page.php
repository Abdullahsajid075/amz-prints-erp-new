<?php
/**
 * Front page template
 *
 * @package Studio_Portfolio
 */

get_header();

get_template_part( 'template-parts/hero' );

if ( studio_section_enabled( 'marquee' ) ) {
	get_template_part( 'template-parts/marquee' );
}
if ( studio_section_enabled( 'portfolio' ) ) {
	get_template_part( 'template-parts/portfolio' );
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

get_footer();
