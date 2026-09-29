<?php
/**
 * Remove saved visual edits when the plugin is deleted.
 *
 * @package AMZ_Visual_Editor
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'amz_ve_content' );
