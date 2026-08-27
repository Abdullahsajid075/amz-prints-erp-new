<?php
/**
 * Hero section
 *
 * @package Studio_Portfolio
 */

$latest = new WP_Query( array(
	'post_type'      => 'portfolio',
	'posts_per_page' => 1,
	'orderby'        => 'menu_order date',
	'order'          => 'ASC',
) );
?>

<section class="hero grid-bg">
	<div class="hero-glow-blue"></div>
	<div class="hero-glow-gold"></div>

	<div class="container">
		<div class="hero-content fade-in">
			<div class="hero-status">
				<span class="status-dot"></span>
				<span class="section-label" style="margin:0;"><?php echo esc_html( studio_get_option( 'hero_status', 'Available for projects' ) ); ?></span>
			</div>

			<h1 class="hero-title display-xl">
				<?php echo esc_html( studio_get_option( 'hero_title_line1', 'Designing' ) ); ?><br>
				<span class="text-gradient"><?php echo esc_html( studio_get_option( 'hero_title_line2', 'experiences' ) ); ?></span><br>
				<?php echo esc_html( studio_get_option( 'hero_title_line3', 'that inspire' ) ); ?>
			</h1>

			<p class="hero-desc">
				<?php echo esc_html( studio_get_option( 'hero_description', "I'm a multidisciplinary designer crafting bold brand identities, intuitive interfaces, and visual systems that leave lasting impressions." ) ); ?>
			</p>

			<div class="hero-actions">
				<a href="#work" class="btn btn-primary btn-lg"><?php esc_html_e( 'View My Work', 'studio-portfolio' ); ?> →</a>
				<a href="#contact" class="btn btn-outline btn-lg"><?php esc_html_e( 'Get in Touch', 'studio-portfolio' ); ?></a>
			</div>
		</div>

		<?php if ( $latest->have_posts() ) : $latest->the_post(); ?>
			<div class="hero-card glass">
				<div class="hero-card-preview">
					<?php if ( has_post_thumbnail() ) : ?>
						<?php the_post_thumbnail( 'portfolio-card' ); ?>
					<?php else : ?>
						<span>Aa</span>
					<?php endif; ?>
				</div>
				<p class="section-label" style="margin-bottom:0.25rem;"><?php esc_html_e( 'Latest Project', 'studio-portfolio' ); ?></p>
				<p style="font-family:var(--font-display);font-weight:600;font-size:1.125rem;"><?php the_title(); ?></p>
			</div>
			<?php wp_reset_postdata(); ?>
		<?php endif; ?>

		<div class="scroll-indicator">
			<span><?php esc_html_e( 'Scroll', 'studio-portfolio' ); ?></span>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
		</div>
	</div>
</section>

<style>
.fade-in { opacity: 0; transform: translateY(30px); transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1); }
.fade-in.visible { opacity: 1; transform: translateY(0); }
</style>
