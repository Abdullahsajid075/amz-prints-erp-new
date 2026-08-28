<?php
/**
 * Marquee section
 *
 * @package Studio_Portfolio
 *
 * @var array $args {
 *     Optional overrides (Elementor widget or shortcode).
 *
 *     @type array  $items       Marquee text items.
 *     @type string $text_color  Text color hex.
 *     @type string $sep_color   Separator color hex.
 *     @type string $bg_color    Background color hex.
 * }
 */

$items = isset( $args['items'] ) ? $args['items'] : studio_get_marquee_items();
if ( empty( $items ) ) {
	return;
}

$text_color = isset( $args['text_color'] ) ? $args['text_color'] : studio_get_option( 'marquee_text_color', '#B8B8B8' );
$sep_color  = isset( $args['sep_color'] ) ? $args['sep_color'] : studio_get_option( 'marquee_sep_color', '#059669' );
$bg_color   = isset( $args['bg_color'] ) ? $args['bg_color'] : studio_get_option( 'marquee_bg_color', '#F7FAF7' );

$section_style = sprintf(
	'--marquee-text-color:%1$s;--marquee-sep-color:%2$s;--marquee-bg-color:%3$s;background:%3$s;',
	esc_attr( $text_color ),
	esc_attr( $sep_color ),
	esc_attr( $bg_color )
);
?>

<section class="marquee-section" aria-hidden="true" style="<?php echo esc_attr( $section_style ); ?>">
	<div class="marquee-track">
		<?php for ( $i = 0; $i < 2; $i++ ) : ?>
			<?php foreach ( $items as $item ) : ?>
				<span class="marquee-item" style="color:<?php echo esc_attr( $text_color ); ?>;">
					<?php echo esc_html( $item ); ?>
					<span class="marquee-sep" style="color:<?php echo esc_attr( $sep_color ); ?>;">✦</span>
				</span>
			<?php endforeach; ?>
		<?php endfor; ?>
	</div>
</section>
