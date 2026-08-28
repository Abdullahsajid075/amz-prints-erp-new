<?php
/**
 * Contact section
 *
 * @package Studio_Portfolio
 *
 * @var array $args Optional Elementor overrides.
 */

$args           = isset( $args ) ? $args : array();
$contact_status = isset( $_GET['contact'] ) ? sanitize_text_field( wp_unslash( $_GET['contact'] ) ) : '';
$show_form      = studio_template_arg( $args, 'show_form', '', true );
$email          = studio_template_arg( $args, 'contact_email', 'contact_email', 'hello@studio.design' );
$social_links   = studio_get_social_links( $args );
?>

<section id="contact" class="section contact-section">
	<div class="contact-glow"></div>
	<div class="container">
		<div class="contact-grid">
			<div class="fade-in">
				<div class="section-header">
					<p class="section-label"><?php echo esc_html( studio_template_arg( $args, 'contact_label', 'contact_label', 'Get in Touch' ) ); ?></p>
					<h2 class="display-md contact-title"><?php echo esc_html( studio_template_arg( $args, 'contact_title', 'contact_title', "Let's create something amazing together" ) ); ?></h2>
					<p class="text-muted" style="margin-top:1rem;">
						<?php echo esc_html( studio_template_arg( $args, 'contact_description', 'contact_description', 'Have a project in mind? Drop me a message and let us start a conversation.' ) ); ?>
					</p>
				</div>

				<div class="contact-info-item">
					<div class="contact-icon">✉</div>
					<div>
						<p class="text-muted" style="font-size:0.875rem;"><?php esc_html_e( 'Email', 'studio-portfolio' ); ?></p>
						<a href="mailto:<?php echo esc_attr( $email ); ?>" style="color:var(--color-gold);">
							<?php echo esc_html( $email ); ?>
						</a>
					</div>
				</div>

				<div class="contact-info-item">
					<div class="contact-icon">📍</div>
					<div>
						<p class="text-muted" style="font-size:0.875rem;"><?php esc_html_e( 'Location', 'studio-portfolio' ); ?></p>
						<p><?php echo esc_html( studio_template_arg( $args, 'contact_location', 'contact_location', 'Available Worldwide · Remote' ) ); ?></p>
					</div>
				</div>

				<?php if ( ! empty( $social_links ) ) : ?>
					<div class="social-links">
						<?php foreach ( $social_links as $link ) : ?>
							<a href="<?php echo esc_url( $link['url'] ); ?>" target="_blank" rel="noopener noreferrer">
								<?php echo esc_html( $link['label'] ); ?>
							</a>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
			</div>

			<?php if ( $show_form ) : ?>
				<form class="contact-form fade-in" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<input type="hidden" name="action" value="studio_contact_form">
					<?php wp_nonce_field( 'studio_contact_form', 'studio_contact_nonce' ); ?>

					<?php if ( 'success' === $contact_status ) : ?>
						<div class="form-success"><?php echo esc_html( studio_template_arg( $args, 'contact_success', 'contact_success', 'Thank you! Your message has been sent.' ) ); ?></div>
					<?php elseif ( 'error' === $contact_status ) : ?>
						<div class="form-success" style="background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.3);color:#fca5a5;">
							<?php esc_html_e( 'Please fill in all fields.', 'studio-portfolio' ); ?>
						</div>
					<?php endif; ?>

					<div class="form-group">
						<label class="form-label" for="contact_name"><?php esc_html_e( 'Name', 'studio-portfolio' ); ?></label>
						<input class="form-input" type="text" id="contact_name" name="contact_name" required placeholder="<?php esc_attr_e( 'Your name', 'studio-portfolio' ); ?>">
					</div>

					<div class="form-group">
						<label class="form-label" for="contact_email"><?php esc_html_e( 'Email', 'studio-portfolio' ); ?></label>
						<input class="form-input" type="email" id="contact_email" name="contact_email" required placeholder="<?php esc_attr_e( 'you@email.com', 'studio-portfolio' ); ?>">
					</div>

					<div class="form-group">
						<label class="form-label" for="contact_message"><?php esc_html_e( 'Message', 'studio-portfolio' ); ?></label>
						<textarea class="form-textarea" id="contact_message" name="contact_message" required placeholder="<?php esc_attr_e( 'Tell me about your project...', 'studio-portfolio' ); ?>"></textarea>
					</div>

					<button type="submit" class="btn btn-gold btn-lg" style="width:100%;">
						<?php echo esc_html( studio_template_arg( $args, 'contact_btn_text', 'contact_btn_text', 'Send Message' ) ); ?> →
					</button>
				</form>
			<?php endif; ?>
		</div>
	</div>
</section>
