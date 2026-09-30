<?php
/**
 * Template Name: Cart
 *
 * @package AMZ_Prints
 */

get_header();
$cart = function_exists( 'amz_prints_cart_summary' ) ? amz_prints_cart_summary() : array( 'items' => array() );
?>

<section class="page-hero page-hero--compact">
	<div class="container">
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'Review items, update quantities, then checkout.', 'amz-prints' ); ?></p>
	</div>
</section>

<section class="section section--cart">
	<div class="container commerce-layout" data-amz-cart>
		<div class="commerce-main">
			<?php if ( empty( $cart['items'] ) ) : ?>
				<div class="commerce-empty">
					<p><?php esc_html_e( 'Your cart is empty.', 'amz-prints' ); ?></p>
					<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Browse products', 'amz-prints' ); ?></a>
				</div>
			<?php else : ?>
				<ul class="cart-lines">
					<?php foreach ( $cart['items'] as $item ) : ?>
						<li class="cart-line" data-product-id="<?php echo esc_attr( $item['id'] ); ?>">
							<a class="cart-line__media" href="<?php echo esc_url( $item['url'] ); ?>">
								<?php if ( ! empty( $item['image'] ) ) : ?>
									<img src="<?php echo amz_prints_product_img_src( $item['image'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>" alt="<?php echo esc_attr( $item['name'] ); ?>" loading="lazy">
								<?php else : ?>
									<span class="cart-line__letter"><?php echo esc_html( mb_substr( $item['name'], 0, 1 ) ); ?></span>
								<?php endif; ?>
							</a>
							<div class="cart-line__body">
								<a href="<?php echo esc_url( $item['url'] ); ?>"><strong><?php echo esc_html( $item['name'] ); ?></strong></a>
								<p class="cart-line__price"><?php echo esc_html( amz_prints_money( $item['price'] ) ); ?><?php echo $item['unit'] ? ' / ' . esc_html( $item['unit'] ) : ''; ?></p>
								<?php if ( empty( $item['orderable'] ) ) : ?>
									<p class="form-note"><?php esc_html_e( 'This item needs a quote — remove it or request a quote.', 'amz-prints' ); ?></p>
								<?php endif; ?>
								<div class="cart-line__qty">
									<button type="button" class="qty-btn" data-cart-qty="-1" aria-label="<?php esc_attr_e( 'Decrease', 'amz-prints' ); ?>">−</button>
									<input type="number" class="qty-input" min="<?php echo esc_attr( $item['minQuantity'] ); ?>" value="<?php echo esc_attr( $item['quantity'] ); ?>" data-cart-qty-input>
									<button type="button" class="qty-btn" data-cart-qty="1" aria-label="<?php esc_attr_e( 'Increase', 'amz-prints' ); ?>">+</button>
									<form class="cart-remove-form" method="post" action="<?php echo esc_url( home_url( '/cart/' ) ); ?>">
										<?php wp_nonce_field( 'amz_cart_remove', 'amz_cart_nonce' ); ?>
										<input type="hidden" name="amz_cart_remove" value="<?php echo esc_attr( $item['id'] ); ?>">
										<button type="submit" class="cart-line__remove" data-cart-remove><?php esc_html_e( 'Remove', 'amz-prints' ); ?></button>
									</form>
								</div>
							</div>
							<div class="cart-line__total"><?php echo esc_html( amz_prints_money( $item['lineTotal'] ) ); ?></div>
						</li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
		</div>

		<aside class="commerce-aside">
			<div class="commerce-summary">
				<h2><?php esc_html_e( 'Order summary', 'amz-prints' ); ?></h2>
				<dl class="commerce-totals" data-cart-totals>
					<div><dt><?php esc_html_e( 'Subtotal', 'amz-prints' ); ?></dt><dd data-total="subtotal"><?php echo esc_html( amz_prints_money( $cart['subtotal'] ?? 0 ) ); ?></dd></div>
					<div><dt><?php esc_html_e( 'Discount', 'amz-prints' ); ?></dt><dd data-total="discount"><?php echo esc_html( amz_prints_money( $cart['discount'] ?? 0 ) ); ?></dd></div>
					<div><dt><?php esc_html_e( 'Delivery', 'amz-prints' ); ?></dt><dd data-total="delivery"><?php esc_html_e( 'Chosen at checkout', 'amz-prints' ); ?></dd></div>
					<div class="is-grand"><dt><?php esc_html_e( 'Total', 'amz-prints' ); ?></dt><dd data-total="total"><?php echo esc_html( amz_prints_money( $cart['total'] ?? 0 ) ); ?></dd></div>
				</dl>
				<?php if ( ! empty( $cart['items'] ) ) : ?>
					<p class="form-note"><?php esc_html_e( 'Delivery is chosen at checkout: PKR 250 within 10 km, or free store pickup.', 'amz-prints' ); ?></p>
					<a class="btn btn--primary btn--block" href="<?php echo esc_url( amz_prints_checkout_url() ); ?>"><?php esc_html_e( 'Proceed to checkout', 'amz-prints' ); ?></a>
				<?php endif; ?>
				<a class="text-link" href="<?php echo esc_url( home_url( '/products/' ) ); ?>"><?php esc_html_e( 'Continue shopping', 'amz-prints' ); ?></a>
			</div>
		</aside>
	</div>
</section>

<?php get_footer(); ?>
