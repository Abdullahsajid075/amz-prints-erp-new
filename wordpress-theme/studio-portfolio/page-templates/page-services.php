<?php
/**
 * Template Name: Services Page
 *
 * @package Studio_Portfolio
 */

get_header();
?>

<main class="studio-page-content studio-services-page">
	<section class="section">
		<div class="container">
			<div class="section-header center">
				<p class="section-label"><?php echo esc_html( studio_get_option( 'home_services_label', 'Services' ) ); ?></p>
				<h1 class="display-md"><?php echo esc_html( studio_get_option( 'home_services_title', 'What I offer' ) ); ?></h1>
				<p class="text-muted home-lead" style="margin:1rem auto 0;max-width:640px;">
					<?php esc_html_e( 'Six to eight core services — complete brand work, not a list of 30 tiny tasks.', 'studio-portfolio' ); ?>
				</p>
			</div>
		</div>
		<?php get_template_part( 'template-parts/home-services', null, array( 'hide_header' => true ) ); ?>
		<div class="container" style="margin-top:2rem;">
			<?php get_template_part( 'template-parts/services-detailed' ); ?>
			<p class="center" style="margin-top:3rem;">
				<a class="btn btn-primary btn-lg" href="<?php echo esc_url( studio_get_page_url( 'contact_page_id', '#' ) ); ?>">
					<?php echo esc_html( studio_get_option( 'nav_schedule', 'Start a Project' ) ); ?> →
				</a>
			</p>
		</div>
	</section>
</main>

<?php
get_footer();
