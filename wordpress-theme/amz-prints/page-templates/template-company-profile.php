<?php
/**
 * Template Name: Company Profile Catalog
 * Multi-page A4 company profile book — print / Save as PDF.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$company   = amz_prints_mod( 'amz_company_name', 'AMZ Prints' );
$legal     = amz_prints_mod( 'amz_legal_name', 'Amazon Printings (Pvt) Ltd' );
$tagline   = amz_prints_mod( 'amz_company_tagline', 'Professional Printing & Advertising Services' );
$phone     = amz_prints_mod( 'amz_phone', '' );
$email     = amz_prints_mod( 'amz_email', 'hello@amzprints.com' );
$address   = amz_prints_mod( 'amz_address', '' );
$hours     = amz_prints_mod( 'amz_hours', 'Mon–Sat · 9am – 6pm' );
$about     = amz_prints_mod( 'amz_about_blurb', 'Amazon Printings (Pvt) Ltd is a full-service print and advertising company delivering digital printing, branding, packaging, NADRA e-services facilitation, and digital solutions with speed and color precision.' );
$mission   = amz_prints_mod( 'amz_mission', 'To help brands look premium in print and digital — with reliable production, clear communication, and craftsmanship that earns repeat trust.' );
$vision    = amz_prints_mod( 'amz_vision', 'To be Pakistan’s most dependable print + digital partner — where every job is tracked, every color is intentional, and every client feels looked after.' );
$catalog   = function_exists( 'amz_prints_services_catalog' ) ? amz_prints_services_catalog() : array();
$site_url  = home_url( '/' );
$wa_raw    = preg_replace( '/\D+/', '', amz_prints_mod( 'amz_whatsapp', $phone ) );
$wa_link   = $wa_raw ? ( 'https://wa.me/' . $wa_raw ) : $site_url;
$logo_url  = '';
if ( function_exists( 'has_custom_logo' ) && has_custom_logo() ) {
	$logo_id  = get_theme_mod( 'custom_logo' );
	$logo_url = $logo_id ? wp_get_attachment_image_url( $logo_id, 'medium' ) : '';
}
$auto_print = isset( $_GET['print'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$body_class = $auto_print ? 'catalog-print-mode' : '';

$toc = array(
	array( 'About Us', '03' ),
	array( 'Mission & Vision', '04' ),
	array( 'Services Overview', '05' ),
	array( 'Service Portfolio', '06+' ),
	array( 'Digital Services', '—' ),
	array( 'Why Choose Us', '—' ),
	array( 'Branches', '—' ),
	array( 'Contact & QR', '—' ),
);

$why = array(
	'Print and digital under one roof — consistent brand from press to website.',
	'Live order tracking and process clarity from brief to delivery.',
	'Authorized NADRA e-services facilitation with trained staff.',
	'Custom-coded digital products — not disposable templates.',
	'Local branches and WhatsApp support you can actually reach.',
	'Quality checks at every production station before handover.',
);

$digital_points = array(
	'Website design & development (business, ecommerce, portals)',
	'Custom software / ERP modules tailored to your workflow',
	'Social media management with on-brand creatives',
	'UI/UX, SEO structure, analytics and launch support',
);

$portfolio = array(
	array( 'title' => 'Brand kits & packaging', 'img' => 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Large format campaigns', 'img' => 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Corporate stationery', 'img' => 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Digital product UI', 'img' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80' ),
);

// Chunk service categories: 2 per A4 page.
$service_chunks = array_chunk( $catalog, 2 );
$page_no        = 1;

?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html( $legal ); ?> — <?php esc_html_e( 'Company Profile Catalog', 'amz-prints' ); ?></title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'amz-catalog-body ' . $body_class ); ?>>
<?php wp_body_open(); ?>

<div class="catalog-toolbar no-print">
	<div class="catalog-toolbar__inner">
		<strong><?php esc_html_e( 'Company Profile Catalog (A4)', 'amz-prints' ); ?></strong>
		<div class="catalog-toolbar__actions">
			<button type="button" class="btn btn--primary" id="amz-catalog-print"><?php esc_html_e( 'Download PDF', 'amz-prints' ); ?></button>
			<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to site', 'amz-prints' ); ?></a>
		</div>
	</div>
	<p class="catalog-toolbar__hint"><?php esc_html_e( 'Tip: In the print dialog choose “Save as PDF”, paper size A4, margins Default/None.', 'amz-prints' ); ?></p>
</div>

<main class="catalog-book" id="amz-catalog-book">

	<!-- 01 Cover -->
	<section class="catalog-page catalog-page--cover" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<div class="catalog-cover__brand">
				<?php if ( $logo_url ) : ?>
					<img class="catalog-cover__logo" src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( $company ); ?>">
				<?php else : ?>
					<span class="catalog-cover__mark" aria-hidden="true"></span>
				<?php endif; ?>
				<p class="catalog-cover__short"><?php echo esc_html( $company ); ?></p>
				<h1 class="catalog-cover__legal"><?php echo esc_html( $legal ); ?></h1>
				<p class="catalog-cover__tag"><?php echo esc_html( $tagline ); ?></p>
			</div>
			<div class="catalog-cover__meta">
				<p><?php esc_html_e( 'Company Profile Catalog', 'amz-prints' ); ?></p>
				<p><?php echo esc_html( gmdate( 'Y' ) ); ?> · <?php esc_html_e( 'Confidential business overview', 'amz-prints' ); ?></p>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- 02 Contents -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php echo esc_html( $company ); ?></p>
			<h2 class="catalog-title"><?php esc_html_e( 'Contents', 'amz-prints' ); ?></h2>
			<ol class="catalog-toc">
				<?php foreach ( $toc as $i => $row ) : ?>
					<li>
						<span><?php echo esc_html( $row[0] ); ?></span>
						<em><?php echo esc_html( $row[1] ); ?></em>
					</li>
				<?php endforeach; ?>
			</ol>
			<p class="catalog-note"><?php esc_html_e( 'This catalog summarizes print, branding, NADRA facilitation, and digital / IT capabilities of Amazon Printings (Pvt) Ltd.', 'amz-prints' ); ?></p>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- 03 About -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'About us', 'amz-prints' ); ?></p>
			<h2 class="catalog-title"><?php echo esc_html( $legal ); ?></h2>
			<p class="catalog-lead"><?php echo esc_html( $about ); ?></p>
			<div class="catalog-grid-2">
				<div>
					<h3><?php esc_html_e( 'Official name', 'amz-prints' ); ?></h3>
					<p><?php echo esc_html( $legal ); ?></p>
					<h3><?php esc_html_e( 'Short name', 'amz-prints' ); ?></h3>
					<p><?php echo esc_html( $company ); ?></p>
				</div>
				<div>
					<h3><?php esc_html_e( 'What we deliver', 'amz-prints' ); ?></h3>
					<ul class="catalog-bullets">
						<li><?php esc_html_e( 'Commercial & digital printing', 'amz-prints' ); ?></li>
						<li><?php esc_html_e( 'Branding, signage & packaging', 'amz-prints' ); ?></li>
						<li><?php esc_html_e( 'NADRA e-services facilitation', 'amz-prints' ); ?></li>
						<li><?php esc_html_e( 'Websites, software & social media', 'amz-prints' ); ?></li>
					</ul>
				</div>
			</div>
			<figure class="catalog-hero-shot">
				<img src="https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1200&q=80" alt="">
			</figure>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- 04 Mission Vision -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Purpose', 'amz-prints' ); ?></p>
			<h2 class="catalog-title"><?php esc_html_e( 'Our Mission & Vision', 'amz-prints' ); ?></h2>
			<div class="catalog-mv">
				<article>
					<h3><?php esc_html_e( 'Mission', 'amz-prints' ); ?></h3>
					<p><?php echo esc_html( $mission ); ?></p>
				</article>
				<article>
					<h3><?php esc_html_e( 'Vision', 'amz-prints' ); ?></h3>
					<p><?php echo esc_html( $vision ); ?></p>
				</article>
			</div>
			<div class="catalog-values">
				<div><strong><?php esc_html_e( 'Quality', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Color-true output', 'amz-prints' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Speed', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Clear timelines', 'amz-prints' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Trust', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Tracked delivery', 'amz-prints' ); ?></span></div>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- 05 Services list -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Capabilities', 'amz-prints' ); ?></p>
			<h2 class="catalog-title"><?php esc_html_e( 'Our Services List', 'amz-prints' ); ?></h2>
			<div class="catalog-services-index">
				<?php foreach ( $catalog as $i => $cat ) : ?>
					<div class="catalog-services-index__item">
						<span><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span>
						<strong><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></strong>
						<em><?php echo esc_html( count( $cat['items'] ) ); ?> <?php esc_html_e( 'offerings', 'amz-prints' ); ?></em>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<?php foreach ( $service_chunks as $chunk ) : ?>
		<section class="catalog-page catalog-page--portfolio" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
			<div class="catalog-page__inner">
				<p class="catalog-kicker"><?php esc_html_e( 'Service portfolio', 'amz-prints' ); ?></p>
				<h2 class="catalog-title"><?php esc_html_e( 'Services detail & mockups', 'amz-prints' ); ?></h2>
				<div class="catalog-svc-pair">
					<?php foreach ( $chunk as $cat ) : ?>
						<article class="catalog-svc">
							<figure class="catalog-svc__mock">
								<img src="<?php echo esc_url( $cat['image'] ); ?>" alt="<?php echo esc_attr( amz_prints_svc_label( $cat ) ); ?>">
							</figure>
							<h3><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></h3>
							<ul>
								<?php foreach ( array_slice( $cat['items'], 0, 6 ) as $item ) : ?>
									<li><?php echo esc_html( amz_prints_svc_label( $item ) ); ?></li>
								<?php endforeach; ?>
							</ul>
						</article>
					<?php endforeach; ?>
				</div>
			</div>
			<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
		</section>
	<?php endforeach; ?>

	<!-- Digital -->
	<section class="catalog-page catalog-page--ink" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'IT & Digital', 'amz-prints' ); ?></p>
			<h2 class="catalog-title"><?php esc_html_e( 'Our Digital Services', 'amz-prints' ); ?></h2>
			<p class="catalog-lead"><?php esc_html_e( 'Website design & development, custom software, and social media management — built with the same brand discipline as our print floor.', 'amz-prints' ); ?></p>
			<ul class="catalog-bullets catalog-bullets--light">
				<?php foreach ( $digital_points as $line ) : ?>
					<li><?php echo esc_html( $line ); ?></li>
				<?php endforeach; ?>
			</ul>
			<p class="catalog-link-note"><?php esc_html_e( 'Full details:', 'amz-prints' ); ?> <?php echo esc_html( home_url( '/digital-services/' ) ); ?></p>
			<figure class="catalog-hero-shot catalog-hero-shot--dark">
				<img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" alt="">
			</figure>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- Why choose -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Difference', 'amz-prints' ); ?></p>
			<h2 class="catalog-title"><?php esc_html_e( 'Why choose us', 'amz-prints' ); ?></h2>
			<ul class="catalog-why">
				<?php foreach ( $why as $i => $line ) : ?>
					<li><span><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span><p><?php echo esc_html( $line ); ?></p></li>
				<?php endforeach; ?>
			</ul>
			<h3 class="catalog-sub"><?php esc_html_e( 'Why customized code', 'amz-prints' ); ?></h3>
			<p><?php esc_html_e( 'We build digital products around your real workflow — ownership, security, integrations, and long-term scalability instead of rented templates.', 'amz-prints' ); ?></p>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- Portfolio highlights -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Portfolio', 'amz-prints' ); ?></p>
			<h2 class="catalog-title"><?php esc_html_e( 'Selected work & mockups', 'amz-prints' ); ?></h2>
			<div class="catalog-portfolio">
				<?php foreach ( $portfolio as $item ) : ?>
					<figure>
						<img src="<?php echo esc_url( $item['img'] ); ?>" alt="<?php echo esc_attr( $item['title'] ); ?>">
						<figcaption><?php echo esc_html( $item['title'] ); ?></figcaption>
					</figure>
				<?php endforeach; ?>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- Branches -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Presence', 'amz-prints' ); ?></p>
			<h2 class="catalog-title"><?php esc_html_e( 'Our Branches', 'amz-prints' ); ?></h2>
			<div class="catalog-branches">
				<article>
					<strong>Bahria Town Phase 8</strong>
					<span>Rawalpindi <em>(Coming Soon)</em></span>
				</article>
				<article>
					<strong>Mandi Bahauddin</strong>
					<span>Punjab, Pakistan</span>
				</article>
				<article>
					<strong>Johar Town</strong>
					<span>Lahore</span>
				</article>
			</div>
			<p class="catalog-note"><?php echo esc_html( $hours ); ?><?php echo $address ? ' · ' . esc_html( $address ) : ''; ?></p>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- Contact + QR -->
	<section class="catalog-page catalog-page--contact" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Connect', 'amz-prints' ); ?></p>
			<h2 class="catalog-title"><?php esc_html_e( 'Contact Us', 'amz-prints' ); ?></h2>
			<div class="catalog-contact">
				<div>
					<p><strong><?php echo esc_html( $legal ); ?></strong></p>
					<p><?php echo esc_html( $company ); ?></p>
					<?php if ( $phone ) : ?><p><?php esc_html_e( 'Phone', 'amz-prints' ); ?>: <?php echo esc_html( $phone ); ?></p><?php endif; ?>
					<?php if ( $email ) : ?><p><?php esc_html_e( 'Email', 'amz-prints' ); ?>: <?php echo esc_html( $email ); ?></p><?php endif; ?>
					<p><?php esc_html_e( 'Website', 'amz-prints' ); ?>: <?php echo esc_html( $site_url ); ?></p>
					<?php if ( $wa_raw ) : ?><p><?php esc_html_e( 'WhatsApp', 'amz-prints' ); ?>: +<?php echo esc_html( $wa_raw ); ?></p><?php endif; ?>
				</div>
				<div class="catalog-qr-grid">
					<figure>
						<img src="<?php echo esc_url( amz_prints_qr_url( $site_url, 200 ) ); ?>" alt="<?php esc_attr_e( 'Website QR', 'amz-prints' ); ?>">
						<figcaption><?php esc_html_e( 'Website QR', 'amz-prints' ); ?></figcaption>
					</figure>
					<figure>
						<img src="<?php echo esc_url( amz_prints_qr_url( $wa_link, 200 ) ); ?>" alt="<?php esc_attr_e( 'WhatsApp QR', 'amz-prints' ); ?>">
						<figcaption><?php esc_html_e( 'WhatsApp QR', 'amz-prints' ); ?></figcaption>
					</figure>
				</div>
			</div>
			<p class="catalog-thanks"><?php esc_html_e( 'Thank you for considering AMZ Prints. We look forward to building your next project.', 'amz-prints' ); ?></p>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

</main>

<script>
(function () {
  function runPrint() {
    window.print();
  }
  var btn = document.getElementById('amz-catalog-print');
  if (btn) btn.addEventListener('click', runPrint);
  if (document.body.classList.contains('catalog-print-mode')) {
    window.setTimeout(runPrint, 700);
  }
})();
</script>
<?php wp_footer(); ?>
</body>
</html>
