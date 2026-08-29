<?php
/**
 * Front page — always uses theme sections (edit in Customizer / Studio Portfolio menu).
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
	get_template_part( 'template-parts/home-services' );
	get_template_part(
		'template-parts/portfolio',
		null,
		array(
			'mode'             => 'home',
			'work_label'       => studio_get_option( 'home_portfolio_label', 'Portfolio' ),
			'work_title'       => studio_get_option( 'home_portfolio_title', 'Featured work' ),
			'work_description' => '',
			'show_view_all'    => true,
			'view_all_text'    => studio_get_option( 'home_portfolio_btn', 'See All Projects →' ),
			'view_all_url'     => studio_get_page_url( 'portfolio_page_id', studio_get_page_url( 'work_page_id', '#portfolio' ) ),
		)
	);

	get_template_part( 'template-parts/home-cta' );
	?>
</main>

<?php
get_footer();
