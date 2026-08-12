<?php
/**
 * Template Name: Company Profile — IT & Digital
 * Landscape A4 tech-themed digital services catalog PDF.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$c       = amz_prints_catalog_context();
$catalog = amz_prints_catalog_digital_services();
$auto_dl = isset( $_GET['download'] ) || isset( $_GET['print'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$page_no = 1;

$website_types = array(
	array( 'title' => 'Business Website', 'desc' => 'Authority site for companies — services, about, contact, and lead capture.' ),
	array( 'title' => 'E-Commerce Store', 'desc' => 'Product catalog, cart, checkout, and order flow built for real sales.' ),
	array( 'title' => 'Portfolio / Agency', 'desc' => 'Showcase work with cinematic layout, case studies, and inquiry CTAs.' ),
	array( 'title' => 'Booking & Services', 'desc' => 'Appointment, quote, or service booking for clinics, salons, and field teams.' ),
	array( 'title' => 'Landing Pages', 'desc' => 'High-conversion campaign pages for ads, launches, and promotions.' ),
	array( 'title' => 'Custom Web Apps', 'desc' => 'Dashboards, portals, and tools tailored to your operations — not templates.' ),
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
$software_features = array(
	'Requirement workshops & process mapping',
	'Custom modules for your exact workflow',
	'Role-based access & permissions',
	'Reports, dashboards & exports',
	'API integrations (payments, SMS, ERP)',
	'Scalable architecture & clean code',
	'Testing, UAT & staged rollout',
	'Maintenance & feature roadmap',
);
$social_features = array(
	'Content calendar & brand voice',
	'Creative posts, reels & stories',
	'Page setup & profile optimization',
	'Community replies & engagement',
	'Ads support & campaign creatives',
	'Monthly performance reports',
);
$mechanism = array(
	array( 'n' => '01', 't' => 'Discovery Call', 'd' => 'Goals, audience, competitors, and must-have features.' ),
	array( 'n' => '02', 't' => 'Blueprint', 'd' => 'Sitemap, wireframes, tech stack, and clear timeline.' ),
	array( 'n' => '03', 't' => 'Design System', 'd' => 'Visual language, components, and motion language.' ),
	array( 'n' => '04', 't' => 'Build & Integrate', 'd' => 'Custom code, CMS, APIs, and device QA.' ),
	array( 'n' => '05', 't' => 'Launch', 'd' => 'Go-live, analytics, training, and support window.' ),
	array( 'n' => '06', 't' => 'Grow', 'd' => 'New pages, modules, campaigns, and upgrades.' ),
);
$why = array(
	array( 't' => 'Print + Digital under one roof', 'd' => 'Branding, print production, and digital products stay visually consistent.' ),
	array( 't' => 'Custom code, not clone themes', 'd' => 'We build what your business needs — no locked templates or dead plugins.' ),
	array( 't' => 'Business-first process', 'd' => 'Every feature maps to leads, sales, tracking, or operations.' ),
	array( 't' => 'Local support you can call', 'd' => 'Branches and WhatsApp mean faster answers than offshore freelancers.' ),
	array( 't' => 'Own your product', 'd' => 'Clean architecture, your data, and a roadmap you control.' ),
	array( 't' => 'Brand continuity', 'd' => 'Same visual language from website to social to printed collateral.' ),
);
$portfolio = array(
	array( 'title' => 'Business websites', 'img' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Ecommerce & checkout', 'img' => 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Dashboards & software', 'img' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'UI systems', 'img' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Social creatives', 'img' => 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Dev & launch', 'img' => 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80' ),
);
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html( $c['legal'] ); ?> — <?php esc_html_e( 'IT & Digital Profile', 'amz-prints' ); ?></title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'amz-catalog-body catalog-theme-digital' . ( $auto_dl ? ' catalog-download-mode' : '' ) ); ?>>
<?php wp_body_open(); ?>

<div class="catalog-toolbar no-print catalog-toolbar--digital">
	<div class="catalog-toolbar__inner">
		<strong><?php esc_html_e( 'IT & Digital Profile · Landscape A4', 'amz-prints' ); ?></strong>
		<div class="catalog-toolbar__actions">
			<button type="button" class="btn btn--primary" id="amz-catalog-download"><?php esc_html_e( 'Download PDF', 'amz-prints' ); ?></button>
			<button type="button" class="btn btn--ghost" id="amz-catalog-print"><?php esc_html_e( 'Print / Save PDF', 'amz-prints' ); ?></button>
			<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/company-profile/' ) ); ?>"><?php esc_html_e( 'All catalogs', 'amz-prints' ); ?></a>
			<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/digital-services/' ) ); ?>"><?php esc_html_e( 'Digital page', 'amz-prints' ); ?></a>
		</div>
	</div>
	<p class="catalog-toolbar__hint" id="amz-catalog-status"><?php esc_html_e( 'Download PDF saves automatically. If it fails, use Print / Save PDF → Save as PDF, A4 Landscape.', 'amz-prints' ); ?></p>
</div>

<main class="catalog-book" id="amz-catalog-book">

	<section class="catalog-page catalog-page--cover catalog-page--cover-digital" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-cover">
			<div class="catalog-cover__left">
				<?php if ( $c['logo_url'] ) : ?>
					<img class="catalog-cover__logo" src="<?php echo esc_url( $c['logo_url'] ); ?>" alt="<?php echo esc_attr( $c['company'] ); ?>" crossorigin="anonymous">
				<?php else : ?>
					<span class="catalog-cover__mark catalog-cover__mark--teal" aria-hidden="true"></span>
				<?php endif; ?>
				<p class="catalog-cover__eyebrow"><?php esc_html_e( 'IT & Digital Services Company Profile', 'amz-prints' ); ?> · <?php echo esc_html( $c['year'] ); ?></p>
				<p class="catalog-cover__short"><?php echo esc_html( $c['company'] ); ?></p>
				<h1 class="catalog-cover__legal"><?php echo esc_html( $c['legal'] ); ?></h1>
				<p class="catalog-cover__tag"><?php esc_html_e( 'Websites, custom software, and social media — built with clarity, motion, and business outcomes.', 'amz-prints' ); ?></p>
			</div>
			<div class="catalog-cover__right">
				<div class="catalog-cover__panel"><strong><?php esc_html_e( 'Short name', 'amz-prints' ); ?></strong><span><?php echo esc_html( $c['company'] ); ?></span></div>
				<div class="catalog-cover__panel"><strong><?php esc_html_e( 'Official name', 'amz-prints' ); ?></strong><span><?php echo esc_html( $c['legal'] ); ?></span></div>
				<div class="catalog-cover__panel"><strong><?php esc_html_e( 'Focus', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Web · Software · Social · IT Systems', 'amz-prints' ); ?></span></div>
				<div class="catalog-cover__panel"><strong><?php esc_html_e( 'Details page', 'amz-prints' ); ?></strong><span><?php echo esc_html( home_url( '/digital-services/' ) ); ?></span></div>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php echo esc_html( $c['company'] ); ?> · IT</p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Contents', 'amz-prints' ); ?></h2>
			<p class="catalog-lead"><?php esc_html_e( 'A complete digital services overview — products we build, how we work, and why clients choose custom code.', 'amz-prints' ); ?></p>
			<ol class="catalog-toc catalog-toc--dense">
				<li><span class="catalog-toc__n">01</span><span class="catalog-toc__label"><?php esc_html_e( 'Cover & Identity', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">02</span><span class="catalog-toc__label"><?php esc_html_e( 'About Digital Division', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">03</span><span class="catalog-toc__label"><?php esc_html_e( 'Mission & Vision', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">04</span><span class="catalog-toc__label"><?php esc_html_e( 'Website Types', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">05</span><span class="catalog-toc__label"><?php esc_html_e( 'Web Development', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">06</span><span class="catalog-toc__label"><?php esc_html_e( 'Software & Social', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">07</span><span class="catalog-toc__label"><?php esc_html_e( 'Working Mechanism', 'amz-prints' ); ?></span></li>
				<li><span class="catalog-toc__n">08</span><span class="catalog-toc__label"><?php esc_html_e( 'Why Choose Us · Contact', 'amz-prints' ); ?></span></li>
			</ol>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-split">
			<div class="catalog-split__copy">
				<p class="catalog-kicker"><?php esc_html_e( 'Digital division', 'amz-prints' ); ?></p>
				<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'IT & Digital Services', 'amz-prints' ); ?></h2>
				<p class="catalog-lead"><?php esc_html_e( 'We design and develop digital products with the same brand discipline as our print floor — interfaces that feel premium, load fast, and turn visitors into customers.', 'amz-prints' ); ?></p>
				<p class="catalog-body"><?php echo esc_html( $c['about'] ); ?></p>
				<ul class="catalog-pillars">
					<li><?php esc_html_e( 'Website design & development', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Custom software / ERP modules', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Social media management', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'IT systems & technology support', 'amz-prints' ); ?></li>
				</ul>
			</div>
			<figure class="catalog-shot catalog-shot--fill">
				<img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" alt="" crossorigin="anonymous">
			</figure>
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
					<h3><?php esc_html_e( 'Why we build', 'amz-prints' ); ?></h3>
					<p class="catalog-body catalog-body--lg"><?php echo esc_html( $c['mission'] ); ?></p>
				</article>
				<article>
					<p class="catalog-kicker"><?php esc_html_e( 'Vision', 'amz-prints' ); ?></p>
					<h3><?php esc_html_e( 'Where digital goes', 'amz-prints' ); ?></h3>
					<p class="catalog-body catalog-body--lg"><?php echo esc_html( $c['vision'] ); ?></p>
				</article>
			</div>
			<div class="catalog-values catalog-values--row catalog-values--digital">
				<div><strong><?php esc_html_e( 'Clarity', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Blueprints before build', 'amz-prints' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Ownership', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Custom code you keep', 'amz-prints' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Performance', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Fast, measurable screens', 'amz-prints' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Support', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Local teams on WhatsApp', 'amz-prints' ); ?></span></div>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Digital catalog', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Types of Websites & Products', 'amz-prints' ); ?></h2>
			<p class="catalog-lead"><?php esc_html_e( 'Pick the shape that fits your goal — we design and develop each one with premium visuals and real functionality.', 'amz-prints' ); ?></p>
			<div class="catalog-type-grid">
				<?php foreach ( $website_types as $type ) : ?>
					<article>
						<h3><?php echo esc_html( $type['title'] ); ?></h3>
						<p><?php echo esc_html( $type['desc'] ); ?></p>
					</article>
				<?php endforeach; ?>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page catalog-page--ink catalog-page--ink-digital" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-split">
			<div class="catalog-split__copy">
				<p class="catalog-kicker"><?php esc_html_e( 'Core service', 'amz-prints' ); ?></p>
				<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Website Design & Development', 'amz-prints' ); ?></h2>
				<p class="catalog-lead"><?php esc_html_e( 'From first sketch to live launch — interfaces that feel premium, load fast, and convert. Brand design meets clean engineering.', 'amz-prints' ); ?></p>
				<ul class="catalog-item-grid catalog-item-grid--dark">
					<?php foreach ( $web_features as $feat ) : ?>
						<li><?php echo esc_html( $feat ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>
			<figure class="catalog-shot catalog-shot--fill">
				<img src="https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=1200&q=80" alt="" crossorigin="anonymous">
			</figure>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Build & grow', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Software, Social & IT Services', 'amz-prints' ); ?></h2>
			<div class="catalog-tri">
				<article>
					<h3><?php esc_html_e( 'Custom Software', 'amz-prints' ); ?></h3>
					<p><?php esc_html_e( 'ERP modules, portals, CRMs, booking systems — engineered around how your team actually works.', 'amz-prints' ); ?></p>
					<ul>
						<?php foreach ( array_slice( $software_features, 0, 5 ) as $feat ) : ?>
							<li><?php echo esc_html( $feat ); ?></li>
						<?php endforeach; ?>
					</ul>
				</article>
				<article>
					<h3><?php esc_html_e( 'Social Media', 'amz-prints' ); ?></h3>
					<p><?php esc_html_e( 'Consistent posting and creatives aligned with your print and website brand.', 'amz-prints' ); ?></p>
					<ul>
						<?php foreach ( $social_features as $feat ) : ?>
							<li><?php echo esc_html( $feat ); ?></li>
						<?php endforeach; ?>
					</ul>
				</article>
				<article>
					<h3><?php esc_html_e( 'IT catalog', 'amz-prints' ); ?></h3>
					<?php foreach ( $catalog as $cat ) : ?>
						<p><strong><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></strong></p>
						<ul>
							<?php foreach ( $cat['items'] as $item ) : ?>
								<li><?php echo esc_html( amz_prints_svc_label( $item ) ); ?></li>
							<?php endforeach; ?>
						</ul>
					<?php endforeach; ?>
				</article>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Working mechanism', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'How Digital Projects Move', 'amz-prints' ); ?></h2>
			<p class="catalog-lead"><?php esc_html_e( 'A clear path from idea to launch — with checkpoints you can see and approve.', 'amz-prints' ); ?></p>
			<div class="catalog-mech-grid">
				<?php foreach ( $mechanism as $step ) : ?>
					<article>
						<span><?php echo esc_html( $step['n'] ); ?></span>
						<h3><?php echo esc_html( $step['t'] ); ?></h3>
						<p><?php echo esc_html( $step['d'] ); ?></p>
					</article>
				<?php endforeach; ?>
			</div>
			<div class="catalog-portfolio catalog-portfolio--6" style="margin-top:0.85rem;flex:0">
				<?php foreach ( array_slice( $portfolio, 0, 3 ) as $item ) : ?>
					<figure>
						<img src="<?php echo esc_url( $item['img'] ); ?>" alt="<?php echo esc_attr( $item['title'] ); ?>" crossorigin="anonymous">
						<figcaption><?php echo esc_html( $item['title'] ); ?></figcaption>
					</figure>
				<?php endforeach; ?>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Difference', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Why Choose Us', 'amz-prints' ); ?></h2>
			<div class="catalog-why-grid">
				<?php foreach ( $why as $i => $row ) : ?>
					<article>
						<span><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span>
						<h3><?php echo esc_html( $row['t'] ); ?></h3>
						<p><?php echo esc_html( $row['d'] ); ?></p>
					</article>
				<?php endforeach; ?>
			</div>
			<div class="catalog-callout catalog-callout--digital">
				<strong><?php esc_html_e( 'Why customized code?', 'amz-prints' ); ?></strong>
				<p><?php esc_html_e( 'Templates get you online. Custom code gets you ahead — exact workflows, integrations, security, and a product you own forever.', 'amz-prints' ); ?></p>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<section class="catalog-page catalog-page--contact" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-split">
			<div class="catalog-split__copy">
				<p class="catalog-kicker"><?php esc_html_e( 'Connect', 'amz-prints' ); ?></p>
				<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Contact Us', 'amz-prints' ); ?></h2>
				<p class="catalog-lead"><?php esc_html_e( 'Discuss your website, software, or social goals — we will map features, timeline, and investment clearly.', 'amz-prints' ); ?></p>
				<div class="catalog-contact-block">
					<p class="catalog-contact-name"><?php echo esc_html( $c['legal'] ); ?></p>
					<p class="catalog-contact-brand"><?php echo esc_html( $c['company'] ); ?> · <?php esc_html_e( 'Digital', 'amz-prints' ); ?></p>
					<?php if ( $c['phone'] ) : ?><p><strong><?php esc_html_e( 'Phone', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $c['phone'] ); ?></p><?php endif; ?>
					<?php if ( $c['email'] ) : ?><p><strong><?php esc_html_e( 'Email', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $c['email'] ); ?></p><?php endif; ?>
					<p><strong><?php esc_html_e( 'Website', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $c['site_url'] ); ?></p>
					<p><strong><?php esc_html_e( 'Digital page', 'amz-prints' ); ?>:</strong> <?php echo esc_html( home_url( '/digital-services/' ) ); ?></p>
					<?php if ( $c['wa_raw'] ) : ?><p><strong><?php esc_html_e( 'WhatsApp', 'amz-prints' ); ?>:</strong> +<?php echo esc_html( $c['wa_raw'] ); ?></p><?php endif; ?>
				</div>
				<p class="catalog-thanks"><?php esc_html_e( 'Thank you — let us build something that works as hard as it looks.', 'amz-prints' ); ?></p>
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
<?php amz_prints_catalog_download_script( 'AMZ-Prints-Digital-Services-Profile.pdf' ); ?>
<?php wp_footer(); ?>
</body>
</html>
