<?php
/**
 * Home — selected clients
 *
 * @package Studio_Portfolio
 */

$clients = studio_get_clients();
if ( empty( $clients ) ) {
	return;
}
?>

<section class="section home-clients premium-section-alt">
	<div class="container">
		<div class="section-header center">
			<p class="section-label"><?php echo esc_html( studio_get_option( 'clients_label', "Brands I've Helped Build" ) ); ?></p>
			<h2 class="display-md"><?php echo esc_html( studio_get_option( 'clients_title', 'Selected clients & industries' ) ); ?></h2>
		</div>
		<div class="clients-grid">
			<?php foreach ( $clients as $client ) : ?>
				<div class="client-card premium-card-glow">
					<h3><?php echo esc_html( $client['name'] ); ?></h3>
					<p class="client-industry"><?php echo esc_html( $client['industry'] ); ?></p>
					<p class="text-muted"><?php echo esc_html( $client['note'] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>
