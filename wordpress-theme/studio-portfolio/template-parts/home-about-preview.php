<?php
/**
 * Home — About preview section
 *
 * @package Studio_Portfolio
 */

$about_url = studio_get_page_url( 'about_page_id', '#about' );
$photo_id  = (int) studio_get_option( 'home_about_photo', 0 );

if ( ! $photo_id ) {
	$home_id = (int) get_option( 'page_on_front' );
	if ( $home_id ) {
		$photo_id = (int) get_post_thumbnail_id( $home_id );
	}
}
if ( ! $photo_id ) {
	$about_id = studio_resolve_page_id( 'about_page_id' );
	if ( $about_id ) {
		$photo_id = (int) get_post_thumbnail_id( $about_id );
	}
}

$has_photo = (bool) $photo_id;
?>

<section class="section home-about-preview premium-section">
	<div class="container">
		<div class="home-about-layout<?php echo $has_photo ? ' has-photo' : ''; ?>">
			<?php if ( $has_photo ) : ?>
				<div class="home-about-photo-wrap premium-card-glow">
					<?php echo wp_get_attachment_image( $photo_id, 'medium_large', false, array( 'class' => 'home-about-photo' ) ); ?>
				</div>
			<?php endif; ?>
			<div class="home-about-content">
				<p class="section-label"><?php echo esc_html( studio_get_option( 'home_about_label', 'About Me' ) ); ?></p>
				<h2 class="display-md"><?php echo esc_html( studio_get_option( 'home_about_title', 'Passionate designer with 5+ years of experience' ) ); ?></h2>
				<p class="text-muted home-lead"><?php echo esc_html( studio_get_option( 'home_about_text', 'I combine strategy, creativity, and attention to detail to deliver designs that not only look beautiful but also solve real business problems.' ) ); ?></p>
				<a href="<?php echo esc_url( $about_url ); ?>" class="btn btn-primary btn-lg">
					<?php echo esc_html( studio_get_option( 'home_about_btn', 'Read Full Story →' ) ); ?>
				</a>
				<?php if ( current_user_can( 'edit_theme_options' ) ) : ?>
					<p class="edit-hint"><a href="<?php echo esc_url( admin_url( 'customize.php?autofocus[section]=studio_home_page' ) ); ?>"><?php esc_html_e( 'Change photo & text →', 'studio-portfolio' ); ?></a></p>
				<?php endif; ?>
			</div>
		</div>
	</div>
</section>
