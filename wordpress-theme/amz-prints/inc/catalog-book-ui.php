<?php
/**
 * Flip-book chrome for catalog templates.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Open flip-book shell (toolbar + stage).
 *
 * @param array $args Theme label, title, etc.
 */
function amz_prints_flipbook_shell_open( $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'theme'   => 'print', // print|digital
			'title'   => __( 'Company Profile', 'amz-prints' ),
			'subtitle'=> __( 'Landscape A4 catalog book', 'amz-prints' ),
		)
	);
	$theme_class = 'print' === $args['theme'] ? 'catalog-theme-print' : 'catalog-theme-digital';
	?>
	<div class="catalog-toolbar no-print catalog-toolbar--flip <?php echo 'digital' === $args['theme'] ? 'catalog-toolbar--digital' : ''; ?>">
		<div class="catalog-toolbar__inner">
			<div class="catalog-toolbar__brand">
				<strong><?php echo esc_html( $args['title'] ); ?></strong>
				<span><?php echo esc_html( $args['subtitle'] ); ?></span>
			</div>
			<div class="catalog-toolbar__actions">
				<button type="button" class="btn btn--ghost" id="amz-flip-prev" aria-label="<?php esc_attr_e( 'Previous page', 'amz-prints' ); ?>">‹ Prev</button>
				<span class="catalog-toolbar__counter" id="amz-flip-counter">1 / 1</span>
				<button type="button" class="btn btn--ghost" id="amz-flip-next" aria-label="<?php esc_attr_e( 'Next page', 'amz-prints' ); ?>">Next ›</button>
				<button type="button" class="btn btn--primary" id="amz-catalog-download"><?php esc_html_e( 'Download PDF', 'amz-prints' ); ?></button>
				<button type="button" class="btn btn--ghost" id="amz-catalog-print"><?php esc_html_e( 'Print', 'amz-prints' ); ?></button>
				<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/company-profile/' ) ); ?>"><?php esc_html_e( 'All books', 'amz-prints' ); ?></a>
			</div>
		</div>
		<p class="catalog-toolbar__hint" id="amz-catalog-status"><?php esc_html_e( 'Click the left side of the book for previous page, right side for next. Or use arrows / swipe.', 'amz-prints' ); ?></p>
	</div>

	<div class="book-room no-print-bg">
		<div class="book-room__glow book-room__glow--<?php echo esc_attr( $args['theme'] ); ?>" aria-hidden="true"></div>
		<div class="book-desk">
			<div class="flipbook-shell" id="amz-flipbook" data-theme="<?php echo esc_attr( $args['theme'] ); ?>">
				<div class="flipbook-shell__cover flipbook-shell__cover--<?php echo esc_attr( $args['theme'] ); ?>" aria-hidden="true">
					<span class="flipbook-shell__spine"></span>
				</div>
				<div class="flipbook-shell__pages" id="amz-catalog-book">
					<button type="button" class="flipbook-hit flipbook-hit--left" id="amz-flip-hit-left" aria-label="<?php esc_attr_e( 'Previous page', 'amz-prints' ); ?>"></button>
					<button type="button" class="flipbook-hit flipbook-hit--right" id="amz-flip-hit-right" aria-label="<?php esc_attr_e( 'Next page', 'amz-prints' ); ?>"></button>
	<?php
}

/**
 * Close flip-book shell.
 */
function amz_prints_flipbook_shell_close() {
	?>
				</div><!-- .flipbook-shell__pages -->
				<div class="flipbook-shell__shadow" aria-hidden="true"></div>
			</div><!-- .flipbook-shell -->
			<p class="book-desk__hint no-print"><?php esc_html_e( 'Tip: Left click zone = previous · Right click zone = next · Keyboard ← →', 'amz-prints' ); ?></p>
		</div>
	</div>
	<?php
}
