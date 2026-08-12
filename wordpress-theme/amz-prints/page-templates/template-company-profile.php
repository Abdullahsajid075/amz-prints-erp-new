<?php
/**
 * Template Name: Company Profile Hub
 * Two premium printed catalog books.
 *
 * @package AMZ_Prints
 */

get_header();
$company     = amz_prints_mod( 'amz_company_name', 'AMZ Prints' );
$legal       = amz_prints_mod( 'amz_legal_name', 'Amazon Printings (Pvt) Ltd' );
$print_hub   = amz_prints_book_image( 'amz_book_print_hub', 'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1000&q=80' );
$digital_hub = amz_prints_book_image( 'amz_book_digital_hub', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80' );
?>

<section class="book-library book-library--premium">
	<div class="book-library__atmosphere" aria-hidden="true">
		<div class="book-library__glow book-library__glow--a"></div>
		<div class="book-library__glow book-library__glow--b"></div>
		<div class="book-library__grain"></div>
	</div>
	<div class="container book-library__inner">
		<header class="book-library__head reveal" data-reveal>
			<p class="eyebrow"><?php echo esc_html( $company ); ?></p>
			<h1><?php esc_html_e( 'Company Profile', 'amz-prints' ); ?></h1>
			<p><?php echo esc_html( $legal ); ?> — <?php esc_html_e( 'two premium catalogs. Open a book, flip pages like the real thing, download PDF anytime. Edit book images in Customizer → A1 — Edit Books.', 'amz-prints' ); ?></p>
		</header>

		<div class="printed-books">
			<article class="printed-book printed-book--print reveal" data-reveal>
				<a class="printed-book__link" href="<?php echo esc_url( amz_prints_catalog_url( 'print' ) ); ?>">
					<div class="printed-book__3d">
						<div class="printed-book__cover" style="background-image:linear-gradient(160deg,rgba(14,20,27,0.75),rgba(242,101,34,0.55)),url('<?php echo esc_url( $print_hub ); ?>')">
							<span class="printed-book__badge"><?php esc_html_e( 'Print house', 'amz-prints' ); ?></span>
							<strong class="printed-book__brand"><?php echo esc_html( $company ); ?></strong>
							<h2><?php esc_html_e( 'Printing & Designing', 'amz-prints' ); ?></h2>
							<p><?php esc_html_e( 'Press · Branding · Packaging · Design', 'amz-prints' ); ?></p>
							<em><?php esc_html_e( 'Open the book →', 'amz-prints' ); ?></em>
						</div>
						<div class="printed-book__spine" aria-hidden="true"></div>
						<div class="printed-book__pages" aria-hidden="true"></div>
					</div>
				</a>
				<div class="printed-book__meta">
					<p><?php esc_html_e( 'Website-style charcoal & orange theme — full services, portfolio, mission, branches, QR codes.', 'amz-prints' ); ?></p>
					<div class="printed-book__actions">
						<a class="btn btn--primary btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'print' ) ); ?>"><?php esc_html_e( 'Open book', 'amz-prints' ); ?></a>
						<a class="btn btn--ghost btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'print', true ) ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Download PDF', 'amz-prints' ); ?></a>
					</div>
				</div>
			</article>

			<article class="printed-book printed-book--digital printed-book--gold reveal" data-reveal>
				<a class="printed-book__link" href="<?php echo esc_url( amz_prints_catalog_url( 'digital' ) ); ?>">
					<div class="printed-book__3d">
						<div class="printed-book__cover" style="background-image:linear-gradient(160deg,rgba(8,8,8,0.88),rgba(201,162,39,0.45)),url('<?php echo esc_url( $digital_hub ); ?>')">
							<span class="printed-book__badge"><?php esc_html_e( 'IT & Digital', 'amz-prints' ); ?></span>
							<strong class="printed-book__brand"><?php echo esc_html( $company ); ?></strong>
							<h2><?php esc_html_e( 'Digital Services', 'amz-prints' ); ?></h2>
							<p><?php esc_html_e( 'Web · Software · Social · IT', 'amz-prints' ); ?></p>
							<em><?php esc_html_e( 'Open the book →', 'amz-prints' ); ?></em>
						</div>
						<div class="printed-book__spine" aria-hidden="true"></div>
						<div class="printed-book__pages" aria-hidden="true"></div>
					</div>
				</a>
				<div class="printed-book__meta">
					<p><?php esc_html_e( 'Black & gold premium theme — websites, software, social, portfolio, process, contact QRs.', 'amz-prints' ); ?></p>
					<div class="printed-book__actions">
						<a class="btn btn--primary btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'digital' ) ); ?>"><?php esc_html_e( 'Open book', 'amz-prints' ); ?></a>
						<a class="btn btn--ghost btn--magnetic" href="<?php echo esc_url( amz_prints_catalog_url( 'digital', true ) ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Download PDF', 'amz-prints' ); ?></a>
					</div>
				</div>
			</article>
		</div>
	</div>
</section>

<?php get_footer(); ?>
