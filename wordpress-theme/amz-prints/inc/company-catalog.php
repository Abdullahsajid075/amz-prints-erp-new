<?php
/**
 * Dual company profile catalog helpers (Print + Digital).
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Whether current request is a catalog PDF book template.
 *
 * @return bool
 */
function amz_prints_is_catalog_book() {
	if ( is_page_template( 'page-templates/template-company-profile-print.php' )
		|| is_page_template( 'page-templates/template-company-profile-digital.php' ) ) {
		return true;
	}
	if ( is_page( array( 'company-profile-print', 'company-profile-digital' ) ) ) {
		return true;
	}
	return false;
}

/**
 * Catalog page URL by type.
 *
 * @param string $type     print|digital|hub.
 * @param bool   $download Auto-download query.
 * @return string
 */
function amz_prints_catalog_url( $type = 'hub', $download = false ) {
	$map = array(
		'hub'     => '/company-profile/',
		'print'   => '/company-profile-print/',
		'digital' => '/company-profile-digital/',
	);
	$path = isset( $map[ $type ] ) ? $map[ $type ] : $map['hub'];
	$url  = home_url( $path );
	if ( $download && 'hub' !== $type ) {
		$url = add_query_arg( 'download', '1', $url );
	}
	return $url;
}

/**
 * Legacy alias.
 *
 * @param bool $download Auto download.
 * @return string
 */
function amz_prints_company_profile_url( $download = false ) {
	return amz_prints_catalog_url( 'hub', false );
}

/**
 * QR image URL.
 *
 * @param string $data Payload.
 * @param int    $size Size.
 * @return string
 */
function amz_prints_qr_url( $data, $size = 220 ) {
	$size = max( 80, min( 400, (int) $size ) );
	// quickchart.io supports CORS for canvas/PDF capture.
	return 'https://quickchart.io/qr?size=' . $size . '&margin=2&text=' . rawurlencode( (string) $data );
}

/**
 * Shared catalog company context.
 *
 * @return array
 */
function amz_prints_catalog_context() {
	$phone   = amz_prints_mod( 'amz_phone', '' );
	$wa_raw  = preg_replace( '/\D+/', '', amz_prints_mod( 'amz_whatsapp', $phone ) );
	$site    = home_url( '/' );
	$logo    = '';
	if ( function_exists( 'has_custom_logo' ) && has_custom_logo() ) {
		$logo_id = get_theme_mod( 'custom_logo' );
		$logo    = $logo_id ? wp_get_attachment_image_url( $logo_id, 'medium' ) : '';
	}
	return array(
		'company'  => amz_prints_mod( 'amz_company_name', 'AMZ Prints' ),
		'legal'    => amz_prints_mod( 'amz_legal_name', 'Amazon Printings (Pvt) Ltd' ),
		'tagline'  => amz_prints_mod( 'amz_company_tagline', 'Professional Printing & Advertising Services' ),
		'phone'    => $phone,
		'email'    => amz_prints_mod( 'amz_email', 'hello@amzprints.com' ),
		'address'  => amz_prints_mod( 'amz_address', '' ),
		'hours'    => amz_prints_mod( 'amz_hours', 'Mon–Sat · 9am – 6pm' ),
		'about'    => amz_prints_mod(
			'amz_about_blurb',
			'Amazon Printings (Pvt) Ltd — known as AMZ Prints — is a full-service print, branding, and digital company delivering commercial printing, large-format campaigns, packaging, NADRA facilitation, websites, custom software, and social media.'
		),
		'mission'  => amz_prints_mod(
			'amz_mission',
			'To help brands look premium in print and digital — with reliable production, clear communication, and craftsmanship that earns repeat trust.'
		),
		'vision'   => amz_prints_mod(
			'amz_vision',
			'To be Pakistans most dependable print + digital partner — where every job is tracked, every color is intentional, and every client feels looked after.'
		),
		'site_url' => $site,
		'wa_raw'   => $wa_raw,
		'wa_link'  => $wa_raw ? ( 'https://wa.me/' . $wa_raw ) : $site,
		'logo_url' => $logo,
		'year'     => gmdate( 'Y' ),
	);
}

/**
 * Service categories for print & design catalog.
 *
 * @return array
 */
function amz_prints_catalog_print_services() {
	$slugs = array(
		'printing-services',
		'branding-signage',
		'marketing-materials',
		'packaging-solutions',
		'promotional-items',
		'corporate-branding',
		'document-office-printing',
		'graphic-design',
		'photography-media',
		'custom-printing',
	);
	$all   = function_exists( 'amz_prints_services_catalog' ) ? amz_prints_services_catalog() : array();
	$out   = array();
	foreach ( $all as $cat ) {
		if ( in_array( $cat['slug'], $slugs, true ) ) {
			$out[] = $cat;
		}
	}
	return $out;
}

/**
 * Service categories for digital / IT catalog.
 *
 * @return array
 */
function amz_prints_catalog_digital_services() {
	$slugs = array( 'web-digital-services', 'it-technology-services' );
	$all   = function_exists( 'amz_prints_services_catalog' ) ? amz_prints_services_catalog() : array();
	$out   = array();
	foreach ( $all as $cat ) {
		if ( in_array( $cat['slug'], $slugs, true ) ) {
			$out[] = $cat;
		}
	}
	return $out;
}

/**
 * Download button for a catalog type.
 *
 * @param array $args Args.
 */
function amz_prints_catalog_download_button( $args = array() ) {
	$args  = wp_parse_args(
		$args,
		array(
			'class'    => 'btn btn--primary btn--magnetic',
			'label'    => __( 'Download PDF', 'amz-prints' ),
			'type'     => 'print',
			'download' => true,
			'size'     => '',
		)
	);
	$class = $args['class'];
	if ( $args['size'] ) {
		$class .= ' ' . $args['size'];
	}
	$url = amz_prints_catalog_url( $args['type'], ! empty( $args['download'] ) );
	printf(
		'<a class="%1$s" href="%2$s" target="_blank" rel="noopener noreferrer" data-catalog-download>%3$s</a>',
		esc_attr( $class ),
		esc_url( $url ),
		esc_html( $args['label'] )
	);
}

/**
 * Dual catalog promo (home / services / digital).
 *
 * @param string $context home|services|digital.
 */
function amz_prints_catalog_promo( $context = 'home' ) {
	$focus = 'both';
	if ( 'digital' === $context ) {
		$focus = 'digital';
	} elseif ( 'services' === $context ) {
		$focus = 'print';
	}
	?>
	<section class="section catalog-promo catalog-promo--dual reveal" data-reveal>
		<div class="container">
			<header class="section-head catalog-promo__head">
				<p class="eyebrow"><?php esc_html_e( 'Company profiles', 'amz-prints' ); ?></p>
				<h2><?php esc_html_e( 'Download the right catalog for your needs', 'amz-prints' ); ?></h2>
				<p><?php esc_html_e( 'Two beautifully designed landscape A4 PDFs — one for print & design, one for IT & digital. Click download and the file saves automatically.', 'amz-prints' ); ?></p>
			</header>
			<div class="catalog-dual">
				<?php if ( 'digital' !== $focus ) : ?>
				<article class="catalog-dual__card catalog-dual__card--print">
					<p class="eyebrow"><?php esc_html_e( 'Print & Design', 'amz-prints' ); ?></p>
					<h3><?php esc_html_e( 'Printing & Designing Profile', 'amz-prints' ); ?></h3>
					<p><?php esc_html_e( 'Press, branding, packaging, marketing materials, graphic design, and portfolio mockups — warm print-house theme.', 'amz-prints' ); ?></p>
					<div class="catalog-dual__actions">
						<?php
						amz_prints_catalog_download_button(
							array(
								'class' => 'btn btn--primary btn--magnetic',
								'label' => __( 'Download Print PDF', 'amz-prints' ),
								'type'  => 'print',
							)
						);
						?>
						<a class="btn btn--ghost btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'print' ) ); ?>"><?php esc_html_e( 'Preview', 'amz-prints' ); ?></a>
					</div>
				</article>
				<?php endif; ?>
				<?php if ( 'print' !== $focus ) : ?>
				<article class="catalog-dual__card catalog-dual__card--digital">
					<p class="eyebrow"><?php esc_html_e( 'IT & Digital', 'amz-prints' ); ?></p>
					<h3><?php esc_html_e( 'Digital Services Profile', 'amz-prints' ); ?></h3>
					<p><?php esc_html_e( 'Websites, custom software, social media, process, and why choose us — modern tech theme with contact QRs.', 'amz-prints' ); ?></p>
					<div class="catalog-dual__actions">
						<?php
						amz_prints_catalog_download_button(
							array(
								'class' => 'btn btn--primary btn--magnetic',
								'label' => __( 'Download Digital PDF', 'amz-prints' ),
								'type'  => 'digital',
							)
						);
						?>
						<a class="btn btn--ghost btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'digital' ) ); ?>"><?php esc_html_e( 'Preview', 'amz-prints' ); ?></a>
					</div>
				</article>
				<?php endif; ?>
			</div>
		</div>
	</section>
	<?php
}

/**
 * Homepage dual service pillars.
 */
function amz_prints_home_service_pillars() {
	?>
	<section class="section section--pillars" id="divisions">
		<div class="container">
			<header class="section-head reveal" data-reveal>
				<p class="eyebrow"><?php esc_html_e( 'Two worlds. One brand.', 'amz-prints' ); ?></p>
				<h2><?php esc_html_e( 'Print & Design · IT & Digital', 'amz-prints' ); ?></h2>
				<p><?php esc_html_e( 'Whether you need press-ready production or custom-coded digital products — AMZ delivers both with the same standard of craft.', 'amz-prints' ); ?></p>
			</header>
			<div class="service-pillars">
				<article class="service-pillar service-pillar--print reveal has-tilt" data-reveal>
					<div class="service-pillar__media" style="background-image:url('https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1200&q=80')"></div>
					<div class="service-pillar__body">
						<p class="eyebrow"><?php esc_html_e( 'Press & craft', 'amz-prints' ); ?></p>
						<h3><?php esc_html_e( 'Printing & Designing', 'amz-prints' ); ?></h3>
						<p><?php esc_html_e( 'Digital & offset printing, branding, signage, packaging, marketing materials, graphic design, and custom finishes.', 'amz-prints' ); ?></p>
						<ul>
							<li><?php esc_html_e( 'Commercial & large-format print', 'amz-prints' ); ?></li>
							<li><?php esc_html_e( 'Brand identity & signage', 'amz-prints' ); ?></li>
							<li><?php esc_html_e( 'Packaging & promotional items', 'amz-prints' ); ?></li>
						</ul>
						<div class="service-pillar__actions">
							<a class="btn btn--primary btn--magnetic" href="<?php echo esc_url( home_url( '/services/' ) ); ?>"><?php esc_html_e( 'Explore print services', 'amz-prints' ); ?></a>
							<a class="btn btn--ghost btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'print', true ) ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Download Print Profile', 'amz-prints' ); ?></a>
						</div>
					</div>
				</article>
				<article class="service-pillar service-pillar--digital reveal has-tilt" data-reveal>
					<div class="service-pillar__media" style="background-image:url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80')"></div>
					<div class="service-pillar__body">
						<p class="eyebrow"><?php esc_html_e( 'Code & screens', 'amz-prints' ); ?></p>
						<h3><?php esc_html_e( 'IT & Digital Services', 'amz-prints' ); ?></h3>
						<p><?php esc_html_e( 'Website design & development, custom software, social media management, and tech solutions built around your workflow.', 'amz-prints' ); ?></p>
						<ul>
							<li><?php esc_html_e( 'Business & ecommerce websites', 'amz-prints' ); ?></li>
							<li><?php esc_html_e( 'Custom software / ERP modules', 'amz-prints' ); ?></li>
							<li><?php esc_html_e( 'Social media & digital growth', 'amz-prints' ); ?></li>
						</ul>
						<div class="service-pillar__actions">
							<a class="btn btn--primary btn--magnetic" href="<?php echo esc_url( home_url( '/digital-services/' ) ); ?>"><?php esc_html_e( 'Explore digital services', 'amz-prints' ); ?></a>
							<a class="btn btn--ghost btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'digital', true ) ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Download Digital Profile', 'amz-prints' ); ?></a>
						</div>
					</div>
				</article>
			</div>
		</div>
	</section>
	<?php
}

/**
 * Inline download script removed — uses assets/js/catalog-pdf.js via enqueue.
 *
 * @param string $filename Unused (kept for back-compat).
 */
function amz_prints_catalog_download_script( $filename = 'AMZ-Prints-Company-Profile.pdf' ) {
	// Intentionally empty — PDF logic lives in catalog-pdf.js.
}
