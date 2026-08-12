<?php
/**
 * Template Name: Company Profile — Print & Design
 * Real flip-book from the official print PDF pages.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$pages   = amz_prints_catalog_page_images( 'print' );
$auto_dl = isset( $_GET['download'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$total   = count( $pages );
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Amazon Printings Pvt Ltd — Company Profile</title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'amz-catalog-body catalog-theme-print catalog-pdf-book catalog-portrait flipbook-body' . ( $auto_dl ? ' catalog-download-mode' : '' ) ); ?>>
<?php wp_body_open(); ?>
<?php
amz_prints_flipbook_shell_open(
	array(
		'theme'    => 'print',
		'title'    => __( 'Printing & Designing Profile', 'amz-prints' ),
		'subtitle' => __( 'Real catalog book', 'amz-prints' ),
	)
);

if ( $pages ) :
	foreach ( $pages as $i => $url ) :
		$hard = ( 0 === $i || ( $total - 1 ) === $i );
		?>
	<div class="page<?php echo $hard ? ' page--hard' : ''; ?>" data-density="<?php echo $hard ? 'hard' : 'soft'; ?>">
		<div class="page-content page-content--pdf">
			<img src="<?php echo esc_url( $url ); ?>" alt="<?php echo esc_attr( sprintf( 'Page %d', $i + 1 ) ); ?>">
		</div>
	</div>
		<?php
	endforeach;
else :
	?>
	<div class="page page--hard" data-density="hard">
		<div class="page-content page-content--pdf page-content--empty">
			<p>Print catalog pages are missing.</p>
		</div>
	</div>
	<?php
endif;

amz_prints_flipbook_shell_close();
?>
<?php wp_footer(); ?>
</body>
</html>
