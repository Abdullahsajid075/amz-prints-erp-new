<?php
/**
 * Portfolio Custom Post Type
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register Portfolio post type and taxonomy.
 */
function studio_register_portfolio_cpt() {
	$labels = array(
		'name'               => _x( 'Portfolio', 'post type general name', 'studio-portfolio' ),
		'singular_name'      => _x( 'Portfolio Item', 'post type singular name', 'studio-portfolio' ),
		'menu_name'          => _x( 'Portfolio', 'admin menu', 'studio-portfolio' ),
		'add_new'            => _x( 'Add New', 'portfolio item', 'studio-portfolio' ),
		'add_new_item'       => __( 'Add New Portfolio Item', 'studio-portfolio' ),
		'edit_item'          => __( 'Edit Portfolio Item', 'studio-portfolio' ),
		'new_item'           => __( 'New Portfolio Item', 'studio-portfolio' ),
		'view_item'          => __( 'View Portfolio Item', 'studio-portfolio' ),
		'search_items'       => __( 'Search Portfolio', 'studio-portfolio' ),
		'not_found'          => __( 'No portfolio items found', 'studio-portfolio' ),
		'not_found_in_trash' => __( 'No portfolio items in trash', 'studio-portfolio' ),
	);

	register_post_type( 'portfolio', array(
		'labels'             => $labels,
		'public'             => true,
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'menu_icon'          => 'dashicons-art',
		'menu_position'      => 5,
		'query_var'          => true,
		'rewrite'            => array( 'slug' => 'portfolio' ),
		'capability_type'    => 'post',
		'has_archive'        => true,
		'hierarchical'       => false,
		'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt', 'page-attributes' ),
		'show_in_rest'       => true,
	) );

	register_taxonomy( 'portfolio_category', 'portfolio', array(
		'labels' => array(
			'name'          => __( 'Portfolio Categories', 'studio-portfolio' ),
			'singular_name' => __( 'Portfolio Category', 'studio-portfolio' ),
			'search_items'  => __( 'Search Categories', 'studio-portfolio' ),
			'all_items'     => __( 'All Categories', 'studio-portfolio' ),
			'edit_item'     => __( 'Edit Category', 'studio-portfolio' ),
			'update_item'   => __( 'Update Category', 'studio-portfolio' ),
			'add_new_item'  => __( 'Add New Category', 'studio-portfolio' ),
			'new_item_name' => __( 'New Category Name', 'studio-portfolio' ),
			'menu_name'     => __( 'Categories', 'studio-portfolio' ),
		),
		'hierarchical'      => true,
		'show_ui'           => true,
		'show_admin_column' => true,
		'rewrite'           => array( 'slug' => 'portfolio-category' ),
		'show_in_rest'      => true,
	) );
}
add_action( 'init', 'studio_register_portfolio_cpt' );

/**
 * Admin columns for portfolio list.
 */
function studio_portfolio_columns( $columns ) {
	$new = array();
	$new['cb'] = $columns['cb'];
	$new['thumbnail'] = __( 'Image', 'studio-portfolio' );
	$new['title'] = $columns['title'];
	$new['portfolio_category'] = __( 'Category', 'studio-portfolio' );
	$new['portfolio_year'] = __( 'Year', 'studio-portfolio' );
	$new['menu_order'] = __( 'Order', 'studio-portfolio' );
	$new['date'] = $columns['date'];
	return $new;
}
add_filter( 'manage_portfolio_posts_columns', 'studio_portfolio_columns' );

function studio_portfolio_column_content( $column, $post_id ) {
	switch ( $column ) {
		case 'thumbnail':
			if ( has_post_thumbnail( $post_id ) ) {
				echo get_the_post_thumbnail( $post_id, array( 60, 60 ), array( 'style' => 'border-radius:8px;' ) );
			} else {
				echo '<span style="color:#999;">—</span>';
			}
			break;
		case 'portfolio_category':
			$terms = get_the_terms( $post_id, 'portfolio_category' );
			if ( $terms && ! is_wp_error( $terms ) ) {
				echo esc_html( implode( ', ', wp_list_pluck( $terms, 'name' ) ) );
			} else {
				echo '<span style="color:#999;">—</span>';
			}
			break;
		case 'portfolio_year':
			$year = get_post_meta( $post_id, '_portfolio_year', true );
			echo $year ? esc_html( $year ) : '<span style="color:#999;">—</span>';
			break;
		case 'menu_order':
			$post = get_post( $post_id );
			echo esc_html( $post->menu_order );
			break;
	}
}
add_action( 'manage_portfolio_posts_custom_column', 'studio_portfolio_column_content', 10, 2 );

/**
 * Flush rewrite rules on theme activation.
 */
function studio_portfolio_activation() {
	studio_register_portfolio_cpt();
	flush_rewrite_rules();

	$defaults = array( 'Branding', 'UI/UX Design', 'Print Design', 'Packaging', 'Social Media', 'Logo Design' );
	foreach ( $defaults as $cat ) {
		if ( ! term_exists( $cat, 'portfolio_category' ) ) {
			wp_insert_term( $cat, 'portfolio_category' );
		}
	}
}
add_action( 'after_switch_theme', 'studio_portfolio_activation' );
