<?php
/**
 * Template Name: Company Profile — IT & Digital
 * Real flip-book digital catalog.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$c       = amz_prints_catalog_context();
$catalog = amz_prints_catalog_digital_services();
$auto_dl = isset( $_GET['download'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

$website_types = array(
	array( 'Business Website', 'Authority site — services, about, contact, lead capture.' ),
	array( 'E-Commerce Store', 'Catalog, cart, checkout, and real order flow.' ),
	array( 'Portfolio / Agency', 'Case studies and inquiry CTAs.' ),
	array( 'Booking & Services', 'Appointments and quote booking flows.' ),
	array( 'Landing Pages', 'High-conversion campaign pages.' ),
	array( 'Custom Web Apps', 'Dashboards and portals — not templates.' ),
);
$mechanism = array(
	array( '01', 'Discovery', 'Goals, audience, and must-have features.' ),
	array( '02', 'Blueprint', 'Sitemap, wireframes, stack, timeline.' ),
	array( '03', 'Design', 'Visual system and motion language.' ),
	array( '04', 'Build', 'Custom code, CMS, APIs, QA.' ),
	array( '05', 'Launch', 'Go-live, analytics, training.' ),
	array( '06', 'Grow', 'New modules, campaigns, upgrades.' ),
);
$toc = array(
	array( 'Introduction', '03' ),
	array( 'Vision & Mission', '04' ),
	array( 'Website Types', '05' ),
	array( 'Web Development', '06' ),
	array( 'Software & Social', '07' ),
	array( 'How We Work', '08' ),
	array( 'Why Choose Us', '09' ),
	array( 'Contact Us', '10' ),
);
$pn = 1;
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html( $c['legal'] ); ?> — Digital Services Profile</title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'amz-catalog-body catalog-theme-digital flipbook-body' . ( $auto_dl ? ' catalog-download-mode' : '' ) ); ?>>
<?php wp_body_open(); ?>
<?php
amz_prints_flipbook_shell_open(
	array(
		'theme'    => 'digital',
		'title'    => __( 'IT & Digital Services Profile', 'amz-prints' ),
		'subtitle' => __( 'Open the book · Flip the pages', 'amz-prints' ),
	)
);
?>

	<div class="page page--hard page--cover-digital" data-density="hard">
		<div class="page-content page-content--cover">
			<?php if ( $c['logo_url'] ) : ?>
				<img class="page-cover__logo" src="<?php echo esc_url( $c['logo_url'] ); ?>" alt="">
			<?php endif; ?>
			<p class="page-cover__eyebrow">Digital Profile <?php echo esc_html( $c['year'] ); ?></p>
			<p class="page-cover__short"><?php echo esc_html( $c['company'] ); ?></p>
			<h1><?php echo esc_html( $c['legal'] ); ?></h1>
			<p class="page-cover__tag">Websites · Software · Social · IT Systems</p>
		</div>
	</div>

	<div class="page page--hard" data-density="hard">
		<div class="page-content page-content--center">
			<p class="page-kicker">IT &amp; Digital Division</p>
			<h2 class="page-title"><?php echo esc_html( $c['company'] ); ?></h2>
			<p class="page-lead"><?php echo esc_html( $c['legal'] ); ?></p>
			<p class="page-body"><?php esc_html_e( 'Digital products with the same brand discipline as our print floor.', 'amz-prints' ); ?></p>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--toc page-content--toc-digital">
			<div class="page-teal-bar"><?php esc_html_e( 'Table of Contents', 'amz-prints' ); ?></div>
			<table class="page-toc-table page-toc-table--teal">
				<thead>
					<tr><th>SL NO</th><th>Description</th><th>Page</th></tr>
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
			<span class="page-spine-bar page-spine-bar--right page-spine-bar--teal" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content page-content--intro">
			<span class="page-spine-bar page-spine-bar--left page-spine-bar--teal" aria-hidden="true"></span>
			<div class="page-intro-grid">
				<figure class="page-intro-photo">
					<img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80" alt="">
				</figure>
				<div class="page-intro-copy">
					<h2 class="page-heading-teal"><?php esc_html_e( 'Introduction', 'amz-prints' ); ?></h2>
					<p><?php esc_html_e( 'We design and develop websites, custom software, and social media systems that look sharp and work hard — lead capture, ecommerce, portals, and always-on brand presence.', 'amz-prints' ); ?></p>
					<p><?php echo esc_html( $c['about'] ); ?></p>
				</div>
			</div>
			<div class="page-bottom-meta">
				<span class="page-logo-mark"><?php echo esc_html( $c['company'] ); ?> Digital</span>
				<span class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></span>
			</div>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<div class="page-teal-bar"><?php esc_html_e( 'Vision & Mission', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<h3 class="page-heading-teal"><?php esc_html_e( 'Vision', 'amz-prints' ); ?></h3>
				<p class="page-body"><?php echo esc_html( $c['vision'] ); ?></p>
				<h3 class="page-heading-teal"><?php esc_html_e( 'Mission', 'amz-prints' ); ?></h3>
				<p class="page-body"><?php echo esc_html( $c['mission'] ); ?></p>
			</div>
			<span class="page-spine-bar page-spine-bar--right page-spine-bar--teal" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<span class="page-spine-bar page-spine-bar--left page-spine-bar--teal" aria-hidden="true"></span>
			<div class="page-teal-bar"><?php esc_html_e( 'Website Types', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<ul class="page-type-list">
					<?php foreach ( $website_types as $t ) : ?>
						<li><strong><?php echo esc_html( $t[0] ); ?></strong><span><?php echo esc_html( $t[1] ); ?></span></li>
					<?php endforeach; ?>
				</ul>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<div class="page-teal-bar"><?php esc_html_e( 'Web Development', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<p class="page-lead"><?php esc_html_e( 'From first sketch to live launch — premium UI, speed, SEO structure, CMS, WhatsApp leads, analytics, and training.', 'amz-prints' ); ?></p>
				<ul class="page-bullets">
					<li>UI/UX aligned to your brand</li>
					<li>Responsive mobile-first builds</li>
					<li>CMS for easy updates</li>
					<li>Forms &amp; lead capture</li>
					<li>SSL &amp; hosting guidance</li>
					<li>Post-launch support</li>
				</ul>
			</div>
			<span class="page-spine-bar page-spine-bar--right page-spine-bar--teal" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<span class="page-spine-bar page-spine-bar--left page-spine-bar--teal" aria-hidden="true"></span>
			<div class="page-teal-bar"><?php esc_html_e( 'Software & Social', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<h3 class="page-heading-teal"><?php esc_html_e( 'Custom Software', 'amz-prints' ); ?></h3>
				<p class="page-body"><?php esc_html_e( 'ERP modules, portals, CRMs, booking systems — engineered around how your team works.', 'amz-prints' ); ?></p>
				<h3 class="page-heading-teal"><?php esc_html_e( 'Social Media', 'amz-prints' ); ?></h3>
				<p class="page-body"><?php esc_html_e( 'Content calendar, creatives, engagement, ads support, and monthly reports aligned with print brand.', 'amz-prints' ); ?></p>
				<?php foreach ( $catalog as $cat ) : ?>
					<p><strong><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?>:</strong>
					<?php echo esc_html( implode( ', ', array_map( 'amz_prints_svc_label', $cat['items'] ) ) ); ?></p>
				<?php endforeach; ?>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<div class="page-teal-bar"><?php esc_html_e( 'How We Work', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<ol class="page-mech">
					<?php foreach ( $mechanism as $step ) : ?>
						<li><strong><?php echo esc_html( $step[0] . ' · ' . $step[1] ); ?></strong><span><?php echo esc_html( $step[2] ); ?></span></li>
					<?php endforeach; ?>
				</ol>
			</div>
			<span class="page-spine-bar page-spine-bar--right page-spine-bar--teal" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<span class="page-spine-bar page-spine-bar--left page-spine-bar--teal" aria-hidden="true"></span>
			<div class="page-teal-bar"><?php esc_html_e( 'Why Choose Us', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<ul class="page-why">
					<li><strong>Print + Digital one roof</strong><span>Brand stays consistent from press to website.</span></li>
					<li><strong>Custom code</strong><span>No locked templates — products you own.</span></li>
					<li><strong>Business-first</strong><span>Features map to leads, sales, operations.</span></li>
					<li><strong>Local support</strong><span>Branches and WhatsApp you can reach.</span></li>
				</ul>
			</div>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page">
		<div class="page-content">
			<div class="page-teal-bar"><?php esc_html_e( 'Contact Us', 'amz-prints' ); ?></div>
			<div class="page-pad">
				<div class="page-contact">
					<p><strong><?php echo esc_html( $c['legal'] ); ?></strong></p>
					<p><?php echo esc_html( $c['company'] ); ?> · Digital</p>
					<?php if ( $c['phone'] ) : ?><p><?php echo esc_html( $c['phone'] ); ?></p><?php endif; ?>
					<?php if ( $c['email'] ) : ?><p><?php echo esc_html( $c['email'] ); ?></p><?php endif; ?>
					<p><?php echo esc_html( $c['site_url'] ); ?></p>
					<p><?php echo esc_html( home_url( '/digital-services/' ) ); ?></p>
				</div>
				<div class="page-qr-row">
					<figure>
						<img src="<?php echo esc_url( amz_prints_qr_url( $c['site_url'], 160 ) ); ?>" alt="">
						<figcaption>Website</figcaption>
					</figure>
					<figure>
						<img src="<?php echo esc_url( amz_prints_qr_url( $c['wa_link'], 160 ) ); ?>" alt="">
						<figcaption>WhatsApp</figcaption>
					</figure>
				</div>
			</div>
			<span class="page-spine-bar page-spine-bar--right page-spine-bar--teal" aria-hidden="true"></span>
			<p class="page-footer-num"><?php echo esc_html( sprintf( '%02d', $pn++ ) ); ?></p>
		</div>
	</div>

	<div class="page page--hard page--cover-digital" data-density="hard">
		<div class="page-content page-content--cover page-content--back">
			<p class="page-cover__short"><?php echo esc_html( $c['company'] ); ?></p>
			<h2><?php esc_html_e( 'Digital Services', 'amz-prints' ); ?></h2>
			<p class="page-cover__tag"><?php echo esc_html( home_url( '/digital-services/' ) ); ?></p>
			<p class="page-cover__tag"><?php esc_html_e( 'Thank you', 'amz-prints' ); ?></p>
		</div>
	</div>

<?php amz_prints_flipbook_shell_close(); ?>
<?php wp_footer(); ?>
</body>
</html>
