<?php
/**
 * Home — About preview section (text only)
 *
 * @package Studio_Portfolio
 */

$about_url = studio_get_page_url( 'about_page_id', '#about' );
?>

<section class="section home-about-preview premium-section">
	<div class="container">
		<div class="home-about-text-only fade-in">
			<p class="section-label"><?php echo esc_html( studio_get_option( 'home_about_label', 'About Me' ) ); ?></p>
			<h2 class="display-md"><?php echo esc_html( studio_get_option( 'home_about_title', 'Passionate designer with 5+ years of experience' ) ); ?></h2>
			<p class="text-muted home-lead"><?php echo esc_html( studio_get_option( 'home_about_text', '' ) ); ?></p>
			<a href="<?php echo esc_url( $about_url ); ?>" class="btn btn-primary btn-lg">
				<?php echo esc_html( studio_get_option( 'home_about_btn', 'Read Full Story →' ) ); ?>
			</a>
		</div>
	</div>
</section>
