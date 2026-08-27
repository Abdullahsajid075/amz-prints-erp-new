<?php
/**
 * Design System showcase
 *
 * @package Studio_Portfolio
 */
?>

<section id="design-system" class="section design-system-section">
	<div class="container">
		<div class="section-header center fade-in">
			<p class="section-label"><?php esc_html_e( 'Design System', 'studio-portfolio' ); ?></p>
			<h2 class="display-md"><?php esc_html_e( 'Built with intention', 'studio-portfolio' ); ?></h2>
			<p class="text-muted" style="margin-top:1rem;font-size:1.125rem;">
				<?php esc_html_e( 'Blue, black, white, and gold — a token-based system for consistency and craft.', 'studio-portfolio' ); ?>
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
					array( 'name' => 'Black', 'hex' => '#0A0A0F', 'bg' => '#0A0A0F' ),
					array( 'name' => 'Blue', 'hex' => '#2563EB', 'bg' => '#2563EB' ),
					array( 'name' => 'Blue Light', 'hex' => '#3B82F6', 'bg' => '#3B82F6' ),
					array( 'name' => 'White', 'hex' => '#FFFFFF', 'bg' => '#FFFFFF' ),
					array( 'name' => 'Gold', 'hex' => '#D4AF37', 'bg' => '#D4AF37' ),
					array( 'name' => 'Gold Light', 'hex' => '#F5C542', 'bg' => '#F5C542' ),
					array( 'name' => 'Muted', 'hex' => '#94A3B8', 'bg' => '#94A3B8' ),
					array( 'name' => 'Elevated', 'hex' => '#12121A', 'bg' => '#12121A' ),
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

		<div class="fade-in" style="margin-top:3rem;">
			<h3 style="font-family:var(--font-display);font-weight:600;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.75rem;">
				<span style="width:2rem;height:2px;background:var(--color-gold);display:inline-block;"></span>
				<?php esc_html_e( 'Typography', 'studio-portfolio' ); ?>
			</h3>
			<div class="type-grid">
				<div class="type-sample">
					<p class="section-label" style="margin-bottom:0.5rem;">Display</p>
					<p style="font-family:var(--font-display);font-size:2rem;font-weight:800;margin-bottom:0.5rem;">Syne</p>
					<p style="font-family:var(--font-display);font-size:1.5rem;font-weight:700;">Design Bold</p>
				</div>
				<div class="type-sample">
					<p class="section-label" style="margin-bottom:0.5rem;">Body</p>
					<p style="font-size:1.25rem;margin-bottom:0.5rem;">DM Sans</p>
					<p style="font-size:1.125rem;">Clean & readable body text</p>
				</div>
				<div class="type-sample">
					<p class="section-label" style="margin-bottom:0.5rem;">Mono</p>
					<p style="font-family:var(--font-mono);font-size:1.25rem;">JetBrains Mono</p>
					<p style="font-family:var(--font-mono);font-size:0.875rem;color:var(--color-gold);">LABEL_TEXT</p>
				</div>
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
			<div class="component-row">
				<div>
					<p class="component-label"><?php esc_html_e( 'Badges', 'studio-portfolio' ); ?></p>
					<div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
						<span class="badge"><?php esc_html_e( 'Default', 'studio-portfolio' ); ?></span>
						<span class="badge badge-gold"><?php esc_html_e( 'Gold', 'studio-portfolio' ); ?></span>
						<span class="badge badge-blue"><?php esc_html_e( 'Blue', 'studio-portfolio' ); ?></span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
