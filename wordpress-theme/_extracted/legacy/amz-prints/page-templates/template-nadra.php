<?php
/**
 * Template Name: NADRA E-Services
 *
 * @package AMZ_Prints
 */

get_header();

echo '<div class="amz-nadra-page">';

$services = array(
	array( 'title' => 'CNIC / Smart Card Support', 'text' => 'Guidance and facilitation for NADRA CNIC and Smart National Identity Card related e-services at our authorized counter.' ),
	array( 'title' => 'Family Registration (FRC)', 'text' => 'Assistance with Family Registration Certificate applications and related documentation support.' ),
	array( 'title' => 'CRC & Child Registration', 'text' => 'Help with Child Registration Certificate processing and required information preparation.' ),
	array( 'title' => 'Biometric / Verification Support', 'text' => 'On-site support for verification steps where applicable — handled under NADRA authorized partner guidelines.' ),
	array( 'title' => 'Document Printing & Attestation Prep', 'text' => 'Clear prints of application forms, photos, and supporting documents prepared to NADRA standards.' ),
	array( 'title' => 'Status Follow-up Guidance', 'text' => 'We help you understand next steps and tracking for submitted applications.' ),
);

$certs = array(
	array( 'title' => 'Authorized NADRA Partner', 'text' => 'Official authorization to facilitate NADRA e-services for the public.', 'badge' => 'Partner' ),
	array( 'title' => 'Trained Operators', 'text' => 'Staff trained on NADRA workflows, data care, and customer handling.', 'badge' => 'Training' ),
	array( 'title' => 'Secure Process', 'text' => 'Privacy-conscious handling of personal information at every step.', 'badge' => 'Security' ),
	array( 'title' => 'Verified Facility', 'text' => 'Service desk operating under partner compliance standards.', 'badge' => 'Verified' ),
);
?>

<section class="page-hero page-hero--nadra">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<p class="page-hero__kicker"><?php esc_html_e( 'Authorized Partner', 'amz-prints' ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php echo esc_html( amz_prints_mod( 'amz_nadra_lead', 'Official NADRA e-services facilitation — trusted, authorized, and customer-friendly.' ) ); ?></p>
	</div>
</section>

<section class="section">
	<div class="container nadra-partner reveal" data-reveal>
		<div class="nadra-partner__badge" aria-hidden="true">
			<div class="nadra-seal">
				<span class="nadra-seal__ring"></span>
				<span class="nadra-seal__core">NADRA</span>
				<span class="nadra-seal__sub">Authorized Partner</span>
			</div>
		</div>
		<div class="nadra-partner__copy">
			<h2><?php esc_html_e( 'We’re an authorized NADRA partner', 'amz-prints' ); ?></h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_nadra_blurb', 'AMZ Prints is an authorized partner for NADRA e-services. Citizens can visit our counter for guided support on identity and registration services — with clear process, trained staff, and professional document handling.' ) ); ?></p>
			<ul class="check-list">
				<li><?php esc_html_e( 'Authorized partner status', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Trained customer service team', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Transparent steps & documentation help', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Combined with our printing expertise', 'amz-prints' ); ?></li>
			</ul>
			<?php
			$cert_img = absint( amz_prints_mod( 'amz_nadra_cert_image', 0 ) );
			if ( $cert_img ) :
				echo wp_get_attachment_image( $cert_img, 'large', false, array( 'class' => 'nadra-cert-photo' ) );
			endif;
			?>
		</div>
	</div>
</section>

<section class="section section--muted">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<h2><?php esc_html_e( 'NADRA e-services we facilitate', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Visit our counter for guided support. Requirements may vary by case — our team will advise on the spot.', 'amz-prints' ); ?></p>
		</header>
		<div class="service-grid">
			<?php foreach ( $services as $service ) : ?>
				<article class="service-item reveal" data-reveal>
					<div class="service-item__link">
						<span class="service-item__icon"><?php echo amz_prints_icon_svg( 'type' ); // phpcs:ignore ?></span>
						<h3><?php echo esc_html( $service['title'] ); ?></h3>
						<p><?php echo esc_html( $service['text'] ); ?></p>
					</div>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section class="section" id="certifications">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<h2><?php esc_html_e( 'Certifications & trust', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Credentials that back our partnership and service quality.', 'amz-prints' ); ?></p>
		</header>
		<div class="cert-grid">
			<?php foreach ( $certs as $cert ) : ?>
				<article class="cert-card reveal" data-reveal>
					<span class="cert-card__badge"><?php echo esc_html( $cert['badge'] ); ?></span>
					<h3><?php echo esc_html( $cert['title'] ); ?></h3>
					<p><?php echo esc_html( $cert['text'] ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>
		<p class="cert-note reveal" data-reveal>
			<?php esc_html_e( 'Upload your official partner certificate image in Customize → NADRA E-Services. Replace service descriptions by editing this page content anytime.', 'amz-prints' ); ?>
		</p>
	</div>
</section>

<section class="section section--cta">
	<div class="container cta-band reveal" data-reveal>
		<div class="cta-band__copy">
			<h2><?php esc_html_e( 'Need NADRA e-services today?', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Visit our authorized counter or contact us for timings and required documents.', 'amz-prints' ); ?></p>
		</div>
		<a class="btn btn--primary btn--lg" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Contact Us', 'amz-prints' ); ?></a>
	</div>
</section>

<?php
while ( have_posts() ) :
	the_post();
	if ( trim( get_the_content() ) ) :
		?>
		<section class="section section--muted">
			<div class="container content-narrow"><?php the_content(); ?></div>
		</section>
		<?php
	endif;
endwhile;

echo '</div>';

get_footer();
