<?php
/**
 * Template Name: Contact
 *
 * @package AMZ_Prints
 */

get_header();
?>

<?php
if ( function_exists( 'amz_prints_page_banner' ) ) {
	amz_prints_page_banner( 'contact' );
}
$wa = amz_prints_mod( 'amz_whatsapp', '' );
$wa_link = $wa ? 'https://wa.me/' . preg_replace( '/\D+/', '', $wa ) : '';
$socials = array(
	'facebook'  => 'Facebook',
	'instagram' => 'Instagram',
	'linkedin'  => 'LinkedIn',
	'youtube'   => 'YouTube',
	'tiktok'    => 'TikTok',
);
?>

<section class="section">
	<div class="container contact-layout">
		<div class="contact-info contact-panel reveal" data-reveal>
			<h2><?php esc_html_e( 'Contact information', 'amz-prints' ); ?></h2>
			<ul class="contact-list">
				<?php if ( amz_prints_mod( 'amz_phone' ) ) : ?>
					<li>
						<span class="contact-list__icon" aria-hidden="true">☎</span>
						<div>
							<span><?php esc_html_e( 'Phone', 'amz-prints' ); ?></span>
							<a href="tel:<?php echo esc_attr( preg_replace( '/\s+/', '', amz_prints_mod( 'amz_phone' ) ) ); ?>"><?php echo esc_html( amz_prints_mod( 'amz_phone' ) ); ?></a>
						</div>
					</li>
				<?php endif; ?>
				<?php if ( $wa ) : ?>
					<li>
						<span class="contact-list__icon" aria-hidden="true">✆</span>
						<div>
							<span><?php esc_html_e( 'WhatsApp', 'amz-prints' ); ?></span>
							<a href="<?php echo esc_url( $wa_link ); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html( $wa ); ?></a>
						</div>
					</li>
				<?php endif; ?>
				<?php if ( amz_prints_mod( 'amz_email' ) ) : ?>
					<li>
						<span class="contact-list__icon" aria-hidden="true">✉</span>
						<div>
							<span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span>
							<a href="mailto:<?php echo esc_attr( amz_prints_mod( 'amz_email' ) ); ?>"><?php echo esc_html( amz_prints_mod( 'amz_email' ) ); ?></a>
						</div>
					</li>
				<?php endif; ?>
				<?php if ( amz_prints_mod( 'amz_address' ) ) : ?>
					<li>
						<span class="contact-list__icon" aria-hidden="true">⌂</span>
						<div>
							<span><?php esc_html_e( 'Address', 'amz-prints' ); ?></span>
							<strong><?php echo esc_html( amz_prints_mod( 'amz_address' ) ); ?></strong>
						</div>
					</li>
				<?php endif; ?>
				<?php if ( amz_prints_mod( 'amz_hours' ) ) : ?>
					<li>
						<span class="contact-list__icon" aria-hidden="true">◷</span>
						<div>
							<span><?php esc_html_e( 'Business hours', 'amz-prints' ); ?></span>
							<strong><?php echo esc_html( amz_prints_mod( 'amz_hours' ) ); ?></strong>
						</div>
					</li>
				<?php endif; ?>
			</ul>
			<?php
			$social_links = array();
			foreach ( $socials as $network => $label ) {
				$url = (string) amz_prints_mod( 'amz_social_' . $network, '' );
				if ( $url ) {
					$social_links[ $label ] = $url;
				}
			}
			if ( $social_links ) :
				?>
				<div class="contact-social">
					<span><?php esc_html_e( 'Social', 'amz-prints' ); ?></span>
					<ul>
						<?php foreach ( $social_links as $label => $url ) : ?>
							<li><a href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html( $label ); ?></a></li>
						<?php endforeach; ?>
					</ul>
				</div>
			<?php endif; ?>
		</div>

		<div class="contact-form-wrap contact-panel reveal" data-reveal>
			<h2><?php esc_html_e( 'Contact form', 'amz-prints' ); ?></h2>
			<?php
			while ( have_posts() ) :
				the_post();
				if ( trim( get_the_content() ) ) {
					the_content();
				} else {
					?>
					<form class="amz-form" id="amz-wa-contact-form" data-wa-form data-lead-source="website-contact">
						<label>
							<span>Name</span>
							<input type="text" name="name" required>
						</label>
						<label>
							<span>Email</span>
							<input type="email" name="email" required>
						</label>
						<label>
							<span>Phone</span>
							<input type="tel" name="phone" required>
						</label>
						<label>
							<span>Message</span>
							<textarea name="message" rows="5" required></textarea>
						</label>
						<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Send on WhatsApp', 'amz-prints' ); ?></button>
					</form>
					<?php
				}
			endwhile;
			?>
		</div>
	</div>
</section>

<?php get_footer(); ?>
