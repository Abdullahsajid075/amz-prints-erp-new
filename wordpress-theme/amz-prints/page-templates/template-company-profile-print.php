<?php
/**
 * Template Name: Company Profile — Print & Design
 * Premium website-style flip book (charcoal + orange).
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$c       = amz_prints_catalog_context();
$catalog = amz_prints_catalog_print_services();
$auto_dl = isset( $_GET['download'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$about   = amz_prints_mod( 'amz_book_print_about', '' );
if ( ! $about ) {
	$about = $c['about'];
}
$intro_img = amz_prints_book_image( 'amz_book_print_intro', 'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1000&q=80' );
$cover_img = amz_prints_book_image( 'amz_book_print_cover', 'https://images.unsplash.com/photo-1626785774573-4b7993143459?auto=format&fit=crop&w=1000&q=80' );
$portfolio = amz_prints_book_portfolio( 'print' );
$svc_blurb = array(
	'printing-services'        => 'Commercial and specialty print with color-true output for marketing, packaging, and production runs — digital, offset, UV, DTF, and large format.',
	'branding-signage'         => 'Indoor and outdoor identity systems that make storefronts, fleets, and events impossible to miss.',
	'marketing-materials'      => 'Everyday brand touchpoints — cards, flyers, brochures, catalogs, and folders that feel premium in the hand.',
	'packaging-solutions'      => 'Product boxes, labels, and custom packs that protect goods and sell on the shelf.',
	'promotional-items'        => 'Memorable giveaways and branded gifts that keep your name in clients hands.',
	'corporate-branding'       => 'From logo systems to exhibition stands — cohesive identity for offices and events.',
	'document-office-printing' => 'Fast, reliable document production, binding, IDs, certificates, and finishing for offices.',
	'graphic-design'           => 'Creative that works in print and on screen — logos, social, packaging, and campaigns.',
	'photography-media'        => 'Product and corporate photography plus video and motion for campaigns.',
	'custom-printing'          => 'Wedding cards, invitations, menus, calendars, notebooks, and made-to-order gifts.',
);
$toc = array(
	'Introduction', 'Mission & Vision', 'Services Overview', 'Service Portfolio', 'Selected Work', 'Why Choose Us', 'Branches', 'Contact & QR',
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
		'subtitle' => __( 'Premium catalog · website style', 'amz-prints' ),
	)
);
?>

	<div class="page page--hard page--cover-print" data-density="hard">
		<div class="page-content page-content--cover page-content--cover-photo" style="--cover-img:url('<?php echo esc_url( $cover_img ); ?>')">
			<div class="page-cover__veil"></div>
			<div class="page-cover__copy">
				<?php if ( $c['logo_url'] ) : ?><img class="page-cover__logo" src="<?php echo esc_url( $c['logo_url'] ); ?>" alt=""><?php endif; ?>
				<p class="page-cover__eyebrow">Company Profile <?php echo esc_html( $c['year'] ); ?></p>
				<p class="page-cover__short"><?php echo esc_html( $c['company'] ); ?></p>
				<h1><?php echo esc_html( $c['legal'] ); ?></h1>
				<p class="page-cover__tag">Printing · Branding · Packaging · Graphic Design</p>
			</div>
		</div>
	</div>

	<div class="page page--hard" data-density="hard">
		<div class="page-content page-content--center page-content--premium">
			<p class="page-kicker">Official identity</p>
			<h2 class="page-title"><?php echo esc_html( $c['legal'] ); ?></h2>
			<p class="page-lead">Brand: <strong><?php echo esc_html( $c['company'] ); ?></strong></p>
			<p class="page-body"><?php echo esc_html( $c['tagline'] ); ?></p>
			<div class="page-chip-row">
				<span>Press</span><span>Brand</span><span>Pack</span><span>Design</span>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--toc">
			<div class="page-orange-bar">Table of Contents</div>
			<table class="page-toc-table">
				<thead><tr><th>SL NO</th><th>Description</th><th>Page</th></tr></thead>
				<tbody>
					<?php foreach ( $toc as $i => $label ) : ?>
						<tr>
							<td><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></td>
							<td><?php echo esc_html( $label ); ?></td>
							<td><?php echo esc_html( sprintf( '%02d', $i + 3 ) ); ?></td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
			<span class="page-spine-bar page-spine-bar--right" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--intro">
			<span class="page-spine-bar page-spine-bar--left" aria-hidden="true"></span>
			<div class="page-intro-grid">
				<figure class="page-intro-photo page-hover-lift"><img src="<?php echo esc_url( $intro_img ); ?>" alt=""></figure>
				<div class="page-intro-copy">
					<h2 class="page-heading-orange">Introduction</h2>
					<p><?php echo esc_html( $about ); ?></p>
					<p>We partner with businesses and agencies who need print that looks sharp and arrives on time — from business cards to vehicle wraps, packaging to large-format campaigns. Design and press stay under one roof so color and finish never drift.</p>
					<ul class="page-mini-facts">
						<li><strong>Hours</strong> <?php echo esc_html( $c['hours'] ); ?></li>
						<?php if ( $c['address'] ) : ?><li><strong>Address</strong> <?php echo esc_html( $c['address'] ); ?></li><?php endif; ?>
					</ul>
				</div>
			</div>
			<div class="page-bottom-meta">
				<span class="page-logo-mark"><?php echo esc_html( $c['company'] ); ?></span>
				<span class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></span>
			</div>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<div class="page-orange-bar">Our Mission</div>
			<div class="page-pad">
				<h2 class="page-title">Why we print</h2>
				<p class="page-lead"><?php echo esc_html( $c['mission'] ); ?></p>
				<div class="page-value-row">
					<div class="page-hover-lift"><strong>Quality</strong><span>Color-true output</span></div>
					<div class="page-hover-lift"><strong>Speed</strong><span>Clear timelines</span></div>
					<div class="page-hover-lift"><strong>Craft</strong><span>Premium finishes</span></div>
				</div>
			</div>
			<span class="page-spine-bar page-spine-bar--right" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<span class="page-spine-bar page-spine-bar--left" aria-hidden="true"></span>
			<div class="page-orange-bar">Our Vision</div>
			<div class="page-pad">
				<h2 class="page-title">Where we are going</h2>
				<p class="page-lead"><?php echo esc_html( $c['vision'] ); ?></p>
				<ul class="page-bullets">
					<li>Calibrated color across every substrate</li>
					<li>Tracked jobs from brief to handover</li>
					<li>Local branches and WhatsApp support</li>
					<li>Print craftsmanship that earns repeat trust</li>
					<li>Brand continuity from press to digital</li>
				</ul>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<div class="page-orange-bar">Our Best Services</div>
			<div class="page-pad">
				<p class="page-body">Full print and design capabilities — each category detailed on the following pages with offerings and mockups.</p>
				<ul class="page-service-index">
					<?php foreach ( $catalog as $i => $cat ) : ?>
						<li class="page-hover-lift">
							<span><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span>
							<strong><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></strong>
							<em><?php echo esc_html( count( $cat['items'] ) ); ?> offerings</em>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>
			<span class="page-spine-bar page-spine-bar--right" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

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
					<figure class="page-hover-lift"><img src="<?php echo esc_url( $cat['image'] ); ?>" alt=""></figure>
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

	<div class="page">
		<div class="page-content">
			<div class="page-orange-bar">Selected Portfolio</div>
			<div class="page-pad">
				<p class="page-body">A snapshot of print, packaging, branding, and campaign work.</p>
				<div class="page-portfolio-grid">
					<?php foreach ( array_slice( $portfolio, 0, 4 ) as $item ) : ?>
						<figure class="page-hover-lift">
							<img src="<?php echo esc_url( $item['img'] ); ?>" alt="">
							<figcaption><?php echo esc_html( $item['title'] ); ?></figcaption>
						</figure>
					<?php endforeach; ?>
				</div>
			</div>
			<span class="page-spine-bar page-spine-bar--right" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<span class="page-spine-bar page-spine-bar--left" aria-hidden="true"></span>
			<div class="page-orange-bar">More Portfolio</div>
			<div class="page-pad">
				<div class="page-portfolio-grid">
					<?php foreach ( array_slice( $portfolio, 4, 2 ) as $item ) : ?>
						<figure class="page-hover-lift">
							<img src="<?php echo esc_url( $item['img'] ); ?>" alt="">
							<figcaption><?php echo esc_html( $item['title'] ); ?></figcaption>
						</figure>
					<?php endforeach; ?>
				</div>
				<ul class="page-why" style="margin-top:0.85rem">
					<li><strong>Color that matches</strong><span>Calibrated workflows across jobs and substrates.</span></li>
					<li><strong>Deadlines kept</strong><span>Transparent timelines from proof to delivery.</span></li>
					<li><strong>Premium finishes</strong><span>Lamination, foil, emboss, die-cut details.</span></li>
				</ul>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<div class="page-orange-bar">Why Choose Us</div>
			<div class="page-pad">
				<ul class="page-why">
					<li><strong>Design + press under one roof</strong><span>Artwork and production stay aligned.</span></li>
					<li><strong>Tracked production</strong><span>Know where every job stands.</span></li>
					<li><strong>Local branches</strong><span>Visit or WhatsApp for fast quotes.</span></li>
					<li><strong>NADRA facilitation</strong><span>Authorized e-services with trained staff.</span></li>
					<li><strong>Brand continuity</strong><span>Same visual language from print to digital.</span></li>
					<li><strong>Quality checks</strong><span>Every station before handover.</span></li>
				</ul>
			</div>
			<span class="page-spine-bar page-spine-bar--right" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<span class="page-spine-bar page-spine-bar--left" aria-hidden="true"></span>
			<div class="page-orange-bar">Branches & Contact</div>
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
					<p><?php echo esc_html( $c['hours'] ); ?></p>
				</div>
				<div class="page-qr-row">
					<figure class="page-hover-lift">
						<img src="<?php echo esc_url( amz_prints_qr_url( $c['site_url'], 160 ) ); ?>" alt="">
						<figcaption>Website</figcaption>
					</figure>
					<figure class="page-hover-lift">
						<img src="<?php echo esc_url( amz_prints_qr_url( $c['wa_link'], 160 ) ); ?>" alt="">
						<figcaption>WhatsApp</figcaption>
					</figure>
				</div>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page page--hard page--cover-print" data-density="hard">
		<div class="page-content page-content--cover page-content--back">
			<p class="page-cover__short"><?php echo esc_html( $c['company'] ); ?></p>
			<h2><?php echo esc_html( $c['legal'] ); ?></h2>
			<p class="page-cover__tag"><?php echo esc_html( $c['site_url'] ); ?></p>
			<p class="page-cover__tag">Thank you for considering us</p>
		</div>
	</div>

<?php amz_prints_flipbook_shell_close(); ?>
<?php wp_footer(); ?>
</body>
</html>
