<?php
/**
 * Front page template
 *
 * @package Studio_Portfolio
 */

get_header();

get_template_part( 'template-parts/hero' );
get_template_part( 'template-parts/marquee' );
get_template_part( 'template-parts/portfolio' );
get_template_part( 'template-parts/about' );
get_template_part( 'template-parts/design-system' );
get_template_part( 'template-parts/contact' );

get_footer();
