<?php
/**
 * Template Name: Company Profile — Print & Design
 * Landscape A4 print-house themed catalog PDF.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$c         = amz_prints_catalog_context();
$catalog   = amz_prints_catalog_print_services();
$auto_dl   = isset( $_GET['download'] ) || isset( $_GET['print'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$page_no   = 1;
$svc_blurb = array(
	'printing-services'        => 'Commercial and specialty print with color-true output for marketing, packaging, and production runs.',
	'branding-signage'         => 'Indoor and outdoor identity systems that make storefronts, fleets, and events impossible to miss.',
	'marketing-materials'      => 'Everyday brand touchpoints — cards, flyers, catalogs, and folders that feel premium in the hand.',
	'packaging-solutions'      => 'Product boxes, labels, and custom packs that protect goods and sell on the shelf.',
	'promotional-items'        => 'Memorable giveaways and branded gifts that keep your name in clients hands.',
	'corporate-branding'       => 'From logo systems to exhibition stands — cohesive identity for offices and events.',
	'document-office-printing' => 'Fast, reliable document production, binding, IDs, and finishing for offices and institutions.',
	'graphic-design'           => 'Creative that works in print and on screen — logos, social, packaging layouts, and campaigns.',
	'photography-media'        => 'Product and corporate photography plus video and motion for campaigns.',
	'custom-printing'          => 'Wedding, invites, menus, calendars, notebooks, and made-to-order gifts.',
);
$why       = array(
	array( 't' => 'Color that matches', 'd' => 'Calibrated workflows so brand colors stay consistent across jobs and substrates.' ),
	array( 't' => 'Deadlines kept', 'd' => 'Transparent timelines and proactive updates from proof through delivery.' ),
	array( 't' => 'Finishes that feel premium', 'd' => 'Lamination, foil, emboss, die-cut — details worth picking up.' ),
	array( 't' => 'Design + press under one roof', 'd' => 'Artwork and production stay aligned so what you approve is what you receive.' ),
	array( 't' => 'Tracked production', 'd' => 'Know where every job stands — design, print, finish, and handover.' ),
	array( 't' => 'Local branches', 'd' => 'Visit Mandi Bahauddin, Johar Town Lahore, or WhatsApp us for fast quotes.' ),
);
$portfolio = array(
	array( 'title' => 'Press production', 'img' => 'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Brand & signage', 'img' => 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Stationery suites', 'img' => 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Packaging systems', 'img' => 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Promotional merch', 'img' => 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Custom invitations', 'img' => 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=80' ),
);
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html( $c['legal'] ); ?> — <?php esc_html_e( 'Print & Design Profile', 'amz-prints' ); ?></title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'amz-catalog-body catalog-theme-print' . ( $auto_dl ? ' catalog-download-mode' : '' ) ); ?>>
<?php wp_body_open(); ?>

<div class="catalog-toolbar no-print">
	<div class="catalog-toolbar__inner">
		<strong><?php esc_html_e( 'Print & Design Profile · Landscape A4', 'amz-prints' ); ?></strong>
		<div class="catalog-toolbar__actions">
			<button type="button" class="btn btn--primary" id="amz-catalog-download"><?php esc_html_e( 'Download PDF', 'amz-prints' ); ?></button>
			<button type="button" class="btn btn--ghost" id="amz-catalog-print"><?php esc_html_e( 'Print / Save PDF', 'amz-prints' ); ?></button>
			<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/company-profile/' ) ); ?>"><?php esc_html_e( 'All catalogs', 'amz-prints' ); ?></a>
			<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'amz-prints' ); ?></a>
		</div>
	</div>
	<p class="catalog-toolbar__hint" id="amz-catalog-status"><?php esc_html_e( 'Download PDF saves automatically. If it fails, use Print / Save PDF → Save as PDF, A4 Landscape.', 'amz-prints' ); ?></p>
</div>

<main class="catalog-book" id="amz-catalog-book">

	<section class="catalog-page catalog-page--cover" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-cover">
			<div class="catalog-cover__left">
				<?php if ( $c['logo_url'] ) : ?>
					<img class="catalog-cover__logo" src="<?php echo esc_url( $c['logo_url'] ); ?>" alt="<?php echo esc_attr( $c['company'] ); ?>" crossorigin="anonymous">
				<?php else : ?>
					<span class="catalog-cover__mark" aria-hidden="true"></span>
				<?php endif; ?>
				<p class="catalog-cover__eyebrow"><?php esc_html_e( 'Printing & Designing Company Profile', 'amz-prints' ); ?> · <?php echo esc_html( $c['year'] ); ?></p>
				<p class="catalog-cover__short"><?php echo esc_html( $c['company'] ); ?></p>
				<h1 class="catalog-cover__legal"><?php echo esc_html( $c['legal'] ); ?></h1>
				<p class="catalog-cover__tag"><?php esc_html_e( 'Professional printing, branding, packaging & graphic design — crafted for color and finish.', 'amz-prints' ); ?></p>
			</div>
			<div class="catalog-cover__right">
				<div class="catalog-cover__panel"><strong><?php esc_html_e( 'Short name', 'amz-prints' ); ?></strong><span><?php echo esc_html( $c['company'] ); ?></span></div>
				<div class="catalog-cover__panel"><strong><?php esc_html_e( 'Official name', 'amz-prints' ); ?></strong><span><?php echo esc_html( $c['legal'] ); ?></span></div>
				<div class="catalog-cover__panel"><strong><?php esc_html_e( 'Focus', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Print · Branding · Packaging · Design · Media', 'amz-prints' ); ?></span></div>
				<div class="catalog-cover__panel"><strong><?php esc_html_e( 'Website', 'amz-prints' ); ?></strong><span><?php echo esc_html( $c['site_url'] ); ?></span></div>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php echo esc_html( $c['company'] ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Contents', 'amz-prints' ); ?></h2>
			<p class="catalog-lead"><?php esc_html_e( 'Everything about our print floor, design studio, and production capabilities in one landscape profile.', 'amz-prints' ); ?></p>
			<ol class="catalog-toc catalog-toc--dense">
				<li><span class="catalog-toc__n">01</span><span class="catalog-toc__label"><?php esc_html_e( 'Cover & Identity', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">02</span><span class="catalog-toc__label"><?php esc_html_e( 'About Print & Design', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">03</span><span class="catalog-toc__label"><?php esc_html_e( 'Mission & Vision', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">04</span><span class="catalog-toc__label"><?php esc_html_e( 'Services Overview', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">05+</span><span class="catalog-toc__label"><?php esc_html_e( 'Service Details & Mockups', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">—</span><span class="catalog-toc__label"><?php esc_html_e( 'Why Choose Us', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">—</span><span class="catalog-toc__label"><?php esc_html_e( 'Portfolio', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">—</span><span class="catalog-toc__label"><?php esc_html_e( 'Branches & Contact QR', 'amz-prints' ); ?></span></li>
			</ol>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-split">
			<div class="catalog-split__copy">
				<p class="catalog-kicker"><?php esc_html_e( 'About us', 'amz-prints' ); ?></p>
				<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Print & Design Studio', 'amz-prints' ); ?></h2>
				<p class="catalog-lead"><?php echo esc_html( $c['about'] ); ?></p>
				<p class="catalog-body"><?php esc_html_e( 'We partner with businesses and agencies who need print that looks sharp and arrives on time — from business cards to vehicle wraps, packaging to large-format campaigns. Design and press stay under one roof so color and finish never drift.', 'amz-prints' ); ?></p>
				<div class="catalog-facts">
					<div><strong><?php esc_html_e( 'Official name', 'amz-prints' ); ?></strong><span><?php echo esc_html( $c['legal'] ); ?></span></div>
					<div><strong><?php esc_html_e( 'Brand', 'amz-prints' ); ?></strong><span><?php echo esc_html( $c['company'] ); ?></span></div>
					<div><strong><?php esc_html_e( 'Hours', 'amz-prints' ); ?></strong><span><?php echo esc_html( $c['hours'] ); ?></span></div>
				</div>
			</div>
			<div class="catalog-split__visual">
				<figure class="catalog-shot catalog-shot--tall">
					<img src="https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1200&q=80" alt="" crossorigin="anonymous">
				</figure>
				<ul class="catalog-pillars">
					<li><?php esc_html_e( 'Commercial & digital printing', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Branding, signage & packaging', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Graphic design & media', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Custom & promotional print', 'amz-prints' ); ?></li>
				</ul>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Purpose', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Mission & Vision', 'amz-prints' ); ?></h2>
			<div class="catalog-mv catalog-mv--wide">
				<article>
					<p class="catalog-kicker"><?php esc_html_e( 'Mission', 'amz-prints' ); ?></p>
					<h3><?php esc_html_e( 'Why we print', 'amz-prints' ); ?></h3>
					<p class="catalog-body catalog-body--lg"><?php echo esc_html( $c['mission'] ); ?></p>
				</article>
				<article>
					<p class="catalog-kicker"><?php esc_html_e( 'Vision', 'amz-prints' ); ?></p>
					<h3><?php esc_html_e( 'Where we are going', 'amz-prints' ); ?></h3>
					<p class="catalog-body catalog-body--lg"><?php echo esc_html( $c['vision'] ); ?></p>
				</article>
			</div>
			<div class="catalog-values catalog-values--row">
				<div><strong><?php esc_html_e( 'Quality', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Color-true output', 'amz-prints' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Speed', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Clear timelines', 'amz-prints' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Craft', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Premium finishes', 'amz-prints' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Trust', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Tracked delivery', 'amz-prints' ); ?></span></div>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Capabilities', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Print & Design Services', 'amz-prints' ); ?></h2>
			<p class="catalog-lead"><?php esc_html_e( 'Our complete print and design catalog — each category detailed on the following pages with portfolio mockups.', 'amz-prints' ); ?></p>
			<div class="catalog-services-index catalog-services-index--fill">
				<?php foreach ( $catalog as $i => $cat ) : ?>
					<div class="catalog-services-index__item">
						<span><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span>
						<div>
							<strong><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></strong>
							<em><?php echo esc_html( count( $cat['items'] ) ); ?> <?php esc_html_e( 'offerings', 'amz-prints' ); ?></em>
						</div>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<?php foreach ( $catalog as $cat ) : ?>
		<?php
		$slug  = $cat['slug'];
		$blurb = isset( $svc_blurb[ $slug ] ) ? $svc_blurb[ $slug ] : 'Professional production with brand-consistent quality.';
		?>
		<section class="catalog-page catalog-page--svc" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
			<div class="catalog-page__inner catalog-split">
				<div class="catalog-split__copy">
					<p class="catalog-kicker"><?php esc_html_e( 'Service portfolio', 'amz-prints' ); ?></p>
					<h2 class="catalog-title catalog-title--xl"><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></h2>
					<p class="catalog-lead"><?php echo esc_html( $blurb ); ?></p>
					<ul class="catalog-item-grid">
						<?php foreach ( $cat['items'] as $item ) : ?>
							<li><?php echo esc_html( amz_prints_svc_label( $item ) ); ?></li>
						<?php endforeach; ?>
					</ul>
				</div>
				<figure class="catalog-split__visual catalog-shot catalog-shot--fill">
					<img src="<?php echo esc_url( $cat['image'] ); ?>" alt="<?php echo esc_attr( amz_prints_svc_label( $cat ) ); ?>" crossorigin="anonymous">
					<figcaption><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?> · <?php esc_html_e( 'Mockup', 'amz-prints' ); ?></figcaption>
				</figure>
			</div>
			<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
		</section>
	<?php endforeach; ?>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Difference', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Why Choose Our Print Studio', 'amz-prints' ); ?></h2>
			<div class="catalog-why-grid">
				<?php foreach ( $why as $i => $row ) : ?>
					<article>
						<span><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span>
						<h3><?php echo esc_html( $row['t'] ); ?></h3>
						<p><?php echo esc_html( $row['d'] ); ?></p>
					</article>
				<?php endforeach; ?>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Portfolio', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Selected Print & Design Work', 'amz-prints' ); ?></h2>
			<div class="catalog-portfolio catalog-portfolio--6">
				<?php foreach ( $portfolio as $item ) : ?>
					<figure>
						<img src="<?php echo esc_url( $item['img'] ); ?>" alt="<?php echo esc_attr( $item['title'] ); ?>" crossorigin="anonymous">
						<figcaption><?php echo esc_html( $item['title'] ); ?></figcaption>
					</figure>
				<?php endforeach; ?>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page catalog-page--contact" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-split">
			<div class="catalog-split__copy">
				<p class="catalog-kicker"><?php esc_html_e( 'Connect', 'amz-prints' ); ?></p>
				<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Branches & Contact', 'amz-prints' ); ?></h2>
				<div class="catalog-branches catalog-branches--big">
					<article><strong>Bahria Town Phase 8</strong><span>Rawalpindi <em>(Coming Soon)</em></span></article>
					<article><strong>Mandi Bahauddin</strong><span>Punjab, Pakistan</span></article>
					<article><strong>Johar Town</strong><span>Lahore</span></article>
				</div>
				<div class="catalog-contact-block">
					<p class="catalog-contact-name"><?php echo esc_html( $c['legal'] ); ?></p>
					<p class="catalog-contact-brand"><?php echo esc_html( $c['company'] ); ?></p>
					<?php if ( $c['phone'] ) : ?><p><strong><?php esc_html_e( 'Phone', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $c['phone'] ); ?></p><?php endif; ?>
					<?php if ( $c['email'] ) : ?><p><strong><?php esc_html_e( 'Email', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $c['email'] ); ?></p><?php endif; ?>
					<p><strong><?php esc_html_e( 'Website', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $c['site_url'] ); ?></p>
					<?php if ( $c['wa_raw'] ) : ?><p><strong><?php esc_html_e( 'WhatsApp', 'amz-prints' ); ?>:</strong> +<?php echo esc_html( $c['wa_raw'] ); ?></p><?php endif; ?>
				</div>
			</div>
			<div class="catalog-qr-grid catalog-qr-grid--big">
				<figure>
					<img src="<?php echo esc_url( amz_prints_qr_url( $c['site_url'], 280 ) ); ?>" alt="" crossorigin="anonymous">
					<figcaption><?php esc_html_e( 'Website QR', 'amz-prints' ); ?></figcaption>
				</figure>
				<figure>
					<img src="<?php echo esc_url( amz_prints_qr_url( $c['wa_link'], 280 ) ); ?>" alt="" crossorigin="anonymous">
					<figcaption><?php esc_html_e( 'WhatsApp QR', 'amz-prints' ); ?></figcaption>
				</figure>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

</main>
<?php amz_prints_catalog_download_script( 'AMZ-Prints-Print-Design-Profile.pdf' ); ?>
<?php wp_footer(); ?>
</body>
</html>
