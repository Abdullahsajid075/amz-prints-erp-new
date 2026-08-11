<?php
/**
 * Mega menu — modern image cards, fully clickable
 *
 * @package AMZ_Prints
 */

$catalog = amz_prints_services_catalog();
?>
<div class="mega-menu" id="mega-menu-services">
	<div class="mega-menu__inner container">
		<div class="mega-menu__top">
			<div>
				<p class="mega-menu__eyebrow"><?php echo esc_html( amz_t( 'services' ) ); ?></p>
				<h3 class="mega-menu__title"><?php echo esc_html( amz_t( 'our_services' ) ); ?></h3>
			</div>
			<a class="btn btn--primary btn--sm" href="<?php echo esc_url( home_url( '/services/' ) ); ?>"><?php echo esc_html( amz_t( 'view_all' ) ); ?></a>
		</div>

		<div class="mega-menu__cards">
			<?php foreach ( $catalog as $cat ) : ?>
				<?php
				$cat_url = ( 'web-digital-services' === $cat['slug'] || 'it-technology-services' === $cat['slug'] )
					? home_url( '/digital-services/' )
					: amz_prints_service_section_url( $cat['slug'] );
				?>
				<article class="mega-card">
					<a class="mega-card__media" href="<?php echo esc_url( $cat_url ); ?>">
						<img src="<?php echo esc_url( $cat['image'] ); ?>" alt="<?php echo esc_attr( amz_prints_svc_label( $cat ) ); ?>" loading="lazy" width="400" height="240">
						<span class="mega-card__shade"></span>
						<span class="mega-card__name"><?php echo esc_html( amz_prints_svc_label( $cat ) ); ?></span>
					</a>
					<ul class="mega-card__links">
						<?php foreach ( array_slice( $cat['items'], 0, 5 ) as $item ) : ?>
							<li>
								<a href="<?php echo esc_url( amz_prints_service_quote_url( $item['en'] ) ); ?>">
									<?php echo esc_html( amz_prints_svc_label( $item ) ); ?>
								</a>
							</li>
						<?php endforeach; ?>
						<li>
							<a class="mega-card__more" href="<?php echo esc_url( $cat_url ); ?>">
								<?php echo esc_html( amz_t( 'view_all' ) ); ?> →
							</a>
						</li>
					</ul>
				</article>
			<?php endforeach; ?>
		</div>

		<div class="mega-menu__footer">
			<div>
				<strong><?php echo esc_html( amz_t( 'mega_cta' ) ); ?></strong>
				<p><?php echo esc_html( amz_t( 'mega_cta_sub' ) ); ?></p>
			</div>
			<div class="mega-menu__footer-actions">
				<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/digital-services/' ) ); ?>"><?php esc_html_e( 'Digital Services', 'amz-prints' ); ?></a>
				<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/quote/' ) ); ?>"><?php echo esc_html( amz_t( 'quote' ) ); ?></a>
				<a class="btn btn--ghost mega-menu__wa-btn" href="#" data-open-wa><?php echo esc_html( amz_t( 'wa_chat' ) ); ?></a>
			</div>
		</div>
	</div>
</div>
