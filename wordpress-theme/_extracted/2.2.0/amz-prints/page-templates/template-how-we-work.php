<?php
/**
 * Template Name: How We Work
 *
 * @package AMZ_Prints
 */

get_header();

$steps = array(
	array(
		'num'   => '01',
		'title' => 'Customer Care First',
		'text'  => 'You call, WhatsApp, or walk in. Our front desk listens carefully, notes your needs, and opens a clear job brief — no guessing, no confusion.',
		'icon'  => 'headset',
		'tone'  => 'care',
	),
	array(
		'num'   => '02',
		'title' => 'Quote & Confirmation',
		'text'  => 'We share transparent pricing, timeline, and finish options. Once you approve, your order is logged in our system with a unique tracking ID.',
		'icon'  => 'file',
		'tone'  => 'quote',
	),
	array(
		'num'   => '03',
		'title' => 'Design & Proof',
		'text'  => 'If you need design help, our team crafts artwork. You review a digital (or hard) proof so color, size, and layout are locked before press.',
		'icon'  => 'pen',
		'tone'  => 'design',
	),
	array(
		'num'   => '04',
		'title' => 'Production Floor',
		'text'  => 'Jobs move through printing, cutting, finishing, and QC. Supervisors check quality at each station so every piece matches the approved proof.',
		'icon'  => 'printer',
		'tone'  => 'press',
	),
	array(
		'num'   => '05',
		'title' => 'Live Project Tracking',
		'text'  => 'Track your order anytime with your Order ID. Status updates move from Received → In Design → Printing → Finishing → Ready → Delivered.',
		'icon'  => 'track',
		'tone'  => 'track',
	),
	array(
		'num'   => '06',
		'title' => 'Delivery & Follow-up',
		'text'  => 'Pickup or delivery — packed and labeled. We confirm you’re happy and stay available for reprints, future campaigns, and support.',
		'icon'  => 'truck',
		'tone'  => 'deliver',
	),
);
?>

<section class="page-hero">
	<div class="container">
		<p class="page-hero__brand"><?php echo esc_html( amz_prints_mod( 'amz_company_name', 'AMZ Prints' ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead"><?php esc_html_e( 'From first call to final delivery — a clear mechanism built around service, quality, and live tracking.', 'amz-prints' ); ?></p>
	</div>
</section>

<section class="section">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<h2><?php esc_html_e( 'Our working mechanism', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Every job follows the same reliable path so you always know what happens next.', 'amz-prints' ); ?></p>
		</header>

		<div class="work-flow">
			<?php foreach ( $steps as $i => $step ) : ?>
				<article class="work-step work-step--<?php echo esc_attr( $step['tone'] ); ?> reveal" data-reveal>
					<div class="work-step__visual" aria-hidden="true">
						<div class="work-step__scene work-step__scene--<?php echo esc_attr( $step['tone'] ); ?>">
							<span class="work-step__icon"><?php echo amz_prints_work_icon( $step['icon'] ); // phpcs:ignore ?></span>
						</div>
					</div>
					<div class="work-step__copy">
						<span class="work-step__num"><?php echo esc_html( $step['num'] ); ?></span>
						<h3><?php echo esc_html( $step['title'] ); ?></h3>
						<p><?php echo esc_html( $step['text'] ); ?></p>
					</div>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section class="section section--muted">
	<div class="container">
		<header class="section-head reveal" data-reveal>
			<h2><?php esc_html_e( 'What you can expect', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Support pillars that keep every project moving smoothly.', 'amz-prints' ); ?></p>
		</header>
		<div class="pillar-grid">
			<article class="pillar-card reveal" data-reveal>
				<div class="pillar-card__art pillar-card__art--cs" aria-hidden="true"></div>
				<h3><?php esc_html_e( 'Customer Service Desk', 'amz-prints' ); ?></h3>
				<p><?php esc_html_e( 'Friendly staff for walk-ins, calls, and WhatsApp — quick answers on pricing, files, and timelines.', 'amz-prints' ); ?></p>
			</article>
			<article class="pillar-card reveal" data-reveal>
				<div class="pillar-card__art pillar-card__art--track" aria-hidden="true"></div>
				<h3><?php esc_html_e( 'Project Tracking', 'amz-prints' ); ?></h3>
				<p><?php esc_html_e( 'Every order gets an ID. Check status online anytime — no need to chase updates.', 'amz-prints' ); ?></p>
			</article>
			<article class="pillar-card reveal" data-reveal>
				<div class="pillar-card__art pillar-card__art--qc" aria-hidden="true"></div>
				<h3><?php esc_html_e( 'Quality Control', 'amz-prints' ); ?></h3>
				<p><?php esc_html_e( 'Proofs before print, station checks during production, and final inspection before handover.', 'amz-prints' ); ?></p>
			</article>
			<article class="pillar-card reveal" data-reveal>
				<div class="pillar-card__art pillar-card__art--rush" aria-hidden="true"></div>
				<h3><?php esc_html_e( 'Rush & Priority Jobs', 'amz-prints' ); ?></h3>
				<p><?php esc_html_e( 'Need it fast? Ask for priority scheduling — we’ll tell you what’s realistic before you confirm.', 'amz-prints' ); ?></p>
			</article>
		</div>
	</div>
</section>

<section class="section section--cta">
	<div class="container cta-band reveal" data-reveal>
		<div class="cta-band__copy">
			<h2><?php esc_html_e( 'Already placed an order?', 'amz-prints' ); ?></h2>
			<p><?php esc_html_e( 'Track live status with your Order ID or phone number.', 'amz-prints' ); ?></p>
		</div>
		<a class="btn btn--primary btn--lg" href="<?php echo esc_url( home_url( '/track-order/' ) ); ?>"><?php esc_html_e( 'Track Order', 'amz-prints' ); ?></a>
	</div>
</section>

<?php get_footer(); ?>
