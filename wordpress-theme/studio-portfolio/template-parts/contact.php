<?php
/**
 * Contact section
 *
 * @package Studio_Portfolio
 */

$contact_status = isset( $_GET['contact'] ) ? sanitize_text_field( wp_unslash( $_GET['contact'] ) ) : '';
?>

<section id="contact" class="section contact-section">
	<div class="contact-glow"></div>
	<div class="container">
		<div class="contact-grid">
			<div class="fade-in">
				<div class="section-header">
					<p class="section-label"><?php esc_html_e( 'Get in Touch', 'studio-portfolio' ); ?></p>
					<h2 class="display-md"><?php esc_html_e( "Let's create something amazing together", 'studio-portfolio' ); ?></h2>
					<p class="text-muted" style="margin-top:1rem;">
						<?php esc_html_e( 'Have a project in mind? Drop me a message and let us start a conversation.', 'studio-portfolio' ); ?>
					</p>
				</div>

				<div class="contact-info-item">
					<div class="contact-icon">✉</div>
					<div>
						<p class="text-muted" style="font-size:0.875rem;"><?php esc_html_e( 'Email', 'studio-portfolio' ); ?></p>
						<a href="mailto:<?php echo esc_attr( studio_get_option( 'contact_email', 'hello@studio.design' ) ); ?>" style="color:var(--color-gold);">
							<?php echo esc_html( studio_get_option( 'contact_email', 'hello@studio.design' ) ); ?>
						</a>
					</div>
				</div>

				<div class="contact-info-item">
					<div class="contact-icon">📍</div>
					<div>
						<p class="text-muted" style="font-size:0.875rem;"><?php esc_html_e( 'Location', 'studio-portfolio' ); ?></p>
						<p><?php echo esc_html( studio_get_option( 'contact_location', 'Available Worldwide · Remote' ) ); ?></p>
					</div>
				</div>

				<div class="social-links">
					<a href="#"><?php esc_html_e( 'Dribbble', 'studio-portfolio' ); ?></a>
					<a href="#"><?php esc_html_e( 'Behance', 'studio-portfolio' ); ?></a>
					<a href="#"><?php esc_html_e( 'LinkedIn', 'studio-portfolio' ); ?></a>
				</div>
			</div>

			<form class="contact-form fade-in" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="studio_contact_form">
				<?php wp_nonce_field( 'studio_contact_form', 'studio_contact_nonce' ); ?>

				<?php if ( 'success' === $contact_status ) : ?>
					<div class="form-success"><?php esc_html_e( 'Thank you! Your message has been sent.', 'studio-portfolio' ); ?></div>
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
					<?php esc_html_e( 'Send Message', 'studio-portfolio' ); ?> →
				</button>
			</form>
		</div>
	</div>
</section>
