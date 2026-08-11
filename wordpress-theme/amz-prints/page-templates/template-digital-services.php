<?php
/**
 * Template Name: Digital Services
 * IT & Digital services — websites, custom software, social media.
 *
 * @package AMZ_Prints
 */

get_header();

$company = amz_prints_mod( 'amz_company_name', 'AMZ Prints' );
$wa      = preg_replace( '/\D+/', '', amz_prints_mod( 'amz_whatsapp', amz_prints_mod( 'amz_phone', '' ) ) );
$wa_msg  = rawurlencode( 'Hello AMZ Prints — I want to discuss Digital / IT services.' );
$wa_href = $wa ? ( 'https://wa.me/' . $wa . '?text=' . $wa_msg ) : home_url( '/contact/' );
$discuss = home_url( '/quote/?service=' . rawurlencode( 'Digital Services Discussion' ) );

$website_types = array(
	array(
		'title' => 'Business Website',
		'desc'  => 'Authority site for companies — services, about, contact, and lead capture.',
		'img'   => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
	),
	array(
		'title' => 'E-Commerce Store',
		'desc'  => 'Product catalog, cart, checkout, and order flow built for real sales.',
		'img'   => 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80',
	),
	array(
		'title' => 'Portfolio / Agency',
		'desc'  => 'Showcase work with cinematic layout, case studies, and inquiry CTAs.',
		'img'   => 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=900&q=80',
	),
	array(
		'title' => 'Booking & Services',
		'desc'  => 'Appointment, quote, or service booking flows for clinics, salons, and field teams.',
		'img'   => 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80',
	),
	array(
		'title' => 'Landing Pages',
		'desc'  => 'High-conversion campaign pages for ads, launches, and promotions.',
		'img'   => 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=900&q=80',
	),
	array(
		'title' => 'Custom Web Apps',
		'desc'  => 'Dashboards, portals, and tools tailored to your operations — not templates.',
		'img'   => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
	),
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
	'Hashtag & reach strategy',
	'Monthly performance reports',
	'Print + digital asset alignment',
);

$mechanism = array(
	array( 'n' => '01', 't' => 'Discovery Call', 'd' => 'We learn your goals, audience, competitors, and must-have features.' ),
	array( 'n' => '02', 't' => 'Blueprint', 'd' => 'Sitemap, wireframes, tech stack, and timeline — clear before we build.' ),
	array( 'n' => '03', 't' => 'Design System', 'd' => 'Visual language, components, and motion so every screen feels premium.' ),
	array( 'n' => '04', 't' => 'Build & Integrate', 'd' => 'Custom-coded features, CMS, APIs, and quality checks on real devices.' ),
	array( 'n' => '05', 't' => 'Launch', 'd' => 'Go-live, analytics, training, and a support window so you are never stuck.' ),
	array( 'n' => '06', 't' => 'Grow', 'd' => 'Iterate with new pages, campaigns, modules, and performance upgrades.' ),
);

$different = array(
	array( 't' => 'Print + Digital under one roof', 'd' => 'Branding, print production, and digital products stay visually consistent.' ),
	array( 't' => 'Custom code, not clone themes', 'd' => 'We build what your business needs — no locked templates or dead plugins.' ),
	array( 't' => 'Business-first process', 'd' => 'Every feature maps to leads, sales, tracking, or operations — not decoration.' ),
	array( 't' => 'Local support you can call', 'd' => 'Branches and WhatsApp support mean faster answers than offshore freelancers.' ),
);

$why_custom = array(
	'Your workflow is unique — off-the-shelf tools force you to bend around them.',
	'Custom code owns your data, branding, and speed without renting someone else’s limits.',
	'We can connect print orders, CRM, inventory, and web leads into one system.',
	'Clean architecture means cheaper updates later — not a pile of temporary hacks.',
	'Security and roles are designed for your team, not a generic “admin” account.',
);
?>

<section class="ds-hero" data-ds-hero>
	<div class="ds-hero__bg" aria-hidden="true">
		<div class="ds-hero__orb ds-hero__orb--a"></div>
		<div class="ds-hero__orb ds-hero__orb--b"></div>
		<div class="ds-hero__grid"></div>
		<div class="ds-hero__photo" style="background-image:url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80')"></div>
	</div>
	<div class="container ds-hero__inner">
		<p class="eyebrow reveal" data-reveal><?php echo esc_html( $company ); ?> · IT & Digital</p>
		<h1 class="reveal" data-reveal><?php esc_html_e( 'Digital Services that look sharp and work hard', 'amz-prints' ); ?></h1>
		<p class="ds-hero__lead reveal" data-reveal><?php esc_html_e( 'Website design & development, custom software, and social media management — built with animation, clarity, and business outcomes.', 'amz-prints' ); ?></p>
		<div class="ds-hero__actions reveal" data-reveal>
			<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( $discuss ); ?>"><?php esc_html_e( 'More info & discussion', 'amz-prints' ); ?></a>
			<a class="btn btn--ghost btn--lg btn--magnetic" href="<?php echo esc_url( $wa_href ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'WhatsApp us', 'amz-prints' ); ?></a>
		</div>
		<nav class="ds-jump reveal" data-reveal aria-label="<?php esc_attr_e( 'Jump to section', 'amz-prints' ); ?>">
			<a href="#website-types"><?php esc_html_e( 'Website types', 'amz-prints' ); ?></a>
			<a href="#web-dev"><?php esc_html_e( 'Web development', 'amz-prints' ); ?></a>
			<a href="#custom-software"><?php esc_html_e( 'Custom software', 'amz-prints' ); ?></a>
			<a href="#social"><?php esc_html_e( 'Social media', 'amz-prints' ); ?></a>
			<a href="#mechanism"><?php esc_html_e( 'How we work', 'amz-prints' ); ?></a>
		</nav>
	</div>
</section>

<section class="section ds-section" id="website-types">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Digital catalog', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Types of websites & digital products', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Pick the shape that fits your goal — we design and develop each one with premium visuals and real functionality.', 'amz-prints' ); ?></p>
		</header>
		<div class="ds-type-grid">
			<?php foreach ( $website_types as $i => $type ) : ?>
				<article class="ds-type reveal has-tilt" data-reveal style="--i:<?php echo esc_attr( (string) $i ); ?>">
					<div class="ds-type__media">
						<img src="<?php echo esc_url( $type['img'] ); ?>" alt="<?php echo esc_attr( $type['title'] ); ?>" loading="lazy">
						<span class="ds-type__shine" aria-hidden="true"></span>
					</div>
					<div class="ds-type__body">
						<h3><?php echo esc_html( $type['title'] ); ?></h3>
						<p><?php echo esc_html( $type['desc'] ); ?></p>
					</div>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section class="section ds-section ds-section--split" id="web-dev">
	<div class="container ds-split">
		<div class="ds-split__visual reveal" data-reveal>
			<div class="ds-stage" data-ds-stage>
				<img class="ds-stage__img is-active" src="https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=1200&q=80" alt="" loading="lazy">
				<img class="ds-stage__img" src="https://images.unsplash.com/photo-1522542550221-31fd19575c2c?auto=format&fit=crop&w=1200&q=80" alt="" loading="lazy">
				<img class="ds-stage__img" src="https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=80" alt="" loading="lazy">
				<div class="ds-stage__frame" aria-hidden="true"></div>
			</div>
		</div>
		<div class="ds-split__copy reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Core service', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Website Design & Development', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'From first sketch to live launch — interfaces that feel premium, load fast, and turn visitors into customers. We combine brand design with clean engineering so your site is not just pretty — it performs.', 'amz-prints' ); ?></p>
			<ul class="ds-feature-list">
				<?php foreach ( $web_features as $feat ) : ?>
					<li><?php echo esc_html( $feat ); ?></li>
				<?php endforeach; ?>
			</ul>
			<a class="btn btn--primary btn--magnetic" href="<?php echo esc_url( $discuss ); ?>"><?php esc_html_e( 'Discuss my website', 'amz-prints' ); ?></a>
		</div>
	</div>
</section>

<section class="section ds-section ds-section--ink" id="custom-software">
	<div class="container ds-split ds-split--flip">
		<div class="ds-split__copy reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Built for operations', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Custom Software Development', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'ERP modules, portals, CRMs, booking systems, and internal tools — engineered around how your team actually works. No rented templates. No mystery code. Full ownership of a system that scales with you.', 'amz-prints' ); ?></p>
			<ul class="ds-feature-list ds-feature-list--light">
				<?php foreach ( $software_features as $feat ) : ?>
					<li><?php echo esc_html( $feat ); ?></li>
				<?php endforeach; ?>
			</ul>
			<a class="btn btn--primary btn--magnetic" href="<?php echo esc_url( $discuss ); ?>"><?php esc_html_e( 'Plan a custom system', 'amz-prints' ); ?></a>
		</div>
		<div class="ds-split__visual reveal" data-reveal>
			<figure class="ds-shot">
				<img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80" alt="<?php esc_attr_e( 'Custom software dashboards', 'amz-prints' ); ?>" loading="lazy">
			</figure>
		</div>
	</div>
</section>

<section class="section ds-section" id="social">
	<div class="container ds-split">
		<div class="ds-split__visual reveal" data-reveal>
			<figure class="ds-shot ds-shot--stack">
				<img src="https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=900&q=80" alt="" loading="lazy">
				<img src="https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=700&q=80" alt="" loading="lazy">
			</figure>
		</div>
		<div class="ds-split__copy reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Always-on presence', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Social Media Management', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Consistent posting, on-brand creatives, and engagement that grows trust. We align your social feed with the same visual language used in your print and website — so every channel feels like one brand.', 'amz-prints' ); ?></p>
			<ul class="ds-feature-list">
				<?php foreach ( $social_features as $feat ) : ?>
					<li><?php echo esc_html( $feat ); ?></li>
				<?php endforeach; ?>
			</ul>
			<a class="btn btn--primary btn--magnetic" href="<?php echo esc_url( $discuss ); ?>"><?php esc_html_e( 'Start social management', 'amz-prints' ); ?></a>
		</div>
	</div>
</section>

<section class="section ds-section ds-section--mechanism" id="mechanism">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Working mechanism', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'How digital projects move with us', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'A clear path from idea to launch — with checkpoints you can see and approve.', 'amz-prints' ); ?></p>
		</header>
		<div class="ds-mech">
			<?php foreach ( $mechanism as $i => $step ) : ?>
				<article class="ds-mech__step reveal" data-reveal style="--i:<?php echo esc_attr( (string) $i ); ?>">
					<span class="ds-mech__n"><?php echo esc_html( $step['n'] ); ?></span>
					<h3><?php echo esc_html( $step['t'] ); ?></h3>
					<p><?php echo esc_html( $step['d'] ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section class="section ds-section" id="why-different">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Why AMZ', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Why we are different from others', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Most vendors sell pages. We deliver systems, brand continuity, and support that stays after launch.', 'amz-prints' ); ?></p>
		</header>
		<div class="ds-diff-grid">
			<?php foreach ( $different as $i => $row ) : ?>
				<article class="ds-diff reveal has-tilt" data-reveal style="--i:<?php echo esc_attr( (string) $i ); ?>">
					<span class="ds-diff__mark" aria-hidden="true"></span>
					<h3><?php echo esc_html( $row['t'] ); ?></h3>
					<p><?php echo esc_html( $row['d'] ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section class="section ds-section ds-section--custom" id="why-custom">
	<div class="container ds-custom">
		<div class="ds-custom__copy reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Engineering philosophy', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Why we work on customized code', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Templates get you online. Custom code gets you ahead — faster screens, exact workflows, and a product you own.', 'amz-prints' ); ?></p>
			<ul class="ds-feature-list">
				<?php foreach ( $why_custom as $line ) : ?>
					<li><?php echo esc_html( $line ); ?></li>
				<?php endforeach; ?>
			</ul>
		</div>
		<div class="ds-custom__panel reveal" data-reveal aria-hidden="true">
			<div class="ds-code">
				<span>custom · secure · scalable</span>
				<strong>Build once.<br>Own forever.</strong>
			</div>
		</div>
	</div>
</section>

<?php if ( function_exists( 'amz_prints_catalog_promo' ) ) { amz_prints_catalog_promo( 'digital' ); } ?>

<section class="section ds-section ds-cta" id="discuss">
	<div class="container ds-cta__band reveal" data-reveal>
		<div>
			<p class="eyebrow"><?php esc_html_e( 'Next step', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Need more info or a live discussion?', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Tell us about your website, software, or social goals — we will map features, timeline, and investment clearly.', 'amz-prints' ); ?></p>
		</div>
		<div class="ds-cta__actions">
			<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( $discuss ); ?>"><?php esc_html_e( 'More info & discussion', 'amz-prints' ); ?></a>
			<a class="btn btn--ghost btn--lg btn--magnetic" href="<?php echo esc_url( $wa_href ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'WhatsApp discussion', 'amz-prints' ); ?></a>
			<a class="btn btn--ghost btn--lg btn--magnetic" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Contact form', 'amz-prints' ); ?></a>
		</div>
	</div>
</section>

<?php get_footer(); ?>
