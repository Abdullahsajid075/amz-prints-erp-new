<?php
/**
 * Homepage
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
$layout   = amz_prints_mod( 'amz_hero_layout', 'mosaic' );

$fallback_imgs = array(
	'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1600&q=80',
	'https://images.unsplash.com/photo-1626785774573-4b7993143459?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1503690970856-d1a3c8d8e9e3?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80',
);

$main_id  = absint( amz_prints_mod( 'amz_hero_image', 0 ) );
$main_url = $main_id ? wp_get_attachment_image_url( $main_id, 'amz-hero' ) : '';
if ( ! $main_url ) {
	$main_url = $fallback_imgs[0];
}

$support = array();
foreach ( array( 'amz_hero_support_1', 'amz_hero_support_2', 'amz_hero_support_3', 'amz_hero_support_4', 'amz_hero_support_5' ) as $i => $key ) {
	$id  = absint( amz_prints_mod( $key, 0 ) );
	$url = $id ? wp_get_attachment_image_url( $id, 'amz-card' ) : '';
	$support[] = $url ? $url : $fallback_imgs[ $i + 1 ];
}

$hero_slides = array( $main_url );
foreach ( array( 'amz_hero_image_2', 'amz_hero_image_3' ) as $key ) {
	$id = absint( amz_prints_mod( $key, 0 ) );
	if ( $id ) {
		$url = wp_get_attachment_image_url( $id, 'amz-hero' );
		if ( $url ) {
			$hero_slides[] = $url;
		}
	}
}
while ( count( $hero_slides ) < 3 ) {
	$hero_slides[] = $fallback_imgs[ count( $hero_slides ) % count( $fallback_imgs ) ];
}
$hero_slides = array_slice( $hero_slides, 0, 3 );
$catalog     = array_slice( amz_prints_services_catalog(), 0, 6 );
?>

<?php if ( 'slider' === $layout ) : ?>
<section class="hero hero--slider" data-hero-slider data-hero-interval="3000">
	<div class="hero__media" aria-hidden="true">
		<div class="hero__slides">
			<?php foreach ( $hero_slides as $i => $url ) : ?>
				<div class="hero__slide<?php echo 0 === $i ? ' is-active' : ''; ?>" style="background-image:url('<?php echo esc_url( $url ); ?>')"></div>
			<?php endforeach; ?>
		</div>
		<div class="hero__veil"></div>
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
<?php else : ?>
<section class="hero hero--mosaic">
	<div class="container hero-mosaic">
		<div class="hero-mosaic__copy reveal" data-reveal>
			<p class="hero__brand"><?php echo esc_html( $company ); ?></p>
			<p class="hero__legal"><?php echo esc_html( $legal ); ?></p>
			<h1 class="hero__title"><?php echo esc_html( $headline ); ?></h1>
			<p class="hero__sub"><?php echo esc_html( $sub ); ?></p>
			<div class="hero__actions">
				<a class="btn btn--primary btn--lg" href="<?php echo esc_url( home_url( $cta1_url ) ); ?>"><?php echo esc_html( $cta1 ); ?></a>
				<a class="btn btn--ghost btn--lg" href="<?php echo esc_url( home_url( $cta2_url ) ); ?>"><?php echo esc_html( $cta2 ); ?></a>
			</div>
		</div>
		<div class="hero-mosaic__visual" data-hero-mosaic>
			<figure class="hero-mosaic__main reveal" data-reveal>
				<img src="<?php echo esc_url( $main_url ); ?>" alt="<?php echo esc_attr( $company ); ?>" loading="eager">
			</figure>
			<div class="hero-mosaic__side" data-hero-mosaic-track>
				<?php foreach ( $support as $i => $url ) : ?>
					<figure class="hero-mosaic__tile reveal" data-reveal style="--i:<?php echo esc_attr( (string) $i ); ?>">
						<img src="<?php echo esc_url( $url ); ?>" alt="" loading="lazy">
					</figure>
				<?php endforeach; ?>
			</div>
		</div>
	</div>
</section>
<?php endif; ?>

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
<section class="section section--products" id="products">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<h2><?php echo esc_html( amz_prints_mod( 'amz_products_title', 'Popular products' ) ); ?></h2>
			<p><?php echo esc_html( amz_prints_mod( 'amz_products_sub', 'Ready to order — customize finishes, quantities, and turnaround.' ) ); ?></p>
		</header>
		<div class="product-grid">
			<?php
			$erp_home_products = function_exists( 'amz_prints_erp_get_products' ) ? amz_prints_erp_get_products() : array();
			if ( ! empty( $erp_home_products ) ) :
				$erp_home_products = array_slice( $erp_home_products, 0, 6 );
				foreach ( $erp_home_products as $product ) :
					$purl   = function_exists( 'amz_prints_erp_product_url' ) ? amz_prints_erp_product_url( $product['id'] ) : home_url( '/products/' );
					$price  = amz_prints_erp_product_price_label( $product );
					$excerpt = $product['description'] ? wp_trim_words( $product['description'], 14 ) : ( $product['category'] ?: '' );
					$img     = ! empty( $product['image'] ) ? $product['image'] : '';
					?>
					<article class="product-tile reveal" data-reveal>
						<a href="<?php echo esc_url( $purl ); ?>">
							<div class="product-tile__media">
								<?php if ( $img ) : ?>
									<img src="<?php echo function_exists( 'amz_prints_product_img_src' ) ? amz_prints_product_img_src( $img ) : esc_url( $img ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>" alt="<?php echo esc_attr( $product['name'] ); ?>" loading="lazy">
								<?php else : ?>
									<div class="product-tile__placeholder" aria-hidden="true"><span><?php echo esc_html( mb_substr( $product['name'], 0, 1 ) ); ?></span></div>
								<?php endif; ?>
							</div>
							<div class="product-tile__body">
								<h3><?php echo esc_html( $product['name'] ); ?></h3>
								<?php if ( $excerpt ) : ?><p><?php echo esc_html( $excerpt ); ?></p><?php endif; ?>
								<span class="product-tile__price"><?php echo esc_html( $price ); ?></span>
							</div>
						</a>
					</article>
					<?php
				endforeach;
			else :
				$products = new WP_Query( array(
					'post_type'      => 'amz_product',
					'posts_per_page' => 6,
					'orderby'        => 'menu_order',
					'order'          => 'ASC',
				) );
				if ( $products->have_posts() ) :
					while ( $products->have_posts() ) :
						$products->the_post();
						$price = get_post_meta( get_the_ID(), '_amz_price_label', true );
						?>
						<article class="product-tile reveal" data-reveal>
							<a href="<?php the_permalink(); ?>">
								<div class="product-tile__media">
									<?php if ( has_post_thumbnail() ) : ?>
										<?php the_post_thumbnail( 'amz-product' ); ?>
									<?php else : ?>
										<div class="product-tile__placeholder" aria-hidden="true"><span><?php echo esc_html( mb_substr( get_the_title(), 0, 1 ) ); ?></span></div>
									<?php endif; ?>
								</div>
								<div class="product-tile__body">
									<h3><?php the_title(); ?></h3>
									<p><?php echo esc_html( wp_trim_words( get_the_excerpt() ?: get_the_content(), 14 ) ); ?></p>
									<?php if ( $price ) : ?><span class="product-tile__price"><?php echo esc_html( $price ); ?></span><?php endif; ?>
								</div>
							</a>
						</article>
						<?php
					endwhile;
					wp_reset_postdata();
				endif;
			endif;
			?>
		</div>
		<div class="section-foot reveal" data-reveal>
			<a class="text-link" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Shop all products', 'amz-prints' ); ?></a>
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
