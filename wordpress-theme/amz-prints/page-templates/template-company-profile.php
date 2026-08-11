<?php
/**
 * Template Name: Company Profile Catalog
 * Dense landscape A4 company profile — auto-download PDF.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$company  = amz_prints_mod( 'amz_company_name', 'AMZ Prints' );
$legal    = amz_prints_mod( 'amz_legal_name', 'Amazon Printings (Pvt) Ltd' );
$tagline  = amz_prints_mod( 'amz_company_tagline', 'Professional Printing & Advertising Services' );
$phone    = amz_prints_mod( 'amz_phone', '' );
$email    = amz_prints_mod( 'amz_email', 'hello@amzprints.com' );
$address  = amz_prints_mod( 'amz_address', '' );
$hours    = amz_prints_mod( 'amz_hours', 'Mon–Sat · 9am – 6pm' );
$about    = amz_prints_mod(
	'amz_about_blurb',
	'Amazon Printings (Pvt) Ltd — known as AMZ Prints — is a full-service print, branding, and digital company. We deliver commercial printing, large-format campaigns, packaging, NADRA e-services facilitation, websites, custom software, and social media with color precision and clear timelines.'
);
$mission  = amz_prints_mod(
	'amz_mission',
	'To help brands look premium in print and digital — with reliable production, clear communication, and craftsmanship that earns repeat trust.'
);
$vision   = amz_prints_mod(
	'amz_vision',
	'To be Pakistan’s most dependable print + digital partner — where every job is tracked, every color is intentional, and every client feels looked after.'
);
$catalog  = function_exists( 'amz_prints_services_catalog' ) ? amz_prints_services_catalog() : array();
$site_url = home_url( '/' );
$wa_raw   = preg_replace( '/\D+/', '', amz_prints_mod( 'amz_whatsapp', $phone ) );
$wa_link  = $wa_raw ? ( 'https://wa.me/' . $wa_raw ) : $site_url;
$logo_url = '';
if ( function_exists( 'has_custom_logo' ) && has_custom_logo() ) {
	$logo_id  = get_theme_mod( 'custom_logo' );
	$logo_url = $logo_id ? wp_get_attachment_image_url( $logo_id, 'medium' ) : '';
}
$auto_dl = isset( $_GET['download'] ) || isset( $_GET['print'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

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
	array( 't' => 'Print + Digital under one roof', 'd' => 'Branding, print production, and digital products stay visually consistent from press to website.' ),
	array( 't' => 'Custom code, not clone themes', 'd' => 'We build what your business needs — no locked templates or dead plugins.' ),
	array( 't' => 'Live order tracking', 'd' => 'Clear process from brief to delivery so you always know where the job stands.' ),
	array( 't' => 'NADRA facilitation', 'd' => 'Authorized e-services support with trained staff for ID and related services.' ),
	array( 't' => 'Local support you can call', 'd' => 'Branches and WhatsApp mean faster answers than offshore freelancers.' ),
	array( 't' => 'Quality at every station', 'd' => 'Checks before handover so color, finish, and files meet the brief.' ),
);

$portfolio = array(
	array( 'title' => 'Brand kits & packaging', 'img' => 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Large format campaigns', 'img' => 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Corporate stationery', 'img' => 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Digital product UI', 'img' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Promotional merchandise', 'img' => 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=900&q=80' ),
	array( 'title' => 'Web & software screens', 'img' => 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80' ),
);

$svc_blurbs = array(
	'printing-services'         => 'Commercial and specialty print with color-true output for marketing, packaging, and production runs.',
	'branding-signage'          => 'Indoor and outdoor identity systems that make storefronts, fleets, and events impossible to miss.',
	'marketing-materials'       => 'Everyday brand touchpoints — cards, flyers, catalogs, and folders that feel premium in the hand.',
	'packaging-solutions'       => 'Product boxes, labels, and custom packs that protect goods and sell on the shelf.',
	'promotional-items'         => 'Memorable giveaways and branded gifts that keep your name in clients’ hands.',
	'corporate-branding'        => 'From logo systems to exhibition stands — cohesive identity for offices and events.',
	'document-office-printing'  => 'Fast, reliable document production, binding, IDs, and finishing for offices and institutions.',
	'graphic-design'            => 'Creative that works in print and on screen — logos, social, packaging, and UI.',
	'web-digital-services'      => 'Websites, ecommerce, ERP, apps, SEO, and digital marketing under one partner.',
	'it-technology-services'    => 'Software, networks, CCTV, biometrics, cloud, and ongoing IT support.',
	'photography-media'         => 'Product and corporate photography plus video and motion for campaigns.',
	'custom-printing'           => 'Wedding, invites, menus, calendars, notebooks, and made-to-order gifts.',
);

$page_no = 1;
$toc     = array(
	'Cover & Identity',
	'Contents',
	'About Us',
	'Mission & Vision',
	'Services Overview',
	'Service Portfolio (detail pages)',
	'Digital Services',
	'Website Types & Features',
	'Software, Social & Process',
	'Why Choose Us',
	'Portfolio Mockups',
	'Branches',
	'Contact & QR Codes',
);

?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html( $legal ); ?> — <?php esc_html_e( 'Company Profile Catalog', 'amz-prints' ); ?></title>
	<?php wp_head(); ?>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
</head>
<body <?php body_class( 'amz-catalog-body' . ( $auto_dl ? ' catalog-download-mode' : '' ) ); ?>>
<?php wp_body_open(); ?>

<div class="catalog-toolbar no-print" id="amz-catalog-toolbar">
	<div class="catalog-toolbar__inner">
		<strong><?php esc_html_e( 'Company Profile · Landscape A4 PDF', 'amz-prints' ); ?></strong>
		<div class="catalog-toolbar__actions">
			<button type="button" class="btn btn--primary" id="amz-catalog-download"><?php esc_html_e( 'Download PDF', 'amz-prints' ); ?></button>
			<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to site', 'amz-prints' ); ?></a>
		</div>
	</div>
	<p class="catalog-toolbar__hint" id="amz-catalog-status"><?php esc_html_e( 'Click Download PDF — a landscape A4 file saves automatically to your device.', 'amz-prints' ); ?></p>
</div>

<main class="catalog-book" id="amz-catalog-book">

	<!-- COVER -->
	<section class="catalog-page catalog-page--cover" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-cover">
			<div class="catalog-cover__left">
				<?php if ( $logo_url ) : ?>
					<img class="catalog-cover__logo" src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( $company ); ?>" crossorigin="anonymous">
				<?php else : ?>
					<span class="catalog-cover__mark" aria-hidden="true"></span>
				<?php endif; ?>
				<p class="catalog-cover__eyebrow"><?php esc_html_e( 'Company Profile Catalog', 'amz-prints' ); ?> · <?php echo esc_html( gmdate( 'Y' ) ); ?></p>
				<p class="catalog-cover__short"><?php echo esc_html( $company ); ?></p>
				<h1 class="catalog-cover__legal"><?php echo esc_html( $legal ); ?></h1>
				<p class="catalog-cover__tag"><?php echo esc_html( $tagline ); ?></p>
			</div>
			<div class="catalog-cover__right">
				<div class="catalog-cover__panel">
					<strong><?php esc_html_e( 'Short name', 'amz-prints' ); ?></strong>
					<span><?php echo esc_html( $company ); ?></span>
				</div>
				<div class="catalog-cover__panel">
					<strong><?php esc_html_e( 'Official legal name', 'amz-prints' ); ?></strong>
					<span><?php echo esc_html( $legal ); ?></span>
				</div>
				<div class="catalog-cover__panel">
					<strong><?php esc_html_e( 'What we do', 'amz-prints' ); ?></strong>
					<span><?php esc_html_e( 'Printing · Branding · Packaging · NADRA · Websites · Software · Social', 'amz-prints' ); ?></span>
				</div>
				<div class="catalog-cover__panel">
					<strong><?php esc_html_e( 'Website', 'amz-prints' ); ?></strong>
					<span><?php echo esc_html( $site_url ); ?></span>
				</div>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- CONTENTS -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php echo esc_html( $company ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Table of Contents', 'amz-prints' ); ?></h2>
			<p class="catalog-lead"><?php esc_html_e( 'A complete business overview — who we are, what we print, how we build digital products, and how to reach us.', 'amz-prints' ); ?></p>
			<ol class="catalog-toc catalog-toc--dense">
				<?php foreach ( $toc as $i => $label ) : ?>
					<li>
						<span class="catalog-toc__n"><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span>
						<span class="catalog-toc__label"><?php echo esc_html( $label ); ?></span>
					</li>
				<?php endforeach; ?>
			</ol>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- ABOUT -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-split">
			<div class="catalog-split__copy">
				<p class="catalog-kicker"><?php esc_html_e( 'About us', 'amz-prints' ); ?></p>
				<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Who we are', 'amz-prints' ); ?></h2>
				<p class="catalog-lead"><?php echo esc_html( $about ); ?></p>
				<p class="catalog-body"><?php esc_html_e( 'We partner with businesses, agencies, and institutions that need print that looks sharp and arrives on time — and digital products that convert visitors into customers. From business cards to vehicle wraps, packaging to large-format campaigns, websites to custom ERP modules — one team keeps your brand consistent.', 'amz-prints' ); ?></p>
				<div class="catalog-facts">
					<div>
						<strong><?php esc_html_e( 'Official name', 'amz-prints' ); ?></strong>
						<span><?php echo esc_html( $legal ); ?></span>
					</div>
					<div>
						<strong><?php esc_html_e( 'Short name / brand', 'amz-prints' ); ?></strong>
						<span><?php echo esc_html( $company ); ?></span>
					</div>
					<div>
						<strong><?php esc_html_e( 'Hours', 'amz-prints' ); ?></strong>
						<span><?php echo esc_html( $hours ); ?></span>
					</div>
				</div>
			</div>
			<div class="catalog-split__visual">
				<figure class="catalog-shot catalog-shot--tall">
					<img src="https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1200&q=80" alt="" crossorigin="anonymous">
				</figure>
				<ul class="catalog-pillars">
					<li><?php esc_html_e( 'Commercial & digital printing', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Branding, signage & packaging', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'NADRA e-services facilitation', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Websites, software & social media', 'amz-prints' ); ?></li>
				</ul>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- MISSION VISION -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Purpose', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Our Mission & Vision', 'amz-prints' ); ?></h2>
			<div class="catalog-mv catalog-mv--wide">
				<article>
					<p class="catalog-kicker"><?php esc_html_e( 'Mission', 'amz-prints' ); ?></p>
					<h3><?php esc_html_e( 'Why we exist', 'amz-prints' ); ?></h3>
					<p class="catalog-body catalog-body--lg"><?php echo esc_html( $mission ); ?></p>
				</article>
				<article>
					<p class="catalog-kicker"><?php esc_html_e( 'Vision', 'amz-prints' ); ?></p>
					<h3><?php esc_html_e( 'Where we are going', 'amz-prints' ); ?></h3>
					<p class="catalog-body catalog-body--lg"><?php echo esc_html( $vision ); ?></p>
				</article>
			</div>
			<div class="catalog-values catalog-values--row">
				<div><strong><?php esc_html_e( 'Quality', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Color-true output and finishes that feel premium.', 'amz-prints' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Speed', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Clear timelines and proactive updates.', 'amz-prints' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Trust', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Tracked jobs and support you can reach.', 'amz-prints' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Craft', 'amz-prints' ); ?></strong><span><?php esc_html_e( 'Print floor discipline meets custom digital code.', 'amz-prints' ); ?></span></div>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- SERVICES INDEX -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Capabilities', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Our Services', 'amz-prints' ); ?></h2>
			<p class="catalog-lead"><?php esc_html_e( 'Full catalog of print, branding, media, and digital offerings — each category detailed on the following pages with portfolio mockups.', 'amz-prints' ); ?></p>
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
		$slug  = isset( $cat['slug'] ) ? $cat['slug'] : '';
		$blurb = isset( $svc_blurbs[ $slug ] ) ? $svc_blurbs[ $slug ] : 'Professional production with brand-consistent quality.';
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
					<figcaption><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?> · <?php esc_html_e( 'Portfolio mockup', 'amz-prints' ); ?></figcaption>
				</figure>
			</div>
			<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
		</section>
	<?php endforeach; ?>

	<!-- DIGITAL OVERVIEW -->
	<section class="catalog-page catalog-page--ink" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-split">
			<div class="catalog-split__copy">
				<p class="catalog-kicker"><?php esc_html_e( 'IT & Digital', 'amz-prints' ); ?></p>
				<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Our Digital Services', 'amz-prints' ); ?></h2>
				<p class="catalog-lead"><?php esc_html_e( 'Website design & development, custom software, and social media management — built with the same brand discipline as our print floor.', 'amz-prints' ); ?></p>
				<p class="catalog-body"><?php esc_html_e( 'We combine premium visuals with real functionality: lead capture, ecommerce, portals, ERP modules, and always-on social presence. Full details live on our Digital Services page.', 'amz-prints' ); ?></p>
				<p class="catalog-link-note"><?php echo esc_html( home_url( '/digital-services/' ) ); ?></p>
				<ul class="catalog-pillars catalog-pillars--dark">
					<li><?php esc_html_e( 'Website design & development', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Custom software / ERP modules', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'Social media management', 'amz-prints' ); ?></li>
					<li><?php esc_html_e( 'UI/UX, SEO & launch support', 'amz-prints' ); ?></li>
				</ul>
			</div>
			<figure class="catalog-shot catalog-shot--fill">
				<img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" alt="" crossorigin="anonymous">
			</figure>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- WEBSITE TYPES -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Digital catalog', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Website Types & Web Development', 'amz-prints' ); ?></h2>
			<p class="catalog-lead"><?php esc_html_e( 'Pick the shape that fits your goal — we design and develop each one with premium visuals and real functionality.', 'amz-prints' ); ?></p>
			<div class="catalog-type-grid">
				<?php foreach ( $website_types as $type ) : ?>
					<article>
						<h3><?php echo esc_html( $type['title'] ); ?></h3>
						<p><?php echo esc_html( $type['desc'] ); ?></p>
					</article>
				<?php endforeach; ?>
			</div>
			<h3 class="catalog-sub"><?php esc_html_e( 'What’s included in web projects', 'amz-prints' ); ?></h3>
			<ul class="catalog-item-grid catalog-item-grid--4">
				<?php foreach ( $web_features as $feat ) : ?>
					<li><?php echo esc_html( $feat ); ?></li>
				<?php endforeach; ?>
			</ul>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- SOFTWARE + SOCIAL + PROCESS -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Build & grow', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Software, Social & How We Work', 'amz-prints' ); ?></h2>
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
						<?php foreach ( array_slice( $social_features, 0, 5 ) as $feat ) : ?>
							<li><?php echo esc_html( $feat ); ?></li>
						<?php endforeach; ?>
					</ul>
				</article>
				<article>
					<h3><?php esc_html_e( 'Working mechanism', 'amz-prints' ); ?></h3>
					<ol class="catalog-mech">
						<?php foreach ( $mechanism as $step ) : ?>
							<li><strong><?php echo esc_html( $step['n'] . ' · ' . $step['t'] ); ?></strong><span><?php echo esc_html( $step['d'] ); ?></span></li>
						<?php endforeach; ?>
					</ol>
				</article>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- WHY US -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Difference', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Why Choose Us', 'amz-prints' ); ?></h2>
			<p class="catalog-lead"><?php esc_html_e( 'Most vendors sell pages or prints alone. We deliver systems, brand continuity, and support that stays after delivery.', 'amz-prints' ); ?></p>
			<div class="catalog-why-grid">
				<?php foreach ( $why as $i => $row ) : ?>
					<article>
						<span><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span>
						<h3><?php echo esc_html( $row['t'] ); ?></h3>
						<p><?php echo esc_html( $row['d'] ); ?></p>
					</article>
				<?php endforeach; ?>
			</div>
			<div class="catalog-callout">
				<strong><?php esc_html_e( 'Why customized code?', 'amz-prints' ); ?></strong>
				<p><?php esc_html_e( 'Your workflow is unique. Custom code owns your data, branding, and integrations — connecting print orders, CRM, inventory, and web leads into one system you control.', 'amz-prints' ); ?></p>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- PORTFOLIO -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner">
			<p class="catalog-kicker"><?php esc_html_e( 'Portfolio', 'amz-prints' ); ?></p>
			<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Selected Work & Mockups', 'amz-prints' ); ?></h2>
			<p class="catalog-lead"><?php esc_html_e( 'A snapshot of the environments we design for — print, packaging, campaigns, and digital interfaces.', 'amz-prints' ); ?></p>
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

	<!-- BRANCHES -->
	<section class="catalog-page" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-split">
			<div class="catalog-split__copy">
				<p class="catalog-kicker"><?php esc_html_e( 'Presence', 'amz-prints' ); ?></p>
				<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Our Branches', 'amz-prints' ); ?></h2>
				<p class="catalog-lead"><?php esc_html_e( 'Visit us or message WhatsApp — local teams ready for quotes, proofs, and digital project discussions.', 'amz-prints' ); ?></p>
				<div class="catalog-branches catalog-branches--big">
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
				<p class="catalog-body"><strong><?php esc_html_e( 'Business hours', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $hours ); ?></p>
				<?php if ( $address ) : ?>
					<p class="catalog-body"><strong><?php esc_html_e( 'Address', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $address ); ?></p>
				<?php endif; ?>
			</div>
			<figure class="catalog-shot catalog-shot--fill">
				<img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80" alt="" crossorigin="anonymous">
			</figure>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

	<!-- CONTACT -->
	<section class="catalog-page catalog-page--contact" data-page="<?php echo esc_attr( (string) $page_no++ ); ?>">
		<div class="catalog-page__inner catalog-split">
			<div class="catalog-split__copy">
				<p class="catalog-kicker"><?php esc_html_e( 'Connect', 'amz-prints' ); ?></p>
				<h2 class="catalog-title catalog-title--xl"><?php esc_html_e( 'Contact Us', 'amz-prints' ); ?></h2>
				<p class="catalog-lead"><?php esc_html_e( 'Scan a QR code or reach us directly — we are ready for your next print job or digital build.', 'amz-prints' ); ?></p>
				<div class="catalog-contact-block">
					<p class="catalog-contact-name"><?php echo esc_html( $legal ); ?></p>
					<p class="catalog-contact-brand"><?php echo esc_html( $company ); ?></p>
					<?php if ( $phone ) : ?><p><strong><?php esc_html_e( 'Phone', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $phone ); ?></p><?php endif; ?>
					<?php if ( $email ) : ?><p><strong><?php esc_html_e( 'Email', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $email ); ?></p><?php endif; ?>
					<p><strong><?php esc_html_e( 'Website', 'amz-prints' ); ?>:</strong> <?php echo esc_html( $site_url ); ?></p>
					<?php if ( $wa_raw ) : ?><p><strong><?php esc_html_e( 'WhatsApp', 'amz-prints' ); ?>:</strong> +<?php echo esc_html( $wa_raw ); ?></p><?php endif; ?>
				</div>
				<p class="catalog-thanks"><?php esc_html_e( 'Thank you for considering AMZ Prints. We look forward to building your next project.', 'amz-prints' ); ?></p>
			</div>
			<div class="catalog-qr-grid catalog-qr-grid--big">
				<figure>
					<img src="<?php echo esc_url( amz_prints_qr_url( $site_url, 280 ) ); ?>" alt="<?php esc_attr_e( 'Website QR', 'amz-prints' ); ?>" crossorigin="anonymous">
					<figcaption><?php esc_html_e( 'Website QR', 'amz-prints' ); ?></figcaption>
					<small><?php echo esc_html( $site_url ); ?></small>
				</figure>
				<figure>
					<img src="<?php echo esc_url( amz_prints_qr_url( $wa_link, 280 ) ); ?>" alt="<?php esc_attr_e( 'WhatsApp QR', 'amz-prints' ); ?>" crossorigin="anonymous">
					<figcaption><?php esc_html_e( 'WhatsApp QR', 'amz-prints' ); ?></figcaption>
					<small><?php echo $wa_raw ? esc_html( '+' . $wa_raw ) : esc_html__( 'Chat on WhatsApp', 'amz-prints' ); ?></small>
				</figure>
			</div>
		</div>
		<span class="catalog-folio"><?php echo esc_html( sprintf( '%02d', $page_no - 1 ) ); ?></span>
	</section>

</main>

<script>
(function () {
  var btn = document.getElementById('amz-catalog-download');
  var statusEl = document.getElementById('amz-catalog-status');
  var book = document.getElementById('amz-catalog-book');
  var busy = false;

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function waitForImages(root) {
    var imgs = Array.prototype.slice.call(root.querySelectorAll('img'));
    return Promise.all(imgs.map(function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (resolve) {
        var done = function () { resolve(); };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(done, 8000);
      });
    }));
  }

  function downloadPdf() {
    if (busy) return;
    if (typeof html2pdf === 'undefined') {
      setStatus('PDF library failed to load. Please refresh and try again.');
      return;
    }
    busy = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Preparing PDF…';
    }
    setStatus('Building landscape A4 PDF — please wait…');

    waitForImages(book).then(function () {
      var opt = {
        margin: 0,
        filename: 'AMZ-Prints-Company-Profile.pdf',
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 1400
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['css', 'legacy'], after: '.catalog-page' }
      };

      return html2pdf().set(opt).from(book).save();
    }).then(function () {
      setStatus('Download started — check your Downloads folder for AMZ-Prints-Company-Profile.pdf');
    }).catch(function () {
      setStatus('Automatic download failed. Opening print dialog as fallback…');
      window.print();
    }).finally(function () {
      busy = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Download PDF';
      }
    });
  }

  if (btn) btn.addEventListener('click', downloadPdf);

  if (document.body.classList.contains('catalog-download-mode')) {
    setStatus('Starting automatic landscape PDF download…');
    window.setTimeout(downloadPdf, 900);
  }
})();
</script>
<?php wp_footer(); ?>
</body>
</html>
