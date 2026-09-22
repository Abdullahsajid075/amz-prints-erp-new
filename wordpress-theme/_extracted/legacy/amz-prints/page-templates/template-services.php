<?php
/**
 * Template Name: Services
 *
 * @package AMZ_Prints
 */

get_header();
$catalog = amz_prints_services_catalog();
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php echo esc_html( amz_t( 'our_services' ) ); ?></h1>
		<p class="page-hero__lead"><?php echo esc_html( amz_t( 'services_lead' ) ); ?></p>
	</div>
</section>

<section class="section section--services-catalog">
	<div class="container">
		<nav class="services-jump reveal" data-reveal>
			<?php foreach ( $catalog as $cat ) : ?>
				<a href="#<?php echo esc_attr( $cat['slug'] ); ?>"><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></a>
			<?php endforeach; ?>
		</nav>

		<?php foreach ( $catalog as $cat ) : ?>
			<section class="service-category reveal" data-reveal id="<?php echo esc_attr( $cat['slug'] ); ?>">
				<a class="service-category__banner" href="<?php echo esc_url( amz_prints_service_section_url( $cat['slug'] ) ); ?>">
					<img src="<?php echo esc_url( $cat['image'] ); ?>" alt="<?php echo esc_attr( amz_prints_svc_label( $cat ) ); ?>" loading="lazy">
					<div class="service-category__banner-copy">
						<h2><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></h2>
						<span><?php echo esc_html( count( $cat['items'] ) ); ?> <?php echo esc_html( amz_prints_is_rtl() ? 'سروسز' : 'services' ); ?></span>
					</div>
				</a>
				<div class="service-category__grid">
					<?php foreach ( $cat['items'] as $item ) : ?>
						<a class="service-chip" href="<?php echo esc_url( amz_prints_service_quote_url( $item['en'] ) ); ?>">
							<h3><?php echo esc_html( amz_prints_svc_label( $item ) ); ?></h3>
							<span><?php echo esc_html( amz_t( 'request_quote' ) ); ?> →</span>
						</a>
					<?php endforeach; ?>
				</div>
			</section>
		<?php endforeach; ?>
	</div>
</section>

<section class="section section--cta">
	<div class="container cta-band reveal" data-reveal>
		<div class="cta-band__copy">
			<h2><?php echo esc_html( amz_t( 'mega_cta' ) ); ?></h2>
			<p><?php echo esc_html( amz_t( 'mega_cta_sub' ) ); ?></p>
		</div>
		<a class="btn btn--primary btn--lg" href="<?php echo esc_url( home_url( '/quote/' ) ); ?>"><?php echo esc_html( amz_t( 'quote' ) ); ?></a>
	</div>
</section>

<?php get_footer(); ?>
