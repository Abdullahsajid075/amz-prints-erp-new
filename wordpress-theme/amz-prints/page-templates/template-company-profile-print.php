<?php
/**
 * Template Name: Company Profile — Print & Design
 * Editorial portrait catalog — orange atelier.
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
$lays      = array( 'cp-lay-a', 'cp-lay-b', 'cp-lay-c', 'cp-lay-d' );
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html( $id['registered'] ); ?> — Company Profile</title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'amz-catalog-body catalog-theme-print catalog-classic catalog-atelier catalog-portrait flipbook-body' . ( $auto_dl ? ' catalog-download-mode' : '' ) ); ?>>
<?php wp_body_open(); ?>
<?php
amz_prints_flipbook_shell_open(
	array(
		'theme'    => 'print',
		'title'    => __( 'Printing & Designing Profile', 'amz-prints' ),
		'subtitle' => __( 'Editorial portrait catalog', 'amz-prints' ),
	)
);
?>

	<div class="page page--hard" data-density="hard">
		<div class="page-content cp cp--cover cp--cover-print" style="--cp-cover:url('<?php echo esc_url( $cover_img ); ?>')">
			<div class="cp-cover__inner">
				<div class="cp-cover__top">
					<span>Est. Mandi Bahauddin</span>
					<span><?php echo esc_html( $id['year'] ); ?></span>
				</div>
				<div class="cp-cover__crest">APS</div>
				<p class="cp-cover__eyebrow">Official Company Profile</p>
				<?php if ( ! empty( $id['logo_url'] ) ) : ?>
					<img class="cp-cover__logo" src="<?php echo esc_url( $id['logo_url'] ); ?>" alt="">
				<?php endif; ?>
				<h1 class="cp-cover__title"><?php echo esc_html( $id['registered'] ); ?></h1>
				<p class="cp-cover__brand"><?php echo esc_html( $brand ); ?></p>
				<div class="cp-cover__rule"></div>
				<p class="cp-cover__tag"><?php echo esc_html( $id['business'] ); ?></p>
				<p class="cp-cover__loc"><?php echo esc_html( $id['hq'] ); ?></p>
			</div>
		</div>
	</div>

	<div class="page page--hard" data-density="hard">
		<div class="page-content cp cp--identity">
			<aside class="cp-rail">Identity</aside>
			<div class="cp-identity__body">
				<?php amz_cp_head( 'Company Identity', $id['registered'] ); ?>
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
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--toc">
			<div class="cp-plate"><span>Contents</span></div>
			<ol class="cp-toc">
				<?php foreach ( $toc as $i => $label ) : ?>
					<li><span><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span><em><?php echo esc_html( $label ); ?></em><i></i></li>
				<?php endforeach; ?>
			</ol>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--intro">
			<figure class="cp-intro__photo">
				<img src="<?php echo esc_url( $intro_img ); ?>" alt="">
				<figcaption>Press · Branding · Design</figcaption>
			</figure>
			<div class="cp-intro__copy">
				<?php amz_cp_head( '01 — Introduction', 'Company Overview' ); ?>
				<p class="cp-drop"><?php echo esc_html( $id['overview'] ); ?></p>
				<p><?php echo esc_html( $id['history'] ); ?></p>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--letter">
			<?php amz_cp_head( '02 — Leadership', 'Message from the CEO' ); ?>
			<div class="cp-monogram">AS</div>
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

	<div class="page">
		<div class="page-content cp cp--about">
			<?php amz_cp_head( '03 — About Us', 'Business Nature & Core Expertise' ); ?>
			<p class="cp-lead">We serve individuals, retailers, corporates, institutions and agencies with printing, advertising, branding and digital services.</p>
			<div class="cp-split">
				<div>
					<h3 class="cp-h3">Core Expertise</h3>
					<?php amz_cp_checklist( $id['expertise'] ); ?>
				</div>
				<div>
					<h3 class="cp-h3">Company Strengths</h3>
					<?php amz_cp_checklist( $id['strengths'] ); ?>
				</div>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--vm">
			<?php amz_cp_head( '04 — Direction', 'Vision & Mission' ); ?>
			<div class="cp-vm-card cp-vm-card--vision">
				<b>V</b>
				<div>
					<span>Vision</span>
					<p><?php echo esc_html( $id['vision'] ); ?></p>
				</div>
			</div>
			<div class="cp-vm-card cp-vm-card--mission">
				<b>M</b>
				<div>
					<span>Mission</span>
					<p><?php echo esc_html( $id['mission'] ); ?></p>
				</div>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--values">
			<?php amz_cp_head( '05 — Principles', 'Core Values' ); ?>
			<div class="cp-value-grid">
				<?php foreach ( $id['values'] as $i => $v ) : ?>
					<div class="cp-value"><i><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></i><span><?php echo esc_html( $v ); ?></span></div>
				<?php endforeach; ?>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--services-index">
			<div class="cp-plate"><span>Our Services</span></div>
			<p class="cp-pad-top">A complete print, branding and studio offering — detailed chapter by chapter in the following pages.</p>
			<ol class="cp-index-list">
				<?php foreach ( $chapters as $i => $ch ) : ?>
					<li><b><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></b><span><?php echo esc_html( $ch['title'] ); ?></span><em><?php echo esc_html( count( $ch['items'] ) ); ?></em></li>
				<?php endforeach; ?>
			</ol>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<?php foreach ( $chapters as $ci => $ch ) : ?>
		<div class="page">
			<div class="page-content cp cp--chapter <?php echo esc_attr( $lays[ $ci % 4 ] ); ?>">
				<div class="cp-ch-head">
					<span><?php echo esc_html( sprintf( '%02d', $ci + 1 ) ); ?></span>
					<h2><?php echo esc_html( $ch['title'] ); ?></h2>
				</div>
				<div class="cp-chapter-body">
					<p class="cp-lead"><?php echo esc_html( $ch['intro'] ); ?></p>
					<?php amz_cp_checklist( $ch['items'] ); ?>
				</div>
				<?php amz_cp_foot( $pn, $brand ); ?>
			</div>
		</div>
	<?php endforeach; ?>

	<div class="page">
		<div class="page-content cp cp--ink-soft">
			<?php amz_cp_head( 'Digital & IT', 'Digital Services at a Glance' ); ?>
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

	<div class="page">
		<div class="page-content cp cp--facilities">
			<?php amz_cp_head( 'Production', 'Infrastructure & Capability' ); ?>
			<?php amz_cp_checklist( $id['facilities'] ); ?>
			<h3 class="cp-h3">Business Infrastructure</h3>
			<?php amz_cp_chips( $id['infra'] ); ?>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--team">
			<?php amz_cp_head( 'Our Team', 'Human Resources' ); ?>
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

	<div class="page">
		<div class="page-content cp cp--tech">
			<?php amz_cp_head( 'Technology', 'Systems & ERP' ); ?>
			<p class="cp-lead">Modern systems keep jobs tracked — from enquiry to dispatch.</p>
			<h3 class="cp-h3">Technology &amp; Systems</h3>
			<?php amz_cp_checklist( $id['tech'] ); ?>
			<h3 class="cp-h3">ERP Modules</h3>
			<?php amz_cp_chips( $id['erp'] ); ?>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--quality cp-lay-b">
			<div class="cp-ch-head">
				<span>QA</span>
				<h2>Quality Policy</h2>
			</div>
			<div class="cp-chapter-body">
				<p class="cp-lead">Every job passes through design, production and finishing checks before handover.</p>
				<?php amz_cp_checklist( $id['quality'] ); ?>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--markets">
			<?php amz_cp_head( 'Markets', 'Industries We Serve' ); ?>
			<?php amz_cp_chips( $id['segments'] ); ?>
			<h3 class="cp-h3">Primary Market</h3>
			<?php amz_cp_chips( $id['markets'] ); ?>
			<h3 class="cp-h3">Expansion Focus</h3>
			<?php amz_cp_chips( $id['expansion'] ); ?>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--portfolio">
			<?php amz_cp_head( 'Portfolio', 'Selected Work' ); ?>
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

	<div class="page">
		<div class="page-content cp cp--why">
			<div class="cp-plate"><span>Why Choose Us</span></div>
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

	<div class="page">
		<div class="page-content cp cp--group">
			<?php amz_cp_head( 'Group Companies', 'Associated Companies' ); ?>
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

	<div class="page">
		<div class="page-content cp cp--contact">
			<div class="cp-plate"><span>Contact Us</span></div>
			<div class="cp-contact-card">
				<p class="cp-contact-card__name"><?php echo esc_html( $id['registered'] ); ?></p>
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

	<div class="page page--hard" data-density="hard">
		<div class="page-content cp cp--back cp--cover-print">
			<div class="cp-cover__crest">APS</div>
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
