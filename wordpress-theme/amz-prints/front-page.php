<?php
/**
 * Homepage — mixed print + digital, full ecommerce, live tracking
 *
 * @package AMZ_Prints
 */

get_header();

$company  = amz_prints_mod( 'amz_company_name', 'AMZ Prints' );
$legal    = amz_prints_mod( 'amz_legal_name', 'Amazon Printings (Pvt) Ltd' );
$headline = amz_prints_mod( 'amz_hero_headline', 'Print that moves brands forward.' );
$sub      = amz_prints_mod( 'amz_hero_sub', 'Offset, digital, large format, packaging, and digital services — crafted with color precision and on-time delivery.' );

$fallback_imgs = array(
	'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80',
	'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1626785774573-4b7993143459?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?auto=format&fit=crop&w=900&q=80',
);

$main_id  = absint( amz_prints_mod( 'amz_hero_image', 0 ) );
$main_url = $main_id ? wp_get_attachment_image_url( $main_id, 'amz-hero' ) : '';
$hero_bg  = $main_url ? $main_url : $fallback_imgs[0];

$catalog = array_slice( amz_prints_services_catalog(), 0, 8 );
$erp_all = function_exists( 'amz_prints_erp_get_products' ) ? amz_prints_erp_get_products() : array();
$cats    = array();
foreach ( $erp_all as $p ) {
	$c = trim( (string) ( $p['category'] ?? '' ) );
	if ( $c ) {
		$cats[ sanitize_title( $c ) ] = $c;
	}
}

$featured = array();
foreach ( $erp_all as $p ) {
	if ( empty( $p['name'] ) ) {
		continue;
	}
	$raw = ! empty( $p['image'] ) ? (string) $p['image'] : '';
	$pname = mb_strtolower( (string) $p['name'] );
	if ( false !== strpos( $pname, 'sahulat' ) ) {
		continue;
	}
	if ( $raw && 0 !== strpos( $raw, 'data:image' ) && ! preg_match( '#^https?://#i', $raw ) ) {
		$raw = '';
	}
	$featured[] = array(
		'name' => (string) $p['name'],
		'url'  => $raw ? $raw : $fallback_imgs[ ( count( $featured ) % 4 ) + 1 ],
		'id'   => (string) ( $p['id'] ?? '' ),
	);
	if ( count( $featured ) >= 4 ) {
		break;
	}
}
if ( count( $featured ) < 4 ) {
	$defaults = array(
		array( 'name' => 'Business Cards', 'url' => $fallback_imgs[1], 'id' => '' ),
		array( 'name' => 'Banners & Signage', 'url' => $fallback_imgs[2], 'id' => '' ),
		array( 'name' => 'Packaging & Boxes', 'url' => $fallback_imgs[3], 'id' => '' ),
		array( 'name' => 'Custom Apparel', 'url' => $fallback_imgs[4], 'id' => '' ),
	);
	$featured = array_slice( array_merge( $featured, $defaults ), 0, 4 );
}

$track_url = function_exists( 'amz_prints_customer_is_logged_in' ) && amz_prints_customer_is_logged_in()
	? home_url( '/my-account/#track' )
	: home_url( '/customer-login/?redirect=' . rawurlencode( home_url( '/my-account/#track' ) ) );
?>

<section class="land-hero">
	<div class="land-hero__photo" style="background-image:url('<?php echo esc_url( $hero_bg ); ?>')" aria-hidden="true"></div>
	<div class="land-hero__wash" aria-hidden="true"></div>
	<div class="container land-hero__inner">
		<div class="land-hero__copy reveal" data-reveal>
			<p class="land-hero__brand"><?php echo esc_html( $company ); ?></p>
			<p class="land-hero__legal"><?php echo esc_html( $legal ); ?></p>
			<h1><?php echo esc_html( $headline ); ?></h1>
			<p class="land-hero__sub"><?php echo esc_html( $sub ); ?></p>
			<div class="land-hero__actions">
				<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Shop products', 'amz-prints' ); ?></a>
				<a class="btn btn--ghost btn--lg btn--magnetic" href="<?php echo esc_url( home_url( '/services/' ) ); ?>"><?php esc_html_e( 'View services', 'amz-prints' ); ?></a>
			</div>
		</div>
		<div class="land-hero__tiles reveal" data-reveal>
			<?php foreach ( $featured as $tile ) : ?>
				<?php
				$src = function_exists( 'amz_prints_product_img_src' )
					? amz_prints_product_img_src( $tile['url'] )
					: esc_url( $tile['url'] );
				$pid = (string) ( $tile['id'] ?? '' );
				?>
				<figure
					class="land-tile"
					<?php if ( $pid ) : ?>
						data-open-product="<?php echo esc_attr( $pid ); ?>"
						data-product-name="<?php echo esc_attr( $tile['name'] ); ?>"
						role="button"
						tabindex="0"
					<?php else : ?>
						onclick="window.location.href='<?php echo esc_url( home_url( '/products/' ) ); ?>'"
						role="link"
						tabindex="0"
					<?php endif; ?>
				>
					<img src="<?php echo $src; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>" alt="<?php echo esc_attr( $tile['name'] ); ?>">
					<figcaption><?php echo esc_html( $tile['name'] ); ?></figcaption>
				</figure>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section class="land-quick">
	<div class="container land-quick__grid">
		<a class="land-quick__card land-quick__card--blue reveal" data-reveal href="<?php echo esc_url( $track_url ); ?>">
			<span><?php esc_html_e( 'Live status', 'amz-prints' ); ?></span>
			<strong><?php esc_html_e( 'Track order', 'amz-prints' ); ?></strong>
		</a>
		<a class="land-quick__card land-quick__card--orange reveal" data-reveal href="<?php echo esc_url( home_url( '/how-we-work/' ) ); ?>">
			<span><?php esc_html_e( 'Process', 'amz-prints' ); ?></span>
			<strong><?php esc_html_e( 'How we work', 'amz-prints' ); ?></strong>
		</a>
		<a class="land-quick__card land-quick__card--green reveal" data-reveal href="<?php echo esc_url( home_url( '/nadra-e-services/' ) ); ?>">
			<span><?php esc_html_e( 'Authorized', 'amz-prints' ); ?></span>
			<strong><?php esc_html_e( 'NADRA e-services', 'amz-prints' ); ?></strong>
		</a>
		<a class="land-quick__card land-quick__card--mix reveal" data-reveal href="<?php echo esc_url( home_url( '/quote/' ) ); ?>">
			<span><?php esc_html_e( 'Start', 'amz-prints' ); ?></span>
			<strong><?php esc_html_e( 'Get a quote', 'amz-prints' ); ?></strong>
		</a>
	</div>
</section>

<?php if ( function_exists( 'amz_prints_home_service_pillars' ) ) { amz_prints_home_service_pillars(); } ?>

<section class="section section--services" id="services">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Mixed services', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Print, branding, and digital — one house', 'amz-prints' ); ?></h2>
			<p><?php echo esc_html( amz_t( 'services_lead' ) ); ?></p>
		</header>
		<div class="land-svc-grid">
			<?php foreach ( $catalog as $i => $cat ) : ?>
				<a class="land-svc reveal" data-reveal href="<?php echo esc_url( home_url( '/services/#' . $cat['slug'] ) ); ?>" style="--reveal-delay:<?php echo esc_attr( (string) ( $i * 50 ) ); ?>ms">
					<img src="<?php echo esc_url( $cat['image'] ); ?>" alt="" loading="lazy">
					<div>
						<h3><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></h3>
						<p><?php echo esc_html( implode( ' · ', array_map( 'amz_prints_svc_label', array_slice( $cat['items'], 0, 3 ) ) ) ); ?></p>
					</div>
				</a>
			<?php endforeach; ?>
		</div>
		<div class="section-foot reveal" data-reveal>
			<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/services/' ) ); ?>"><?php echo esc_html( amz_t( 'view_all' ) ); ?></a>
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/digital-services/' ) ); ?>"><?php esc_html_e( 'Digital services', 'amz-prints' ); ?></a>
		</div>
	</div>
</section>

<?php if ( amz_prints_mod( 'amz_show_products', true ) ) : ?>
<section class="section section--shop" id="products">
	<div class="container">
		<header class="shop-head reveal" data-reveal>
			<p class="shop-head__eyebrow eyebrow"><?php esc_html_e( 'Ecommerce', 'amz-prints' ); ?></p>
			<h2><?php echo esc_html( amz_prints_mod( 'amz_products_title', 'Shop print products' ) ); ?></h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_products_sub', 'Open any item for details, add to cart, and checkout online.' ) ); ?></p>
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
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Open full shop', 'amz-prints' ); ?></a>
		</div>
	</div>
</section>
<?php endif; ?>

<section class="section section--track-home" id="track">
	<div class="container track-home reveal" data-reveal>
		<div>
			<p class="eyebrow"><?php esc_html_e( 'On the main site', 'amz-prints' ); ?></p>
			<h2><?php echo esc_html( amz_t( 'track_order' ) ); ?></h2>
			<p><?php esc_html_e( 'Log in to see live design, printing, and delivery status for your orders.', 'amz-prints' ); ?></p>
		</div>
		<div class="track-home__form">
			<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( $track_url ); ?>"><?php echo esc_html( amz_t( 'track_order' ) ); ?></a>
		</div>
	</div>
</section>

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

<section class="cv-home-band">
	<div class="container cv-home-band__inner reveal" data-reveal>
		<div>
			<p class="eyebrow"><?php esc_html_e( 'Free', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Build your free CV', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Create a professional A4 resume online, then print it with us if you want a finished copy.', 'amz-prints' ); ?></p>
		</div>
		<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( home_url( '/create-free-cv/' ) ); ?>"><?php esc_html_e( 'Create Free CV', 'amz-prints' ); ?></a>
	</div>
</section>

<?php if ( function_exists( 'amz_prints_catalog_promo' ) ) { amz_prints_catalog_promo( 'home' ); } ?>

<section class="section section--cta">
	<div class="container cta-band reveal" data-reveal>
		<div class="cta-band__copy">
			<p class="eyebrow"><?php esc_html_e( 'Ready when you are', 'amz-prints' ); ?></p>
			<h2><?php echo esc_html( amz_prints_mod( 'amz_cta_title', 'Ready to print something great?' ) ); ?></h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_cta_sub', 'Shop online, track your job, or send a quote — we will move fast.' ) ); ?></p>
		</div>
		<div class="land-hero__actions">
			<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Shop now', 'amz-prints' ); ?></a>
			<a class="btn btn--ghost btn--lg" href="<?php echo esc_url( home_url( '/quote/' ) ); ?>"><?php esc_html_e( 'Get a Quote', 'amz-prints' ); ?></a>
		</div>
	</div>
</section>

<?php get_footer(); ?>
