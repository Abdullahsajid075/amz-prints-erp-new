<?php
/**
 * Front page — Welcome → Who I am → What I do → Work → How I work → Proof → CTA
 *
 * @package Studio_Portfolio
 */

get_header();
?>

<main class="studio-home">
	<?php
	get_template_part( 'template-parts/hero' );

	if ( studio_get_option( 'show_marquee_home', true ) ) {
		get_template_part( 'template-parts/marquee' );
	}

	get_template_part( 'template-parts/home-about-preview' );
	get_template_part(
		'template-parts/portfolio',
		null,
		array(
			'mode'             => 'home',
			'work_label'       => studio_get_option( 'home_portfolio_label', 'My Work' ),
			'work_title'       => studio_get_option( 'home_portfolio_title', 'Featured projects' ),
			'work_description' => '',
			'show_view_all'    => true,
			'view_all_text'    => studio_get_option( 'home_portfolio_btn', 'View all work →' ),
			'view_all_url'     => studio_get_page_url( 'portfolio_page_id', home_url( '/portfolio/' ) ),
		)
	);
	get_template_part( 'template-parts/home-services' );
	get_template_part( 'template-parts/home-approach' );
	get_template_part( 'template-parts/home-why' );
	get_template_part( 'template-parts/home-clients' );
	get_template_part( 'template-parts/home-testimonials' );
	get_template_part( 'template-parts/home-cta' );
	?>
</main>

<?php
get_footer();
