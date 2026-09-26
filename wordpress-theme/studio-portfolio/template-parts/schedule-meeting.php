<?php
/**
 * Schedule Meeting — form sends to WhatsApp
 *
 * @package Studio_Portfolio
 */

$platforms = studio_get_meeting_platforms();
$whatsapp  = preg_replace( '/\D+/', '', studio_get_option( 'schedule_whatsapp', '923471136415' ) );
?>

<section class="section schedule-meeting-section premium-section-alt">
	<div class="container">
		<div class="schedule-grid">
			<div class="fade-in">
				<p class="section-label"><?php echo esc_html( studio_get_option( 'schedule_page_label', 'Book a Call' ) ); ?></p>
				<h1 class="display-md"><?php echo esc_html( studio_get_option( 'schedule_page_title', 'Schedule a meeting with me' ) ); ?></h1>
				<p class="text-muted home-lead"><?php echo esc_html( studio_get_option( 'schedule_page_description', '' ) ); ?></p>

				<ul class="schedule-features">
					<li>✦ <?php esc_html_e( 'Pick your preferred date & time', 'studio-portfolio' ); ?></li>
					<li>✦ <?php esc_html_e( 'Choose meeting platform (Zoom, Meet, WhatsApp…)', 'studio-portfolio' ); ?></li>
					<li>✦ <?php esc_html_e( 'Details sent directly to WhatsApp', 'studio-portfolio' ); ?></li>
				</ul>
			</div>

			<form id="studio-meeting-form" class="schedule-form premium-card-glow fade-in" novalidate>
				<input type="hidden" id="schedule_whatsapp" value="<?php echo esc_attr( $whatsapp ); ?>" />

				<div class="form-group">
					<label class="form-label" for="meeting_name"><?php esc_html_e( 'Full Name', 'studio-portfolio' ); ?> *</label>
					<input class="form-input" type="text" id="meeting_name" name="name" required placeholder="<?php esc_attr_e( 'Your name', 'studio-portfolio' ); ?>">
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="meeting_email"><?php esc_html_e( 'Email', 'studio-portfolio' ); ?> *</label>
						<input class="form-input" type="email" id="meeting_email" name="email" required placeholder="you@email.com">
					</div>
					<div class="form-group">
						<label class="form-label" for="meeting_phone"><?php esc_html_e( 'Phone', 'studio-portfolio' ); ?> *</label>
						<input class="form-input" type="tel" id="meeting_phone" name="phone" required placeholder="+92 300 0000000">
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="meeting_date"><?php esc_html_e( 'Preferred Date', 'studio-portfolio' ); ?> *</label>
						<input class="form-input" type="date" id="meeting_date" name="date" required>
					</div>
					<div class="form-group">
						<label class="form-label" for="meeting_time"><?php esc_html_e( 'Preferred Time', 'studio-portfolio' ); ?> *</label>
						<input class="form-input" type="time" id="meeting_time" name="time" required>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label" for="meeting_platform"><?php esc_html_e( 'Meeting Platform', 'studio-portfolio' ); ?> *</label>
					<select class="form-input" id="meeting_platform" name="platform" required>
						<option value=""><?php esc_html_e( 'Select platform…', 'studio-portfolio' ); ?></option>
						<?php foreach ( $platforms as $platform ) : ?>
							<option value="<?php echo esc_attr( $platform ); ?>"><?php echo esc_html( $platform ); ?></option>
						<?php endforeach; ?>
					</select>
				</div>

				<div class="form-group">
					<label class="form-label" for="meeting_message"><?php esc_html_e( 'Project / Message', 'studio-portfolio' ); ?> *</label>
					<textarea class="form-textarea" id="meeting_message" name="message" required rows="4" placeholder="<?php esc_attr_e( 'Tell me about your project or what you would like to discuss…', 'studio-portfolio' ); ?>"></textarea>
				</div>

				<button type="submit" class="btn btn-gold btn-lg" style="width:100%;">
					<?php echo esc_html( studio_get_option( 'schedule_submit_text', 'Send via WhatsApp →' ) ); ?>
				</button>

				<p class="schedule-form-note text-muted">
					<?php esc_html_e( 'After clicking, WhatsApp opens with your meeting details pre-filled. Send the message to confirm.', 'studio-portfolio' ); ?>
				</p>

				<div id="schedule-form-success" class="form-success" style="display:none;margin-top:1rem;">
					<?php echo esc_html( studio_get_option( 'schedule_success_text', 'Opening WhatsApp — send the message to confirm your meeting!' ) ); ?>
				</div>
			</form>
		</div>
	</div>
</section>
