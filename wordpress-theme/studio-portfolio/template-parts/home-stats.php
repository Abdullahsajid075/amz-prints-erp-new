<?php
/**
 * Home — Stats strip
 *
 * @package Studio_Portfolio
 */

$stats = array(
	array(
		'value' => studio_get_option( 'stat_projects', '80+' ),
		'label' => studio_get_option( 'stat_projects_label', __( 'Projects', 'studio-portfolio' ) ),
	),
	array(
		'value' => studio_get_option( 'stat_clients', '45+' ),
		'label' => studio_get_option( 'stat_clients_label', __( 'Happy Clients', 'studio-portfolio' ) ),
	),
	array(
		'value' => studio_get_option( 'stat_experience', '5+' ),
		'label' => studio_get_option( 'stat_experience_label', __( 'Years Experience', 'studio-portfolio' ) ),
	),
	array(
		'value' => studio_get_option( 'stat_awards', '8' ),
		'label' => studio_get_option( 'stat_awards_label', __( 'Awards', 'studio-portfolio' ) ),
	),
);
?>

<section class="home-stats-strip" aria-label="<?php esc_attr_e( 'Highlights', 'studio-portfolio' ); ?>">
	<div class="container">
		<div class="home-stats-grid fade-in">
			<?php foreach ( $stats as $stat ) : ?>
				<div class="home-stat-item">
					<span class="home-stat-value"><?php echo esc_html( $stat['value'] ); ?></span>
					<span class="home-stat-label"><?php echo esc_html( $stat['label'] ); ?></span>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>
