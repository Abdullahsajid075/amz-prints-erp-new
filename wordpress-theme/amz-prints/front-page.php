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

$catalog = array_slice( amz_prints_services_catalog(), 0, 8 );
$erp_all = function_exists( 'amz_prints_erp_get_products' ) ? amz_prints_erp_get_products() : array();
$cats    = array();
foreach ( $erp_all as $p ) {
	$c = trim( (string) ( $p['category'] ?? '' ) );
	if ( $c ) {
		$cats[ sanitize_title( $c ) ] = $c;
	}
}

$track_url = function_exists( 'amz_prints_customer_is_logged_in' ) && amz_prints_customer_is_logged_in()
	? home_url( '/my-account/#track' )
	: home_url( '/customer-login/?redirect=' . rawurlencode( home_url( '/my-account/#track' ) ) );

$slide_copy = array(
	array(
		'kicker' => __( 'Printing', 'amz-prints' ),
		'title'  => $headline,
		'text'   => $sub,
		'tone'   => 'orange',
	),
	array(
		'kicker' => __( 'Technology', 'amz-prints' ),
		'title'  => amz_prints_mod( 'amz_hero_title_2', 'Digital work, built to ship.' ),
		'text'   => amz_prints_mod( 'amz_hero_text_2', 'Websites, software, and brand systems from the same house that prints the work.' ),
		'tone'   => 'blue',
	),
	array(
		'kicker' => __( 'Brand', 'amz-prints' ),
		'title'  => amz_prints_mod( 'amz_hero_title_3', 'Color, finish, and identity.' ),
		'text'   => amz_prints_mod( 'amz_hero_text_3', 'Cards, signage, packaging, and large format with a finish you can hold.' ),
		'tone'   => 'ink',
	),
	array(
		'kicker' => __( 'Orders', 'amz-prints' ),
		'title'  => amz_prints_mod( 'amz_hero_title_4', 'Every job, live to track.' ),
		'text'   => amz_prints_mod( 'amz_hero_text_4', 'Create an account, place the order, and follow design, print, and delivery.' ),
		'tone'   => 'orange',
	),
);
$slide_ids = array( 'amz_hero_image', 'amz_hero_image_2', 'amz_hero_image_3', 'amz_hero_support_1' );
$fallbacks = array(
	'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1626785774573-4b7993143459?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1200&q=80',
);
$hero_slides = array();
foreach ( $slide_copy as $i => $copy ) {
	$id  = absint( amz_prints_mod( $slide_ids[ $i ], 0 ) );
	$url = $id ? wp_get_attachment_image_url( $id, 'large' ) : '';
	$hero_slides[] = array(
		'kicker' => $copy['kicker'],
		'title'  => $copy['title'],
		'text'   => $copy['text'],
		'image'  => $url ? $url : $fallbacks[ $i ],
		'tone'   => $copy['tone'],
	);
}
$strip_raw  = amz_prints_mod( 'amz_running_strip', 'Offset Printing | Digital Printing | Large Format | Packaging | Branding | NADRA e-Services | Free CV | Order Tracking | Shop Online' );
$strip      = array_values( array_filter( array_map( 'trim', explode( '|', (string) $strip_raw ) ) ) );
$strip_loop = $strip ? array_merge( $strip, $strip ) : array();
$photo_products = array();
$photo_rest     = array();
foreach ( $erp_all as $p ) {
	if ( empty( $p['name'] ) || ! function_exists( 'amz_prints_product_photo_url' ) || ! amz_prints_product_photo_url( $p ) ) {
		continue;
	}
	if ( ! empty( $p['showOnTop'] ) ) {
		$photo_products[] = $p;
	} else {
		$photo_rest[] = $p;
	}
}
$photo_products    = array_merge( $photo_products, $photo_rest );
$photo_loop        = $photo_products ? array_merge( $photo_products, $photo_products ) : array();
$featured_products = array_slice( $photo_products, 0, 8 );
$featured_services = array_slice( $catalog, 0, 4 );
?>

<section class="stage" data-hero-rotator data-interval="10000" aria-roledescription="carousel" aria-label="<?php echo esc_attr( $headline ); ?>">
	<div class="container stage__panel">
		<?php foreach ( $hero_slides as $i => $slide ) : ?>
			<article class="stage__slide stage__slide--<?php echo esc_attr( $slide['tone'] ); ?><?php echo 0 === $i ? ' is-active' : ''; ?>" data-slide>
				<div class="stage__copy">
					<p><?php echo esc_html( $slide['kicker'] ); ?></p>
					<h1><?php echo esc_html( $slide['title'] ); ?></h1>
					<p class="stage__lead"><?php echo esc_html( $slide['text'] ); ?></p>
					<div class="stage__actions">
						<a class="btn btn--light btn--lg" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Shop products', 'amz-prints' ); ?></a>
						<a class="btn btn--ghost btn--lg stage__ghost" href="<?php echo esc_url( home_url( '/quote/' ) ); ?>"><?php esc_html_e( 'Get a quote', 'amz-prints' ); ?></a>
					</div>
				</div>
				<div class="stage__photo" style="background-image:url('<?php echo esc_url( $slide['image'] ); ?>')" role="img" aria-label="<?php echo esc_attr( $slide['title'] ); ?>"></div>
			</article>
		<?php endforeach; ?>
		<div class="stage__dots">
			<?php foreach ( $hero_slides as $i => $slide ) : ?>
				<button type="button" class="<?php echo 0 === $i ? 'is-active' : ''; ?>" data-stage-dot="<?php echo esc_attr( (string) $i ); ?>" aria-label="<?php echo esc_attr( sprintf( __( 'Slide %d', 'amz-prints' ), $i + 1 ) ); ?>"></button>
			<?php endforeach; ?>
		</div>
	</div>
</section>
<?php if ( $featured_products ) : ?>
<section class="home-block">
	<div class="container">
		<header class="section-head">
			<p class="eyebrow"><?php esc_html_e( 'Featured products', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Pieces ready to order', 'amz-prints' ); ?></h2>
		</header>
		<div class="feat-grid">
			<?php foreach ( $featured_products as $product ) : ?>
				<?php get_template_part( 'template-parts/product', 'card', array( 'product' => $product ) ); ?>
			<?php endforeach; ?>
		</div>
	</div>
</section>
<?php endif; ?>

<?php if ( $featured_services ) : ?>
<section class="home-block home-block--services">
	<div class="container">
		<header class="section-head">
			<p class="eyebrow"><?php esc_html_e( 'Featured services', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Print, brand, and digital', 'amz-prints' ); ?></h2>
		</header>
		<div class="feat-services">
			<?php foreach ( $featured_services as $cat ) : ?>
				<a class="feat-service" href="<?php echo esc_url( home_url( '/services/#' . $cat['slug'] ) ); ?>">
					<img src="<?php echo esc_url( $cat['image'] ); ?>" alt="">
					<span>
						<strong><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></strong>
						<em><?php echo esc_html( implode( ' · ', array_map( 'amz_prints_svc_label', array_slice( $cat['items'], 0, 2 ) ) ) ); ?></em>
					</span>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>
<?php endif; ?>

	<?php if ( $photo_loop ) : ?>
		<div class="amz-prodrail" aria-label="<?php esc_attr_e( 'Products with photos', 'amz-prints' ); ?>">
			<div class="amz-prodrail__track">
				<?php foreach ( $photo_loop as $product ) : ?>
					<?php $rail_url = function_exists( 'amz_prints_erp_product_url' ) ? amz_prints_erp_product_url( $product['id'] ?? '' ) : home_url( '/products/' ); ?>
					<a class="amz-prodrail__card" href="<?php echo esc_url( $rail_url ); ?>">
						<img src="<?php echo function_exists( 'amz_prints_product_img_src' ) ? amz_prints_product_img_src( $product['image'] ) : esc_url( $product['image'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>" alt="<?php echo esc_attr( $product['name'] ); ?>">
						<span><?php echo esc_html( $product['name'] ); ?></span>
					</a>
				<?php endforeach; ?>
			</div>
		</div>
	<?php endif; ?>

<div class="amz-marquee amz-marquee--ink" aria-hidden="true">
	<div class="amz-marquee__track">
		<?php foreach ( $strip_loop as $item ) : ?>
			<span class="amz-marquee__item"><?php echo esc_html( $item ); ?><em></em></span>
		<?php endforeach; ?>
	</div>
</div>

<section class="land-mix">
	<div class="container land-mix__grid">
		<article class="land-mix__card land-mix__card--print">
			<p><?php esc_html_e( 'Printing', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Press, color, and finish', 'amz-prints' ); ?></h2>
			<ul>
				<li><?php esc_html_e( 'Offset and digital print', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Large format, UV, DTF', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Packaging and signage', 'amz-prints' ); ?></li>
			</ul>
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/services/' ) ); ?>"><?php esc_html_e( 'Printing services', 'amz-prints' ); ?></a>
		</article>
		<article class="land-mix__card land-mix__card--tech">
			<p><?php esc_html_e( 'Technology', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Digital studio and software', 'amz-prints' ); ?></h2>
			<ul>
				<li><?php esc_html_e( 'Websites, apps, and ERP', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Brand systems and motion', 'amz-prints' ); ?></li>
				<li><?php esc_html_e( 'Live order tracking', 'amz-prints' ); ?></li>
			</ul>
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/digital-services/' ) ); ?>"><?php esc_html_e( 'Digital services', 'amz-prints' ); ?></a>
		</article>
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

<section class="land-ecom">
	<div class="container land-ecom__grid">
		<div class="land-ecom__copy reveal" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Full ecommerce', 'amz-prints' ); ?></p>
			<h2><?php esc_html_e( 'Shop print + digital, track every job, pay your way', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Create an account to get a downloadable customer card, QR, ledger, and pending payments. Matching name, email, and phone opens your existing AMZ Prints record automatically.', 'amz-prints' ); ?></p>
			<div class="land-hero__actions">
				<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Open shop', 'amz-prints' ); ?></a>
				<?php if ( function_exists( 'amz_prints_customer_is_logged_in' ) && amz_prints_customer_is_logged_in() ) : ?>
					<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/my-account/' ) ); ?>"><?php esc_html_e( 'My account', 'amz-prints' ); ?></a>
				<?php else : ?>
					<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/customer-signup/' ) ); ?>"><?php esc_html_e( 'Create account', 'amz-prints' ); ?></a>
				<?php endif; ?>
			</div>
		</div>
		<ul class="land-ecom__list reveal" data-reveal>
			<li><?php esc_html_e( 'Live order tracking on the main site', 'amz-prints' ); ?></li>
			<li><?php esc_html_e( 'Customer card + QR you can download', 'amz-prints' ); ?></li>
			<li><?php esc_html_e( 'Bank payment cards (customizable)', 'amz-prints' ); ?></li>
			<li><?php esc_html_e( 'Mixed print house + digital services', 'amz-prints' ); ?></li>
			<li><?php esc_html_e( 'Free CV builder with photo and PDF download', 'amz-prints' ); ?></li>
		</ul>
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
