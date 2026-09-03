<?php
/**
 * Template Name: Free CV Builder
 *
 * Free online CV / resume creator with live A4 preview.
 *
 * @package AMZ_Prints
 */

get_header();
?>

<div class="cv-portal" id="cv-portal" data-cv-root>
	<div class="cv-portal__bar">
		<div class="cv-portal__bar-copy">
			<p class="cv-portal__free"><?php esc_html_e( 'Free service', 'amz-prints' ); ?></p>
			<h1><?php esc_html_e( 'Create Free CV', 'amz-prints' ); ?></h1>
			<p><?php esc_html_e( 'Build a professional A4 resume, pick a design, change colours, and download or print — no payment required.', 'amz-prints' ); ?></p>
		</div>
		<div class="cv-portal__bar-actions">
			<span class="cv-page-pill" data-cv-pagecount><?php esc_html_e( '1 page', 'amz-prints' ); ?></span>
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

<?php get_footer(); ?>
