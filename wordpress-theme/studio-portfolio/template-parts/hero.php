<?php
/**
 * Hero — light minimalist with open PNG & moving background
 *
 * @package Studio_Portfolio
 */

$personal_photo = studio_get_option( 'hero_personal_photo', '' );
$name           = studio_get_option( 'hero_name', get_bloginfo( 'name' ) );
$role           = studio_get_option( 'hero_role', '' );
?>

<section class="hero hero-light">
	<div class="hero-bg-motion" aria-hidden="true">
		<span class="hero-blob hero-blob-1"></span>
		<span class="hero-blob hero-blob-2"></span>
		<span class="hero-blob hero-blob-3"></span>
		<span class="hero-ring hero-ring-1"></span>
		<span class="hero-ring hero-ring-2"></span>
		<span class="hero-dot-field"></span>
	</div>

	<div class="container">
		<div class="hero-grid">
			<div class="hero-content fade-in">
				<div class="hero-status">
					<span class="status-dot"></span>
					<span class="section-label" style="margin:0;"><?php echo esc_html( studio_get_option( 'hero_status', 'Available for projects' ) ); ?></span>
				</div>

				<?php if ( $name ) : ?>
					<p class="hero-name"><?php echo esc_html( $name ); ?></p>
				<?php endif; ?>

				<h1 class="hero-title display-xl">
					<span class="hero-title-line1"><?php echo esc_html( studio_get_option( 'hero_title_line1', 'Hi, I am' ) ); ?></span>
					<em class="text-gradient hero-title-line2"><?php echo esc_html( studio_get_option( 'hero_title_line2', 'a Designer' ) ); ?></em>
					<span class="hero-title-line3"><?php echo esc_html( studio_get_option( 'hero_title_line3', 'building my brand' ) ); ?></span>
				</h1>

				<?php if ( $role ) : ?>
					<p class="hero-role"><?php echo esc_html( $role ); ?></p>
				<?php endif; ?>

				<p class="hero-desc"><?php echo esc_html( studio_get_option( 'hero_description', 'Welcome to my personal portfolio. Here I share my work, my story, and everything about my creative journey.' ) ); ?></p>

				<div class="hero-actions">
					<a href="<?php echo esc_url( studio_get_option( 'hero_btn1_url', '#work' ) ); ?>" class="btn btn-primary btn-lg">
						<?php echo esc_html( studio_get_option( 'hero_btn1_text', 'View My Work' ) ); ?>
					</a>
					<a href="<?php echo esc_url( studio_get_option( 'hero_btn2_url', '#about' ) ); ?>" class="btn btn-outline btn-lg">
						<?php echo esc_html( studio_get_option( 'hero_btn2_text', 'About Me' ) ); ?>
					</a>
				</div>
			</div>

			<div class="hero-photo-open fade-in">
				<?php if ( $personal_photo ) : ?>
					<?php echo wp_get_attachment_image( $personal_photo, 'large', false, array(
						'class' => 'hero-png-image',
						'alt'   => esc_attr( $name ),
					) ); ?>
				<?php else : ?>
					<div class="hero-photo-placeholder">
						<span><?php esc_html_e( 'Upload your PNG photo in Customize → Hero', 'studio-portfolio' ); ?></span>
					</div>
				<?php endif; ?>
				<?php if ( studio_get_option( 'hero_photo_caption', '' ) ) : ?>
					<p class="hero-photo-caption"><?php echo esc_html( studio_get_option( 'hero_photo_caption', '' ) ); ?></p>
				<?php endif; ?>
			</div>
		</div>

		<div class="scroll-indicator">
			<span><?php esc_html_e( 'Scroll', 'studio-portfolio' ); ?></span>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
		</div>
	</div>
</section>
