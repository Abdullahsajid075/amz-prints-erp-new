<?php
/**
 * Company profile catalog helpers + download CTA.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Company profile catalog page URL.
 *
 * @param bool $download Append ?download=1 for auto landscape PDF save.
 * @return string
 */
function amz_prints_company_profile_url( $download = false ) {
	$url = home_url( '/company-profile/' );
	if ( $download ) {
		$url = add_query_arg( 'download', '1', $url );
	}
	return $url;
}

/**
 * QR image URL (external generator — no PHP QR lib required).
 *
 * @param string $data Payload (URL / text).
 * @param int    $size Pixel size.
 * @return string
 */
function amz_prints_qr_url( $data, $size = 220 ) {
	$data = rawurlencode( (string) $data );
	$size = max( 80, min( 400, (int) $size ) );
	return 'https://api.qrserver.com/v1/create-qr-code/?size=' . $size . 'x' . $size . '&margin=8&data=' . $data;
}

/**
 * Render download company catalog button.
 *
 * @param array $args Optional class, label, print.
 */
function amz_prints_catalog_download_button( $args = array() ) {
	$args  = wp_parse_args(
		$args,
		array(
			'class'    => 'btn btn--primary btn--magnetic',
			'label'    => __( 'Download Company Profile PDF', 'amz-prints' ),
			'download' => true,
			'print'    => true, // legacy alias → download
			'size'     => '',
		)
	);
	$class = $args['class'];
	if ( $args['size'] ) {
		$class .= ' ' . $args['size'];
	}
	$auto = ! empty( $args['download'] ) || ! empty( $args['print'] );
	$url  = amz_prints_company_profile_url( $auto );
	printf(
		'<a class="%1$s" href="%2$s" target="_blank" rel="noopener noreferrer" data-catalog-download>%3$s</a>',
		esc_attr( $class ),
		esc_url( $url ),
		esc_html( $args['label'] )
	);
}

/**
 * Compact catalog promo strip (used on marketing pages).
 *
 * @param string $context home|services|digital.
 */
function amz_prints_catalog_promo( $context = 'home' ) {
	$copy = array(
		'home'     => __( 'Get our full company profile — big headings, every service with mockups, digital details, and contact QRs. Downloads as a landscape A4 PDF automatically.', 'amz-prints' ),
		'services' => __( 'Download the complete landscape AMZ company catalog — every service category, portfolio mockups, and contact details.', 'amz-prints' ),
		'digital'  => __( 'Download our landscape company profile PDF covering print + digital capabilities, why choose us, and WhatsApp / website QR codes.', 'amz-prints' ),
	);
	$text = isset( $copy[ $context ] ) ? $copy[ $context ] : $copy['home'];
	?>
	<section class="section catalog-promo reveal" data-reveal>
		<div class="container catalog-promo__band">
			<div class="catalog-promo__copy">
				<p class="eyebrow"><?php esc_html_e( 'Company catalog', 'amz-prints' ); ?></p>
				<h2><?php esc_html_e( 'Download our Company Profile', 'amz-prints' ); ?></h2>
				<p><?php echo esc_html( $text ); ?></p>
			</div>
			<div class="catalog-promo__actions">
				<?php
				amz_prints_catalog_download_button(
					array(
						'class'    => 'btn btn--primary btn--lg btn--magnetic',
						'label'    => __( 'Download PDF Catalog', 'amz-prints' ),
						'download' => true,
					)
				);
				?>
				<a class="btn btn--ghost btn--lg btn--magnetic" href="<?php echo esc_url( amz_prints_company_profile_url( false ) ); ?>">
					<?php esc_html_e( 'Preview catalog', 'amz-prints' ); ?>
				</a>
			</div>
		</div>
	</section>
	<?php
}
