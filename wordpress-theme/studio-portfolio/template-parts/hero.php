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

$hero_image_id = studio_get_option( 'hero_card_image', '' );
$show_card     = studio_get_option( 'hero_show_card', true );
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
				<span class="hero-title-line1"><?php echo esc_html( studio_get_option( 'hero_title_line1', 'Designing' ) ); ?></span><br>
				<span class="text-gradient hero-title-line2"><?php echo esc_html( studio_get_option( 'hero_title_line2', 'experiences' ) ); ?></span><br>
				<span class="hero-title-line3"><?php echo esc_html( studio_get_option( 'hero_title_line3', 'that inspire' ) ); ?></span>
			</h1>

			<p class="hero-desc"><?php echo esc_html( studio_get_option( 'hero_description', "I'm a multidisciplinary designer crafting bold brand identities, intuitive interfaces, and visual systems that leave lasting impressions." ) ); ?></p>

			<div class="hero-actions">
				<a href="<?php echo esc_url( studio_get_option( 'hero_btn1_url', '#work' ) ); ?>" class="btn btn-primary btn-lg">
					<?php echo esc_html( studio_get_option( 'hero_btn1_text', 'View My Work' ) ); ?> →
				</a>
				<a href="<?php echo esc_url( studio_get_option( 'hero_btn2_url', '#contact' ) ); ?>" class="btn btn-outline btn-lg">
					<?php echo esc_html( studio_get_option( 'hero_btn2_text', 'Get in Touch' ) ); ?>
				</a>
			</div>
		</div>

		<?php if ( $show_card ) : ?>
			<?php
			$card_title = '';
			if ( $latest->have_posts() ) {
				$latest->the_post();
				$card_title = get_the_title();
				wp_reset_postdata();
			}
			?>
			<div class="hero-card glass">
				<div class="hero-card-preview">
					<?php if ( $hero_image_id ) : ?>
						<?php echo wp_get_attachment_image( $hero_image_id, 'portfolio-card' ); ?>
					<?php elseif ( $latest->have_posts() ) : ?>
						<?php $latest->the_post(); ?>
						<?php if ( has_post_thumbnail() ) : ?>
							<?php the_post_thumbnail( 'portfolio-card' ); ?>
						<?php else : ?>
							<span>Aa</span>
						<?php endif; ?>
						<?php wp_reset_postdata(); ?>
					<?php else : ?>
						<span>Aa</span>
					<?php endif; ?>
				</div>
				<p class="section-label" style="margin-bottom:0.25rem;"><?php echo esc_html( studio_get_option( 'hero_card_label', 'Latest Project' ) ); ?></p>
				<?php if ( $card_title ) : ?>
					<p style="font-family:var(--font-display);font-weight:600;font-size:1.125rem;"><?php echo esc_html( $card_title ); ?></p>
				<?php endif; ?>
			</div>
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
