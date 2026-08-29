<?php
/**
 * Single portfolio card
 *
 * @package Studio_Portfolio
 *
 * @var array $args {
 *     @type array $card Card data.
 * }
 */

$card = isset( $args['card'] ) ? $args['card'] : array();
$post_id   = $card['post_id'] ?? 0;
if ( ! $post_id ) {
	return;
}
$number    = $card['number'] ?? '01';
$size      = $card['size'] ?? 'portfolio-card-large';
$large     = ! empty( $card['large'] );
$premium   = ! empty( $card['premium'] );
$context   = $card['context'] ?? 'default';
$thumb_id  = studio_get_portfolio_thumbnail_id( $post_id, $context );
$year      = get_post_meta( $post_id, '_portfolio_year', true );
$tags      = studio_get_portfolio_tags( $post_id );
$categories = studio_get_portfolio_categories( $post_id );
$cat_slugs  = studio_get_portfolio_category_slugs( $post_id );
$link       = studio_get_portfolio_link( $post_id );
$title      = get_the_title( $post_id );
$excerpt    = ( 'home' === $context ) ? studio_get_portfolio_home_description( $post_id ) : get_the_excerpt( $post_id );

$card_classes = array( 'portfolio-card', 'fade-in' );
if ( $large ) {
	$card_classes[] = 'portfolio-card-lg';
}
if ( $link['is_pdf'] ) {
	$card_classes[] = 'is-pdf';
}
if ( $premium ) {
	$card_classes[] = 'portfolio-card-premium';
}
?>

<article
	class="<?php echo esc_attr( implode( ' ', $card_classes ) ); ?>"
	data-categories="<?php echo esc_attr( implode( ' ', $cat_slugs ) ); ?>"
>
	<a href="<?php echo esc_url( $link['url'] ); ?>" class="portfolio-card-link" target="<?php echo esc_attr( $link['target'] ); ?>"<?php echo $link['is_pdf'] ? ' rel="noopener noreferrer"' : ''; ?>>
		<div class="portfolio-card-image">
			<?php if ( $thumb_id ) : ?>
				<?php echo wp_get_attachment_image( $thumb_id, $size, false, array( 'class' => 'portfolio-card-thumb' ) ); ?>
			<?php else : ?>
				<div class="portfolio-card-placeholder">
					<span><?php esc_html_e( 'Add Featured Image', 'studio-portfolio' ); ?></span>
				</div>
			<?php endif; ?>

			<span class="portfolio-card-number"><?php echo esc_html( $number ); ?></span>

			<?php if ( $link['is_pdf'] ) : ?>
				<span class="portfolio-pdf-badge">PDF</span>
				<?php if ( $thumb_id ) : ?>
					<div class="portfolio-pdf-hover-preview" aria-hidden="true">
						<?php echo wp_get_attachment_image( $thumb_id, 'portfolio-card', false, array( 'class' => 'portfolio-pdf-preview-img' ) ); ?>
						<span class="portfolio-pdf-preview-label"><?php esc_html_e( 'View PDF →', 'studio-portfolio' ); ?></span>
					</div>
				<?php endif; ?>
			<?php endif; ?>

			<div class="portfolio-card-overlay">
				<span>
					<?php echo $link['is_pdf'] ? esc_html__( 'View PDF →', 'studio-portfolio' ) : esc_html__( 'View Project →', 'studio-portfolio' ); ?>
				</span>
			</div>
		</div>

		<div class="portfolio-card-body">
			<?php if ( ! empty( $categories ) ) : ?>
				<div class="portfolio-category-badges">
					<?php foreach ( $categories as $cat_name ) : ?>
						<span class="badge badge-category"><?php echo esc_html( $cat_name ); ?></span>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>

			<p class="portfolio-card-meta">
				<?php if ( $year ) : ?>
					<?php echo esc_html( $year ); ?>
				<?php endif; ?>
			</p>

			<h3 class="portfolio-card-title"><?php echo esc_html( $title ); ?></h3>

			<?php if ( $excerpt ) : ?>
				<p class="portfolio-card-desc"><?php echo esc_html( $excerpt ); ?></p>
			<?php endif; ?>

			<?php if ( ! empty( $tags ) ) : ?>
				<div class="portfolio-card-tags">
					<?php foreach ( array_slice( $tags, 0, 3 ) as $tag ) : ?>
						<span class="badge badge-blue"><?php echo esc_html( $tag ); ?></span>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
		</div>
	</a>
</article>
