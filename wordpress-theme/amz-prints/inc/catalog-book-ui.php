<?php
/**
 * Flip-book chrome — real book stage (no top next/prev).
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Open book shell.
 *
 * @param array $args Args.
 */
function amz_prints_flipbook_shell_open( $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'theme'    => 'print',
			'title'    => __( 'Company Profile', 'amz-prints' ),
			'subtitle' => __( 'Interactive catalog book', 'amz-prints' ),
		)
	);
	$is_digital = ( 'digital' === $args['theme'] );
	?>
	<div class="catalog-toolbar no-print catalog-toolbar--flip <?php echo $is_digital ? 'catalog-toolbar--digital' : ''; ?>">
		<div class="catalog-toolbar__inner">
			<div class="catalog-toolbar__brand">
				<strong><?php echo esc_html( $args['title'] ); ?></strong>
				<span><?php echo esc_html( $args['subtitle'] ); ?></span>
			</div>
			<div class="catalog-toolbar__actions">
				<span class="catalog-toolbar__counter" id="amz-flip-counter">1</span>
				<button type="button" class="btn btn--primary" id="amz-catalog-download"><?php esc_html_e( 'Download PDF', 'amz-prints' ); ?></button>
				<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/company-profile/' ) ); ?>"><?php esc_html_e( 'All books', 'amz-prints' ); ?></a>
			</div>
		</div>
		<p class="catalog-toolbar__hint" id="amz-catalog-status"><?php esc_html_e( 'Hover a page corner to fold · Click left or right page to turn · Feels like a real book', 'amz-prints' ); ?></p>
	</div>

	<div class="book-room book-room--wood">
		<div class="book-room__wood" aria-hidden="true"></div>
		<div class="book-desk">
			<div class="stf-book-wrap">
				<div class="stf-book" id="amz-flipbook" data-theme="<?php echo esc_attr( $args['theme'] ); ?>">
	<?php
}

/**
 * Close book shell + hidden PDF export root.
 */
function amz_prints_flipbook_shell_close() {
	?>
				</div><!-- #amz-flipbook -->
			</div>
			<p class="book-desk__hint no-print"><?php esc_html_e( 'Drag or click the page edge to flip — just like a printed catalog.', 'amz-prints' ); ?></p>
		</div>
	</div>
	<!-- Off-screen landscape sheets for reliable PDF capture -->
	<div id="amz-pdf-export" class="amz-pdf-export" aria-hidden="true"></div>
	<?php
}
