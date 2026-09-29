<?php
/**
 * Plugin Name: AMZ Visual Editor
 * Description: Edit the live website. Click text, photos, the header, or the footer, then save. Header and footer changes show on every page.
 * Version: 1.0.0
 * Author: AMZ Prints
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: amz-visual-editor
 *
 * @package AMZ_Visual_Editor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AMZ_VE_VERSION', '1.0.0' );
define( 'AMZ_VE_FILE', __FILE__ );
define( 'AMZ_VE_OPTION', 'amz_ve_content' );

/**
 * Saved edits: global (header and footer) plus one list per page path.
 *
 * @return array
 */
function amz_ve_edits() {
	$saved = get_option( AMZ_VE_OPTION, array() );
	if ( ! is_array( $saved ) ) {
		$saved = array();
	}
	if ( empty( $saved['global'] ) || ! is_array( $saved['global'] ) ) {
		$saved['global'] = array();
	}
	if ( empty( $saved['pages'] ) || ! is_array( $saved['pages'] ) ) {
		$saved['pages'] = array();
	}
	return $saved;
}

/**
 * Current front-end path, such as / or /contact/.
 *
 * @return string
 */
function amz_ve_request_path() {
	$uri  = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';
	$path = wp_parse_url( $uri, PHP_URL_PATH );
	$path = is_string( $path ) ? rawurldecode( $path ) : '/';
	$path = '/' . trim( $path, '/' );
	if ( '/' !== $path ) {
		$path = untrailingslashit( $path ) . '/';
	}
	return $path;
}

/**
 * Only an administrator who can change the site may open the editor.
 *
 * @return bool
 */
function amz_ve_can_edit() {
	return is_user_logged_in() && current_user_can( 'edit_theme_options' );
}

/**
 * Editor is open on this request.
 *
 * @return bool
 */
function amz_ve_is_editing() {
	if ( ! amz_ve_can_edit() ) {
		return false;
	}
	return isset( $_GET['amz-edit'] ) && '1' === (string) wp_unslash( $_GET['amz-edit'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
}

/**
 * A CSS path produced by the editor: tag:nth-of-type(n) > ...
 *
 * @param string $path Path.
 * @return bool
 */
function amz_ve_valid_path( $path ) {
	$path = (string) $path;
	if ( strlen( $path ) < 8 || strlen( $path ) > 700 ) {
		return false;
	}
	return (bool) preg_match( '/^[a-z][a-z0-9]*:nth-of-type\(\d+\)(?: > [a-z][a-z0-9]*:nth-of-type\(\d+\))*$/', $path );
}

/**
 * Editor path as tag and nth-of-type pairs, in document order.
 *
 * @param string $path Editor path.
 * @return array<int, array{0:string,1:int}>
 */
function amz_ve_path_steps( $path ) {
	if ( ! amz_ve_valid_path( $path ) ) {
		return array();
	}
	$steps = array();
	foreach ( explode( ' > ', $path ) as $part ) {
		if ( ! preg_match( '/^([a-z][a-z0-9]*):nth-of-type\((\d+)\)$/', $part, $match ) ) {
			return array();
		}
		$steps[] = array( $match[1], (int) $match[2] );
	}
	return $steps;
}

/**
 * Tags the browser does not give an end tag.
 *
 * @return array<string, bool>
 */
function amz_ve_void_tags() {
	return array(
		'area'   => true,
		'base'   => true,
		'br'     => true,
		'col'    => true,
		'embed'  => true,
		'hr'     => true,
		'img'    => true,
		'input'  => true,
		'link'   => true,
		'meta'   => true,
		'param'  => true,
		'source' => true,
		'track'  => true,
		'wbr'    => true,
	);
}

/**
 * Find the element the browser pointed at, without rewriting the rest of the page.
 *
 * @param string $html  Full page HTML.
 * @param array  $steps Path steps.
 * @return array|null
 */
function amz_ve_find_element( $html, $steps ) {
	$len   = strlen( $html );
	$i     = 0;
	$stack = array();
	$root  = array();
	$void  = amz_ve_void_tags();
	$raw   = array(
		'script'   => true,
		'style'    => true,
		'textarea' => true,
		'title'    => true,
	);
	$hit   = null;

	while ( $i < $len ) {
		$lt = strpos( $html, '<', $i );
		if ( false === $lt ) {
			break;
		}
		$i = $lt;
		if ( $i + 1 >= $len ) {
			break;
		}
		if ( 0 === substr_compare( $html, '<!--', $i, 4 ) ) {
			$end = strpos( $html, '-->', $i + 4 );
			$i   = ( false === $end ) ? $len : $end + 3;
			continue;
		}
		$next = $html[ $i + 1 ];
		if ( '!' === $next || '?' === $next ) {
			$end = strpos( $html, '>', $i + 2 );
			$i   = ( false === $end ) ? $len : $end + 1;
			continue;
		}
		if ( '/' === $next ) {
			if ( ! preg_match( '/^<\/([a-zA-Z0-9]+)/', substr( $html, $i, 30 ), $match ) ) {
				$i++;
				continue;
			}
			$tag = strtolower( $match[1] );
			$end = strpos( $html, '>', $i );
			$close_end = ( false === $end ) ? $len : $end + 1;
			while ( $stack ) {
				$popped = array_pop( $stack );
				if ( ! empty( $popped['hit'] ) ) {
					return array(
						'start'         => $hit['start'],
						'start_tag_end' => $hit['start_tag_end'],
						'end'           => $i,
						'close_end'     => $close_end,
						'void'          => false,
					);
				}
				if ( $popped['tag'] === $tag ) {
					break;
				}
			}
			$i = $close_end;
			continue;
		}
		if ( ! preg_match( '/^<([a-zA-Z0-9]+)/', substr( $html, $i, 30 ), $match ) ) {
			$i++;
			continue;
		}
		$tag       = strtolower( $match[1] );
		$tag_start = $i;
		$j         = $i + 1 + strlen( $match[1] );
		$quote     = '';
		$self      = false;
		while ( $j < $len ) {
			$char = $html[ $j ];
			if ( '' !== $quote ) {
				if ( $char === $quote ) {
					$quote = '';
				}
				$j++;
				continue;
			}
			if ( '"' === $char || "'" === $char ) {
				$quote = $char;
				$j++;
				continue;
			}
			if ( '>' === $char ) {
				$self = ( $j > $tag_start && '/' === $html[ $j - 1 ] );
				$j++;
				break;
			}
			$j++;
		}
		$tag_end = $j;

		$parent_tag = $stack ? $stack[ count( $stack ) - 1 ]['tag'] : '';
		if ( 'tr' === $tag && 'table' === $parent_tag ) {
			$top = count( $stack ) - 1;
			$stack[ $top ]['counts']['tbody'] = ( $stack[ $top ]['counts']['tbody'] ?? 0 ) + 1;
			$stack[] = array(
				'tag'    => 'tbody',
				'index'  => $stack[ $top ]['counts']['tbody'],
				'counts' => array(),
				'hit'    => false,
			);
		}

		if ( $stack ) {
			$top = count( $stack ) - 1;
			$stack[ $top ]['counts'][ $tag ] = ( $stack[ $top ]['counts'][ $tag ] ?? 0 ) + 1;
			$index = $stack[ $top ]['counts'][ $tag ];
		} else {
			$root[ $tag ] = ( $root[ $tag ] ?? 0 ) + 1;
			$index        = $root[ $tag ];
		}

		$in_foreign = false;
		foreach ( $stack as $frame ) {
			if ( 'svg' === $frame['tag'] || 'math' === $frame['tag'] ) {
				$in_foreign = true;
				break;
			}
		}
		$is_void = isset( $void[ $tag ] ) || ( $self && $in_foreign );

		$stack[] = array(
			'tag'    => $tag,
			'index'  => $index,
			'counts' => array(),
			'hit'    => false,
		);
		$depth = count( $stack );
		$match_path = ( $depth === count( $steps ) );
		if ( $match_path ) {
			foreach ( $stack as $depth_index => $frame ) {
				if ( $frame['tag'] !== $steps[ $depth_index ][0] || $frame['index'] !== $steps[ $depth_index ][1] ) {
					$match_path = false;
					break;
				}
			}
		}
		if ( $match_path ) {
			$stack[ $depth - 1 ]['hit'] = true;
			$hit = array(
				'start'         => $tag_start,
				'start_tag_end' => $tag_end,
			);
		}

		if ( $is_void ) {
			$popped = array_pop( $stack );
			$i      = $tag_end;
			if ( ! empty( $popped['hit'] ) ) {
				return array(
					'start'         => $hit['start'],
					'start_tag_end' => $hit['start_tag_end'],
					'end'           => $tag_end,
					'close_end'     => $tag_end,
					'void'          => true,
				);
			}
			continue;
		}

		if ( isset( $raw[ $tag ] ) ) {
			$close = stripos( $html, '</' . $tag, $tag_end );
			if ( false === $close ) {
				$close_end = $len;
				$close     = $len;
			} else {
				$gt        = strpos( $html, '>', $close );
				$close_end = ( false === $gt ) ? $len : $gt + 1;
			}
			$popped = array_pop( $stack );
			if ( ! empty( $popped['hit'] ) ) {
				return array(
					'start'         => $hit['start'],
					'start_tag_end' => $hit['start_tag_end'],
					'end'           => $close,
					'close_end'     => $close_end,
					'void'          => false,
				);
			}
			$i = $close_end;
			continue;
		}

		$i = $tag_end;
	}
	return null;
}

/**
 * Set one attribute on a start tag, leaving every other character alone.
 *
 * @param string $tag   Start tag.
 * @param string $name  Attribute name.
 * @param string $value Raw value.
 * @return string
 */
function amz_ve_set_attr( $tag, $name, $value ) {
	$escaped = htmlspecialchars( (string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	$pattern = '/\s' . preg_quote( $name, '/' ) . '\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)/i';
	$done    = false;
	$out     = preg_replace_callback(
		$pattern,
		static function () use ( $name, $escaped, &$done ) {
			$done = true;
			return ' ' . $name . '="' . $escaped . '"';
		},
		$tag,
		1
	);
	if ( $done && is_string( $out ) ) {
		return $out;
	}
	if ( preg_match( '/\/?>$/', $tag, $end, PREG_OFFSET_CAPTURE ) ) {
		$pos = $end[0][1];
		return substr( $tag, 0, $pos ) . ' ' . $name . '="' . $escaped . '" ' . substr( $tag, $pos );
	}
	return $tag;
}

/**
 * Remove one attribute from a start tag.
 *
 * @param string $tag  Start tag.
 * @param string $name Attribute name.
 * @return string
 */
function amz_ve_remove_attr( $tag, $name ) {
	$pattern = '/\s' . preg_quote( $name, '/' ) . '\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)/i';
	$out     = preg_replace( $pattern, '', $tag, 1 );
	return is_string( $out ) ? $out : $tag;
}

/**
 * Write one saved change into the original HTML.
 *
 * @param string $html Full page HTML.
 * @param array  $item Saved change.
 * @return string
 */
function amz_ve_apply_item_html( $html, $item ) {
	if ( ! is_array( $item ) ) {
		return $html;
	}
	$steps = amz_ve_path_steps( $item['path'] ?? '' );
	$range = $steps ? amz_ve_find_element( $html, $steps ) : null;
	if ( ! $range ) {
		return $html;
	}
	$start_tag = substr( $html, $range['start'], $range['start_tag_end'] - $range['start'] );
	if ( ! preg_match( '/^<([a-zA-Z0-9]+)/', $start_tag, $tag_match ) ) {
		return $html;
	}
	$tag  = strtolower( $tag_match[1] );
	$type = (string) ( $item['type'] ?? 'text' );
	if ( 'image' === $type ) {
		if ( 'img' !== $tag ) {
			return $html;
		}
		$src = isset( $item['src'] ) ? esc_url_raw( (string) $item['src'] ) : '';
		if ( ! $src ) {
			return $html;
		}
		$start_tag = amz_ve_set_attr( $start_tag, 'src', $src );
		$start_tag = amz_ve_remove_attr( $start_tag, 'srcset' );
		$start_tag = amz_ve_remove_attr( $start_tag, 'sizes' );
		$start_tag = amz_ve_remove_attr( $start_tag, 'data-src' );
		if ( isset( $item['alt'] ) ) {
			$start_tag = amz_ve_set_attr( $start_tag, 'alt', sanitize_text_field( (string) $item['alt'] ) );
		}
		return substr( $html, 0, $range['start'] ) . $start_tag . substr( $html, $range['start_tag_end'] );
	}
	if ( ! empty( $range['void'] ) ) {
		return $html;
	}
	if ( 'a' === $tag && ! empty( $item['href'] ) ) {
		$href = amz_ve_sanitize_href( (string) $item['href'] );
		if ( $href ) {
			$start_tag = amz_ve_set_attr( $start_tag, 'href', $href );
		}
	}
	$text = sanitize_textarea_field( (string) ( $item['text'] ?? '' ) );
	if ( strlen( $text ) > 5000 ) {
		$text = function_exists( 'mb_substr' ) ? mb_substr( $text, 0, 5000, 'UTF-8' ) : substr( $text, 0, 5000 );
	}
	$escaped = htmlspecialchars( $text, ENT_NOQUOTES | ENT_HTML5, 'UTF-8' );
	$end_tag = substr( $html, $range['end'], $range['close_end'] - $range['end'] );
	return substr( $html, 0, $range['start'] ) . $start_tag . $escaped . $end_tag . substr( $html, $range['close_end'] );
}

/**
 * Keep site links and normal web addresses. Drop anything else.
 *
 * @param string $href Raw link.
 * @return string
 */
function amz_ve_sanitize_href( $href ) {
	$href = trim( $href );
	if ( '' === $href ) {
		return '';
	}
	if ( '/' === substr( $href, 0, 1 ) && '/' !== substr( $href, 1, 1 ) ) {
		return esc_url_raw( home_url( $href ) ) ? $href : '';
	}
	$clean = esc_url_raw( $href, array( 'http', 'https', 'mailto', 'tel' ) );
	return $clean ? $clean : '';
}

/**
 * Write saved text and photos into the finished HTML.
 *
 * @param string $html Full page HTML.
 * @return string
 */
function amz_ve_apply_html( $html ) {
	if ( ! is_string( $html ) || false === stripos( $html, '<html' ) ) {
		return $html;
	}
	$edits = amz_ve_edits();
	$path  = function_exists( 'amz_ve_request_path' ) ? amz_ve_request_path() : '/';
	$page  = ( isset( $edits['pages'][ $path ] ) && is_array( $edits['pages'][ $path ] ) ) ? $edits['pages'][ $path ] : array();
	if ( ! $edits['global'] && ! $page ) {
		return $html;
	}
	foreach ( array( $edits['global'], $page ) as $bucket ) {
		$bucket = array_values( $bucket );
		usort(
			$bucket,
			static function ( $a, $b ) {
				$a_depth = substr_count( (string) ( $a['path'] ?? '' ), '>' );
				$b_depth = substr_count( (string) ( $b['path'] ?? '' ), '>' );
				return $b_depth <=> $a_depth;
			}
		);
		foreach ( $bucket as $item ) {
			$html = amz_ve_apply_item_html( $html, $item );
		}
	}
	return $html;
}

/**
 * Start capturing the page so edits can be written in before it is sent.
 */
function amz_ve_start_buffer() {
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
		return;
	}
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return;
	}
	$edits = amz_ve_edits();
	$path  = amz_ve_request_path();
	$has   = ! empty( $edits['global'] ) || ! empty( $edits['pages'][ $path ] );
	if ( ! $has ) {
		return;
	}
	ob_start( 'amz_ve_apply_html' );
}
add_action( 'template_redirect', 'amz_ve_start_buffer', 0 );

/**
 * Keep the editor preview out of the page cache.
 */
function amz_ve_nocache_editor() {
	if ( ! amz_ve_is_editing() || headers_sent() ) {
		return;
	}
	header( 'Cache-Control: no-store, no-cache, must-revalidate, max-age=0' );
	header( 'Pragma: no-cache' );
}
add_action( 'send_headers', 'amz_ve_nocache_editor' );

/**
 * Top bar link, plus a button on the page when the admin bar is hidden.
 *
 * @param WP_Admin_Bar $bar Admin bar.
 */
function amz_ve_admin_bar( $bar ) {
	if ( ! amz_ve_can_edit() || is_admin() ) {
		return;
	}
	$editing = amz_ve_is_editing();
	$bar->add_node(
		array(
			'id'    => 'amz-ve-edit',
			'title' => $editing ? __( 'Exit editor', 'amz-visual-editor' ) : __( 'Edit site', 'amz-visual-editor' ),
			'href'  => $editing ? remove_query_arg( 'amz-edit' ) : add_query_arg( 'amz-edit', '1' ),
		)
	);
}
add_action( 'admin_bar_menu', 'amz_ve_admin_bar', 80 );

/**
 * Load the editor on the page being viewed.
 */
function amz_ve_enqueue_editor() {
	if ( ! amz_ve_is_editing() ) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_style( 'amz-ve-editor', plugins_url( 'assets/editor.css', AMZ_VE_FILE ), array(), AMZ_VE_VERSION );
	wp_enqueue_script( 'amz-ve-editor', plugins_url( 'assets/editor.js', AMZ_VE_FILE ), array( 'jquery', 'media-editor' ), AMZ_VE_VERSION, true );
	wp_localize_script(
		'amz-ve-editor',
		'amzVisualEditor',
		array(
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'amz_ve_save' ),
			'path'    => amz_ve_request_path(),
			'exitUrl' => remove_query_arg( 'amz-edit' ),
		)
	);
}
add_action( 'wp_enqueue_scripts', 'amz_ve_enqueue_editor', 40 );

/**
 * Clean one change sent by the editor.
 *
 * @param array $raw Posted item.
 * @return array|null
 */
function amz_ve_sanitize_item( $raw ) {
	if ( ! is_array( $raw ) || ! amz_ve_valid_path( $raw['path'] ?? '' ) ) {
		return null;
	}
	$type = ( isset( $raw['type'] ) && 'image' === $raw['type'] ) ? 'image' : 'text';
	$item = array(
		'path' => (string) $raw['path'],
		'type' => $type,
	);
	if ( 'image' === $type ) {
		$src = isset( $raw['src'] ) ? esc_url_raw( (string) $raw['src'] ) : '';
		if ( ! $src ) {
			return null;
		}
		$item['src'] = $src;
		if ( isset( $raw['alt'] ) ) {
			$item['alt'] = sanitize_text_field( (string) $raw['alt'] );
		}
		return $item;
	}
	$item['text'] = sanitize_textarea_field( (string) ( $raw['text'] ?? '' ) );
	if ( strlen( $item['text'] ) > 5000 ) {
		$item['text'] = substr( $item['text'], 0, 5000 );
	}
	if ( ! empty( $raw['href'] ) ) {
		$href = amz_ve_sanitize_href( (string) $raw['href'] );
		if ( $href ) {
			$item['href'] = $href;
		}
	}
	return $item;
}

/**
 * Merge incoming changes into a list, replacing an older change for the same element.
 *
 * @param array $list  Existing items.
 * @param array $items New items.
 * @return array
 */
function amz_ve_merge_items( $list, $items ) {
	foreach ( $items as $item ) {
		$clean = amz_ve_sanitize_item( $item );
		if ( ! $clean ) {
			continue;
		}
		$replaced = false;
		foreach ( $list as $index => $existing ) {
			if ( is_array( $existing ) && ( $existing['path'] ?? '' ) === $clean['path'] ) {
				$list[ $index ] = $clean;
				$replaced       = true;
				break;
			}
		}
		if ( ! $replaced ) {
			$list[] = $clean;
		}
	}
	if ( count( $list ) > 500 ) {
		$list = array_slice( $list, -500 );
	}
	return array_values( $list );
}

/**
 * Save editor changes.
 */
function amz_ve_ajax_save() {
	if ( ! amz_ve_can_edit() ) {
		wp_send_json_error( array( 'message' => __( 'You cannot edit this site.', 'amz-visual-editor' ) ), 403 );
	}
	check_ajax_referer( 'amz_ve_save', 'nonce' );
	$payload = isset( $_POST['changes'] ) ? json_decode( wp_unslash( $_POST['changes'] ), true ) : null;
	if ( ! is_array( $payload ) ) {
		wp_send_json_error( array( 'message' => __( 'Nothing to save.', 'amz-visual-editor' ) ), 400 );
	}
	$edits = amz_ve_edits();
	if ( ! empty( $payload['global'] ) && is_array( $payload['global'] ) ) {
		$edits['global'] = amz_ve_merge_items( $edits['global'], $payload['global'] );
	}
	$page_path = isset( $payload['path'] ) ? amz_ve_request_path_from( (string) $payload['path'] ) : amz_ve_request_path();
	if ( ! empty( $payload['page'] ) && is_array( $payload['page'] ) ) {
		$current = ( isset( $edits['pages'][ $page_path ] ) && is_array( $edits['pages'][ $page_path ] ) ) ? $edits['pages'][ $page_path ] : array();
		$edits['pages'][ $page_path ] = amz_ve_merge_items( $current, $payload['page'] );
	}
	if ( ! empty( $payload['reset'] ) ) {
		if ( 'page' === $payload['reset'] ) {
			unset( $edits['pages'][ $page_path ] );
		} elseif ( 'global' === $payload['reset'] ) {
			$edits['global'] = array();
		} elseif ( 'all' === $payload['reset'] ) {
			$edits = array(
				'global' => array(),
				'pages'  => array(),
			);
		}
	}
	update_option( AMZ_VE_OPTION, $edits, true );
	wp_send_json_success( array( 'message' => __( 'Saved.', 'amz-visual-editor' ) ) );
}
add_action( 'wp_ajax_amz_ve_save', 'amz_ve_ajax_save' );

/**
 * Keep a posted page path in the same shape as the request path.
 *
 * @param string $path Raw path.
 * @return string
 */
function amz_ve_request_path_from( $path ) {
	$path = wp_parse_url( $path, PHP_URL_PATH );
	$path = is_string( $path ) ? rawurldecode( $path ) : '/';
	$path = '/' . trim( $path, '/' );
	if ( '/' !== $path ) {
		$path = untrailingslashit( $path ) . '/';
	}
	return $path;
}

/**
 * Instructions and a way to undo every edit.
 */
function amz_ve_admin_page() {
	if ( ! amz_ve_can_edit() ) {
		return;
	}
	if ( isset( $_POST['amz_ve_reset_all'] ) && check_admin_referer( 'amz_ve_reset_all' ) ) {
		delete_option( AMZ_VE_OPTION );
		echo '<div class="notice notice-success"><p>' . esc_html__( 'All visual edits were removed. The site is back to the theme text and photos.', 'amz-visual-editor' ) . '</p></div>';
	}
	$home = home_url( '/?amz-edit=1' );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'AMZ Visual Editor', 'amz-visual-editor' ); ?></h1>
		<p><?php esc_html_e( 'Change text, photos, the header, and the footer on the live site. You do not need to edit code.', 'amz-visual-editor' ); ?></p>
		<ol>
			<li><?php esc_html_e( 'Open the page you want to change.', 'amz-visual-editor' ); ?></li>
			<li><?php esc_html_e( 'Click Edit site in the top bar.', 'amz-visual-editor' ); ?></li>
			<li><?php esc_html_e( 'Click a heading, paragraph, button, menu name, or photo.', 'amz-visual-editor' ); ?></li>
			<li><?php esc_html_e( 'Click Save. Header, footer, and the floating buttons change on every page. Other text changes only on the page you edited.', 'amz-visual-editor' ); ?></li>
			<li><?php esc_html_e( 'Clear the Hostinger cache, then refresh the site.', 'amz-visual-editor' ); ?></li>
		</ol>
		<p><a class="button button-primary" href="<?php echo esc_url( $home ); ?>"><?php esc_html_e( 'Edit the homepage', 'amz-visual-editor' ); ?></a></p>
		<form method="post">
			<?php wp_nonce_field( 'amz_ve_reset_all' ); ?>
			<p><button class="button" name="amz_ve_reset_all" value="1" onclick="return confirm('Remove every visual edit?');"><?php esc_html_e( 'Reset all edits', 'amz-visual-editor' ); ?></button></p>
		</form>
	</div>
	<?php
}
add_action(
	'admin_menu',
	function () {
		add_menu_page(
			__( 'AMZ Editor', 'amz-visual-editor' ),
			__( 'AMZ Editor', 'amz-visual-editor' ),
			'edit_theme_options',
			'amz-visual-editor',
			'amz_ve_admin_page',
			'dashicons-edit-large',
			58
		);
	}
);
