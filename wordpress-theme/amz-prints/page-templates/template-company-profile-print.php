<?php
/**
 * Template Name: Company Profile — Print & Design
 * Classic portrait company profile catalog.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$id        = amz_prints_profile_identity();
$chapters  = amz_prints_print_service_chapters();
$auto_dl   = isset( $_GET['download'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$cover_img = amz_prints_book_image( 'amz_book_print_cover', 'https://images.unsplash.com/photo-1626785774573-4b7993143459?auto=format&fit=crop&w=1200&q=80' );
$intro_img = amz_prints_book_image( 'amz_book_print_intro', 'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1000&q=80' );
$portfolio = amz_prints_book_portfolio( 'print' );
$brand     = $id['brand'];
$pn        = 1;
$toc       = array(
	'Company Introduction', 'CEO Message', 'About Us', 'Vision & Mission', 'Core Values',
	'Our Services', 'Printing Chapters', 'Production & Team', 'Technology & ERP',
	'Quality & Markets', 'Why Choose Us', 'Group Companies', 'Contact',
);
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html( $id['registered'] ); ?> — Company Profile</title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'amz-catalog-body catalog-theme-print catalog-classic catalog-portrait flipbook-body' . ( $auto_dl ? ' catalog-download-mode' : '' ) ); ?>>
<?php wp_body_open(); ?>
<?php
amz_prints_flipbook_shell_open(
	array(
		'theme'    => 'print',
		'title'    => __( 'Printing & Designing Profile', 'amz-prints' ),
		'subtitle' => __( 'Classic portrait catalog', 'amz-prints' ),
	)
);
?>

	<!-- COVER -->
	<div class="page page--hard" data-density="hard">
		<div class="page-content cp cp--cover cp--cover-print" style="--cp-cover:url('<?php echo esc_url( $cover_img ); ?>')">
			<div class="cp-cover__frame">
				<?php if ( ! empty( $id['logo_url'] ) ) : ?>
					<img class="cp-cover__logo" src="<?php echo esc_url( $id['logo_url'] ); ?>" alt="">
				<?php endif; ?>
				<p class="cp-cover__eyebrow">Official Company Profile <?php echo esc_html( $id['year'] ); ?></p>
				<h1 class="cp-cover__title"><?php echo esc_html( $id['registered'] ); ?></h1>
				<p class="cp-cover__brand"><?php echo esc_html( $brand ); ?></p>
				<div class="cp-cover__rule"></div>
				<p class="cp-cover__tag"><?php echo esc_html( $id['business'] ); ?></p>
				<p class="cp-cover__loc"><?php echo esc_html( $id['hq'] ); ?></p>
			</div>
		</div>
	</div>

	<!-- INSIDE COVER / IDENTITY -->
	<div class="page page--hard" data-density="hard">
		<div class="page-content cp cp--identity">
			<p class="cp-kicker">Company Identity</p>
			<h2 class="cp-h1"><?php echo esc_html( $id['registered'] ); ?></h2>
			<table class="cp-meta-table">
				<tr><th>Registered Name</th><td><?php echo esc_html( $id['registered'] ); ?></td></tr>
				<tr><th>Brand / Trading</th><td><?php echo esc_html( $brand ); ?></td></tr>
				<tr><th>Business Type</th><td><?php echo esc_html( $id['business'] ); ?></td></tr>
				<tr><th>CEO / MD</th><td><?php echo esc_html( $id['ceo'] ); ?></td></tr>
				<tr><th>Head Office</th><td><?php echo esc_html( $id['hq'] ); ?></td></tr>
				<tr><th>WhatsApp</th><td><?php echo esc_html( $id['wa_display'] ); ?></td></tr>
				<tr><th>Website</th><td><?php echo esc_html( $id['website'] ); ?></td></tr>
				<tr><th>Email</th><td><?php echo esc_html( $id['email'] ); ?></td></tr>
				<tr><th>Hours</th><td><?php echo esc_html( $id['hours'] ); ?></td></tr>
			</table>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- TOC -->
	<div class="page">
		<div class="page-content cp cp--toc">
			<div class="cp-ribbon">Contents</div>
			<ol class="cp-toc">
				<?php foreach ( $toc as $i => $label ) : ?>
					<li><span><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span><em><?php echo esc_html( $label ); ?></em></li>
				<?php endforeach; ?>
			</ol>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- INTRODUCTION -->
	<div class="page">
		<div class="page-content cp cp--intro">
			<figure class="cp-intro__photo"><img src="<?php echo esc_url( $intro_img ); ?>" alt=""></figure>
			<div class="cp-intro__copy">
				<p class="cp-kicker">01 — Introduction</p>
				<h2 class="cp-h2">Company Overview</h2>
				<p><?php echo esc_html( $id['overview'] ); ?></p>
				<p><?php echo esc_html( $id['history'] ); ?></p>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- CEO MESSAGE -->
	<div class="page">
		<div class="page-content cp cp--letter">
			<p class="cp-kicker">02 — Leadership</p>
			<h2 class="cp-h2">Message from the CEO</h2>
			<blockquote class="cp-quote">
				<p>At Amazon Printing Services, we believe every brand deserves print and digital work that feels intentional — sharp color, reliable timelines, and creative that earns trust. From Mandi Bahauddin to clients across Pakistan and beyond, our team builds lasting partnerships through craftsmanship and clear communication.</p>
				<p>Whether you need a single visiting card or a complete branding and technology system, we are ready to deliver with professionalism and care.</p>
			</blockquote>
			<div class="cp-sign">
				<strong><?php echo esc_html( $id['ceo'] ); ?></strong>
				<span><?php echo esc_html( $id['ceo_title'] ); ?></span>
				<span><?php echo esc_html( $id['registered'] ); ?></span>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- ABOUT / EXPERTISE -->
	<div class="page">
		<div class="page-content cp cp--about">
			<p class="cp-kicker">03 — About Us</p>
			<h2 class="cp-h2">Business Nature &amp; Core Expertise</h2>
			<p class="cp-lead">We serve individuals, retailers, corporates, institutions and agencies with printing, advertising, branding and digital services.</p>
			<h3 class="cp-h3">Core Expertise</h3>
			<?php amz_cp_checklist( $id['expertise'] ); ?>
			<h3 class="cp-h3">Company Strengths</h3>
			<?php amz_cp_checklist( $id['strengths'] ); ?>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- VISION MISSION -->
	<div class="page">
		<div class="page-content cp cp--vm">
			<p class="cp-kicker">04 — Direction</p>
			<div class="cp-vm-card cp-vm-card--vision">
				<span>Vision</span>
				<p><?php echo esc_html( $id['vision'] ); ?></p>
			</div>
			<div class="cp-vm-card cp-vm-card--mission">
				<span>Mission</span>
				<p><?php echo esc_html( $id['mission'] ); ?></p>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- VALUES -->
	<div class="page">
		<div class="page-content cp cp--values">
			<p class="cp-kicker">05 — Principles</p>
			<h2 class="cp-h2">Core Values</h2>
			<div class="cp-value-grid">
				<?php foreach ( $id['values'] as $v ) : ?>
					<div class="cp-value"><span><?php echo esc_html( $v ); ?></span></div>
				<?php endforeach; ?>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- SERVICES OVERVIEW -->
	<div class="page">
		<div class="page-content cp cp--services-index">
			<div class="cp-band">Our Services</div>
			<p class="cp-pad-top">A complete print, branding and studio offering — detailed chapter by chapter in the following pages.</p>
			<ol class="cp-index-list">
				<?php foreach ( $chapters as $i => $ch ) : ?>
					<li><b><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></b><span><?php echo esc_html( $ch['title'] ); ?></span><em><?php echo esc_html( count( $ch['items'] ) ); ?> offerings</em></li>
				<?php endforeach; ?>
			</ol>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<?php foreach ( $chapters as $ci => $ch ) : ?>
		<div class="page">
			<div class="page-content cp cp--chapter <?php echo esc_attr( 0 === $ci % 2 ? 'cp--chapter-a' : 'cp--chapter-b' ); ?>">
				<div class="cp-band"><?php echo esc_html( $ch['title'] ); ?></div>
				<div class="cp-chapter-body">
					<p class="cp-lead"><?php echo esc_html( $ch['intro'] ); ?></p>
					<?php amz_cp_checklist( $ch['items'] ); ?>
				</div>
				<?php amz_cp_foot( $pn, $brand ); ?>
			</div>
		</div>
	<?php endforeach; ?>

	<!-- DIGITAL BRIEF -->
	<div class="page">
		<div class="page-content cp cp--ink-soft">
			<p class="cp-kicker">Digital &amp; IT</p>
			<h2 class="cp-h2">Digital Services at a Glance</h2>
			<p class="cp-lead">Alongside print, our IT &amp; Digital division delivers websites, custom software, ecommerce, SEO, social media and business automation — see the Digital Profile for the complete catalogue.</p>
			<?php
			amz_cp_checklist(
				array(
					'Website Design & Development',
					'Custom Website Development',
					'WordPress & E-Commerce',
					'UI / Mobile App UI Design',
					'Digital Marketing & SEO',
					'Social Media Management',
					'Business Automation',
					'ERP / Business Management Solutions',
				)
			);
			?>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- PRODUCTION -->
	<div class="page">
		<div class="page-content cp cp--facilities">
			<p class="cp-kicker">Production Facilities</p>
			<h2 class="cp-h2">Infrastructure &amp; Capability</h2>
			<?php amz_cp_checklist( $id['facilities'] ); ?>
			<h3 class="cp-h3">Business Infrastructure</h3>
			<?php amz_cp_chips( $id['infra'] ); ?>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- TEAM -->
	<div class="page">
		<div class="page-content cp cp--team">
			<p class="cp-kicker">Our Team</p>
			<h2 class="cp-h2">Human Resources</h2>
			<div class="cp-stat-grid">
				<?php foreach ( $id['workforce'] as $row ) : ?>
					<div class="cp-stat"><strong><?php echo esc_html( $row[0] ); ?></strong><span><?php echo esc_html( $row[1] ); ?></span></div>
				<?php endforeach; ?>
			</div>
			<h3 class="cp-h3">Departments</h3>
			<?php amz_cp_chips( $id['departments'] ); ?>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- TECH & ERP -->
	<div class="page">
		<div class="page-content cp cp--tech">
			<p class="cp-kicker">Technology</p>
			<h2 class="cp-h2">Systems &amp; ERP</h2>
			<p class="cp-lead">Modern systems keep jobs tracked — from enquiry to dispatch.</p>
			<h3 class="cp-h3">Technology &amp; Systems</h3>
			<?php amz_cp_checklist( $id['tech'] ); ?>
			<h3 class="cp-h3">ERP Modules</h3>
			<?php amz_cp_chips( $id['erp'] ); ?>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- QUALITY -->
	<div class="page">
		<div class="page-content cp cp--quality">
			<div class="cp-band">Quality Policy</div>
			<div class="cp-chapter-body">
				<p class="cp-lead">Every job passes through design, production and finishing checks before handover.</p>
				<?php amz_cp_checklist( $id['quality'] ); ?>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- SEGMENTS & MARKETS -->
	<div class="page">
		<div class="page-content cp cp--markets">
			<p class="cp-kicker">Markets</p>
			<h2 class="cp-h2">Industries We Serve</h2>
			<?php amz_cp_chips( $id['segments'] ); ?>
			<h3 class="cp-h3">Primary Market</h3>
			<?php amz_cp_chips( $id['markets'] ); ?>
			<h3 class="cp-h3">Expansion Focus</h3>
			<?php amz_cp_chips( $id['expansion'] ); ?>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- PORTFOLIO -->
	<div class="page">
		<div class="page-content cp cp--portfolio">
			<p class="cp-kicker">Portfolio</p>
			<h2 class="cp-h2">Selected Work</h2>
			<div class="cp-folio">
				<?php foreach ( array_slice( $portfolio, 0, 6 ) as $item ) : ?>
					<figure>
						<img src="<?php echo esc_url( $item['img'] ); ?>" alt="">
						<figcaption><?php echo esc_html( $item['title'] ); ?></figcaption>
					</figure>
				<?php endforeach; ?>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- WHY US -->
	<div class="page">
		<div class="page-content cp cp--why">
			<div class="cp-band">Why Choose Us</div>
			<div class="cp-chapter-body">
				<ol class="cp-why-list">
					<?php foreach ( $id['why'] as $i => $w ) : ?>
						<li><b><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></b><span><?php echo esc_html( $w ); ?></span></li>
					<?php endforeach; ?>
				</ol>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- GROUP -->
	<div class="page">
		<div class="page-content cp cp--group">
			<p class="cp-kicker">Group Companies</p>
			<h2 class="cp-h2">Associated Companies</h2>
			<?php foreach ( $id['group'] as $g ) : ?>
				<article class="cp-group-card">
					<strong><?php echo esc_html( $g['name'] ); ?></strong>
					<p><?php echo esc_html( $g['desc'] ); ?></p>
				</article>
			<?php endforeach; ?>
			<p class="cp-note">Presented as group / associated companies subject to confirming exact legal relationships.</p>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- ONLINE + CONTACT -->
	<div class="page">
		<div class="page-content cp cp--contact">
			<div class="cp-band">Contact Us</div>
			<div class="cp-contact-block">
				<p><strong><?php echo esc_html( $id['registered'] ); ?></strong></p>
				<p><?php echo esc_html( $brand ); ?></p>
				<p><?php echo esc_html( $id['hq'] ); ?></p>
				<p>WhatsApp: <?php echo esc_html( $id['wa_display'] ); ?></p>
				<p>Website: <?php echo esc_html( $id['website'] ); ?></p>
				<?php if ( $id['email'] ) : ?><p>Email: <?php echo esc_html( $id['email'] ); ?></p><?php endif; ?>
				<?php if ( $id['phone'] ) : ?><p>Phone: <?php echo esc_html( $id['phone'] ); ?></p><?php endif; ?>
				<p><?php echo esc_html( $id['hours'] ); ?></p>
			</div>
			<h3 class="cp-h3">Online Presence</h3>
			<?php amz_cp_chips( $id['online'] ); ?>
			<div class="cp-qr">
				<figure>
					<img src="<?php echo esc_url( amz_prints_qr_url( $id['site_url'], 140 ) ); ?>" alt="">
					<figcaption>Website</figcaption>
				</figure>
				<figure>
					<img src="<?php echo esc_url( amz_prints_qr_url( $id['wa_link'], 140 ) ); ?>" alt="">
					<figcaption>WhatsApp</figcaption>
				</figure>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<!-- BACK COVER -->
	<div class="page page--hard" data-density="hard">
		<div class="page-content cp cp--back cp--cover-print">
			<p class="cp-cover__brand"><?php echo esc_html( $brand ); ?></p>
			<h2 class="cp-cover__title"><?php echo esc_html( $id['registered'] ); ?></h2>
			<div class="cp-cover__rule"></div>
			<p class="cp-cover__tag"><?php echo esc_html( $id['website'] ); ?></p>
			<p class="cp-cover__loc">WhatsApp <?php echo esc_html( $id['wa_display'] ); ?></p>
			<p class="cp-cover__tag">Thank you</p>
		</div>
	</div>

<?php amz_prints_flipbook_shell_close(); ?>
<?php wp_footer(); ?>
</body>
</html>
