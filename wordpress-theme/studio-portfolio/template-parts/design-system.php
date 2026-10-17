<?php
/**
 * Design System showcase
 *
 * @package Studio_Portfolio
 *
 * @var array $args Optional Elementor overrides.
 */

$args = isset( $args ) ? $args : array();

if ( ! empty( $args['colors'] ) && is_array( $args['colors'] ) ) {
	$colors = $args['colors'];
} else {
	$black = studio_get_option( 'color_black', '#1A1A1A' );
	$white = studio_get_option( 'color_white', '#FFFFFF' );
	$colors = array(
		array( 'name' => __( 'Black', 'studio-portfolio' ), 'hex' => $black, 'bg' => $black ),
		array( 'name' => __( 'Green', 'studio-portfolio' ), 'hex' => studio_get_option( 'color_green', '#059669' ), 'bg' => studio_get_option( 'color_green', '#059669' ) ),
		array( 'name' => __( 'Light', 'studio-portfolio' ), 'hex' => studio_get_option( 'color_light', '#F7FAF7' ), 'bg' => studio_get_option( 'color_light', '#F7FAF7' ) ),
		array( 'name' => __( 'White', 'studio-portfolio' ), 'hex' => $white, 'bg' => $white ),
	);
}

$show_palette    = studio_template_arg( $args, 'show_palette', '', true );
$show_components = studio_template_arg( $args, 'show_components', '', true );
?>

<section id="design-system" class="section design-system-section">
	<div class="container">
		<div class="section-header center fade-in">
			<p class="section-label"><?php echo esc_html( studio_template_arg( $args, 'ds_label', 'ds_label', 'Design System' ) ); ?></p>
			<h2 class="display-md"><?php echo esc_html( studio_template_arg( $args, 'ds_title', 'ds_title', 'Built with intention' ) ); ?></h2>
			<p class="text-muted" style="margin-top:1rem;font-size:1.125rem;">
				<?php echo esc_html( studio_template_arg( $args, 'ds_description', 'ds_description', 'Green, black, white, and light — my personal brand design system.' ) ); ?>
			</p>
		</div>

		<?php if ( $show_palette && ! empty( $colors ) ) : ?>
			<div class="fade-in">
				<h3 style="font-family:var(--font-display);font-weight:600;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.75rem;">
					<span style="width:2rem;height:2px;background:var(--color-gold);display:inline-block;"></span>
					<?php esc_html_e( 'Color Palette', 'studio-portfolio' ); ?>
				</h3>
				<div class="color-grid">
					<?php foreach ( $colors as $color ) : ?>
						<div class="color-swatch">
							<div class="color-swatch-preview" style="background:<?php echo esc_attr( $color['bg'] ); ?>;"></div>
							<div class="color-swatch-info">
								<p class="color-swatch-name"><?php echo esc_html( $color['name'] ); ?></p>
								<p class="color-swatch-hex"><?php echo esc_html( $color['hex'] ); ?></p>
							</div>
						</div>
					<?php endforeach; ?>
				</div>
			</div>
		<?php endif; ?>

		<?php if ( $show_components ) : ?>
			<div class="fade-in component-showcase" style="margin-top:3rem;">
				<div class="component-row">
					<div style="width:100%;">
						<p class="component-label"><?php esc_html_e( 'Buttons', 'studio-portfolio' ); ?></p>
						<div style="display:flex;flex-wrap:wrap;gap:0.75rem;">
							<span class="btn btn-primary btn-sm"><?php esc_html_e( 'Primary', 'studio-portfolio' ); ?></span>
							<span class="btn btn-gold btn-sm"><?php esc_html_e( 'Gold', 'studio-portfolio' ); ?></span>
							<span class="btn btn-outline btn-sm"><?php esc_html_e( 'Outline', 'studio-portfolio' ); ?></span>
						</div>
					</div>
				</div>
			</div>
		<?php endif; ?>
	</div>
</section>
