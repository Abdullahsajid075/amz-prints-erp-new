<?php
/**
 * Home — About preview section
 *
 * @package Studio_Portfolio
 */

$about_url = studio_get_page_url( 'about_page_id', '#about' );
$photo_id  = (int) studio_get_option( 'home_about_photo', 0 );
if ( ! $photo_id ) {
	$photo_id = (int) studio_get_option( 'hero_personal_photo', 0 );
}
?>

<section class="section home-about-preview premium-section">
	<div class="container">
		<div class="home-split fade-in">
			<div class="home-split-visual premium-card-glow home-about-photo-wrap">
				<?php if ( $photo_id ) : ?>
					<?php echo wp_get_attachment_image( $photo_id, 'medium_large', false, array( 'class' => 'home-about-photo' ) ); ?>
				<?php else : ?>
					<div class="home-about-photo-placeholder">
						<span><?php esc_html_e( 'Customize → Home Page → About Section Photo', 'studio-portfolio' ); ?></span>
					</div>
				<?php endif; ?>
			</div>
			<div class="home-split-content">
				<p class="section-label"><?php echo esc_html( studio_get_option( 'home_about_label', 'About Me' ) ); ?></p>
				<h2 class="display-md"><?php echo esc_html( studio_get_option( 'home_about_title', 'Passionate designer with 5+ years of experience' ) ); ?></h2>
				<p class="text-muted home-lead"><?php echo esc_html( studio_get_option( 'home_about_text', '' ) ); ?></p>
				<a href="<?php echo esc_url( $about_url ); ?>" class="btn btn-primary btn-lg">
					<?php echo esc_html( studio_get_option( 'home_about_btn', 'Read Full Story →' ) ); ?>
				</a>
			</div>
		</div>
	</div>
</section>
