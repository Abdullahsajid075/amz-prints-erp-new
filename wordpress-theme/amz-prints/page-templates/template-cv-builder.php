<?php
/**
 * Template Name: Free CV Builder
 *
 * Free online CV / resume creator with live A4 preview.
 *
 * @package AMZ_Prints
 */

$cv_back = home_url( '/create-free-cv/' );
if ( ! function_exists( 'amz_prints_customer_is_logged_in' ) || ! amz_prints_customer_is_logged_in() || ! amz_prints_customer_current_email() ) {
	$login = function_exists( 'amz_prints_customer_login_url' ) ? amz_prints_customer_login_url( $cv_back ) : home_url( '/customer-login/' );
	wp_safe_redirect( $login );
	exit;
}

$cv_email = amz_prints_customer_current_email();
$cv_saved = function_exists( 'amz_prints_customer_cv_get' ) ? amz_prints_customer_cv_get( $cv_email ) : null;
$cv_state = ( is_array( $cv_saved ) && isset( $cv_saved['state'] ) && is_array( $cv_saved['state'] ) ) ? $cv_saved['state'] : null;

get_header();
?>

<div class="cv-portal" id="cv-portal" data-cv-root>
	<div class="cv-portal__bar">
		<div class="cv-portal__bar-copy">
			<p class="cv-portal__free"><?php esc_html_e( 'Free service', 'amz-prints' ); ?></p>
			<h1><?php esc_html_e( 'Create Free CV', 'amz-prints' ); ?></h1>
			<p><?php esc_html_e( 'Fill the CV and it stays on this account. Use Show on CV if you want a photo, or leave it off.', 'amz-prints' ); ?></p>
		</div>
		<div class="cv-portal__bar-actions">
			<span class="cv-page-pill" data-cv-pagecount><?php esc_html_e( '1 page', 'amz-prints' ); ?></span>
			<span class="cv-save-status" data-cv-status><?php echo $cv_state ? esc_html__( 'Saved on your account', 'amz-prints' ) : esc_html__( 'Not saved yet', 'amz-prints' ); ?></span>
			<button type="button" class="btn btn--ghost btn--sm" data-cv-action="save"><?php esc_html_e( 'Save CV', 'amz-prints' ); ?></button>
			<button type="button" class="btn btn--ghost btn--sm" data-cv-action="preview"><?php esc_html_e( 'Preview CV', 'amz-prints' ); ?></button>
			<button type="button" class="btn btn--ghost btn--sm" data-cv-action="print"><?php esc_html_e( 'Print CV', 'amz-prints' ); ?></button>
			<button type="button" class="btn btn--primary btn--sm" data-cv-action="download"><?php esc_html_e( 'Download CV', 'amz-prints' ); ?></button>
			<button type="button" class="btn btn--ghost btn--sm" data-cv-action="reset"><?php esc_html_e( 'Start Again', 'amz-prints' ); ?></button>
		</div>
	</div>

	<div class="cv-portal__layout">
		<aside class="cv-portal__editor" id="cv-editor" aria-label="<?php esc_attr_e( 'CV information', 'amz-prints' ); ?>"></aside>
		<section class="cv-portal__preview" aria-label="<?php esc_attr_e( 'Live CV preview', 'amz-prints' ); ?>">
			<div class="cv-preview-scroll">
				<div class="cv-preview-scale" id="cv-scale">
					<div class="cv-pages" id="cv-pages"></div>
				</div>
			</div>
		</section>
	</div>
</div>

<div class="cv-lightbox" id="cv-lightbox" hidden>
	<div class="cv-lightbox__panel">
		<div class="cv-lightbox__top">
			<strong><?php esc_html_e( 'CV preview', 'amz-prints' ); ?></strong>
			<button type="button" class="btn btn--ghost btn--sm" data-cv-action="close-preview"><?php esc_html_e( 'Close', 'amz-prints' ); ?></button>
		</div>
		<div class="cv-lightbox__body" id="cv-lightbox-body"></div>
	</div>
</div>

<?php if ( $cv_state ) : ?>
<script type="application/json" id="amz-cv-saved"><?php echo wp_json_encode( $cv_state, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></script>
<?php endif; ?>
<?php get_footer(); ?>
