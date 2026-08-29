<?php
/**
 * Contact Form Handler
 *
 * @package Studio_Portfolio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handle contact form submission.
 */
function studio_handle_contact_form() {
	if ( ! isset( $_POST['studio_contact_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['studio_contact_nonce'] ) ), 'studio_contact_form' ) ) {
		wp_die( esc_html__( 'Security check failed.', 'studio-portfolio' ) );
	}

	$name         = isset( $_POST['contact_name'] ) ? sanitize_text_field( wp_unslash( $_POST['contact_name'] ) ) : '';
	$email        = isset( $_POST['contact_email'] ) ? sanitize_email( wp_unslash( $_POST['contact_email'] ) ) : '';
	$whatsapp     = isset( $_POST['contact_whatsapp'] ) ? sanitize_text_field( wp_unslash( $_POST['contact_whatsapp'] ) ) : '';
	$company      = isset( $_POST['contact_company'] ) ? sanitize_text_field( wp_unslash( $_POST['contact_company'] ) ) : '';
	$project_type = isset( $_POST['contact_project_type'] ) ? sanitize_text_field( wp_unslash( $_POST['contact_project_type'] ) ) : '';
	$message      = isset( $_POST['contact_message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['contact_message'] ) ) : '';

	if ( empty( $name ) || empty( $email ) || empty( $message ) ) {
		wp_safe_redirect( add_query_arg( 'contact', 'error', wp_get_referer() ) );
		exit;
	}

	$to      = studio_get_option( 'contact_email', get_option( 'admin_email' ) );
	$subject = sprintf( '[%s] New project inquiry from %s', get_bloginfo( 'name' ), $name );
	$body    = sprintf(
		"Name: %s\nEmail: %s\nWhatsApp: %s\nCompany: %s\nProject Type: %s\n\nProject:\n%s",
		$name,
		$email,
		$whatsapp,
		$company,
		$project_type,
		$message
	);
	$headers = array(
		'Content-Type: text/plain; charset=UTF-8',
		'Reply-To: ' . $name . ' <' . $email . '>',
	);

	wp_mail( $to, $subject, $body, $headers );

	wp_safe_redirect( add_query_arg( 'contact', 'success', wp_get_referer() . '#contact' ) );
	exit;
}
add_action( 'admin_post_studio_contact_form', 'studio_handle_contact_form' );
add_action( 'admin_post_nopriv_studio_contact_form', 'studio_handle_contact_form' );
