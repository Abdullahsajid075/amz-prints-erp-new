<?php
/**
 * Template Name: Pricing
 * Digital services pricing
 *
 * @package AMZ_Prints
 */

get_header();
?>

<section class="page-hero page-hero--light">
	<div class="container">
		<p class="page-hero__brand">Amazon Printings (Pvt) Ltd</p>
		<h1>Digital Services Pricing</h1>
		<p class="page-hero__lead">Transparent starting prices for website and social media packages.</p>
	</div>
</section>

<section class="section">
	<div class="container pricing-grid">
		<article class="price-card reveal" data-reveal>
			<div class="price-card__media" style="background-image:url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80')"></div>
			<div class="price-card__body">
				<p class="price-card__tag">Digital Service</p>
				<h2>Website Development</h2>
				<p class="price-card__price">Starting from <strong>Rs. 3,000</strong></p>
				<ul class="price-card__features">
					<li>Responsive modern website design</li>
					<li>Home + inner pages structure</li>
					<li>Contact / WhatsApp integration</li>
					<li>Basic SEO setup</li>
					<li>Mobile-friendly layout</li>
					<li>Fast loading optimization</li>
					<li>Content upload support</li>
				</ul>
				<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/quote/?service=Website%20Development' ) ); ?>">Get a Quote</a>
				<a class="btn btn--ghost price-card__wa" href="#" data-wa-service="Website Development">WhatsApp Now</a>
			</div>
		</article>

		<article class="price-card reveal" data-reveal>
			<div class="price-card__media" style="background-image:url('https://images.unsplash.com/photo-1611162617474-5b21e11e480f?auto=format&fit=crop&w=900&q=80')"></div>
			<div class="price-card__body">
				<p class="price-card__tag">Digital Service</p>
				<h2>Social Media Management</h2>
				<p class="price-card__price">Starting from <strong>Rs. 6,000 / month</strong></p>
				<ul class="price-card__features">
					<li>Monthly content calendar</li>
					<li>Creative posts & captions</li>
					<li>Page / profile optimization</li>
					<li>Hashtag & reach strategy</li>
					<li>Basic community replies</li>
					<li>Monthly performance summary</li>
					<li>Brand-consistent visuals</li>
				</ul>
				<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/quote/?service=Social%20Media%20Management' ) ); ?>">Get a Quote</a>
				<a class="btn btn--ghost price-card__wa" href="#" data-wa-service="Social Media Management">WhatsApp Now</a>
			</div>
		</article>
	</div>
</section>

<?php get_footer(); ?>
