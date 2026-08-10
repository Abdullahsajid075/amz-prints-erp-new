<?php
/**
 * Promotional popup — Customizer controlled.
 *
 * @package AMZ_Prints
 */

$enabled_raw = get_theme_mod( 'amz_popup_enabled', true );
$enabled     = ! ( false === $enabled_raw || 0 === $enabled_raw || '0' === $enabled_raw );
if ( ! $enabled ) {
	return;
}

$image_id  = absint( amz_prints_mod( 'amz_popup_image', 0 ) );
$image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'large' ) : '';
if ( ! $image_url ) {
	$image_url = trim( (string) amz_prints_mod( 'amz_popup_image_url', '' ) );
}
if ( ! $image_url ) {
	$image_url = 'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=900&q=80';
}

$show = false;
if ( (bool) get_theme_mod( 'amz_popup_page_all', false ) ) {
	$show = true;
}
// Homepage always eligible when enabled (fixes front-page detection + unchecked flags).
if ( is_front_page() || is_home() || is_page( 'home' ) ) {
	$show = true;
}
if ( (bool) get_theme_mod( 'amz_popup_page_products', false ) && ( is_page( 'products' ) || is_page_template( 'page-templates/template-products.php' ) ) ) {
	$show = true;
}
if ( (bool) get_theme_mod( 'amz_popup_page_services', false ) && ( is_page( 'services' ) || is_page_template( 'page-templates/template-services.php' ) ) ) {
	$show = true;
}
$force = isset( $_GET['show_popup'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
if ( $force ) {
	$show = true;
}
if ( ! $show ) {
	return;
}

$style   = sanitize_key( (string) amz_prints_mod( 'amz_popup_style', 'centered' ) );
$allowed = array( 'centered', 'banner', 'corner', 'fullscreen', 'card' );
if ( ! in_array( $style, $allowed, true ) ) {
	$style = 'centered';
}
$show_close  = (bool) get_theme_mod( 'amz_popup_show_close', true );
$link        = trim( (string) amz_prints_mod( 'amz_popup_link', '' ) );
$delay       = max( 0, (int) amz_prints_mod( 'amz_popup_delay', 700 ) );
$cookie_days = max( 0, (int) amz_prints_mod( 'amz_popup_cookie_days', 1 ) );
?>
<div
	class="amz-popup amz-popup--<?php echo esc_attr( $style ); ?>"
	id="amz-promo-popup"
	data-popup
	data-delay="<?php echo esc_attr( (string) $delay ); ?>"
	data-cookie-days="<?php echo esc_attr( (string) $cookie_days ); ?>"
	data-force="<?php echo $force ? '1' : '0'; ?>"
	role="dialog"
	aria-modal="true"
	aria-label="<?php esc_attr_e( 'Promotion', 'amz-prints' ); ?>"
	aria-hidden="true"
>
	<div class="amz-popup__backdrop" data-popup-close tabindex="-1"></div>
	<div class="amz-popup__dialog">
		<?php if ( $show_close ) : ?>
			<button type="button" class="amz-popup__close" data-popup-close aria-label="<?php esc_attr_e( 'Close', 'amz-prints' ); ?>">×</button>
		<?php endif; ?>
		<?php if ( $link ) : ?>
			<a class="amz-popup__media" href="<?php echo esc_url( $link ); ?>">
				<img src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?>">
			</a>
		<?php else : ?>
			<div class="amz-popup__media">
				<img src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?>">
			</div>
		<?php endif; ?>
	</div>
</div>
<script>
(function () {
  var root = document.getElementById('amz-promo-popup');
  if (!root || root.getAttribute('data-popup-bound') === '1') return;
  var key = 'amz_promo_popup_v301';
  ['amz_promo_popup_dismissed', 'amz_promo_popup_dismissed_v254'].forEach(function (old) {
    try { sessionStorage.removeItem(old); } catch (e) {}
    document.cookie = old + '=; path=/; max-age=0; SameSite=Lax';
  });
  var force = root.getAttribute('data-force') === '1' || /show_popup=1/.test(location.search);
  var delay = parseInt(root.getAttribute('data-delay') || '700', 10) || 700;
  var days = parseInt(root.getAttribute('data-cookie-days') || '1', 10);
  if (isNaN(days) || days < 0) days = 1;
  function readCookie(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  var dismissed = false;
  try { dismissed = !force && (readCookie(key) === '1' || sessionStorage.getItem(key) === '1'); }
  catch (e) { dismissed = !force && readCookie(key) === '1'; }
  if (dismissed) return;
  root.setAttribute('data-popup-bound', '1');
  function open() {
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('popup-open');
    root.style.opacity = '1';
    root.style.visibility = 'visible';
    root.style.pointerEvents = 'auto';
    root.style.zIndex = '10050';
  }
  function close() {
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('popup-open');
    root.style.opacity = '';
    root.style.visibility = '';
    root.style.pointerEvents = '';
    if (!force) {
      try { sessionStorage.setItem(key, '1'); } catch (e) {}
      if (days > 0) {
        document.cookie = key + '=1; path=/; max-age=' + (days * 86400) + '; SameSite=Lax';
      }
    }
  }
  root.querySelectorAll('[data-popup-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('is-open')) close();
  });
  setTimeout(open, delay);
})();
</script>
