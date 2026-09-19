<?php
/**
 * Template Name: Company Profile — IT & Digital
 * Editorial portrait catalog — black & gold.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$id         = amz_prints_profile_identity();
$chapters   = amz_prints_digital_service_chapters();
$packages   = amz_prints_digital_packages();
$process    = amz_prints_digital_process();
$auto_dl    = isset( $_GET['download'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$cover_img  = amz_prints_book_image( 'amz_book_digital_cover', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80' );
$intro_img  = amz_prints_book_image( 'amz_book_digital_intro', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80' );
$portfolio  = amz_prints_book_portfolio( 'digital' );
$brand      = $id['brand'] . ' — Digital';
$pn         = 1;
$core_cats  = array(
	'Website Design & Development',
	'Custom Software Development',
	'Mobile App Development',
	'ERP, CRM & Business Automation',
	'UI/UX & Product Design',
	'E-Commerce Solutions',
	'SEO & Search Engine Marketing',
	'Social Media & Digital Marketing',
	'Cloud, Hosting, API & IT Infrastructure',
	'IT Consulting, Maintenance & Technical Support',
);
$tech_stack = array(
	'Frontend' => array( 'HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Responsive Web' ),
	'Backend'  => array( 'Node.js', 'PHP', 'Laravel', 'REST APIs', 'Server-Side Apps' ),
	'Data'     => array( 'PostgreSQL', 'MySQL', 'MongoDB', 'Supabase' ),
	'CMS'      => array( 'WordPress', 'WooCommerce', 'Custom CMS', 'Custom E-Commerce' ),
	'Design'   => array( 'Figma', 'Photoshop', 'Illustrator', 'After Effects', 'UI Systems' ),
	'Ops'      => array( 'Git / GitHub', 'Cloud Hosting', 'VPS', 'Hostinger', 'Vercel', 'CI/CD', 'DNS & SSL' ),
);
$toc = array(
	'Digital Overview', 'CEO Message', 'Core Categories', 'Service Chapters',
	'Packages', 'Process', 'Technology', 'Industries', 'Why Choose Us', 'Contact',
);
$lays = array( 'cp-lay-a', 'cp-lay-b', 'cp-lay-c', 'cp-lay-d' );
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html( $id['registered'] ); ?> — IT &amp; Digital Profile</title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'amz-catalog-body catalog-theme-digital catalog-theme-gold catalog-classic catalog-atelier catalog-portrait flipbook-body' . ( $auto_dl ? ' catalog-download-mode' : '' ) ); ?>>
<?php wp_body_open(); ?>
<?php
amz_prints_flipbook_shell_open(
	array(
		'theme'    => 'digital',
		'title'    => __( 'IT & Digital Solutions Profile', 'amz-prints' ),
		'subtitle' => __( 'Black & gold editorial catalog', 'amz-prints' ),
	)
);
?>

	<div class="page page--hard" data-density="hard">
		<div class="page-content cp cp--cover cp--cover-gold" style="--cp-cover:url('<?php echo esc_url( $cover_img ); ?>')">
			<div class="cp-cover__inner">
				<div class="cp-cover__top">
					<span>IT &amp; Digital Division</span>
					<span><?php echo esc_html( $id['year'] ); ?></span>
				</div>
				<div class="cp-cover__crest cp-cover__crest--gold">IT</div>
				<p class="cp-cover__eyebrow">Digital Solutions Profile</p>
				<?php if ( ! empty( $id['logo_url'] ) ) : ?>
					<img class="cp-cover__logo" src="<?php echo esc_url( $id['logo_url'] ); ?>" alt="">
				<?php endif; ?>
				<h1 class="cp-cover__title"><?php echo esc_html( $id['registered'] ); ?></h1>
				<p class="cp-cover__brand"><?php echo esc_html( $id['brand'] ); ?></p>
				<div class="cp-cover__rule cp-cover__rule--gold"></div>
				<p class="cp-cover__tag">Websites · Software · Apps · SEO · Social · Automation</p>
				<p class="cp-cover__loc"><?php echo esc_html( $id['hq'] ); ?></p>
			</div>
		</div>
	</div>

	<div class="page page--hard" data-density="hard">
		<div class="page-content cp cp--identity cp--ink">
			<aside class="cp-rail cp-rail--gold">Digital</aside>
			<div class="cp-identity__body">
				<?php amz_cp_head( 'Division Identity', 'IT & Digital Solutions', true ); ?>
				<table class="cp-meta-table cp-meta-table--gold">
					<tr><th>Company</th><td><?php echo esc_html( $id['registered'] ); ?></td></tr>
					<tr><th>Brand</th><td><?php echo esc_html( $id['brand'] ); ?></td></tr>
					<tr><th>Division</th><td>IT &amp; Digital Solutions</td></tr>
					<tr><th>CEO</th><td><?php echo esc_html( $id['ceo'] ); ?></td></tr>
					<tr><th>Office</th><td><?php echo esc_html( $id['hq'] ); ?></td></tr>
					<tr><th>WhatsApp</th><td><?php echo esc_html( $id['wa_display'] ); ?></td></tr>
					<tr><th>Website</th><td><?php echo esc_html( $id['website'] ); ?></td></tr>
					<tr><th>Digital Hub</th><td>amzprints.com/digital-services</td></tr>
				</table>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--toc cp--ink">
			<div class="cp-plate cp-plate--gold"><span>Contents</span></div>
			<ol class="cp-toc cp-toc--gold">
				<?php foreach ( $toc as $i => $label ) : ?>
					<li><span><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span><em><?php echo esc_html( $label ); ?></em><i></i></li>
				<?php endforeach; ?>
			</ol>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--intro cp--ink">
			<figure class="cp-intro__photo">
				<img src="<?php echo esc_url( $intro_img ); ?>" alt="">
				<figcaption>Web · Software · Growth</figcaption>
			</figure>
			<div class="cp-intro__copy">
				<?php amz_cp_head( '01 — Overview', 'IT & Digital Solutions', true ); ?>
				<p class="cp-drop">Our IT &amp; Digital Solutions division provides modern, scalable and customized technology services for businesses, startups, organizations and individuals. We combine software development, website development, digital marketing, branding, automation, cloud solutions and IT consulting to help businesses establish, operate and grow digitally.</p>
				<p>Our objective is to provide businesses with a complete technology partner under one roof — from website and software development to digital marketing, SEO, social media management, business automation and ongoing technical support.</p>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--letter cp--ink">
			<?php amz_cp_head( '02 — Leadership', 'Message from the CEO', true ); ?>
			<div class="cp-monogram cp-monogram--gold">AS</div>
			<blockquote class="cp-quote cp-quote--gold">
				<p>Technology should feel as crafted as print. Our digital division builds websites, software and growth systems that match the same quality standard as our press floor — clear process, modern stack, and support you can reach.</p>
				<p>From Mandi Bahauddin to partners across Pakistan and the GCC, we help brands own their digital future.</p>
			</blockquote>
			<div class="cp-sign">
				<strong><?php echo esc_html( $id['ceo'] ); ?></strong>
				<span><?php echo esc_html( $id['ceo_title'] ); ?></span>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--services-index cp--ink">
			<div class="cp-plate cp-plate--gold"><span>Core Categories</span></div>
			<p class="cp-pad-top">Ten professional service pillars for the company profile.</p>
			<ol class="cp-index-list cp-index-list--gold">
				<?php foreach ( $core_cats as $i => $cat ) : ?>
					<li><b><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></b><span><?php echo esc_html( $cat ); ?></span></li>
				<?php endforeach; ?>
			</ol>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<?php foreach ( $chapters as $ci => $ch ) : ?>
		<div class="page">
			<div class="page-content cp cp--chapter cp--ink <?php echo esc_attr( $lays[ $ci % 4 ] ); ?>">
				<div class="cp-ch-head">
					<span><?php echo esc_html( sprintf( '%02d', $ci + 1 ) ); ?></span>
					<h2><?php echo esc_html( $ch['title'] ); ?></h2>
				</div>
				<div class="cp-chapter-body">
					<p class="cp-lead"><?php echo esc_html( $ch['intro'] ); ?></p>
					<?php foreach ( $ch['groups'] as $gtitle => $items ) : ?>
						<h3 class="cp-h3 cp-h3--gold"><?php echo esc_html( $gtitle ); ?></h3>
						<?php amz_cp_checklist( $items ); ?>
					<?php endforeach; ?>
				</div>
				<?php amz_cp_foot( $pn, $brand ); ?>
			</div>
		</div>
	<?php endforeach; ?>

	<div class="page">
		<div class="page-content cp cp--ink">
			<?php amz_cp_head( 'Creative & Transformation', 'Content & Digital Transformation', true ); ?>
			<h3 class="cp-h3 cp-h3--gold">Content Creation</h3>
			<?php amz_cp_chips( array( 'Social Media Posts', 'Promotional Graphics', 'Reels', 'Short Videos', 'Product Videos', 'Corporate Videos', 'Explainer Videos', 'Motion Graphics', 'Infographics', 'Blog Content', 'Website Content', 'Product Descriptions', 'Advertising Copy', 'Email Content' ), 'cp-chips--gold' ); ?>
			<h3 class="cp-h3 cp-h3--gold">Digital Transformation</h3>
			<?php amz_cp_chips( array( 'Business Process Analysis', 'Digital Strategy', 'Workflow Automation', 'Paperless Operations', 'Cloud Migration', 'ERP Implementation', 'CRM Implementation', 'E-Commerce Transformation', 'Digital Customer Service', 'Data Management', 'Reporting & Analytics' ), 'cp-chips--gold' ); ?>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--packages cp--ink">
			<div class="cp-plate cp-plate--gold"><span>Digital Packages</span></div>
			<div class="cp-package-grid">
				<?php foreach ( $packages as $pkg ) : ?>
					<article>
						<strong><?php echo esc_html( $pkg['title'] ); ?></strong>
						<ul>
							<?php foreach ( $pkg['items'] as $it ) : ?>
								<li><?php echo esc_html( $it ); ?></li>
							<?php endforeach; ?>
						</ul>
					</article>
				<?php endforeach; ?>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--process cp--ink">
			<?php amz_cp_head( 'How We Work', 'Development Process', true ); ?>
			<ol class="cp-process">
				<?php foreach ( $process as $step ) : ?>
					<li>
						<b><?php echo esc_html( $step[0] ); ?></b>
						<strong><?php echo esc_html( $step[1] ); ?></strong>
						<span><?php echo esc_html( $step[2] ); ?></span>
					</li>
				<?php endforeach; ?>
			</ol>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--tech cp--ink">
			<?php amz_cp_head( 'Capabilities', 'Technology Stack', true ); ?>
			<?php foreach ( $tech_stack as $label => $items ) : ?>
				<h3 class="cp-h3 cp-h3--gold"><?php echo esc_html( $label ); ?></h3>
				<?php amz_cp_chips( $items, 'cp-chips--gold' ); ?>
			<?php endforeach; ?>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--markets cp--ink">
			<?php amz_cp_head( 'Markets', 'Industries We Serve', true ); ?>
			<?php amz_cp_chips( $id['segments'], 'cp-chips--gold' ); ?>
			<h3 class="cp-h3 cp-h3--gold">Digital Portfolio</h3>
			<div class="cp-folio cp-folio--gold">
				<?php foreach ( array_slice( $portfolio, 0, 4 ) as $item ) : ?>
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
		<div class="page-content cp cp--why cp--ink">
			<div class="cp-plate cp-plate--gold"><span>Why Choose Us</span></div>
			<div class="cp-chapter-body">
				<ol class="cp-why-list cp-why-list--gold">
					<?php
					$why_digital = array(
						'Complete digital solutions under one roof',
						'Custom-built solutions instead of one-size-fits-all systems',
						'Professional UI/UX',
						'Modern development technologies',
						'Business-focused software development',
						'SEO and digital marketing expertise',
						'Social media management',
						'E-Commerce expertise',
						'Business automation',
						'Printing + Branding + Digital under one company',
						'Scalable solutions',
						'Ongoing technical support',
						'Local and international business support',
					);
					foreach ( $why_digital as $i => $w ) :
						?>
						<li><b><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></b><span><?php echo esc_html( $w ); ?></span></li>
					<?php endforeach; ?>
				</ol>
			</div>
			<?php amz_cp_foot( $pn, $brand ); ?>
		</div>
	</div>

	<div class="page">
		<div class="page-content cp cp--contact cp--ink">
			<div class="cp-plate cp-plate--gold"><span>Contact &amp; Partners</span></div>
			<div class="cp-contact-card cp-contact-card--gold">
				<p class="cp-contact-card__name"><?php echo esc_html( $id['registered'] ); ?></p>
				<p><?php echo esc_html( $id['brand'] ); ?> — IT &amp; Digital</p>
				<p>CEO: <?php echo esc_html( $id['ceo'] ); ?></p>
				<p><?php echo esc_html( $id['hq'] ); ?></p>
				<p>WhatsApp: <?php echo esc_html( $id['wa_display'] ); ?></p>
				<p>Website: <?php echo esc_html( $id['website'] ); ?></p>
				<?php if ( $id['email'] ) : ?><p>Email: <?php echo esc_html( $id['email'] ); ?></p><?php endif; ?>
			</div>
			<?php foreach ( $id['group'] as $g ) : ?>
				<article class="cp-group-card cp-group-card--gold">
					<strong><?php echo esc_html( $g['name'] ); ?></strong>
					<p><?php echo esc_html( $g['desc'] ); ?></p>
				</article>
			<?php endforeach; ?>
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
		<div class="page-content cp cp--back cp--cover-gold">
			<div class="cp-cover__crest cp-cover__crest--gold">IT</div>
			<p class="cp-cover__brand"><?php echo esc_html( $id['brand'] ); ?></p>
			<h2 class="cp-cover__title">IT &amp; Digital Solutions</h2>
			<div class="cp-cover__rule cp-cover__rule--gold"></div>
			<p class="cp-cover__tag"><?php echo esc_html( $id['website'] ); ?></p>
			<p class="cp-cover__loc">WhatsApp <?php echo esc_html( $id['wa_display'] ); ?></p>
			<p class="cp-cover__tag">Thank you — let’s build something exceptional</p>
		</div>
	</div>

<?php amz_prints_flipbook_shell_close(); ?>
<?php wp_footer(); ?>
</body>
</html>
