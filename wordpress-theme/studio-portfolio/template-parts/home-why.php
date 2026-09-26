<?php
/**
 * Home — Why work with me
 *
 * @package Studio_Portfolio
 */

$points = studio_get_why_points();
?>

<section class="section home-why premium-section">
	<div class="container home-why-grid">
		<div>
			<p class="section-label"><?php echo esc_html( studio_get_option( 'why_label', 'Why Work With Me' ) ); ?></p>
			<h2 class="display-md"><?php echo esc_html( studio_get_option( 'why_title', 'Strategy, systems, and real-world brand applications' ) ); ?></h2>
		</div>
		<ul class="why-list">
			<?php foreach ( $points as $point ) : ?>
				<li><?php echo esc_html( $point ); ?></li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>
