<?php
/**
 * Shared page banners and the NADRA certificate card.
 *
 * Copy and images come from the Customizer. Icons are the fallback when no image is uploaded.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Default title and lead for each managed page banner.
 *
 * @return array<string,array{title:string,lead:string,icon:string}>
 */
function amz_prints_page_banner_defs() {
	return array(
		'services' => array(
			'title' => 'Our Services',
			'lead'  => 'Complete print, branding, digital and IT solutions under one roof.',
			'icon'  => 'services',
		),
		'products' => array(
			'title' => 'Our Products',
			'lead'  => 'Browse print products and open any item for full details.',
			'icon'  => 'products',
		),
		'cv'       => array(
			'title' => 'Free CV',
			'lead'  => 'Create a professional A4 resume on your account, then download the PDF.',
			'icon'  => 'cv',
		),
		'track'    => array(
			'title' => 'Track Your Order',
			'lead'  => 'Enter your Order ID or tracking number. No account is required.',
			'icon'  => 'track',
		),
		'contact'  => array(
			'title' => 'Contact',
			'lead'  => 'Talk to the team — we’re ready when you are.',
			'icon'  => 'contact',
		),
		'account'  => array(
			'title' => 'My Account',
			'lead'  => 'Your customer details, orders, and account tools in one place.',
			'icon'  => 'account',
		),
	);
}

/**
 * Inline vector icon used until an admin uploads a banner image.
 *
 * @param string $name Icon key.
 * @return string
 */
function amz_prints_page_banner_icon( $name ) {
	$common = 'viewBox="0 0 120 120" width="120" height="120" fill="none" aria-hidden="true"';
	$icons  = array(
		'services' => '<svg ' . $common . '><rect x="18" y="22" width="36" height="36" rx="10" stroke="#ff6d00" stroke-width="4"/><rect x="66" y="22" width="36" height="36" rx="10" stroke="#0747a3" stroke-width="4"/><rect x="18" y="62" width="36" height="36" rx="10" stroke="#0747a3" stroke-width="4"/><rect x="66" y="62" width="36" height="36" rx="10" stroke="#ff6d00" stroke-width="4"/><path d="M28 40h16M74 40h16M28 80h16M74 80h16" stroke="#111" stroke-width="3" stroke-linecap="round"/></svg>',
		'products' => '<svg ' . $common . '><path d="M28 42h64l-6 48H34L28 42z" stroke="#0747a3" stroke-width="4" stroke-linejoin="round"/><path d="M46 42V32a14 14 0 0 1 28 0v10" stroke="#ff6d00" stroke-width="4" stroke-linecap="round"/><path d="M48 62h24" stroke="#111" stroke-width="3" stroke-linecap="round"/></svg>',
		'cv'       => '<svg ' . $common . '><rect x="30" y="16" width="60" height="88" rx="8" stroke="#0747a3" stroke-width="4"/><circle cx="60" cy="40" r="10" stroke="#ff6d00" stroke-width="4"/><path d="M44 66h32M44 78h32M44 90h20" stroke="#111" stroke-width="3" stroke-linecap="round"/></svg>',
		'track'    => '<svg ' . $common . '><rect x="22" y="28" width="76" height="52" rx="10" stroke="#0747a3" stroke-width="4"/><path d="M22 44h76" stroke="#0747a3" stroke-width="4"/><circle cx="60" cy="92" r="10" stroke="#ff6d00" stroke-width="4"/><path d="M60 80v-8" stroke="#ff6d00" stroke-width="4" stroke-linecap="round"/><path d="M40 58h18" stroke="#111" stroke-width="3" stroke-linecap="round"/></svg>',
		'contact'  => '<svg ' . $common . '><path d="M36 28h48a10 10 0 0 1 10 10v28a10 10 0 0 1-10 10H58l-16 16v-16H36a10 10 0 0 1-10-10V38a10 10 0 0 1 10-10z" stroke="#0747a3" stroke-width="4" stroke-linejoin="round"/><path d="M42 48h36M42 60h22" stroke="#ff6d00" stroke-width="4" stroke-linecap="round"/></svg>',
		'account'  => '<svg ' . $common . '><circle cx="60" cy="44" r="16" stroke="#0747a3" stroke-width="4"/><path d="M28 96c4-18 16-26 32-26s28 8 32 26" stroke="#ff6d00" stroke-width="4" stroke-linecap="round"/></svg>',
	);
	return isset( $icons[ $name ] ) ? $icons[ $name ] : $icons['services'];
}

/**
 * Render a managed page banner.
 *
 * @param string $key Banner key from amz_prints_page_banner_defs().
 */
function amz_prints_page_banner( $key ) {
	$defs = amz_prints_page_banner_defs();
	if ( ! isset( $defs[ $key ] ) ) {
		return;
	}
	$def    = $defs[ $key ];
	$title  = (string) amz_prints_mod( 'amz_banner_' . $key . '_title', $def['title'] );
	$lead   = (string) amz_prints_mod( 'amz_banner_' . $key . '_lead', $def['lead'] );
	$img_id = absint( amz_prints_mod( 'amz_banner_' . $key . '_image', 0 ) );
	$img    = $img_id ? (string) wp_get_attachment_image_url( $img_id, 'large' ) : '';
	?>
	<section class="amz-banner amz-banner--<?php echo esc_attr( $key ); ?>">
		<div class="amz-banner__panel">
			<div class="amz-banner__mark" aria-hidden="true">
				<?php if ( $img ) : ?>
					<img src="<?php echo esc_url( $img ); ?>" alt="">
				<?php else : ?>
					<?php echo amz_prints_page_banner_icon( $def['icon'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<?php endif; ?>
			</div>
			<div class="amz-banner__copy">
				<h1><?php echo esc_html( $title ); ?></h1>
				<?php if ( '' !== trim( $lead ) ) : ?>
					<p><?php echo esc_html( $lead ); ?></p>
				<?php endif; ?>
			</div>
		</div>
	</section>
	<?php
}

/**
 * NADRA certificate card. Uses saved certificate text and the uploaded document only.
 */
function amz_prints_nadra_certificate() {
	$company = (string) amz_prints_mod( 'amz_legal_name', 'Amazon Printings (Pvt) Ltd' );
	$title   = (string) amz_prints_mod( 'amz_nadra_cert_title', 'Authorized NADRA Partner' );
	$lead    = (string) amz_prints_mod( 'amz_nadra_lead', 'Official NADRA e-services facilitation — trusted, authorized, and customer-friendly.' );
	$blurb   = (string) amz_prints_mod( 'amz_nadra_blurb', 'AMZ Prints is an authorized partner for NADRA e-services. Citizens can visit our counter for guided support on identity and registration services — with clear process, trained staff, and professional document handling.' );
	$note    = trim( (string) amz_prints_mod( 'amz_nadra_cert_note', '' ) );
	$img_id  = absint( amz_prints_mod( 'amz_nadra_cert_image', 0 ) );
	$page    = home_url( '/nadra-e-services/' );
	$qr      = function_exists( 'amz_prints_qr_url' ) ? amz_prints_qr_url( $page, 180 ) : '';
	?>
	<article class="amz-cert">
		<div class="amz-cert__sheet">
			<div class="amz-cert__doc">
				<?php
				if ( $img_id ) {
					echo wp_get_attachment_image(
						$img_id,
						'large',
						false,
						array(
							'class' => 'amz-cert__photo',
							'alt'   => $title,
						)
					);
				} else {
					?>
					<div class="amz-cert__empty">
						<strong><?php esc_html_e( 'Certificate', 'amz-prints' ); ?></strong>
						<span><?php esc_html_e( 'Upload the certificate image in Appearance → Customize → NADRA E-Services.', 'amz-prints' ); ?></span>
					</div>
					<?php
				}
				?>
			</div>
			<div class="amz-cert__body">
				<p class="amz-cert__kicker"><?php esc_html_e( 'NADRA e-services', 'amz-prints' ); ?></p>
				<h2><?php echo esc_html( $title ); ?></h2>
				<p class="amz-cert__company"><?php echo esc_html( $company ); ?></p>
				<?php if ( '' !== trim( $lead ) ) : ?>
					<p><?php echo esc_html( $lead ); ?></p>
				<?php endif; ?>
				<?php if ( '' !== trim( $blurb ) ) : ?>
					<p><?php echo esc_html( $blurb ); ?></p>
				<?php endif; ?>
				<?php if ( '' !== $note ) : ?>
					<p class="amz-cert__note"><?php echo esc_html( $note ); ?></p>
				<?php endif; ?>
			</div>
			<?php if ( $qr ) : ?>
				<aside class="amz-cert__verify">
					<img src="<?php echo esc_url( $qr ); ?>" width="108" height="108" alt="<?php esc_attr_e( 'QR code for the NADRA e-services page', 'amz-prints' ); ?>">
					<span><?php esc_html_e( 'Scan to open this page', 'amz-prints' ); ?></span>
				</aside>
			<?php endif; ?>
		</div>
	</article>
	<?php
}
