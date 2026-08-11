<?php
/**
 * Template Name: Company Profile Hub
 * Choose Print or Digital company profile PDF.
 *
 * @package AMZ_Prints
 */

get_header();
$company = amz_prints_mod( 'amz_company_name', 'AMZ Prints' );
$legal   = amz_prints_mod( 'amz_legal_name', 'Amazon Printings (Pvt) Ltd' );
?>

<section class="page-hero page-hero--profiles">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( $company ); ?></p>
		<h1><?php esc_html_e( 'Company Profile Catalogs', 'amz-prints' ); ?></h1>
		<p class="page-hero__lead"><?php echo esc_html( $legal ); ?> — <?php esc_html_e( 'two premium landscape profiles. Pick the one that matches your project.', 'amz-prints' ); ?></p>
	</div>
</section>

<section class="section">
	<div class="container">
		<div class="catalog-dual catalog-dual--page">
			<article class="catalog-dual__card catalog-dual__card--print reveal has-tilt" data-reveal>
				<div class="catalog-dual__visual" style="background-image:url('https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1000&q=80')"></div>
				<p class="eyebrow"><?php esc_html_e( 'Warm print-house theme', 'amz-prints' ); ?></p>
				<h2><?php esc_html_e( 'Printing & Designing', 'amz-prints' ); ?></h2>
				<p><?php esc_html_e( 'Full print & design company profile — services, mockups, mission, branches, and WhatsApp / website QR codes.', 'amz-prints' ); ?></p>
				<div class="catalog-dual__actions">
					<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'print', true ) ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Download Print PDF', 'amz-prints' ); ?></a>
					<a class="btn btn--ghost btn--lg btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'print' ) ); ?>"><?php esc_html_e( 'Preview book', 'amz-prints' ); ?></a>
				</div>
			</article>
			<article class="catalog-dual__card catalog-dual__card--digital reveal has-tilt" data-reveal>
				<div class="catalog-dual__visual" style="background-image:url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80')"></div>
				<p class="eyebrow"><?php esc_html_e( 'Modern tech theme', 'amz-prints' ); ?></p>
				<h2><?php esc_html_e( 'IT & Digital Services', 'amz-prints' ); ?></h2>
				<p><?php esc_html_e( 'Digital services company profile — websites, software, social, process, why us, and contact QR codes.', 'amz-prints' ); ?></p>
				<div class="catalog-dual__actions">
					<a class="btn btn--primary btn--lg btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'digital', true ) ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Download Digital PDF', 'amz-prints' ); ?></a>
					<a class="btn btn--ghost btn--lg btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'digital' ) ); ?>"><?php esc_html_e( 'Preview book', 'amz-prints' ); ?></a>
				</div>
			</article>
		</div>
	</div>
</section>

<?php get_footer(); ?>
