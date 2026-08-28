<?php
/**
 * Home — About preview section
 *
 * @package Studio_Portfolio
 */

$about_url = studio_get_page_url( 'about_page_id', '#about' );
?>

<section class="section home-about-preview premium-section">
	<div class="container">
		<div class="home-split fade-in">
			<div class="home-split-content">
				<p class="section-label"><?php echo esc_html( studio_get_option( 'home_about_label', 'About Me' ) ); ?></p>
				<h2 class="display-md"><?php echo esc_html( studio_get_option( 'home_about_title', 'Designer building meaningful brands' ) ); ?></h2>
				<p class="text-muted home-lead"><?php echo esc_html( studio_get_option( 'home_about_text', '' ) ); ?></p>
				<a href="<?php echo esc_url( $about_url ); ?>" class="btn btn-outline btn-lg">
					<?php echo esc_html( studio_get_option( 'home_about_btn', 'Read My Full Story →' ) ); ?>
				</a>
			</div>
			<div class="home-split-visual premium-card-glow">
				<?php
				$photo_id = (int) studio_get_option( 'hero_personal_photo', 0 );
				if ( $photo_id ) {
					echo wp_get_attachment_image( $photo_id, 'medium_large', false, array( 'class' => 'home-about-photo' ) );
				} else {
					?>
					<div class="home-about-photo-placeholder">
						<span><?php esc_html_e( 'Upload your photo in Customize → Hero', 'studio-portfolio' ); ?></span>
					</div>
					<?php
				}
				?>
			</div>
		</div>
	</div>
</section>
