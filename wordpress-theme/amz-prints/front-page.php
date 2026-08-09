<?php
/**
 * Homepage — full hero + supporting image strip + shop products
 *
 * @package AMZ_Prints
 */

get_header();

$company  = amz_prints_mod( 'amz_company_name', 'AMZ Prints' );
$legal    = amz_prints_mod( 'amz_legal_name', 'Amazon Printings (Pvt) Ltd' );
$headline = amz_prints_mod( 'amz_hero_headline', amz_t( 'hero_headline' ) );
$sub      = amz_prints_mod( 'amz_hero_sub', amz_t( 'hero_sub' ) );
$cta1     = amz_prints_mod( 'amz_hero_cta_primary', amz_t( 'quote' ) );
$cta2     = amz_prints_mod( 'amz_hero_cta_secondary', amz_t( 'view_services' ) );
$cta1_url = amz_prints_mod( 'amz_hero_cta_primary_url', '/products/' );
$cta2_url = amz_prints_mod( 'amz_hero_cta_secondary_url', '/services/' );

$fallback_imgs = array(
	'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1920&q=80',
	'https://images.unsplash.com/photo-1626785774573-4b7993143459?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1503690970856-d1a3c8d8e9e3?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80',
);

$main_id  = absint( amz_prints_mod( 'amz_hero_image', 0 ) );
$main_url = $main_id ? wp_get_attachment_image_url( $main_id, 'amz-hero' ) : '';

$hero_slides = array();
if ( $main_url ) {
	$hero_slides[] = $main_url;
}
foreach ( array( 'amz_hero_image_2', 'amz_hero_image_3' ) as $key ) {
	$id = absint( amz_prints_mod( $key, 0 ) );
	if ( $id ) {
		$url = wp_get_attachment_image_url( $id, 'amz-hero' );
		if ( $url ) {
			$hero_slides[] = $url;
		}
	}
}
if ( empty( $hero_slides ) ) {
	$hero_slides[] = $fallback_imgs[0];
}
while ( count( $hero_slides ) < 3 ) {
	$hero_slides[] = $fallback_imgs[ count( $hero_slides ) % count( $fallback_imgs ) ];
}
$hero_slides = array_slice( $hero_slides, 0, 3 );

$support = array();
foreach ( array( 'amz_hero_support_1', 'amz_hero_support_2', 'amz_hero_support_3', 'amz_hero_support_4', 'amz_hero_support_5' ) as $i => $key ) {
	$id  = absint( amz_prints_mod( $key, 0 ) );
	$url = $id ? wp_get_attachment_image_url( $id, 'amz-card' ) : '';
	$support[] = $url ? $url : $fallback_imgs[ min( $i + 1, count( $fallback_imgs ) - 1 ) ];
}

$catalog = array_slice( amz_prints_services_catalog(), 0, 6 );
$erp_all = function_exists( 'amz_prints_erp_get_products' ) ? amz_prints_erp_get_products() : array();
$cats    = array();
foreach ( $erp_all as $p ) {
	$c = trim( (string) ( $p['category'] ?? '' ) );
	if ( $c ) {
		$cats[ sanitize_title( $c ) ] = $c;
	}
}
?>

<section class="hero hero--slider" data-hero-slider data-hero-interval="3000">
	<div class="hero__media" aria-hidden="true">
		<div class="hero__slides">
			<?php foreach ( $hero_slides as $i => $url ) : ?>
				<div class="hero__slide<?php echo 0 === $i ? ' is-active' : ''; ?>" style="background-image:url('<?php echo esc_url( $url ); ?>')"></div>
			<?php endforeach; ?>
		</div>
		<div class="hero__veil"></div>
		<div class="hero__grain"></div>
	</div>
	<div class="hero__content container">
		<p class="hero__brand reveal" data-reveal><?php echo esc_html( $company ); ?></p>
		<p class="hero__legal reveal" data-reveal><?php echo esc_html( $legal ); ?></p>
		<h1 class="hero__title reveal" data-reveal><?php echo esc_html( $headline ); ?></h1>
		<p class="hero__sub reveal" data-reveal><?php echo esc_html( $sub ); ?></p>
		<div class="hero__actions reveal" data-reveal>
			<a class="btn btn--primary btn--lg" href="<?php echo esc_url( home_url( $cta1_url ) ); ?>"><?php echo esc_html( $cta1 ); ?></a>
			<a class="btn btn--ghost btn--lg" href="<?php echo esc_url( home_url( $cta2_url ) ); ?>"><?php echo esc_html( $cta2 ); ?></a>
		</div>
	</div>
	<div class="hero__dots" aria-hidden="true">
		<?php foreach ( $hero_slides as $i => $url ) : ?>
			<button type="button" class="hero__dot<?php echo 0 === $i ? ' is-active' : ''; ?>" data-hero-dot="<?php echo esc_attr( $i ); ?>"></button>
		<?php endforeach; ?>
	</div>
</section>

<section class="hero-strip" aria-label="<?php esc_attr_e( 'Featured images', 'amz-prints' ); ?>">
	<div class="container">
		<div class="hero-strip__track" data-hero-strip>
			<?php foreach ( $support as $i => $url ) : ?>
				<figure class="hero-strip__item reveal" data-reveal style="--i:<?php echo esc_attr( (string) $i ); ?>">
					<img src="<?php echo esc_url( $url ); ?>" alt="" loading="lazy">
				</figure>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section class="quick-actions">
	<div class="container quick-actions__grid">
		<a class="quick-action reveal" data-reveal href="<?php echo esc_url( home_url( '/track-order/' ) ); ?>">
			<span class="quick-action__label"><?php echo esc_html( amz_t( 'track_order' ) ); ?></span>
			<strong><?php echo esc_html( amz_t( 'track_order' ) ); ?></strong>
		</a>
		<a class="quick-action reveal" data-reveal href="<?php echo esc_url( home_url( '/how-we-work/' ) ); ?>">
			<span class="quick-action__label"><?php echo esc_html( amz_t( 'how_we_work' ) ); ?></span>
			<strong><?php echo esc_html( amz_t( 'how_we_work' ) ); ?></strong>
		</a>
		<a class="quick-action quick-action--nadra reveal" data-reveal href="<?php echo esc_url( home_url( '/nadra-e-services/' ) ); ?>">
			<span class="quick-action__label"><?php echo esc_html( amz_t( 'nadra' ) ); ?></span>
			<strong><?php echo esc_html( amz_t( 'nadra' ) ); ?></strong>
		</a>
		<a class="quick-action reveal" data-reveal href="<?php echo esc_url( home_url( '/products/' ) ); ?>">
			<span class="quick-action__label"><?php esc_html_e( 'Shop', 'amz-prints' ); ?></span>
			<strong><?php esc_html_e( 'Shop products', 'amz-prints' ); ?></strong>
		</a>
	</div>
</section>

<section class="section section--services" id="services">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<h2><?php echo esc_html( amz_t( 'our_services' ) ); ?></h2>
			<p><?php echo esc_html( amz_t( 'services_lead' ) ); ?></p>
		</header>
		<div class="service-grid">
			<?php foreach ( $catalog as $cat ) : ?>
				<article class="service-item reveal" data-reveal>
					<a href="<?php echo esc_url( home_url( '/services/#' . $cat['slug'] ) ); ?>" class="service-item__link">
						<span class="service-item__icon"><?php echo amz_prints_icon_svg( 'printer' ); // phpcs:ignore ?></span>
						<h3><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></h3>
						<p><?php echo esc_html( implode( ' · ', array_map( 'amz_prints_svc_label', array_slice( $cat['items'], 0, 3 ) ) ) ); ?></p>
						<span class="text-link"><?php echo esc_html( amz_t( 'learn_more' ) ); ?></span>
					</a>
				</article>
			<?php endforeach; ?>
		</div>
		<div class="section-foot reveal" data-reveal>
			<a class="text-link" href="<?php echo esc_url( home_url( '/services/' ) ); ?>"><?php echo esc_html( amz_t( 'view_all' ) ); ?></a>
		</div>
	</div>
</section>

<section class="section section--about-home" id="about">
	<div class="container about-home reveal" data-reveal>
		<div class="about-home__copy">
			<p class="about-home__legal"><?php echo esc_html( $legal ); ?></p>
			<h2>About Us</h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_about_blurb', 'Amazon Printings (Pvt) Ltd is a full-service print and advertising company delivering digital printing, branding, packaging, NADRA e-services facilitation, and digital solutions with speed and color precision.' ) ); ?></p>
			<ul class="check-list">
				<li>Professional printing & advertising</li>
				<li>Authorized NADRA e-services partner</li>
				<li>Branches in Mandi Bahauddin, Lahore & Rawalpindi (coming soon)</li>
			</ul>
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/about/' ) ); ?>">Learn more about us</a>
		</div>
		<div class="about-home__visual" aria-hidden="true">
			<div class="ink-swatch ink-swatch--1"></div>
			<div class="ink-swatch ink-swatch--2"></div>
			<div class="ink-swatch ink-swatch--3"></div>
			<div class="ink-swatch ink-swatch--4"></div>
		</div>
	</div>
</section>

<?php if ( amz_prints_mod( 'amz_show_products', true ) ) : ?>
<section class="section section--shop" id="products">
	<div class="container">
		<header class="shop-head reveal" data-reveal>
			<p class="shop-head__eyebrow"><?php esc_html_e( 'Products', 'amz-prints' ); ?></p>
			<h2><?php echo esc_html( amz_prints_mod( 'amz_products_title', 'Our Products' ) ); ?></h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_products_sub', 'Browse print products and open any item for full details.' ) ); ?></p>
		</header>

		<?php if ( ! empty( $erp_all ) ) : ?>
			<nav class="shop-cats" data-shop-cats aria-label="<?php esc_attr_e( 'Product categories', 'amz-prints' ); ?>">
				<button type="button" class="is-active" data-cat="all"><?php esc_html_e( 'All Product', 'amz-prints' ); ?></button>
				<?php foreach ( $cats as $slug => $label ) : ?>
					<button type="button" data-cat="<?php echo esc_attr( $slug ); ?>"><?php echo esc_html( $label ); ?></button>
				<?php endforeach; ?>
			</nav>

			<div class="shop-carousel" data-shop-carousel>
				<button type="button" class="shop-carousel__arrow" data-shop-prev aria-label="<?php esc_attr_e( 'Previous', 'amz-prints' ); ?>">←</button>
				<div class="shop-carousel__viewport">
					<div class="shop-carousel__track" data-shop-track>
						<?php foreach ( $erp_all as $product ) : ?>
							<?php get_template_part( 'template-parts/product', 'card', array( 'product' => $product ) ); ?>
						<?php endforeach; ?>
					</div>
				</div>
				<button type="button" class="shop-carousel__arrow" data-shop-next aria-label="<?php esc_attr_e( 'Next', 'amz-prints' ); ?>">→</button>
			</div>
			<div class="shop-dots" data-shop-dots aria-hidden="true"></div>
		<?php else : ?>
			<p class="form-note"><?php esc_html_e( 'Live ERP products unavailable. Redeploy Code.gs public/products.', 'amz-prints' ); ?></p>
		<?php endif; ?>

		<div class="section-foot reveal" data-reveal>
			<a class="text-link" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'View all products', 'amz-prints' ); ?></a>
		</div>
	</div>
</section>
<?php endif; ?>

<?php if ( amz_prints_mod( 'amz_show_nadra_home', true ) ) : ?>
<section class="section section--nadra-home">
	<div class="container nadra-home reveal" data-reveal>
		<div class="nadra-home__seal" aria-hidden="true">
			<div class="nadra-seal"><span class="nadra-seal__ring"></span><span class="nadra-seal__core">NADRA</span><span class="nadra-seal__sub">Authorized Partner</span></div>
		</div>
		<div class="nadra-home__copy">
			<p class="page-hero__kicker"><?php echo esc_html( amz_t( 'nadra' ) ); ?></p>
			<h2><?php echo esc_html( amz_t( 'nadra' ) ); ?> E-Services</h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_nadra_lead', 'Official NADRA e-services facilitation — trusted, authorized, and customer-friendly.' ) ); ?></p>
			<div class="hero__actions" style="margin-top:1.25rem">
				<a class="btn btn--nadra" href="<?php echo esc_url( home_url( '/nadra-e-services/' ) ); ?>"><?php echo esc_html( amz_t( 'learn_more' ) ); ?></a>
			</div>
		</div>
	</div>
</section>
<?php endif; ?>

<section class="section section--track-home">
	<div class="container track-home reveal" data-reveal>
		<div>
			<h2><?php echo esc_html( amz_t( 'track_order' ) ); ?></h2>
			<p>Enter your Order ID to see live design, printing, and delivery status.</p>
		</div>
		<div class="track-home__form">
			<p class="form-note" style="margin:0;">Customer login required to track your orders.</p>
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/customer-login/?redirect=' . rawurlencode( home_url( '/my-account/#track' ) ) ) ); ?>"><?php echo esc_html( amz_t( 'track_order' ) ); ?></a>
		</div>
	</div>
</section>

<section class="section section--cta">
	<div class="container cta-band reveal" data-reveal>
		<div class="cta-band__copy">
			<h2><?php echo esc_html( amz_prints_mod( 'amz_cta_title', 'Ready to print something great?' ) ); ?></h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_cta_sub', 'Tell us what you need. We will quote fast.' ) ); ?></p>
		</div>
		<a class="btn btn--primary btn--lg" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Shop now', 'amz-prints' ); ?></a>
	</div>
</section>

<?php get_footer(); ?>
