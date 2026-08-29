<?php
/**
 * Home — About preview section
 *
 * @package Studio_Portfolio
 */

$about_url = studio_get_page_url( 'about_page_id', '#about' );
$photo_id  = (int) studio_get_option( 'home_about_photo', 0 );
$has_photo = (bool) $photo_id;
?>

<section class="section home-about-preview premium-section">
	<div class="container">
		<div class="home-about-layout fade-in<?php echo $has_photo ? ' has-photo' : ''; ?>">
			<?php if ( $has_photo ) : ?>
				<div class="home-about-photo-wrap premium-card-glow">
					<?php echo wp_get_attachment_image( $photo_id, 'medium_large', false, array( 'class' => 'home-about-photo' ) ); ?>
				</div>
			<?php endif; ?>
			<div class="home-about-content">
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
