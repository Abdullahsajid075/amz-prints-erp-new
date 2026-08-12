<?php
/**
 * Template Name: Company Profile — Print & Design
 * Real flip-book catalog (sample-style pages).
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$c         = amz_prints_catalog_context();
$catalog   = amz_prints_catalog_print_services();
$auto_dl   = isset( $_GET['download'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$svc_blurb = array(
	'printing-services'        => 'Commercial and specialty print with color-true output for marketing and production runs.',
	'branding-signage'         => 'Indoor and outdoor identity systems for storefronts, fleets, and events.',
	'marketing-materials'      => 'Business cards, flyers, catalogs, and folders that feel premium in the hand.',
	'packaging-solutions'      => 'Product boxes, labels, and custom packs that protect and sell.',
	'promotional-items'        => 'Branded gifts and giveaways that keep your name in clients hands.',
	'corporate-branding'       => 'Logo systems, office branding, and exhibition stands.',
	'document-office-printing' => 'Documents, binding, IDs, certificates, and finishing.',
	'graphic-design'           => 'Logos, social creatives, packaging layouts, and campaign design.',
	'photography-media'        => 'Product and corporate photography plus video for campaigns.',
	'custom-printing'          => 'Wedding cards, invitations, menus, calendars, and custom gifts.',
);
$toc = array(
	array( 'Introduction', '03' ),
	array( 'Vision', '04' ),
	array( 'Mission', '05' ),
	array( 'Our Best Services', '06' ),
	array( 'Service Portfolio', '07' ),
	array( 'Why Choose Us', '—' ),
	array( 'Our Branches', '—' ),
	array( 'Contact Us', '—' ),
);
$pn = 1;
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html( $c['legal'] ); ?> — Print &amp; Design Profile</title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'amz-catalog-body catalog-theme-print flipbook-body' . ( $auto_dl ? ' catalog-download-mode' : '' ) ); ?>>
<?php wp_body_open(); ?>
<?php
amz_prints_flipbook_shell_open(
	array(
		'theme'    => 'print',
		'title'    => __( 'Printing & Designing Profile', 'amz-prints' ),
		'subtitle' => __( 'Open the book · Flip the pages', 'amz-prints' ),
	)
);
?>

	<!-- COVER -->
	<div class="page page--hard page--cover-print" data-density="hard">
		<div class="page-content page-content--cover">
			<?php if ( $c['logo_url'] ) : ?>
				<img class="page-cover__logo" src="<?php echo esc_url( $c['logo_url'] ); ?>" alt="">
			<?php endif; ?>
			<p class="page-cover__eyebrow">Company Profile <?php echo esc_html( $c['year'] ); ?></p>
			<p class="page-cover__short"><?php echo esc_html( $c['company'] ); ?></p>
			<h1><?php echo esc_html( $c['legal'] ); ?></h1>
			<p class="page-cover__tag">Printing · Branding · Packaging · Graphic Design</p>
		</div>
	</div>

	<!-- INSIDE COVER -->
	<div class="page page--hard" data-density="hard">
		<div class="page-content page-content--center">
			<p class="page-kicker">Official name</p>
			<h2 class="page-title"><?php echo esc_html( $c['legal'] ); ?></h2>
			<p class="page-lead">Short name: <strong><?php echo esc_html( $c['company'] ); ?></strong></p>
			<p class="page-body"><?php echo esc_html( $c['tagline'] ); ?></p>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<!-- TOC (sample style) -->
	<div class="page">
		<div class="page-content page-content--toc">
			<div class="page-orange-bar"><?php esc_html_e( 'Table of Contents', 'amz-prints' ); ?></div>
			<table class="page-toc-table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'SL NO', 'amz-prints' ); ?></th>
						<th><?php esc_html_e( 'Description', 'amz-prints' ); ?></th>
						<th><?php esc_html_e( 'Page', 'amz-prints' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $toc as $i => $row ) : ?>
						<tr>
							<td><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></td>
							<td><?php echo esc_html( $row[0] ); ?></td>
							<td><?php echo esc_html( $row[1] ); ?></td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
			<span class="page-spine-bar page-spine-bar--right" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<!-- INTRODUCTION (sample style) -->
	<div class="page">
		<div class="page-content page-content--intro">
			<span class="page-spine-bar page-spine-bar--left" aria-hidden="true"></span>
			<div class="page-intro-grid">
				<figure class="page-intro-photo">
					<img src="https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=800&q=80" alt="">
				</figure>
				<div class="page-intro-copy">
					<h2 class="page-heading-orange"><?php esc_html_e( 'Introduction', 'amz-prints' ); ?></h2>
					<p><?php echo esc_html( $c['about'] ); ?></p>
					<p><?php esc_html_e( 'We partner with businesses and agencies who need print that looks sharp and arrives on time — from business cards to vehicle wraps, packaging to large-format campaigns.', 'amz-prints' ); ?></p>
					<p><?php esc_html_e( 'Design and press stay under one roof so color and finish never drift from proof to delivery.', 'amz-prints' ); ?></p>
				</div>
			</div>
			<div class="page-bottom-meta">
				<span class="page-logo-mark"><?php echo esc_html( $c['company'] ); ?></span>
				<span class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></span>
			</div>
		</div>
	</div>

	<!-- VISION -->
	<div class="page">
		<div class="page-content">
			<div class="page-orange-bar"><?php esc_html_e( 'Our Vision', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<h2 class="page-title"><?php esc_html_e( 'Where we are going', 'amz-prints' ); ?></h2>
				<p class="page-lead"><?php echo esc_html( $c['vision'] ); ?></p>
				<ul class="page-bullets">
					<li><?php esc_html_e( 'Color-true production across every substrate', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Tracked jobs from brief to handover', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Local branches and WhatsApp support', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Print craftsmanship that earns repeat trust', 'amz-prints' ); ?></li>
				</ul>
			</div>
			<span class="page-spine-bar page-spine-bar--right" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<!-- MISSION -->
	<div class="page">
		<div class="page-content">
			<span class="page-spine-bar page-spine-bar--left" aria-hidden="true"></span>
			<div class="page-orange-bar"><?php esc_html_e( 'Our Mission', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<h2 class="page-title"><?php esc_html_e( 'Why we print', 'amz-prints' ); ?></h2>
				<p class="page-lead"><?php echo esc_html( $c['mission'] ); ?></p>
				<div class="page-value-row">
					<div><strong><?php esc_html_e( 'Quality', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Color-true output', 'amz-prints' ); ?></span></div>
					<div><strong><?php esc_html_e( 'Speed', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Clear timelines', 'amz-prints' ); ?></span></div>
					<div><strong><?php esc_html_e( 'Craft', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Premium finishes', 'amz-prints' ); ?></span></div>
				</div>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<!-- SERVICES INDEX -->
	<div class="page">
		<div class="page-content">
			<div class="page-orange-bar"><?php esc_html_e( 'Our Best Services', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<ul class="page-service-index">
					<?php foreach ( $catalog as $i => $cat ) : ?>
						<li>
							<span><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span>
							<strong><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></strong>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>
			<span class="page-spine-bar page-spine-bar--right" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<!-- Blank spacer for even spread if needed - skip, continue with services -->

	<?php foreach ( $catalog as $cat ) : ?>
		<?php
		$slug  = $cat['slug'];
		$blurb = isset( $svc_blurb[ $slug ] ) ? $svc_blurb[ $slug ] : '';
		?>
		<div class="page">
			<div class="page-content page-content--svc">
				<span class="page-spine-bar page-spine-bar--left" aria-hidden="true"></span>
				<div class="page-orange-bar"><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></div>
				<div class="page-pad page-svc-layout">
					<figure>
						<img src="<?php echo esc_url( $cat['image'] ); ?>" alt="">
					</figure>
					<div>
						<p class="page-body"><?php echo esc_html( $blurb ); ?></p>
						<ul class="page-item-list">
							<?php foreach ( $cat['items'] as $item ) : ?>
								<li><?php echo esc_html( amz_prints_svc_label( $item ) ); ?></li>
							<?php endforeach; ?>
						</ul>
					</div>
				</div>
				<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
			</div>
		</div>
	<?php endforeach; ?>

	<!-- WHY US -->
	<div class="page">
		<div class="page-content">
			<div class="page-orange-bar"><?php esc_html_e( 'Why Choose Us', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<ul class="page-why">
					<li><strong><?php esc_html_e( 'Color that matches', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Calibrated workflows across jobs and substrates.', 'amz-prints' ); ?></span></li>
					<li><strong><?php esc_html_e( 'Deadlines kept', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Transparent timelines from proof to delivery.', 'amz-prints' ); ?></span></li>
					<li><strong><?php esc_html_e( 'Premium finishes', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Lamination, foil, emboss, die-cut details.', 'amz-prints' ); ?></span></li>
					<li><strong><?php esc_html_e( 'Design + press together', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Artwork and production stay aligned.', 'amz-prints' ); ?></span></li>
					<li><strong><?php esc_html_e( 'Tracked production', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Know where every job stands.', 'amz-prints' ); ?></span></li>
					<li><strong><?php esc_html_e( 'Local branches', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Visit us or WhatsApp for fast quotes.', 'amz-prints' ); ?></span></li>
				</ul>
			</div>
			<span class="page-spine-bar page-spine-bar--right" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<!-- BRANCHES + CONTACT -->
	<div class="page">
		<div class="page-content">
			<span class="page-spine-bar page-spine-bar--left" aria-hidden="true"></span>
			<div class="page-orange-bar"><?php esc_html_e( 'Branches & Contact', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<ul class="page-branches">
					<li><strong>Bahria Town Phase 8</strong><span>Rawalpindi (Coming Soon)</span></li>
					<li><strong>Mandi Bahauddin</strong><span>Punjab, Pakistan</span></li>
					<li><strong>Johar Town</strong><span>Lahore</span></li>
				</ul>
				<div class="page-contact">
					<p><strong><?php echo esc_html( $c['legal'] ); ?></strong></p>
					<p><?php echo esc_html( $c['company'] ); ?></p>
					<?php if ( $c['phone'] ) : ?><p><?php echo esc_html( $c['phone'] ); ?></p><?php endif; ?>
					<?php if ( $c['email'] ) : ?><p><?php echo esc_html( $c['email'] ); ?></p><?php endif; ?>
					<p><?php echo esc_html( $c['site_url'] ); ?></p>
				</div>
				<div class="page-qr-row">
					<figure>
						<img src="<?php echo esc_url( amz_prints_qr_url( $c['site_url'], 160 ) ); ?>" alt="Website QR">
						<figcaption>Website</figcaption>
					</figure>
					<figure>
						<img src="<?php echo esc_url( amz_prints_qr_url( $c['wa_link'], 160 ) ); ?>" alt="WhatsApp QR">
						<figcaption>WhatsApp</figcaption>
					</figure>
				</div>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<!-- BACK COVER -->
	<div class="page page--hard page--cover-print" data-density="hard">
		<div class="page-content page-content--cover page-content--back">
			<p class="page-cover__short"><?php echo esc_html( $c['company'] ); ?></p>
			<h2><?php echo esc_html( $c['legal'] ); ?></h2>
			<p class="page-cover__tag"><?php echo esc_html( $c['site_url'] ); ?></p>
			<p class="page-cover__tag"><?php esc_html_e( 'Thank you', 'amz-prints' ); ?></p>
		</div>
	</div>

<?php amz_prints_flipbook_shell_close(); ?>
<?php wp_footer(); ?>
</body>
</html>
