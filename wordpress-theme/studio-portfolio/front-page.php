<?php
/**
 * Front page — Hero, Marquee, About, Services, Portfolio
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

	if ( studio_get_option( 'show_marquee_home', true ) ) {
		get_template_part( 'template-parts/marquee' );
	}

	get_template_part( 'template-parts/home-stats' );
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
}

get_footer();
