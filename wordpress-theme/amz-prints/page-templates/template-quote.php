<?php
/**
 * Template Name: Get a Quote
 *
 * @package AMZ_Prints
 */

get_header();

$prefill = isset( $_GET['service'] ) ? sanitize_text_field( wp_unslash( $_GET['service'] ) ) : '';
$wa_img  = AMZ_PRINTS_URI . '/assets/images/required-info.png';
?>

<section class="page-hero page-hero--light">
	<div class="container">
		<p class="page-hero__brand">Amazon Printings (Pvt) Ltd</p>
		<h1><?php the_title(); ?></h1>
		<p class="page-hero__lead">Share your project details — we send your request to WhatsApp instantly.</p>
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
			<p class="quote-aside__note">Submit form → opens WhatsApp with full details.</p>
			<img class="required-info-preview" src="<?php echo esc_url( $wa_img ); ?>" width="100" height="20" alt="REQUIRED INFO">
		</div>

		<div class="quote-form-wrap reveal" data-reveal>
			<form class="amz-form" id="amz-wa-quote-form" data-wa-form>
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
						<option <?php selected( $prefill, 'Website Development' ); ?>>Website Development</option>
						<option <?php selected( $prefill, 'Social Media Management' ); ?>>Social Media Management</option>
						<option <?php selected( $prefill, 'Business Cards' ); ?>>Business Cards</option>
						<option <?php selected( $prefill, 'Flyers & Brochures' ); ?>>Flyers & Brochures</option>
						<option <?php selected( $prefill, 'Banners & Signage' ); ?>>Banners & Signage</option>
						<option <?php selected( $prefill, 'Packaging' ); ?>>Packaging</option>
						<option <?php selected( $prefill, 'Vehicle Branding' ); ?>>Vehicle Branding</option>
						<option <?php selected( $prefill, 'NADRA E-Services' ); ?>>NADRA E-Services</option>
						<option <?php echo $prefill && ! in_array( $prefill, array( 'Website Development', 'Social Media Management', 'Business Cards', 'Flyers & Brochures', 'Banners & Signage', 'Packaging', 'Vehicle Branding', 'NADRA E-Services' ), true ) ? 'selected' : ''; ?>><?php echo $prefill ? esc_html( $prefill ) : 'Other'; ?></option>
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
				<p class="form-note">Your full form is converted into a WhatsApp message with REQUIRED INFO header.</p>
			</form>
		</div>
	</div>
</section>

<?php get_footer(); ?>
