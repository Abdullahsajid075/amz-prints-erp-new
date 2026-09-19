<?php
/**
 * Custom post types: Products & Services
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function amz_prints_register_post_types() {
	register_post_type( 'amz_service', array(
		'labels' => array(
			'name'          => __( 'Services', 'amz-prints' ),
			'singular_name' => __( 'Service', 'amz-prints' ),
			'add_new_item'  => __( 'Add New Service', 'amz-prints' ),
			'edit_item'     => __( 'Edit Service', 'amz-prints' ),
		),
		'public'       => true,
		'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'service' ),
		'menu_icon'    => 'dashicons-admin-tools',
		'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt', 'page-attributes' ),
		'show_in_rest' => true,
	) );

	register_post_type( 'amz_product', array(
		'labels' => array(
			'name'          => __( 'Products', 'amz-prints' ),
			'singular_name' => __( 'Product', 'amz-prints' ),
			'add_new_item'  => __( 'Add New Product', 'amz-prints' ),
			'edit_item'     => __( 'Edit Product', 'amz-prints' ),
		),
		'public'       => true,
		'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'product' ),
		'menu_icon'    => 'dashicons-products',
		'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt', 'page-attributes' ),
		'show_in_rest' => true,
	) );
}
add_action( 'init', 'amz_prints_register_post_types' );

/**
 * Meta boxes for icon / price
 */
function amz_prints_add_meta_boxes() {
	add_meta_box( 'amz_service_icon', __( 'Service Icon', 'amz-prints' ), 'amz_prints_service_icon_cb', 'amz_service', 'side' );
	add_meta_box( 'amz_product_price', __( 'Price Label', 'amz-prints' ), 'amz_prints_product_price_cb', 'amz_product', 'side' );
}
add_action( 'add_meta_boxes', 'amz_prints_add_meta_boxes' );

function amz_prints_service_icon_cb( $post ) {
	wp_nonce_field( 'amz_service_meta', 'amz_service_nonce' );
	$value = get_post_meta( $post->ID, '_amz_icon', true );
	$icons = array( 'layers', 'zap', 'maximize', 'package', 'pen', 'truck', 'printer', 'palette', 'image', 'type' );
	echo '<p><label for="amz_icon">' . esc_html__( 'Icon key', 'amz-prints' ) . '</label></p>';
	echo '<select name="amz_icon" id="amz_icon" style="width:100%">';
	foreach ( $icons as $icon ) {
		printf(
			'<option value="%1$s" %2$s>%1$s</option>',
			esc_attr( $icon ),
			selected( $value, $icon, false )
		);
	}
	echo '</select>';
	echo '<p class="description">' . esc_html__( 'Used on cards. Change anytime.', 'amz-prints' ) . '</p>';
}

function amz_prints_product_price_cb( $post ) {
	wp_nonce_field( 'amz_product_meta', 'amz_product_nonce' );
	$value = get_post_meta( $post->ID, '_amz_price_label', true );
	echo '<p><label for="amz_price_label">' . esc_html__( 'Price label', 'amz-prints' ) . '</label></p>';
	printf(
		'<input type="text" name="amz_price_label" id="amz_price_label" value="%s" style="width:100%%" placeholder="From $25" />',
		esc_attr( $value )
	);
}

function amz_prints_save_meta( $post_id ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( isset( $_POST['amz_service_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['amz_service_nonce'] ) ), 'amz_service_meta' ) ) {
		if ( isset( $_POST['amz_icon'] ) ) {
			update_post_meta( $post_id, '_amz_icon', sanitize_text_field( wp_unslash( $_POST['amz_icon'] ) ) );
		}
	}

	if ( isset( $_POST['amz_product_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['amz_product_nonce'] ) ), 'amz_product_meta' ) ) {
		if ( isset( $_POST['amz_price_label'] ) ) {
			update_post_meta( $post_id, '_amz_price_label', sanitize_text_field( wp_unslash( $_POST['amz_price_label'] ) ) );
		}
	}
}
add_action( 'save_post', 'amz_prints_save_meta' );

/**
 * SVG icons for services
 */
function amz_prints_icon_svg( $key ) {
	$icons = array(
		'layers'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
		'zap'      => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
		'maximize' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
		'package'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>',
		'pen'      => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
		'truck'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
		'printer'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
		'palette'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
		'image'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
		'type'     => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
	);
	return isset( $icons[ $key ] ) ? $icons[ $key ] : $icons['printer'];
}

/**
 * Icons for How We Work scenes
 */
function amz_prints_work_icon( $key ) {
	$extra = array(
		'headset' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
		'file'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
		'track'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
	);
	if ( isset( $extra[ $key ] ) ) {
		return $extra[ $key ];
	}
	return amz_prints_icon_svg( $key );
}
