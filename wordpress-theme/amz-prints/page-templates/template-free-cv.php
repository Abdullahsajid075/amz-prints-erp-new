<?php
/**
 * Template Name: Free CV
 *
 * Login-gated CV builder. Minimalist form -> preview + color/design ->
 * mark completed -> stored in ERP CV section + print/download.
 *
 * @package AMZ_Prints
 */

// Free CV is only accessible when logged in.
if ( ! is_user_logged_in() ) {
	wp_safe_redirect( add_query_arg( 'redirect_to', rawurlencode( home_url( '/free-cv/' ) ), home_url( '/login/' ) ) );
	exit;
}

$current   = wp_get_current_user();
$prefill_n = $current ? trim( $current->display_name ) : '';
$prefill_e = $current ? $current->user_email : '';
$ads       = amz_prints_cv_ads();
$banner    = amz_prints_cv_banner();
$logout    = wp_nonce_url( admin_url( 'admin-post.php?action=amz_logout' ), 'amz_logout', 'amz_logout_nonce' );

get_header();
?>

<section class="page-hero page-hero--light cv-hero">
	<div class="container">
		<p class="page-hero__brand">Amazon Printings (Pvt) Ltd</p>
		<h1>Free CV Builder</h1>
		<p class="page-hero__lead">Build a clean, professional CV in minutes — then download it as a print-ready PDF. Signed in as <strong><?php echo esc_html( $current->display_name ); ?></strong> · <a href="<?php echo esc_url( $logout ); ?>">Log out</a></p>
	</div>
</section>

<section class="section">
	<div class="container cv-portal" data-cv-portal>

		<!-- Vertical side banner → Store product -->
		<aside class="cv-banner" aria-label="Sponsored">
			<a class="cv-banner__link" href="<?php echo esc_url( $banner['url'] ); ?>">
				<img src="<?php echo esc_url( $banner['image'] ); ?>" alt="Featured product">
				<span class="cv-banner__tag">Shop this</span>
			</a>
		</aside>

		<!-- Builder -->
		<div class="cv-builder">
			<ol class="cv-steps" data-cv-steps>
				<li class="is-active" data-step-dot="1"><span>1</span> Details</li>
				<li data-step-dot="2"><span>2</span> Experience</li>
				<li data-step-dot="3"><span>3</span> Design &amp; Finish</li>
			</ol>

			<form class="amz-form cv-form" id="amz-cv-form" novalidate>
				<!-- STEP 1 -->
				<div class="cv-step is-active" data-step="1">
					<div class="cv-photo-row">
						<div class="cv-photo-preview" data-cv-photo-box>
							<img data-cv-photo-img alt="Photo" hidden>
							<span data-cv-photo-empty>Photo</span>
						</div>
						<div>
							<label class="cv-upload-btn">
								<input type="file" name="photo" accept="image/png,image/jpeg,image/webp" data-cv-photo hidden>
								<span>Upload photo</span>
							</label>
							<button type="button" class="cv-photo-remove" data-cv-photo-remove hidden>Remove</button>
							<p class="form-note">JPG/PNG/WebP, up to ~3MB. Shows on your CV.</p>
						</div>
					</div>
					<div class="form-row">
						<label><span>Full name *</span><input type="text" name="fullName" value="<?php echo esc_attr( $prefill_n ); ?>" required></label>
						<label><span>Professional title</span><input type="text" name="headline" placeholder="e.g. Graphic Designer"></label>
					</div>
					<div class="form-row">
						<label><span>Email</span><input type="email" name="email" value="<?php echo esc_attr( $prefill_e ); ?>"></label>
						<label><span>Phone</span><input type="tel" name="phone"></label>
					</div>
					<label><span>City</span><input type="text" name="city" placeholder="e.g. Lahore"></label>
					<label><span>Profile summary</span><textarea name="summary" rows="4" placeholder="A short professional summary about you…"></textarea></label>
					<div class="cv-actions">
						<span></span>
						<button type="button" class="btn btn--primary" data-cv-next>Next: Experience</button>
					</div>
				</div>

				<!-- STEP 2 -->
				<div class="cv-step" data-step="2">
					<h3 class="cv-block-title">Work experience</h3>
					<div data-cv-repeat="experience" class="cv-repeat">
						<template data-cv-template>
							<div class="cv-repeat__item">
								<div class="form-row">
									<label><span>Role</span><input type="text" data-field="role"></label>
									<label><span>Company</span><input type="text" data-field="company"></label>
								</div>
								<div class="form-row">
									<label><span>Period</span><input type="text" data-field="period" placeholder="2021 – 2024"></label>
									<label><span>Details</span><input type="text" data-field="details" placeholder="What you did"></label>
								</div>
								<button type="button" class="cv-repeat__remove" data-cv-remove>Remove</button>
							</div>
						</template>
					</div>
					<button type="button" class="cv-add-btn" data-cv-add="experience">+ Add experience</button>

					<h3 class="cv-block-title">Education</h3>
					<div data-cv-repeat="education" class="cv-repeat">
						<template data-cv-template>
							<div class="cv-repeat__item">
								<div class="form-row">
									<label><span>Degree / Certificate</span><input type="text" data-field="degree"></label>
									<label><span>Institute</span><input type="text" data-field="school"></label>
								</div>
								<label><span>Year</span><input type="text" data-field="year" placeholder="2019"></label>
								<button type="button" class="cv-repeat__remove" data-cv-remove>Remove</button>
							</div>
						</template>
					</div>
					<button type="button" class="cv-add-btn" data-cv-add="education">+ Add education</button>

					<div class="form-row">
						<label><span>Skills (comma separated)</span><input type="text" name="skills" placeholder="Photoshop, Illustrator, Branding"></label>
						<label><span>Languages (comma separated)</span><input type="text" name="languages" placeholder="English, Urdu"></label>
					</div>

					<div class="cv-actions">
						<button type="button" class="btn btn--ghost" data-cv-prev>Back</button>
						<button type="button" class="btn btn--primary" data-cv-next>Next: Design</button>
					</div>
				</div>

				<!-- STEP 3 -->
				<div class="cv-step" data-step="3">
					<div class="cv-design">
						<div class="cv-design__controls">
							<h3 class="cv-block-title">Template</h3>
							<div class="cv-template-picker" data-cv-templates>
								<button type="button" class="cv-tpl is-active" data-template="classic">Classic</button>
								<button type="button" class="cv-tpl" data-template="modern">Modern</button>
								<button type="button" class="cv-tpl" data-template="minimal">Minimal</button>
							</div>
							<h3 class="cv-block-title">Accent color</h3>
							<div class="cv-color-picker" data-cv-colors>
								<button type="button" class="cv-swatch is-active" style="--sw:#F26522" data-color="#F26522"></button>
								<button type="button" class="cv-swatch" style="--sw:#2563eb" data-color="#2563eb"></button>
								<button type="button" class="cv-swatch" style="--sw:#0f766e" data-color="#0f766e"></button>
								<button type="button" class="cv-swatch" style="--sw:#7c3aed" data-color="#7c3aed"></button>
								<button type="button" class="cv-swatch" style="--sw:#db2777" data-color="#db2777"></button>
								<button type="button" class="cv-swatch" style="--sw:#1a1a1a" data-color="#1a1a1a"></button>
							</div>
							<div class="cv-actions">
								<button type="button" class="btn btn--ghost" data-cv-prev>Back</button>
								<button type="submit" class="btn btn--primary" data-cv-submit>Mark as completed</button>
							</div>
							<div class="cv-submit-msg" data-cv-msg hidden></div>
							<div class="cv-done-actions" data-cv-done hidden>
								<button type="button" class="btn btn--primary btn--lg" data-cv-download>Download / Print PDF</button>
							</div>
						</div>

						<div class="cv-preview-wrap">
							<p class="cv-preview-hint">Live preview</p>
							<div class="cv-preview" id="cv-preview" data-cv-preview data-template="classic" style="--cv-accent:#F26522"></div>
						</div>
					</div>
				</div>
			</form>
		</div>

		<!-- Rotating advertisement (changes every 10s) -->
		<aside class="cv-ad" aria-label="Advertisement">
			<span class="cv-ad__tag">Ad</span>
			<a class="cv-ad__link" href="<?php echo esc_url( $ads['url'] ? $ads['url'] : home_url( '/services/' ) ); ?>"
				data-cv-ad data-cv-ad-interval="10000"
				data-cv-ad-images='<?php echo esc_attr( wp_json_encode( array_values( $ads['images'] ) ) ); ?>'>
				<img src="<?php echo esc_url( $ads['images'][0] ); ?>" alt="Advertisement" data-cv-ad-img>
			</a>
		</aside>

	</div>
</section>

<?php get_footer(); ?>
