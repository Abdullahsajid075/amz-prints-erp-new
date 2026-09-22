<?php
/**
 * Template Name: Contact
 *
 * @package AMZ_Prints
 */

get_header();
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'Talk to the team — we’re ready when you are.', 'amz-prints' ); ?></p>
	</div>
</section>

<section class="section">
	<div class="container contact-layout">
		<div class="contact-info reveal" data-reveal>
			<h2><?php esc_html_e( 'Reach us', 'amz-prints' ); ?></h2>
			<ul class="contact-list">
				<?php if ( amz_prints_mod( 'amz_phone' ) ) : ?>
					<li>
						<span><?php esc_html_e( 'Phone', 'amz-prints' ); ?></span>
						<a href="tel:<?php echo esc_attr( preg_replace( '/\s+/', '', amz_prints_mod( 'amz_phone' ) ) ); ?>"><?php echo esc_html( amz_prints_mod( 'amz_phone' ) ); ?></a>
					</li>
				<?php endif; ?>
				<?php if ( amz_prints_mod( 'amz_email' ) ) : ?>
					<li>
						<span><?php esc_html_e( 'Email', 'amz-prints' ); ?></span>
						<a href="mailto:<?php echo esc_attr( amz_prints_mod( 'amz_email' ) ); ?>"><?php echo esc_html( amz_prints_mod( 'amz_email' ) ); ?></a>
					</li>
				<?php endif; ?>
				<?php if ( amz_prints_mod( 'amz_address' ) ) : ?>
					<li>
						<span><?php esc_html_e( 'Address', 'amz-prints' ); ?></span>
						<strong><?php echo esc_html( amz_prints_mod( 'amz_address' ) ); ?></strong>
					</li>
				<?php endif; ?>
				<?php if ( amz_prints_mod( 'amz_hours' ) ) : ?>
					<li>
						<span><?php esc_html_e( 'Hours', 'amz-prints' ); ?></span>
						<strong><?php echo esc_html( amz_prints_mod( 'amz_hours' ) ); ?></strong>
					</li>
				<?php endif; ?>
			</ul>
			<?php
			$wa = amz_prints_mod( 'amz_whatsapp', '' );
			if ( $wa ) :
				$wa_link = 'https://wa.me/' . preg_replace( '/\D+/', '', $wa );
				?>
				<a class="btn btn--primary" href="<?php echo esc_url( $wa_link ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Chat on WhatsApp', 'amz-prints' ); ?></a>
			<?php endif; ?>
		</div>

		<div class="contact-form-wrap reveal" data-reveal>
			<?php
			while ( have_posts() ) :
				the_post();
				if ( trim( get_the_content() ) ) {
					the_content();
				} else {
					?>
					<form class="amz-form" id="amz-wa-contact-form" data-wa-form>
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
						<button type="submit" class="btn btn--primary btn--lg">Send on WhatsApp</button>
						<p class="form-note">Opens WhatsApp with your full message and REQUIRED INFO header.</p>
					</form>
					<?php
				}
			endwhile;
			?>
		</div>
	</div>
</section>

<?php get_footer(); ?>
