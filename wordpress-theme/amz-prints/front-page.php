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

// Build image pool (Customizer → ERP → fallbacks). No 6th bottom tile.
$hero_pool = array();
$push_hero = static function ( $url, $name = '', $id = '' ) use ( &$hero_pool, $company ) {
	$url = trim( (string) $url );
	if ( ! $url ) {
		return;
	}
	foreach ( $hero_pool as $existing ) {
		if ( ( $existing['url'] ?? '' ) === $url ) {
			return;
		}
	}
	$hero_pool[] = array(
		'url'  => $url,
		'name' => $name ? $name : $company,
		'id'   => (string) $id,
	);
};

if ( $main_url ) {
	$push_hero( $main_url, $company );
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
	$push_hero( $url, $company );
}
foreach ( $erp_all as $p ) {
	$raw = ! empty( $p['image'] ) ? (string) $p['image'] : '';
	if ( ! $raw ) {
		continue;
	}
	if ( 0 !== strpos( $raw, 'data:image' ) && ! preg_match( '#^https?://#i', $raw ) ) {
		continue;
	}
	// Skip e-Sahulat / NADRA-looking tiles from hero stage.
	$pname = mb_strtolower( (string) ( $p['name'] ?? '' ) );
	$pcat  = mb_strtolower( (string) ( $p['category'] ?? '' ) );
	if ( false !== strpos( $pname, 'sahulat' ) || false !== strpos( $pname, 'e-sahulat' ) || false !== strpos( $pcat, 'sahulat' ) ) {
		continue;
	}
	$push_hero( $raw, (string) ( $p['name'] ?? $company ), (string) ( $p['id'] ?? '' ) );
	if ( count( $hero_pool ) >= 12 ) {
		break;
	}
}
foreach ( $fallback_imgs as $fb ) {
	$push_hero( $fb, $company );
	if ( count( $hero_pool ) >= 12 ) {
		break;
	}
}

// 3 independent sliders — each head gets a different image set.
$slider_sets = array( array(), array(), array() );
foreach ( $hero_pool as $i => $tile ) {
	$slider_sets[ $i % 3 ][] = $tile;
}
foreach ( $slider_sets as $si => $set ) {
	while ( count( $slider_sets[ $si ] ) < 3 ) {
		$slider_sets[ $si ][] = $hero_pool[ ( $si + count( $slider_sets[ $si ] ) ) % count( $hero_pool ) ];
	}
	$slider_sets[ $si ] = array_slice( $slider_sets[ $si ], 0, 4 );
}

$hero_bg = $main_url ? $main_url : ( $slider_sets[0][0]['url'] ?? $fallback_imgs[0] );
if ( 0 === strpos( (string) $hero_bg, 'data:image' ) ) {
	$hero_bg = $fallback_imgs[0];
}

$slider_meta = array(
	array( 'label' => __( 'Featured', 'amz-prints' ), 'mod' => 'main', 'delay' => 0 ),
	array( 'label' => __( 'Press', 'amz-prints' ), 'mod' => 'side', 'delay' => 1600 ),
	array( 'label' => __( 'Brand', 'amz-prints' ), 'mod' => 'side', 'delay' => 3200 ),
);
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
				<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( home_url( '/create-free-cv/' ) ); ?>"><?php esc_html_e( 'Create Free CV', 'amz-prints' ); ?></a>
				<a class="btn btn--ghost btn--lg btn--magnetic" href="<?php echo esc_url( home_url( $cta1_url ) ); ?>"><?php echo esc_html( $cta1 ); ?></a>
				<a class="btn btn--ghost btn--lg btn--magnetic" href="<?php echo esc_url( home_url( $cta2_url ) ); ?>"><?php echo esc_html( $cta2 ); ?></a>
			</div>
		</div>

		<div class="hero__stage" data-hero-stage>
			<div class="hero-sliders" data-hero-flex>
				<?php foreach ( $slider_sets as $si => $slides ) : ?>
					<?php
					$meta  = $slider_meta[ $si ];
					$mod   = $meta['mod'];
					$delay = (int) $meta['delay'];
					?>
					<div
						class="hero-slot hero-slot--<?php echo esc_attr( $mod ); ?>"
						data-hero-slot
						data-interval="5000"
						data-delay="<?php echo esc_attr( (string) $delay ); ?>"
						aria-label="<?php echo esc_attr( $meta['label'] ); ?>"
					>
						<span class="hero-slot__label"><?php echo esc_html( $meta['label'] ); ?></span>
						<div class="hero-slot__slides">
							<?php foreach ( $slides as $ji => $tile ) : ?>
								<?php
								$src = function_exists( 'amz_prints_product_img_src' )
									? amz_prints_product_img_src( $tile['url'] )
									: esc_url( $tile['url'] );
								$pid = (string) ( $tile['id'] ?? '' );
								?>
								<figure
									class="hero-slot__slide<?php echo 0 === $ji ? ' is-active' : ''; ?>"
									data-hero-slide
									<?php if ( $pid ) : ?>
										data-open-product="<?php echo esc_attr( $pid ); ?>"
										data-product-name="<?php echo esc_attr( $tile['name'] ); ?>"
										role="button"
										tabindex="0"
									<?php endif; ?>
								>
									<img src="<?php echo $src; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>" alt="<?php echo esc_attr( $tile['name'] ); ?>" <?php echo ( 0 === $ji && 0 === $si ) ? '' : 'loading="lazy"'; ?>>
								</figure>
							<?php endforeach; ?>
						</div>
						<div class="hero-slot__dots" aria-hidden="true">
							<?php foreach ( $slides as $ji => $tile ) : ?>
								<span class="hero-slot__dot<?php echo 0 === $ji ? ' is-active' : ''; ?>"></span>
							<?php endforeach; ?>
						</div>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
	</div>
</section>

<section class="cv-home-band">
	<div class="container cv-home-band__inner reveal" data-reveal>
		<div>
			<p class="eyebrow"><?php esc_html_e( 'Free customer service', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Create a professional CV online', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Pick a design, add your photo, change colours, and download an A4 resume — completely free.', 'amz-prints' ); ?></p>
		</div>
		<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( home_url( '/create-free-cv/' ) ); ?>"><?php esc_html_e( 'Create Free CV', 'amz-prints' ); ?></a>
	</div>
</section>

<section class="amz-marquee amz-marquee--ink" aria-label="<?php esc_attr_e( 'Services', 'amz-prints' ); ?>">
	<div class="amz-marquee__track">
		<?php foreach ( array_merge( $marquee_items, $marquee_items ) as $label ) : ?>
			<span class="amz-marquee__item"><em aria-hidden="true"></em><?php echo esc_html( $label ); ?></span>
		<?php endforeach; ?>
	</div>
</section>

<section class="quick-actions quick-actions--lower">
	<div class="container quick-actions__grid">
		<a class="quick-action quick-action--ink reveal has-tilt" data-reveal href="<?php echo esc_url( home_url( '/track-order/' ) ); ?>">
			<span class="quick-action__label"><?php echo esc_html( amz_t( 'track_order' ) ); ?></span>
			<strong><?php echo esc_html( amz_t( 'track_order' ) ); ?></strong>
		</a>
		<a class="quick-action quick-action--orange reveal has-tilt" data-reveal href="<?php echo esc_url( home_url( '/how-we-work/' ) ); ?>">
			<span class="quick-action__label"><?php echo esc_html( amz_t( 'how_we_work' ) ); ?></span>
			<strong><?php echo esc_html( amz_t( 'how_we_work' ) ); ?></strong>
		</a>
		<a class="quick-action quick-action--nadra reveal has-tilt" data-reveal href="<?php echo esc_url( home_url( '/nadra-e-services/' ) ); ?>">
			<span class="quick-action__label"><?php echo esc_html( amz_t( 'nadra' ) ); ?></span>
			<strong><?php echo esc_html( amz_t( 'nadra' ) ); ?></strong>
		</a>
		<a class="quick-action quick-action--mix reveal has-tilt" data-reveal href="<?php echo esc_url( home_url( '/products/' ) ); ?>">
			<span class="quick-action__label"><?php esc_html_e( 'Shop', 'amz-prints' ); ?></span>
			<strong><?php esc_html_e( 'Shop products', 'amz-prints' ); ?></strong>
		</a>
	</div>
</section>

<?php if ( function_exists( 'amz_prints_home_service_pillars' ) ) { amz_prints_home_service_pillars(); } ?>

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

<?php
$clients_raw = (string) amz_prints_mod(
	'amz_clients_list',
	"Honda Atlas\nPepsiCo\nEngro\nJazz\nUnilever\nNestlé\nTelenor\nPackages Ltd"
);
$clients = array_values( array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', $clients_raw ) ) ) );
if ( count( $clients ) < 4 ) {
	$clients = array( 'Honda Atlas', 'PepsiCo', 'Engro', 'Jazz', 'Unilever', 'Nestlé', 'Telenor', 'Packages Ltd' );
}

$projects_raw = (string) amz_prints_mod(
	'amz_projects_list',
	"Brand Launch Kit|Packaging|2025\nRetail Campaign Banners|Large Format|2025\nCorporate Identity Suite|Offset|2024\nNADRA Desk Rollout|Public Service|2024\nProduct Catalog Series|Digital|2025\nEvent Branding System|Advertising|2024"
);
$projects = array();
foreach ( preg_split( '/\r\n|\r|\n/', $projects_raw ) as $line ) {
	$line = trim( $line );
	if ( ! $line ) {
		continue;
	}
	$parts = array_map( 'trim', explode( '|', $line ) );
	$projects[] = array(
		'title'    => $parts[0] ?? '',
		'category' => $parts[1] ?? 'Print',
		'year'     => $parts[2] ?? '',
	);
}
if ( count( $projects ) < 3 ) {
	$projects = array(
		array( 'title' => 'Brand Launch Kit', 'category' => 'Packaging', 'year' => '2025' ),
		array( 'title' => 'Retail Campaign Banners', 'category' => 'Large Format', 'year' => '2025' ),
		array( 'title' => 'Corporate Identity Suite', 'category' => 'Offset', 'year' => '2024' ),
		array( 'title' => 'NADRA Desk Rollout', 'category' => 'Public Service', 'year' => '2024' ),
		array( 'title' => 'Product Catalog Series', 'category' => 'Digital', 'year' => '2025' ),
		array( 'title' => 'Event Branding System', 'category' => 'Advertising', 'year' => '2024' ),
	);
}
?>

<?php if ( amz_prints_mod( 'amz_show_clients', true ) ) : ?>
<section class="section section--clients" id="clients">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Trusted by', 'amz-prints' ); ?></p>
			<h2><?php echo esc_html( amz_prints_mod( 'amz_clients_title', 'Our Clients' ) ); ?></h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_clients_sub', 'Brands that trust AMZ Prints for color-true production and on-time delivery.' ) ); ?></p>
		</header>
		<div class="clients-grid reveal" data-reveal>
			<?php foreach ( $clients as $i => $client ) : ?>
				<div class="client-chip" style="--i:<?php echo esc_attr( (string) $i ); ?>">
					<span><?php echo esc_html( $client ); ?></span>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>
<?php endif; ?>

<?php if ( amz_prints_mod( 'amz_show_projects', true ) ) : ?>
<section class="section section--projects section--atelier" id="projects">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Portfolio', 'amz-prints' ); ?></p>
			<h2><?php echo esc_html( amz_prints_mod( 'amz_projects_title', 'Successful Projects' ) ); ?></h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_projects_sub', 'Selected work across packaging, large format, branding, and public services.' ) ); ?></p>
		</header>
		<div class="projects-grid">
			<?php foreach ( $projects as $i => $project ) : ?>
				<?php if ( empty( $project['title'] ) ) { continue; } ?>
				<article class="project-card reveal has-tilt" data-reveal style="--reveal-delay:<?php echo esc_attr( (string) ( $i * 70 ) ); ?>ms; --i:<?php echo esc_attr( (string) $i ); ?>">
					<div class="project-card__glow" aria-hidden="true"></div>
					<p class="project-card__meta">
						<span><?php echo esc_html( $project['category'] ); ?></span>
						<?php if ( ! empty( $project['year'] ) ) : ?>
							<em><?php echo esc_html( $project['year'] ); ?></em>
						<?php endif; ?>
					</p>
					<h3><?php echo esc_html( $project['title'] ); ?></h3>
					<span class="text-link"><?php esc_html_e( 'View case', 'amz-prints' ); ?></span>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>
<?php endif; ?>

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

<?php if ( function_exists( 'amz_prints_catalog_promo' ) ) { amz_prints_catalog_promo( 'home' ); } ?>

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
