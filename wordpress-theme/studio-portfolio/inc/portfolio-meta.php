<?php
/**
 * Portfolio Meta Boxes & Media Upload
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register meta boxes.
 */
function studio_portfolio_add_meta_boxes() {
	add_meta_box(
		'studio_portfolio_home_display',
		__( '⭐ Homepage Featured Project', 'studio-portfolio' ),
		'studio_portfolio_home_display_callback',
		'portfolio',
		'normal',
		'high'
	);

	add_meta_box(
		'studio_portfolio_details',
		__( 'Portfolio Details', 'studio-portfolio' ),
		'studio_portfolio_details_callback',
		'portfolio',
		'normal',
		'default'
	);

	add_meta_box(
		'studio_portfolio_gallery',
		__( 'Portfolio Gallery', 'studio-portfolio' ),
		'studio_portfolio_gallery_callback',
		'portfolio',
		'normal',
		'default'
	);

	add_meta_box(
		'studio_portfolio_case_study',
		__( 'Case Study', 'studio-portfolio' ),
		'studio_portfolio_case_study_callback',
		'portfolio',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'studio_portfolio_add_meta_boxes' );

/**
 * Homepage featured project meta box.
 *
 * @param WP_Post $post Post object.
 */
function studio_portfolio_home_display_callback( $post ) {
	wp_nonce_field( 'studio_portfolio_save', 'studio_portfolio_nonce' );

	$featured_home = get_post_meta( $post->ID, '_portfolio_featured_home', true );
	$home_image_id = absint( get_post_meta( $post->ID, '_portfolio_home_image', true ) );
	$home_desc     = get_post_meta( $post->ID, '_portfolio_home_description', true );
	$thumb_id      = get_post_thumbnail_id( $post->ID );
	$file_id       = absint( get_post_meta( $post->ID, '_portfolio_pdf', true ) );
	$file_url      = $file_id ? wp_get_attachment_url( $file_id ) : '';
	$preview_url   = $home_image_id ? wp_get_attachment_image_url( $home_image_id, 'medium' ) : ( $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'medium' ) : '' );
	?>
	<div class="studio-home-featured-box">
		<p class="description" style="margin-top:0;">
			<?php esc_html_e( 'Control homepage visibility, card image, description, and project file. Title = post title above.', 'studio-portfolio' ); ?>
		</p>
		<table class="form-table studio-portfolio-meta">
			<tr>
				<th><?php esc_html_e( 'Show on Homepage', 'studio-portfolio' ); ?></th>
				<td>
					<label>
		<input type="checkbox" name="portfolio_featured_home" value="1" <?php checked( $featured_home !== '0' ); ?> />
						<strong><?php esc_html_e( 'Feature on homepage gallery', 'studio-portfolio' ); ?></strong>
					</label>
				</td>
			</tr>
			<tr>
				<th><?php esc_html_e( 'Homepage Card Image', 'studio-portfolio' ); ?></th>
				<td>
					<input type="hidden" id="portfolio_home_image" name="portfolio_home_image" value="<?php echo esc_attr( $home_image_id ); ?>" />
					<div id="studio-home-image-preview" class="studio-media-preview">
						<?php if ( $preview_url ) : ?>
							<img src="<?php echo esc_url( $preview_url ); ?>" alt="" />
						<?php endif; ?>
					</div>
					<p>
						<button type="button" class="button button-primary" id="studio-upload-home-image"><?php esc_html_e( 'Upload Image', 'studio-portfolio' ); ?></button>
						<button type="button" class="button studio-remove-home-image"><?php esc_html_e( 'Remove', 'studio-portfolio' ); ?></button>
					</p>
					<p class="description"><?php esc_html_e( 'Optional. Uses Featured Image from sidebar if empty.', 'studio-portfolio' ); ?></p>
				</td>
			</tr>
			<tr>
				<th><label for="portfolio_home_description"><?php esc_html_e( 'Homepage Description', 'studio-portfolio' ); ?></label></th>
				<td>
					<textarea id="portfolio_home_description" name="portfolio_home_description" rows="3" class="large-text"><?php echo esc_textarea( $home_desc ); ?></textarea>
					<p class="description"><?php esc_html_e( 'Short text shown under title on homepage cards.', 'studio-portfolio' ); ?></p>
				</td>
			</tr>
			<tr>
				<th><?php esc_html_e( 'Project File (PDF / Image)', 'studio-portfolio' ); ?></th>
				<td>
					<input type="hidden" id="portfolio_pdf" name="portfolio_pdf" value="<?php echo esc_attr( $file_id ); ?>" />
					<div id="studio-pdf-preview" class="studio-pdf-preview">
						<?php if ( $file_url ) : ?>
							<a href="<?php echo esc_url( $file_url ); ?>" target="_blank" rel="noopener"><?php echo esc_html( basename( $file_url ) ); ?></a>
							<button type="button" class="button studio-remove-pdf"><?php esc_html_e( 'Remove File', 'studio-portfolio' ); ?></button>
						<?php endif; ?>
					</div>
					<p>
						<button type="button" class="button button-primary" id="studio-upload-pdf"><?php esc_html_e( 'Upload PDF or Image', 'studio-portfolio' ); ?></button>
					</p>
				</td>
			</tr>
		</table>
	</div>
	<?php
}

/**
 * Portfolio details meta box.
 */
function studio_portfolio_details_callback( $post ) {
	wp_nonce_field( 'studio_portfolio_save', 'studio_portfolio_nonce' );

	$year       = get_post_meta( $post->ID, '_portfolio_year', true );
	$client     = get_post_meta( $post->ID, '_portfolio_client', true );
	$project_url = get_post_meta( $post->ID, '_portfolio_url', true );
	$tags       = get_post_meta( $post->ID, '_portfolio_tags', true );
	$number     = get_post_meta( $post->ID, '_portfolio_number', true );
	?>
	<table class="form-table studio-portfolio-meta">
		<tr>
			<th><label for="portfolio_number"><?php esc_html_e( 'Display Number', 'studio-portfolio' ); ?></label></th>
			<td>
				<input type="text" id="portfolio_number" name="portfolio_number" value="<?php echo esc_attr( $number ); ?>" class="regular-text" placeholder="01" />
				<p class="description"><?php esc_html_e( 'Number shown on the portfolio card (e.g. 01, 02).', 'studio-portfolio' ); ?></p>
			</td>
		</tr>
		<tr>
			<th><label for="portfolio_year"><?php esc_html_e( 'Year', 'studio-portfolio' ); ?></label></th>
			<td>
				<input type="text" id="portfolio_year" name="portfolio_year" value="<?php echo esc_attr( $year ); ?>" class="regular-text" placeholder="2025" />
			</td>
		</tr>
		<tr>
			<th><label for="portfolio_client"><?php esc_html_e( 'Client', 'studio-portfolio' ); ?></label></th>
			<td>
				<input type="text" id="portfolio_client" name="portfolio_client" value="<?php echo esc_attr( $client ); ?>" class="regular-text" />
			</td>
		</tr>
		<tr>
			<th><label for="portfolio_url"><?php esc_html_e( 'Project URL', 'studio-portfolio' ); ?></label></th>
			<td>
				<input type="url" id="portfolio_url" name="portfolio_url" value="<?php echo esc_url( $project_url ); ?>" class="regular-text" placeholder="https://" />
			</td>
		</tr>
		<tr>
			<th><label for="portfolio_tags"><?php esc_html_e( 'Tags', 'studio-portfolio' ); ?></label></th>
			<td>
				<input type="text" id="portfolio_tags" name="portfolio_tags" value="<?php echo esc_attr( $tags ); ?>" class="large-text" placeholder="Branding, Logo, Print" />
				<p class="description"><?php esc_html_e( 'Comma-separated tags displayed on the card.', 'studio-portfolio' ); ?></p>
			</td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'PDF Preview Thumbnail', 'studio-portfolio' ); ?></th>
			<td>
				<?php
				$cover_id  = get_post_meta( $post->ID, '_portfolio_pdf_cover', true );
				$cover_url = $cover_id ? wp_get_attachment_image_url( $cover_id, 'medium' ) : '';
				?>
				<input type="hidden" id="portfolio_pdf_cover" name="portfolio_pdf_cover" value="<?php echo esc_attr( $cover_id ); ?>" />
				<div id="studio-pdf-cover-preview" class="studio-pdf-preview">
					<?php if ( $cover_url ) : ?>
						<img src="<?php echo esc_url( $cover_url ); ?>" alt="" style="max-width:160px;height:auto;display:block;margin-bottom:8px;" />
						<button type="button" class="button studio-remove-pdf-cover"><?php esc_html_e( 'Remove Thumbnail', 'studio-portfolio' ); ?></button>
					<?php endif; ?>
				</div>
				<p>
					<button type="button" class="button" id="studio-upload-pdf-cover">
						<?php esc_html_e( 'Upload PDF Thumbnail', 'studio-portfolio' ); ?>
					</button>
				</p>
				<p class="description"><?php esc_html_e( 'Shown on the homepage and on hover for PDF projects. If empty, Featured Image is used.', 'studio-portfolio' ); ?></p>
			</td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'Category', 'studio-portfolio' ); ?></th>
			<td>
				<p class="description"><?php esc_html_e( 'Assign categories using the "Portfolio Categories" box in the right sidebar. Manage all categories under Portfolio → Categories.', 'studio-portfolio' ); ?></p>
			</td>
		</tr>
	</table>
	<p><strong><?php esc_html_e( 'Featured Image:', 'studio-portfolio' ); ?></strong> <?php esc_html_e( 'Set the main project image using the Featured Image box on the right sidebar.', 'studio-portfolio' ); ?></p>
	<?php
}

/**
 * Case study fields — Challenge → Result.
 *
 * @param WP_Post $post Post.
 */
function studio_portfolio_case_study_callback( $post ) {
	$fields = studio_get_case_study_fields();
	?>
	<p class="description">
		<?php esc_html_e( 'This is what visitors see on the project page. Portfolio shows the work; How I Work is your process — keep them different.', 'studio-portfolio' ); ?>
	</p>
	<table class="form-table studio-portfolio-meta">
		<?php foreach ( $fields as $key => $label ) : ?>
			<?php $value = get_post_meta( $post->ID, '_portfolio_' . $key, true ); ?>
			<tr>
				<th><label for="portfolio_<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
				<td>
					<textarea id="portfolio_<?php echo esc_attr( $key ); ?>" name="portfolio_<?php echo esc_attr( $key ); ?>" rows="5" class="large-text"><?php echo esc_textarea( $value ); ?></textarea>
				</td>
			</tr>
		<?php endforeach; ?>
	</table>
	<?php
}

/**
 * Portfolio gallery meta box with media uploader.
 */
function studio_portfolio_gallery_callback( $post ) {
	$gallery_ids = get_post_meta( $post->ID, '_portfolio_gallery', true );
	if ( ! is_array( $gallery_ids ) ) {
		$gallery_ids = array();
	}
	?>
	<div class="studio-gallery-uploader">
		<p class="description"><?php esc_html_e( 'Upload additional project images. Drag to reorder.', 'studio-portfolio' ); ?></p>

		<ul id="studio-gallery-preview" class="studio-gallery-preview">
			<?php foreach ( $gallery_ids as $id ) :
				$thumb = wp_get_attachment_image_src( $id, 'thumbnail' );
				if ( ! $thumb ) continue;
				?>
				<li data-id="<?php echo esc_attr( $id ); ?>">
					<img src="<?php echo esc_url( $thumb[0] ); ?>" alt="" />
					<button type="button" class="studio-remove-image" title="<?php esc_attr_e( 'Remove', 'studio-portfolio' ); ?>">&times;</button>
				</li>
			<?php endforeach; ?>
		</ul>

		<input type="hidden" id="portfolio_gallery" name="portfolio_gallery" value="<?php echo esc_attr( implode( ',', $gallery_ids ) ); ?>" />

		<p>
			<button type="button" class="button button-primary" id="studio-upload-gallery">
				<?php esc_html_e( 'Upload / Add Images', 'studio-portfolio' ); ?>
			</button>
		</p>
	</div>
	<?php
}

/**
 * Save portfolio meta.
 */
function studio_portfolio_save_meta( $post_id ) {
	if ( ! isset( $_POST['studio_portfolio_nonce'] ) || ! wp_verify_nonce( $_POST['studio_portfolio_nonce'], 'studio_portfolio_save' ) ) {
		return;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$text_fields = array(
		'portfolio_number' => '_portfolio_number',
		'portfolio_year'   => '_portfolio_year',
		'portfolio_client' => '_portfolio_client',
		'portfolio_tags'   => '_portfolio_tags',
	);

	foreach ( $text_fields as $input => $meta_key ) {
		if ( isset( $_POST[ $input ] ) ) {
			update_post_meta( $post_id, $meta_key, sanitize_text_field( wp_unslash( $_POST[ $input ] ) ) );
		}
	}

	if ( isset( $_POST['portfolio_url'] ) ) {
		update_post_meta( $post_id, '_portfolio_url', esc_url_raw( wp_unslash( $_POST['portfolio_url'] ) ) );
	}

	if ( isset( $_POST['portfolio_gallery'] ) ) {
		$ids = array_filter( array_map( 'absint', explode( ',', sanitize_text_field( wp_unslash( $_POST['portfolio_gallery'] ) ) ) ) );
		update_post_meta( $post_id, '_portfolio_gallery', $ids );
	}

	if ( isset( $_POST['portfolio_pdf'] ) ) {
		$pdf_id = absint( $_POST['portfolio_pdf'] );
		if ( $pdf_id ) {
			update_post_meta( $post_id, '_portfolio_pdf', $pdf_id );
		} else {
			delete_post_meta( $post_id, '_portfolio_pdf' );
		}
	}

	if ( isset( $_POST['portfolio_pdf_cover'] ) ) {
		$cover_id = absint( $_POST['portfolio_pdf_cover'] );
		if ( $cover_id ) {
			update_post_meta( $post_id, '_portfolio_pdf_cover', $cover_id );
		} else {
			delete_post_meta( $post_id, '_portfolio_pdf_cover' );
		}
	}

	if ( isset( $_POST['portfolio_home_description'] ) ) {
		update_post_meta( $post_id, '_portfolio_home_description', sanitize_textarea_field( wp_unslash( $_POST['portfolio_home_description'] ) ) );
	}

	if ( isset( $_POST['portfolio_home_image'] ) ) {
		$home_image = absint( $_POST['portfolio_home_image'] );
		if ( $home_image ) {
			update_post_meta( $post_id, '_portfolio_home_image', $home_image );
		} else {
			delete_post_meta( $post_id, '_portfolio_home_image' );
		}
	}

	$featured = isset( $_POST['portfolio_featured_home'] ) ? '1' : '0';
	update_post_meta( $post_id, '_portfolio_featured_home', $featured );

	if ( function_exists( 'studio_get_case_study_fields' ) ) {
		foreach ( array_keys( studio_get_case_study_fields() ) as $key ) {
			$input = 'portfolio_' . $key;
			if ( isset( $_POST[ $input ] ) ) {
				update_post_meta( $post_id, '_portfolio_' . $key, sanitize_textarea_field( wp_unslash( $_POST[ $input ] ) ) );
			}
		}
	}
}
add_action( 'save_post_portfolio', 'studio_portfolio_save_meta' );

/**
 * Enqueue admin scripts for media uploader.
 */
function studio_portfolio_admin_scripts( $hook ) {
	global $post_type;

	if ( ( 'post.php' === $hook || 'post-new.php' === $hook ) && 'portfolio' === $post_type ) {
		wp_enqueue_media();
		wp_enqueue_script(
			'studio-portfolio-admin',
			STUDIO_PORTFOLIO_URI . '/assets/js/admin.js',
			array( 'jquery', 'jquery-ui-sortable' ),
			STUDIO_PORTFOLIO_VERSION,
			true
		);
		wp_enqueue_style(
			'studio-portfolio-admin',
			STUDIO_PORTFOLIO_URI . '/assets/css/admin.css',
			array(),
			STUDIO_PORTFOLIO_VERSION
		);
	}
}
add_action( 'admin_enqueue_scripts', 'studio_portfolio_admin_scripts' );

/**
 * Helper: get portfolio tags as array.
 */
function studio_get_portfolio_tags( $post_id ) {
	$tags = get_post_meta( $post_id, '_portfolio_tags', true );
	if ( empty( $tags ) ) {
		return array();
	}
	return array_map( 'trim', explode( ',', $tags ) );
}
