<?php
/**
 * Homepage — Press Atelier 3.0
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
	'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1400&q=80',
	'https://images.unsplash.com/photo-1626785774573-4b7993143459?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1503690970856-d1a3c8d8e9e3?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80',
);

$main_id  = absint( amz_prints_mod( 'amz_hero_image', 0 ) );
$main_url = $main_id ? wp_get_attachment_image_url( $main_id, 'amz-hero' ) : '';

$catalog = array_slice( amz_prints_services_catalog(), 0, 6 );
$erp_all = function_exists( 'amz_prints_erp_get_products' ) ? amz_prints_erp_get_products() : array();
$cats    = array();
foreach ( $erp_all as $p ) {
	$c = trim( (string) ( $p['category'] ?? '' ) );
	if ( $c ) {
		$cats[ sanitize_title( $c ) ] = $c;
	}
}

$marquee_items = array();
foreach ( amz_prints_services_catalog() as $cat ) {
	$marquee_items[] = amz_prints_svc_label( $cat );
	foreach ( array_slice( $cat['items'], 0, 2 ) as $item ) {
		$marquee_items[] = amz_prints_svc_label( $item );
	}
}
$marquee_items = array_values( array_unique( array_filter( $marquee_items ) ) );
if ( count( $marquee_items ) < 8 ) {
	$marquee_items = array_merge( $marquee_items, array( 'Digital Print', 'Offset', 'Packaging', 'UV', 'DTF', 'Branding', 'NADRA', 'Large Format' ) );
}

$hero_tiles = array();
if ( $main_url ) {
	$hero_tiles[] = array( 'url' => $main_url, 'name' => $company, 'id' => '' );
}
foreach ( array( 'amz_hero_image_2', 'amz_hero_image_3', 'amz_hero_support_1', 'amz_hero_support_2', 'amz_hero_support_3', 'amz_hero_support_4', 'amz_hero_support_5' ) as $key ) {
	$id = absint( amz_prints_mod( $key, 0 ) );
	if ( ! $id ) {
		continue;
	}
	$url = wp_get_attachment_image_url( $id, 'amz-card' );
	if ( ! $url ) {
		$url = wp_get_attachment_image_url( $id, 'large' );
	}
	if ( $url ) {
		$hero_tiles[] = array( 'url' => $url, 'name' => $company, 'id' => '' );
	}
}
foreach ( $erp_all as $p ) {
	$img = '';
	if ( ! empty( $p['image'] ) ) {
		$raw = (string) $p['image'];
		if ( 0 === strpos( $raw, 'data:image' ) || preg_match( '#^https?://#i', $raw ) ) {
			$img = $raw;
		}
	}
	if ( ! $img ) {
		continue;
	}
	$hero_tiles[] = array(
		'url'  => $img,
		'name' => (string) ( $p['name'] ?? '' ),
		'id'   => (string) ( $p['id'] ?? '' ),
	);
	if ( count( $hero_tiles ) >= 7 ) {
		break;
	}
}
$fi = 0;
while ( count( $hero_tiles ) < 6 ) {
	$hero_tiles[] = array(
		'url'  => $fallback_imgs[ $fi % count( $fallback_imgs ) ],
		'name' => $company,
		'id'   => '',
	);
	$fi++;
}
$hero_tiles = array_slice( $hero_tiles, 0, 6 );
$hero_bg    = $main_url ? $main_url : ( $hero_tiles[0]['url'] ?? $fallback_imgs[0] );
if ( 0 === strpos( (string) $hero_bg, 'data:image' ) ) {
	$hero_bg = $fallback_imgs[0];
}
?>

<section class="hero hero--premium" data-hero-premium>
	<div class="hero__atmosphere" aria-hidden="true">
		<div class="hero__glow hero__glow--a"></div>
		<div class="hero__glow hero__glow--b"></div>
		<div class="hero__mesh"></div>
		<div class="hero__grain"></div>
		<div class="hero__bg-photo" style="background-image:url('<?php echo esc_url( $hero_bg ); ?>')"></div>
	</div>

	<div class="hero__layout container">
		<div class="hero__copy">
			<p class="hero__brand reveal" data-reveal><?php echo esc_html( $company ); ?></p>
			<p class="hero__legal reveal" data-reveal><?php echo esc_html( $legal ); ?></p>
			<h1 class="hero__title reveal" data-reveal><?php echo esc_html( $headline ); ?></h1>
			<p class="hero__sub reveal" data-reveal><?php echo esc_html( $sub ); ?></p>
			<div class="hero__actions reveal" data-reveal>
				<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( home_url( $cta1_url ) ); ?>"><?php echo esc_html( $cta1 ); ?></a>
				<a class="btn btn--ghost btn--lg btn--magnetic" href="<?php echo esc_url( home_url( $cta2_url ) ); ?>"><?php echo esc_html( $cta2 ); ?></a>
			</div>
		</div>

		<div class="hero__stage" data-hero-stage>
			<div class="hero-flex" data-hero-flex>
				<?php foreach ( $hero_tiles as $i => $tile ) : ?>
					<?php
					$is_hero = ( 0 === $i );
					$cls     = $is_hero ? 'hero-flex__item hero-flex__item--hero' : 'hero-flex__item';
					$src     = function_exists( 'amz_prints_product_img_src' )
						? amz_prints_product_img_src( $tile['url'] )
						: esc_url( $tile['url'] );
					$pid     = (string) ( $tile['id'] ?? '' );
					?>
					<figure
						class="<?php echo esc_attr( $cls ); ?>"
						style="--i:<?php echo esc_attr( (string) $i ); ?>"
						data-hero-tile
						<?php if ( $pid ) : ?>
							data-open-product="<?php echo esc_attr( $pid ); ?>"
							data-product-name="<?php echo esc_attr( $tile['name'] ); ?>"
							role="button"
							tabindex="0"
						<?php endif; ?>
					>
						<img src="<?php echo $src; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>" alt="<?php echo esc_attr( $tile['name'] ); ?>" <?php echo $is_hero ? '' : 'loading="lazy"'; ?>>
					</figure>
				<?php endforeach; ?>
			</div>
		</div>
	</div>
</section>

<section class="amz-marquee" aria-label="<?php esc_attr_e( 'Services', 'amz-prints' ); ?>">
	<div class="amz-marquee__track">
		<?php foreach ( array_merge( $marquee_items, $marquee_items ) as $label ) : ?>
			<span class="amz-marquee__item"><?php echo esc_html( $label ); ?></span>
		<?php endforeach; ?>
	</div>
</section>

<section class="quick-actions">
	<div class="container quick-actions__grid">
		<a class="quick-action reveal has-tilt" data-reveal href="<?php echo esc_url( home_url( '/track-order/' ) ); ?>">
			<span class="quick-action__label"><?php echo esc_html( amz_t( 'track_order' ) ); ?></span>
			<strong><?php echo esc_html( amz_t( 'track_order' ) ); ?></strong>
		</a>
		<a class="quick-action reveal has-tilt" data-reveal href="<?php echo esc_url( home_url( '/how-we-work/' ) ); ?>">
			<span class="quick-action__label"><?php echo esc_html( amz_t( 'how_we_work' ) ); ?></span>
			<strong><?php echo esc_html( amz_t( 'how_we_work' ) ); ?></strong>
		</a>
		<a class="quick-action quick-action--nadra reveal has-tilt" data-reveal href="<?php echo esc_url( home_url( '/nadra-e-services/' ) ); ?>">
			<span class="quick-action__label"><?php echo esc_html( amz_t( 'nadra' ) ); ?></span>
			<strong><?php echo esc_html( amz_t( 'nadra' ) ); ?></strong>
		</a>
		<a class="quick-action reveal has-tilt" data-reveal href="<?php echo esc_url( home_url( '/products/' ) ); ?>">
			<span class="quick-action__label"><?php esc_html_e( 'Shop', 'amz-prints' ); ?></span>
			<strong><?php esc_html_e( 'Shop products', 'amz-prints' ); ?></strong>
		</a>
	</div>
</section>

<section class="section section--services section--atelier" id="services">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Capabilities', 'amz-prints' ); ?></p>
			<h2><?php echo esc_html( amz_t( 'our_services' ) ); ?></h2>
			<p><?php echo esc_html( amz_t( 'services_lead' ) ); ?></p>
		</header>
		<div class="service-grid">
			<?php foreach ( $catalog as $i => $cat ) : ?>
				<article class="service-item reveal has-tilt" data-reveal style="--reveal-delay:<?php echo esc_attr( (string) ( $i * 60 ) ); ?>ms">
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
			<p class="about-home__legal eyebrow"><?php echo esc_html( $legal ); ?></p>
			<h2>Crafted color. Confident brands.</h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_about_blurb', 'Amazon Printings (Pvt) Ltd is a full-service print and advertising company delivering digital printing, branding, packaging, NADRA e-services facilitation, and digital solutions with speed and color precision.' ) ); ?></p>
			<ul class="check-list">
				<li>Professional printing & advertising</li>
				<li>Authorized NADRA e-services partner</li>
				<li>Branches in Mandi Bahauddin, Lahore & Rawalpindi (coming soon)</li>
			</ul>
			<a class="btn btn--primary btn--magnetic" href="<?php echo esc_url( home_url( '/about/' ) ); ?>">Learn more about us</a>
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
<section class="section section--shop section--atelier" id="products">
	<div class="container">
		<header class="shop-head reveal" data-reveal>
			<p class="shop-head__eyebrow eyebrow"><?php esc_html_e( 'Products', 'amz-prints' ); ?></p>
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
			<p class="page-hero__kicker eyebrow"><?php echo esc_html( amz_t( 'nadra' ) ); ?></p>
			<h2><?php echo esc_html( amz_t( 'nadra' ) ); ?> E-Services</h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_nadra_lead', 'Official NADRA e-services facilitation — trusted, authorized, and customer-friendly.' ) ); ?></p>
			<div class="hero__actions" style="margin-top:1.25rem">
				<a class="btn btn--nadra btn--magnetic" href="<?php echo esc_url( home_url( '/nadra-e-services/' ) ); ?>"><?php echo esc_html( amz_t( 'learn_more' ) ); ?></a>
			</div>
		</div>
	</div>
</section>
<?php endif; ?>

<section class="section section--track-home">
	<div class="container track-home reveal" data-reveal>
		<div>
			<p class="eyebrow"><?php esc_html_e( 'Live status', 'amz-prints' ); ?></p>
			<h2><?php echo esc_html( amz_t( 'track_order' ) ); ?></h2>
			<p>Enter your Order ID to see live design, printing, and delivery status.</p>
		</div>
		<div class="track-home__form">
			<p class="form-note" style="margin:0;">Customer login required to track your orders.</p>
			<a class="btn btn--primary btn--magnetic" href="<?php echo esc_url( home_url( '/customer-login/?redirect=' . rawurlencode( home_url( '/my-account/#track' ) ) ) ); ?>"><?php echo esc_html( amz_t( 'track_order' ) ); ?></a>
		</div>
	</div>
</section>

<section class="section section--cta">
	<div class="container cta-band reveal" data-reveal>
		<div class="cta-band__copy">
			<p class="eyebrow"><?php esc_html_e( 'Ready when you are', 'amz-prints' ); ?></p>
			<h2><?php echo esc_html( amz_prints_mod( 'amz_cta_title', 'Ready to print something great?' ) ); ?></h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_cta_sub', 'Tell us what you need. We will quote fast.' ) ); ?></p>
		</div>
		<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Shop now', 'amz-prints' ); ?></a>
	</div>
</section>

<?php get_footer(); ?>
