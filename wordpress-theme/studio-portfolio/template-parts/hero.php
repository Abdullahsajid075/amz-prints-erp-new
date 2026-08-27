<?php
/**
 * Hero section — personal brand intro with photo
 *
 * @package Studio_Portfolio
 */

$personal_photo = studio_get_option( 'hero_personal_photo', '' );
$name           = studio_get_option( 'hero_name', get_bloginfo( 'name' ) );
$role           = studio_get_option( 'hero_role', '' );
?>

<section class="hero grid-bg">
	<div class="hero-glow-green"></div>
	<div class="hero-glow-light"></div>

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
					<span class="text-gradient hero-title-line2"><?php echo esc_html( studio_get_option( 'hero_title_line2', 'a Designer' ) ); ?></span>
					<span class="hero-title-line3"><?php echo esc_html( studio_get_option( 'hero_title_line3', 'building my brand' ) ); ?></span>
				</h1>

				<?php if ( $role ) : ?>
					<p class="hero-role"><?php echo esc_html( $role ); ?></p>
				<?php endif; ?>

				<p class="hero-desc"><?php echo esc_html( studio_get_option( 'hero_description', 'Welcome to my personal portfolio. Here I share my work, my story, and everything about my creative journey.' ) ); ?></p>

				<div class="hero-actions">
					<a href="<?php echo esc_url( studio_get_option( 'hero_btn1_url', '#work' ) ); ?>" class="btn btn-primary btn-lg">
						<?php echo esc_html( studio_get_option( 'hero_btn1_text', 'View My Work' ) ); ?> →
					</a>
					<a href="<?php echo esc_url( studio_get_option( 'hero_btn2_url', '#about' ) ); ?>" class="btn btn-outline btn-lg">
						<?php echo esc_html( studio_get_option( 'hero_btn2_text', 'About Me' ) ); ?>
					</a>
				</div>
			</div>

			<div class="hero-photo-wrap fade-in">
				<div class="hero-photo-ring">
					<div class="hero-photo">
						<?php if ( $personal_photo ) : ?>
							<?php echo wp_get_attachment_image( $personal_photo, 'large', false, array( 'alt' => esc_attr( $name ) ) ); ?>
						<?php else : ?>
							<div class="hero-photo-placeholder">
								<span><?php esc_html_e( 'Upload your photo in Customize → Hero', 'studio-portfolio' ); ?></span>
							</div>
						<?php endif; ?>
					</div>
				</div>
				<p class="hero-photo-caption"><?php echo esc_html( studio_get_option( 'hero_photo_caption', 'Nice to meet you!' ) ); ?></p>
			</div>
		</div>

		<div class="scroll-indicator">
			<span><?php esc_html_e( 'Scroll', 'studio-portfolio' ); ?></span>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
		</div>
	</div>
</section>

<style>
.fade-in { opacity: 0; transform: translateY(30px); transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1); }
.fade-in.visible { opacity: 1; transform: translateY(0); }
</style>
