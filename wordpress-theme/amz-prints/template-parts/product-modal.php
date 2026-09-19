<?php
/**
 * Product detail modal (ERP products).
 *
 * @package AMZ_Prints
 */
?>
<div class="product-modal" id="amz-product-modal" data-product-modal aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="amz-product-modal-title">
	<div class="product-modal__backdrop" data-product-modal-close tabindex="-1"></div>
	<div class="product-modal__dialog">
		<button type="button" class="product-modal__close" data-product-modal-close aria-label="<?php esc_attr_e( 'Close', 'amz-prints' ); ?>">×</button>
		<div class="product-modal__grid">
			<div class="product-modal__gallery">
				<div class="product-modal__main">
					<img src="" alt="" data-pm-image>
					<div class="product-modal__placeholder" data-pm-placeholder hidden aria-hidden="true"><span data-pm-letter></span></div>
				</div>
				<div class="product-modal__thumbs" data-pm-thumbs></div>
			</div>
			<div class="product-modal__info">
				<p class="product-modal__cat" data-pm-category></p>
				<h2 id="amz-product-modal-title" data-pm-title></h2>
				<p class="product-modal__price" data-pm-price></p>
				<p class="product-modal__desc" data-pm-desc></p>
				<ul class="product-modal__meta">
					<li data-pm-row="material" hidden><strong><?php esc_html_e( 'Material', 'amz-prints' ); ?>:</strong> <span data-pm-material></span></li>
					<li data-pm-row="size" hidden><strong><?php esc_html_e( 'Size', 'amz-prints' ); ?>:</strong> <span data-pm-size></span></li>
					<li data-pm-row="unit" hidden><strong><?php esc_html_e( 'Unit', 'amz-prints' ); ?>:</strong> <span data-pm-unit></span></li>
					<li><strong><?php esc_html_e( 'Min. qty', 'amz-prints' ); ?>:</strong> <span data-pm-min>1</span></li>
				</ul>
				<div class="product-modal__actions" data-pm-actions>
					<div class="cart-line__qty">
						<button type="button" class="qty-btn" data-pm-qty="-1">−</button>
						<input type="number" class="qty-input" value="1" min="1" data-pm-qty-input>
						<button type="button" class="qty-btn" data-pm-qty="1">+</button>
					</div>
					<button type="button" class="btn btn--primary" data-pm-add-cart><?php esc_html_e( 'Add to cart', 'amz-prints' ); ?></button>
					<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/cart/' ) ); ?>"><?php esc_html_e( 'View cart', 'amz-prints' ); ?></a>
				</div>
				<p class="form-note" data-pm-quote hidden>
					<?php esc_html_e( 'This product needs a custom quote.', 'amz-prints' ); ?>
					<a class="btn btn--primary btn--sm" data-pm-quote-link href="<?php echo esc_url( home_url( '/quote/' ) ); ?>"><?php esc_html_e( 'Get a Quote', 'amz-prints' ); ?></a>
				</p>
				<p class="form-note" data-pm-feedback hidden></p>
			</div>
		</div>
	</div>
</div>
