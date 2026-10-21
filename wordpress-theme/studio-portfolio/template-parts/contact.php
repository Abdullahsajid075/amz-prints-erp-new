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
$whatsapp       = studio_get_option( 'whatsapp_number', studio_get_option( 'schedule_whatsapp', '923471136415' ) );
$wa_url         = studio_get_whatsapp_url( $whatsapp, studio_get_option( 'whatsapp_message', 'Hello! I would like to start a brand project.' ) );
$project_types  = studio_get_project_types();
?>

<section id="contact" class="section contact-section">
	<div class="contact-glow"></div>
	<div class="container">
		<div class="contact-grid">
			<div class="fade-in">
				<div class="section-header">
					<p class="section-label"><?php echo esc_html( studio_template_arg( $args, 'contact_label', 'contact_label', 'Contact' ) ); ?></p>
					<h2 class="display-md contact-title"><?php echo esc_html( studio_template_arg( $args, 'contact_title', 'contact_title', 'Have a Brand That Needs a Better Identity?' ) ); ?></h2>
					<p class="text-muted" style="margin-top:1rem;">
						<?php echo esc_html( studio_template_arg( $args, 'contact_description', 'contact_description', "Let's talk about your next project." ) ); ?>
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

				<?php if ( $wa_url ) : ?>
					<div class="contact-info-item">
						<div class="contact-icon">💬</div>
						<div>
							<p class="text-muted" style="font-size:0.875rem;"><?php esc_html_e( 'WhatsApp', 'studio-portfolio' ); ?></p>
							<a href="<?php echo esc_url( $wa_url ); ?>" target="_blank" rel="noopener noreferrer" style="color:var(--color-gold);">
								<?php echo esc_html( $whatsapp ); ?>
							</a>
						</div>
					</div>
				<?php endif; ?>

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
						<div class="form-success"><?php echo esc_html( studio_template_arg( $args, 'contact_success', 'contact_success', 'Thank you — I will get back to you shortly.' ) ); ?></div>
					<?php elseif ( 'error' === $contact_status ) : ?>
						<div class="form-success" style="background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.3);color:#fca5a5;">
							<?php esc_html_e( 'Please fill in name, email, and project details.', 'studio-portfolio' ); ?>
						</div>
					<?php endif; ?>

					<div class="form-row-2">
						<div class="form-group">
							<label class="form-label" for="contact_name"><?php esc_html_e( 'Name', 'studio-portfolio' ); ?></label>
							<input class="form-input" type="text" id="contact_name" name="contact_name" required placeholder="<?php esc_attr_e( 'Your name', 'studio-portfolio' ); ?>">
						</div>
						<div class="form-group">
							<label class="form-label" for="contact_email"><?php esc_html_e( 'Email', 'studio-portfolio' ); ?></label>
							<input class="form-input" type="email" id="contact_email" name="contact_email" required placeholder="<?php esc_attr_e( 'you@email.com', 'studio-portfolio' ); ?>">
						</div>
					</div>

					<div class="form-row-2">
						<div class="form-group">
							<label class="form-label" for="contact_whatsapp"><?php esc_html_e( 'WhatsApp', 'studio-portfolio' ); ?></label>
							<input class="form-input" type="text" id="contact_whatsapp" name="contact_whatsapp" placeholder="<?php esc_attr_e( 'With country code', 'studio-portfolio' ); ?>">
						</div>
						<div class="form-group">
							<label class="form-label" for="contact_company"><?php esc_html_e( 'Company', 'studio-portfolio' ); ?></label>
							<input class="form-input" type="text" id="contact_company" name="contact_company" placeholder="<?php esc_attr_e( 'Your company', 'studio-portfolio' ); ?>">
						</div>
					</div>

					<div class="form-group">
						<label class="form-label" for="contact_project_type"><?php esc_html_e( 'Project Type', 'studio-portfolio' ); ?></label>
						<select class="form-input" id="contact_project_type" name="contact_project_type">
							<option value=""><?php esc_html_e( 'Select a service', 'studio-portfolio' ); ?></option>
							<?php foreach ( $project_types as $type ) : ?>
								<option value="<?php echo esc_attr( $type ); ?>"><?php echo esc_html( $type ); ?></option>
							<?php endforeach; ?>
						</select>
					</div>

					<div class="form-group">
						<label class="form-label" for="contact_message"><?php esc_html_e( 'Tell me about your project', 'studio-portfolio' ); ?></label>
						<textarea class="form-textarea" id="contact_message" name="contact_message" required placeholder="<?php esc_attr_e( 'What needs a better identity?', 'studio-portfolio' ); ?>"></textarea>
					</div>

					<button type="submit" class="btn btn-gold btn-lg" style="width:100%;">
						<?php echo esc_html( studio_template_arg( $args, 'contact_btn_text', 'contact_btn_text', 'Start a Project' ) ); ?> →
					</button>
				</form>
			<?php endif; ?>
		</div>
	</div>
</section>
