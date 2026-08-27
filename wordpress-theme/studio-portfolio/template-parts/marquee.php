<?php
/**
 * Marquee section
 *
 * @package Studio_Portfolio
 */

$items = array(
	'Brand Identity',
	'UI/UX Design',
	'Design Systems',
	'Packaging',
	'Art Direction',
	'Motion Design',
	'Typography',
	'Visual Identity',
);
$items = apply_filters( 'studio_marquee_items', $items );
?>

<section class="marquee-section" aria-hidden="true">
	<div class="marquee-track">
		<?php for ( $i = 0; $i < 2; $i++ ) : ?>
			<?php foreach ( $items as $item ) : ?>
				<span class="marquee-item">
					<?php echo esc_html( $item ); ?>
					<span class="marquee-sep">✦</span>
				</span>
			<?php endforeach; ?>
		<?php endfor; ?>
	</div>
</section>
