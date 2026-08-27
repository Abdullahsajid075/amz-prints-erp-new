<?php
/**
 * Design System showcase
 *
 * @package Studio_Portfolio
 */

$black = studio_get_option( 'color_black', '#0A0A0F' );
$blue  = studio_get_option( 'color_blue', '#2563EB' );
$gold  = studio_get_option( 'color_gold', '#D4AF37' );
$white = studio_get_option( 'color_white', '#FFFFFF' );
?>

<section id="design-system" class="section design-system-section">
	<div class="container">
		<div class="section-header center fade-in">
			<p class="section-label"><?php echo esc_html( studio_get_option( 'ds_label', 'Design System' ) ); ?></p>
			<h2 class="display-md"><?php echo esc_html( studio_get_option( 'ds_title', 'Built with intention' ) ); ?></h2>
			<p class="text-muted" style="margin-top:1rem;font-size:1.125rem;">
				<?php echo esc_html( studio_get_option( 'ds_description', 'Blue, black, white, and gold — a token-based system for consistency and craft.' ) ); ?>
			</p>
		</div>

		<div class="fade-in">
			<h3 style="font-family:var(--font-display);font-weight:600;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.75rem;">
				<span style="width:2rem;height:2px;background:var(--color-gold);display:inline-block;"></span>
				<?php esc_html_e( 'Color Palette', 'studio-portfolio' ); ?>
			</h3>
			<div class="color-grid">
				<?php
				$colors = array(
					array( 'name' => __( 'Black', 'studio-portfolio' ), 'hex' => $black, 'bg' => $black ),
					array( 'name' => __( 'Blue', 'studio-portfolio' ), 'hex' => $blue, 'bg' => $blue ),
					array( 'name' => __( 'White', 'studio-portfolio' ), 'hex' => $white, 'bg' => $white ),
					array( 'name' => __( 'Gold', 'studio-portfolio' ), 'hex' => $gold, 'bg' => $gold ),
				);
				foreach ( $colors as $color ) :
					?>
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
	</div>
</section>
