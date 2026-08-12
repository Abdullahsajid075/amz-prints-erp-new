<?php
/**
 * Template Name: Company Profile — IT & Digital
 * Premium black + gold flip book.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$c       = amz_prints_catalog_context();
$catalog = amz_prints_catalog_digital_services();
$auto_dl = isset( $_GET['download'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$about   = amz_prints_mod( 'amz_book_digital_about', '' );
if ( ! $about ) {
	$about = $c['about'];
}
$intro_img = amz_prints_book_image( 'amz_book_digital_intro', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80' );
$cover_img = amz_prints_book_image( 'amz_book_digital_cover', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80' );
$portfolio = amz_prints_book_portfolio( 'digital' );

$website_types = array(
	array( 'Business Website', 'Authority site — services, about, contact, and lead capture.' ),
	array( 'E-Commerce Store', 'Product catalog, cart, checkout, and real order flow.' ),
	array( 'Portfolio / Agency', 'Case studies with cinematic layout and inquiry CTAs.' ),
	array( 'Booking & Services', 'Appointments and quote booking for field teams.' ),
	array( 'Landing Pages', 'High-conversion campaign pages for ads and launches.' ),
	array( 'Custom Web Apps', 'Dashboards, portals, and tools — not templates.' ),
);
$web_features = array(
	'UI/UX design aligned to your brand',
	'Responsive mobile-first builds',
	'SEO-ready structure & speed basics',
	'CMS / admin for easy content updates',
	'Forms, WhatsApp & lead capture',
	'Secure hosting guidance & SSL',
	'Analytics & conversion tracking',
	'Training + post-launch support',
);
$mechanism = array(
	array( '01', 'Discovery', 'Goals, audience, competitors, must-have features.' ),
	array( '02', 'Blueprint', 'Sitemap, wireframes, tech stack, timeline.' ),
	array( '03', 'Design System', 'Visual language, components, motion.' ),
	array( '04', 'Build', 'Custom code, CMS, APIs, device QA.' ),
	array( '05', 'Launch', 'Go-live, analytics, training, support.' ),
	array( '06', 'Grow', 'New pages, modules, campaigns, upgrades.' ),
);
$toc = array( 'Introduction', 'Vision & Mission', 'Website Types', 'Web Development', 'Software & Social', 'How We Work', 'Portfolio', 'Why Us & Contact' );
$pn  = 1;
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html( $c['legal'] ); ?> — Digital Services Profile</title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'amz-catalog-body catalog-theme-digital catalog-theme-gold flipbook-body' . ( $auto_dl ? ' catalog-download-mode' : '' ) ); ?>>
<?php wp_body_open(); ?>
<?php
amz_prints_flipbook_shell_open(
	array(
		'theme'    => 'digital',
		'title'    => __( 'IT & Digital Services Profile', 'amz-prints' ),
		'subtitle' => __( 'Black & gold premium catalog', 'amz-prints' ),
	)
);
?>

	<div class="page page--hard page--cover-gold" data-density="hard">
		<div class="page-content page-content--cover page-content--cover-photo page-content--cover-gold" style="--cover-img:url('<?php echo esc_url( $cover_img ); ?>')">
			<div class="page-cover__veil page-cover__veil--gold"></div>
			<div class="page-cover__copy">
				<?php if ( $c['logo_url'] ) : ?><img class="page-cover__logo" src="<?php echo esc_url( $c['logo_url'] ); ?>" alt=""><?php endif; ?>
				<p class="page-cover__eyebrow">Digital Profile <?php echo esc_html( $c['year'] ); ?></p>
				<p class="page-cover__short page-cover__short--gold"><?php echo esc_html( $c['company'] ); ?></p>
				<h1><?php echo esc_html( $c['legal'] ); ?></h1>
				<p class="page-cover__tag">Websites · Custom Software · Social · IT Systems</p>
			</div>
		</div>
	</div>

	<div class="page page--hard" data-density="hard">
		<div class="page-content page-content--center page-content--premium page-content--ink">
			<p class="page-kicker page-kicker--gold">IT &amp; Digital Division</p>
			<h2 class="page-title page-title--light"><?php echo esc_html( $c['company'] ); ?></h2>
			<p class="page-lead page-lead--muted"><?php echo esc_html( $c['legal'] ); ?></p>
			<p class="page-body page-body--muted">Digital products with the same brand discipline as our print floor — interfaces that convert and systems you own.</p>
			<div class="page-chip-row page-chip-row--gold">
				<span>Web</span><span>Software</span><span>Social</span><span>IT</span>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--toc page-content--toc-gold">
			<div class="page-gold-bar">Table of Contents</div>
			<table class="page-toc-table page-toc-table--gold">
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
			<span class="page-spine-bar page-spine-bar--right page-spine-bar--gold" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--intro page-content--ink">
			<span class="page-spine-bar page-spine-bar--left page-spine-bar--gold" aria-hidden="true"></span>
			<div class="page-intro-grid">
				<figure class="page-intro-photo page-hover-lift"><img src="<?php echo esc_url( $intro_img ); ?>" alt=""></figure>
				<div class="page-intro-copy">
					<h2 class="page-heading-gold">Introduction</h2>
					<p class="page-body--muted"><?php echo esc_html( $about ); ?></p>
					<p class="page-body--muted">We design and develop websites, custom software, and social systems that look sharp and work hard — lead capture, ecommerce, portals, ERP modules, and always-on brand presence.</p>
				</div>
			</div>
			<div class="page-bottom-meta">
				<span class="page-logo-mark page-logo-mark--gold"><?php echo esc_html( $c['company'] ); ?> Digital</span>
				<span class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></span>
			</div>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--ink">
			<div class="page-gold-bar">Vision &amp; Mission</div>
			<div class="page-pad">
				<h3 class="page-heading-gold">Vision</h3>
				<p class="page-body--muted"><?php echo esc_html( $c['vision'] ); ?></p>
				<h3 class="page-heading-gold">Mission</h3>
				<p class="page-body--muted"><?php echo esc_html( $c['mission'] ); ?></p>
				<div class="page-value-row page-value-row--gold">
					<div class="page-hover-lift"><strong>Clarity</strong><span>Blueprints before build</span></div>
					<div class="page-hover-lift"><strong>Ownership</strong><span>Custom code you keep</span></div>
					<div class="page-hover-lift"><strong>Support</strong><span>Local WhatsApp teams</span></div>
				</div>
			</div>
			<span class="page-spine-bar page-spine-bar--right page-spine-bar--gold" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--ink">
			<span class="page-spine-bar page-spine-bar--left page-spine-bar--gold" aria-hidden="true"></span>
			<div class="page-gold-bar">Website Types</div>
			<div class="page-pad">
				<ul class="page-type-list page-type-list--gold">
					<?php foreach ( $website_types as $t ) : ?>
						<li class="page-hover-lift"><strong><?php echo esc_html( $t[0] ); ?></strong><span><?php echo esc_html( $t[1] ); ?></span></li>
					<?php endforeach; ?>
				</ul>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--ink">
			<div class="page-gold-bar">Web Development</div>
			<div class="page-pad">
				<p class="page-lead page-lead--muted">From first sketch to live launch — premium UI, speed, SEO structure, CMS, WhatsApp leads, analytics, and training.</p>
				<ul class="page-bullets page-bullets--gold">
					<?php foreach ( $web_features as $f ) : ?>
						<li><?php echo esc_html( $f ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>
			<span class="page-spine-bar page-spine-bar--right page-spine-bar--gold" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--ink">
			<span class="page-spine-bar page-spine-bar--left page-spine-bar--gold" aria-hidden="true"></span>
			<div class="page-gold-bar">Software &amp; Social</div>
			<div class="page-pad">
				<h3 class="page-heading-gold">Custom Software</h3>
				<p class="page-body--muted">ERP modules, portals, CRMs, booking systems — engineered around how your team actually works. Full ownership. Clean architecture.</p>
				<h3 class="page-heading-gold">Social Media</h3>
				<p class="page-body--muted">Content calendar, creatives, engagement, ads support, and monthly reports aligned with your print brand.</p>
				<?php foreach ( $catalog as $cat ) : ?>
					<p class="page-body--muted"><strong class="gold-text"><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?>:</strong> <?php echo esc_html( implode( ', ', array_map( 'amz_prints_svc_label', $cat['items'] ) ) ); ?></p>
				<?php endforeach; ?>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--ink">
			<div class="page-gold-bar">How We Work</div>
			<div class="page-pad">
				<ol class="page-mech page-mech--gold">
					<?php foreach ( $mechanism as $step ) : ?>
						<li class="page-hover-lift"><strong><?php echo esc_html( $step[0] . ' · ' . $step[1] ); ?></strong><span><?php echo esc_html( $step[2] ); ?></span></li>
					<?php endforeach; ?>
				</ol>
			</div>
			<span class="page-spine-bar page-spine-bar--right page-spine-bar--gold" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--ink">
			<span class="page-spine-bar page-spine-bar--left page-spine-bar--gold" aria-hidden="true"></span>
			<div class="page-gold-bar">Digital Portfolio</div>
			<div class="page-pad">
				<div class="page-portfolio-grid">
					<?php foreach ( $portfolio as $item ) : ?>
						<figure class="page-hover-lift">
							<img src="<?php echo esc_url( $item['img'] ); ?>" alt="">
							<figcaption><?php echo esc_html( $item['title'] ); ?></figcaption>
						</figure>
					<?php endforeach; ?>
				</div>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--ink">
			<div class="page-gold-bar">Why Choose Us</div>
			<div class="page-pad">
				<ul class="page-why page-why--gold">
					<li><strong>Print + Digital one roof</strong><span>Brand stays consistent from press to website.</span></li>
					<li><strong>Custom code</strong><span>No locked templates — products you own.</span></li>
					<li><strong>Business-first</strong><span>Features map to leads, sales, operations.</span></li>
					<li><strong>Local support</strong><span>Branches and WhatsApp you can reach.</span></li>
					<li><strong>Scalable architecture</strong><span>Cheaper updates later, not temporary hacks.</span></li>
					<li><strong>Security by design</strong><span>Roles built for your team.</span></li>
				</ul>
			</div>
			<span class="page-spine-bar page-spine-bar--right page-spine-bar--gold" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--ink">
			<span class="page-spine-bar page-spine-bar--left page-spine-bar--gold" aria-hidden="true"></span>
			<div class="page-gold-bar">Contact Us</div>
			<div class="page-pad">
				<div class="page-contact page-contact--gold">
					<p><strong><?php echo esc_html( $c['legal'] ); ?></strong></p>
					<p><?php echo esc_html( $c['company'] ); ?> · Digital</p>
					<?php if ( $c['phone'] ) : ?><p><?php echo esc_html( $c['phone'] ); ?></p><?php endif; ?>
					<?php if ( $c['email'] ) : ?><p><?php echo esc_html( $c['email'] ); ?></p><?php endif; ?>
					<p><?php echo esc_html( $c['site_url'] ); ?></p>
					<p><?php echo esc_html( home_url( '/digital-services/' ) ); ?></p>
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

	<div class="page page--hard page--cover-gold" data-density="hard">
		<div class="page-content page-content--cover page-content--back page-content--cover-gold">
			<p class="page-cover__short page-cover__short--gold"><?php echo esc_html( $c['company'] ); ?></p>
			<h2>Digital Services</h2>
			<p class="page-cover__tag"><?php echo esc_html( home_url( '/digital-services/' ) ); ?></p>
			<p class="page-cover__tag">Thank you — let's build something exceptional</p>
		</div>
	</div>

<?php amz_prints_flipbook_shell_close(); ?>
<?php wp_footer(); ?>
</body>
</html>
