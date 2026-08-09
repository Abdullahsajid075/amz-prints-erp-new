<?php
/**
 * Template Name: Get a Quote
 *
 * @package AMZ_Prints
 */

get_header();

$prefill      = isset( $_GET['service'] ) ? sanitize_text_field( wp_unslash( $_GET['service'] ) ) : '';
$wa_img       = AMZ_PRINTS_URI . '/assets/images/required-info.png';
$erp_products = function_exists( 'amz_prints_erp_get_products' ) ? amz_prints_erp_get_products() : array();
$static_opts  = array(
	'Website Development',
	'Social Media Management',
	'Business Cards',
	'Flyers & Brochures',
	'Banners & Signage',
	'Packaging',
	'Vehicle Branding',
	'NADRA E-Services',
	'Other',
);
$product_names = array();
foreach ( $erp_products as $p ) {
	if ( ! empty( $p['name'] ) ) {
		$product_names[] = $p['name'];
	}
}
if ( empty( $product_names ) ) {
	$product_names = $static_opts;
} else {
	foreach ( array( 'NADRA E-Services', 'Website Development', 'Social Media Management', 'Other' ) as $extra ) {
		if ( ! in_array( $extra, $product_names, true ) ) {
			$product_names[] = $extra;
		}
	}
}
?>

<section class="page-hero page-hero--light">
	<div class="container">
		<p class="page-hero__brand">Amazon Printings (Pvt) Ltd</p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead">Share your project details — we save your request in CRM and open WhatsApp instantly.</p>
	</div>
</section>

<section class="section">
	<div class="container quote-layout">
		<div class="quote-aside reveal" data-reveal>
			<h2>What helps us quote faster</h2>
			<ul class="check-list">
				<li>Product type & quantity</li>
				<li>Size, paper/stock, finish</li>
				<li>Needed delivery date</li>
				<li>Artwork status (ready / need design)</li>
			</ul>
			<p class="quote-aside__note">Submit → CRM Lead in ERP + WhatsApp with full details.</p>
			<img class="required-info-preview" src="<?php echo esc_url( $wa_img ); ?>" width="100" height="20" alt="REQUIRED INFO">
		</div>

		<div class="quote-form-wrap reveal" data-reveal>
			<form class="amz-form" id="amz-wa-quote-form" data-wa-form data-lead-source="website-quote">
				<img src="<?php echo esc_url( $wa_img ); ?>" width="100" height="20" alt="REQUIRED INFO" class="required-info-preview" hidden>
				<div class="form-row">
					<label>
						<span>Name</span>
						<input type="text" name="name" required>
					</label>
					<label>
						<span>Company</span>
						<input type="text" name="company">
					</label>
				</div>
				<div class="form-row">
					<label>
						<span>Email</span>
						<input type="email" name="email" required>
					</label>
					<label>
						<span>Phone</span>
						<input type="tel" name="phone" required>
					</label>
				</div>
				<label>
					<span>Product / Service</span>
					<select name="product" required>
						<option value="">Select…</option>
						<?php foreach ( $product_names as $opt ) : ?>
							<option value="<?php echo esc_attr( $opt ); ?>" <?php selected( $prefill, $opt ); ?>><?php echo esc_html( $opt ); ?></option>
						<?php endforeach; ?>
						<?php if ( $prefill && ! in_array( $prefill, $product_names, true ) ) : ?>
							<option value="<?php echo esc_attr( $prefill ); ?>" selected><?php echo esc_html( $prefill ); ?></option>
						<?php endif; ?>
					</select>
				</label>
				<div class="form-row">
					<label>
						<span>Quantity</span>
						<input type="text" name="quantity" placeholder="e.g. 500">
					</label>
					<label>
						<span>Needed by</span>
						<input type="date" name="needed_by">
					</label>
				</div>
				<label>
					<span>Project details</span>
					<textarea name="details" rows="5" required placeholder="Size, colors, finishes, delivery…"></textarea>
				</label>
				<button type="submit" class="btn btn--primary btn--lg">Send on WhatsApp</button>
				<p class="form-note">Saved as a CRM Lead in ERP, then opens WhatsApp with REQUIRED INFO header.</p>
			</form>
		</div>
	</div>
</section>

<?php get_footer(); ?>
