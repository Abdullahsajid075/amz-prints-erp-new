<?php
/**
 * Plugin Name: AMZ Visual Editor
 * Description: Edit banners, paragraphs, and other photos on the live site. Change font, size, style, and alignment, and move sections up or down. Product names and product photos stay locked.
 * Version: 1.1.0
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

define( 'AMZ_VE_VERSION', '1.1.0' );
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
	if ( preg_match( '/^block:b\d+$/', $path ) ) {
		return true;
	}
	if ( preg_match( '/^block:b\d+ > /', $path ) ) {
		$path = preg_replace( '/^block:b\d+ > /', '', $path );
	}
	return (bool) preg_match( '/^[a-z][a-z0-9]*:nth-of-type\(\d+\)(?: > [a-z][a-z0-9]*:nth-of-type\(\d+\))*$/', $path );
}

/**
 * Page edits, including the section order. Older saves were a plain list.
 *
 * @param array  $edits Saved option.
 * @param string $path  Request path.
 * @return array{items:array,order:array}
 */
function amz_ve_page_state( $edits, $path ) {
	$raw = ( isset( $edits['pages'][ $path ] ) && is_array( $edits['pages'][ $path ] ) ) ? $edits['pages'][ $path ] : array();
	if ( array_key_exists( 'items', $raw ) || array_key_exists( 'order', $raw ) ) {
		return array(
			'items' => is_array( $raw['items'] ?? null ) ? $raw['items'] : array(),
			'order' => amz_ve_clean_order( $raw['order'] ?? array() ),
		);
	}
	return array(
		'items' => $raw,
		'order' => array(),
	);
}

/**
 * Keep only real section ids.
 *
 * @param mixed $order Posted order.
 * @return string[]
 */
function amz_ve_clean_order( $order ) {
	if ( ! is_array( $order ) ) {
		return array();
	}
	$clean = array();
	foreach ( $order as $id ) {
		$id = (string) $id;
		if ( preg_match( '/^b\d+$/', $id ) && ! in_array( $id, $clean, true ) ) {
			$clean[] = $id;
		}
	}
	return $clean;
}

/**
 * Font and alignment choices the editor is allowed to store.
 *
 * @param mixed $raw Posted style.
 * @return array<string,string>
 */
function amz_ve_sanitize_style( $raw ) {
	if ( ! is_array( $raw ) ) {
		return array();
	}
	$style = array();
	$align = isset( $raw['align'] ) ? (string) $raw['align'] : '';
	if ( in_array( $align, array( 'left', 'center', 'right', 'justify' ), true ) ) {
		$style['align'] = $align;
	}
	$font = isset( $raw['font'] ) ? (string) $raw['font'] : '';
	if ( in_array( $font, array( 'Manrope', 'Arial', 'Georgia', 'Times New Roman' ), true ) ) {
		$style['font'] = $font;
	}
	$weight = isset( $raw['weight'] ) ? (string) $raw['weight'] : '';
	if ( in_array( $weight, array( '400', '700' ), true ) ) {
		$style['weight'] = $weight;
	}
	$italic = isset( $raw['italic'] ) ? (string) $raw['italic'] : '';
	if ( in_array( $italic, array( 'normal', 'italic' ), true ) ) {
		$style['italic'] = $italic;
	}
	$size = isset( $raw['size'] ) ? (int) $raw['size'] : 0;
	if ( $size >= 12 && $size <= 72 ) {
		$style['size'] = (string) $size;
	}
	return $style;
}

/**
 * Inline CSS for a saved text style.
 *
 * @param array $style Sanitized style.
 * @return string
 */
function amz_ve_style_css( $style ) {
	$bits = array();
	if ( ! empty( $style['align'] ) ) {
		$bits[] = 'text-align:' . $style['align'];
	}
	if ( ! empty( $style['font'] ) ) {
		$bits[] = "font-family:'" . $style['font'] . "',sans-serif";
	}
	if ( ! empty( $style['weight'] ) ) {
		$bits[] = 'font-weight:' . $style['weight'];
	}
	if ( ! empty( $style['italic'] ) ) {
		$bits[] = 'font-style:' . $style['italic'];
	}
	if ( ! empty( $style['size'] ) ) {
		$bits[] = 'font-size:' . $style['size'] . 'px';
	}
	return implode( ';', $bits );
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
 * Read one tag at an offset.
 *
 * @param string $html Page HTML.
 * @param int    $i    Offset of `<`.
 * @return array|null
 */
function amz_ve_tag_at( $html, $i ) {
	$len = strlen( $html );
	if ( $i < 0 || $i >= $len || '<' !== $html[ $i ] ) {
		return null;
	}
	if ( 0 === substr_compare( $html, '<!--', $i, 4 ) ) {
		$end = strpos( $html, '-->', $i + 4 );
		return array(
			'kind' => 'skip',
			'next' => false === $end ? $len : $end + 3,
		);
	}
	$next = ( $i + 1 < $len ) ? $html[ $i + 1 ] : '';
	if ( '!' === $next || '?' === $next ) {
		$end = strpos( $html, '>', $i + 2 );
		return array(
			'kind' => 'skip',
			'next' => false === $end ? $len : $end + 1,
		);
	}
	$is_end = ( '/' === $next );
	if ( ! preg_match( $is_end ? '/^<\/([a-zA-Z0-9]+)/' : '/^<([a-zA-Z0-9]+)/', substr( $html, $i, 40 ), $match ) ) {
		return array(
			'kind' => 'skip',
			'next' => $i + 1,
		);
	}
	$tag = strtolower( $match[1] );
	if ( $is_end ) {
		$gt = strpos( $html, '>', $i );
		return array(
			'kind'  => 'end',
			'tag'   => $tag,
			'start' => $i,
			'next'  => false === $gt ? $len : $gt + 1,
		);
	}
	$j     = $i + 1 + strlen( $match[1] );
	$quote = '';
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
			$j++;
			break;
		}
		$j++;
	}
	$void = amz_ve_void_tags();
	return array(
		'kind'    => 'start',
		'tag'     => $tag,
		'start'   => $i,
		'tag_end' => $j,
		'next'    => $j,
		'void'    => isset( $void[ $tag ] ),
	);
}

/**
 * Start and end offsets of the element that begins at $start.
 *
 * @param string $html  Page HTML.
 * @param int    $start Offset of `<`.
 * @return array|null
 */
function amz_ve_span_from( $html, $start ) {
	$open = amz_ve_tag_at( $html, $start );
	if ( ! $open || 'start' !== $open['kind'] ) {
		return null;
	}
	if ( ! empty( $open['void'] ) ) {
		return array(
			'start'         => $open['start'],
			'start_tag_end' => $open['tag_end'],
			'end'           => $open['tag_end'],
			'close_end'     => $open['tag_end'],
			'void'          => true,
			'tag'           => $open['tag'],
		);
	}
	$raw = array(
		'script'   => true,
		'style'    => true,
		'textarea' => true,
		'title'    => true,
	);
	if ( isset( $raw[ $open['tag'] ] ) ) {
		$close = stripos( $html, '</' . $open['tag'], $open['tag_end'] );
		$gt    = ( false === $close ) ? false : strpos( $html, '>', $close );
		return array(
			'start'         => $open['start'],
			'start_tag_end' => $open['tag_end'],
			'end'           => false === $close ? strlen( $html ) : $close,
			'close_end'     => false === $gt ? strlen( $html ) : $gt + 1,
			'void'          => false,
			'tag'           => $open['tag'],
		);
	}
	$i     = $open['tag_end'];
	$len   = strlen( $html );
	$depth = 1;
	while ( $i < $len ) {
		$lt = strpos( $html, '<', $i );
		if ( false === $lt ) {
			break;
		}
		$tok = amz_ve_tag_at( $html, $lt );
		if ( ! $tok ) {
			break;
		}
		if ( 'start' === $tok['kind'] && $tok['tag'] === $open['tag'] && empty( $tok['void'] ) ) {
			$depth++;
		} elseif ( 'end' === $tok['kind'] && $tok['tag'] === $open['tag'] ) {
			$depth--;
			if ( 0 === $depth ) {
				return array(
					'start'         => $open['start'],
					'start_tag_end' => $open['tag_end'],
					'end'           => $tok['start'],
					'close_end'     => $tok['next'],
					'void'          => false,
					'tag'           => $open['tag'],
				);
			}
		} elseif ( 'start' === $tok['kind'] && isset( $raw[ $tok['tag'] ] ) && empty( $tok['void'] ) ) {
			$close = stripos( $html, '</' . $tok['tag'], $tok['tag_end'] );
			$i     = ( false === $close ) ? $len : ( strpos( $html, '>', $close ) + 1 );
			continue;
		}
		$i = $tok['next'];
	}
	return null;
}

/**
 * The main element and its direct children, in source order.
 *
 * @param string $html Page HTML.
 * @return array{main:?array,children:array}
 */
function amz_ve_main_children( $html ) {
	$empty = array(
		'main'     => null,
		'children' => array(),
	);
	$at    = 0;
	$len   = strlen( $html );
	$main  = null;
	while ( $at < $len ) {
		$lt = stripos( $html, '<main', $at );
		if ( false === $lt ) {
			break;
		}
		$after = $lt + 5;
		if ( $after < $len && preg_match( '/[a-z0-9]/i', $html[ $after ] ) ) {
			$at = $after;
			continue;
		}
		$main = amz_ve_span_from( $html, $lt );
		break;
	}
	if ( ! $main || ! empty( $main['void'] ) ) {
		return $empty;
	}
	$children = array();
	$i        = $main['start_tag_end'];
	while ( $i < $main['end'] ) {
		$lt = strpos( $html, '<', $i );
		if ( false === $lt || $lt >= $main['end'] ) {
			break;
		}
		$tok = amz_ve_tag_at( $html, $lt );
		if ( ! $tok ) {
			break;
		}
		if ( 'start' === $tok['kind'] ) {
			$span = amz_ve_span_from( $html, $lt );
			if ( ! $span ) {
				break;
			}
			$children[] = $span;
			$i          = $span['close_end'];
			continue;
		}
		$i = $tok['next'];
	}
	return array(
		'main'     => $main,
		'children' => $children,
	);
}

/**
 * Mark each main section so the editor can move it without losing its text.
 *
 * @param string $html Page HTML.
 * @return string
 */
function amz_ve_stamp_blocks( $html ) {
	$info = amz_ve_main_children( $html );
	if ( empty( $info['children'] ) ) {
		return $html;
	}
	$children = $info['children'];
	for ( $n = count( $children ) - 1; $n >= 0; $n-- ) {
		$span      = $children[ $n ];
		$start_tag = substr( $html, $span['start'], $span['start_tag_end'] - $span['start'] );
		if ( false !== stripos( $start_tag, 'data-amz-block=' ) ) {
			continue;
		}
		$start_tag = amz_ve_set_attr( $start_tag, 'data-amz-block', 'b' . ( $n + 1 ) );
		$html      = substr( $html, 0, $span['start'] ) . $start_tag . substr( $html, $span['start_tag_end'] );
	}
	return $html;
}

/**
 * Put the main sections in the saved order.
 *
 * @param string   $html  Page HTML.
 * @param string[] $order Section ids.
 * @return string
 */
function amz_ve_reorder_blocks( $html, $order ) {
	$order = amz_ve_clean_order( $order );
	$info  = amz_ve_main_children( $html );
	if ( count( $order ) < 1 || count( $info['children'] ) < 2 || empty( $info['main'] ) ) {
		return $html;
	}
	$map = array();
	foreach ( $info['children'] as $n => $span ) {
		$map[ 'b' . ( $n + 1 ) ] = substr( $html, $span['start'], $span['close_end'] - $span['start'] );
	}
	$used   = array();
	$chunks = array();
	foreach ( $order as $id ) {
		if ( isset( $map[ $id ] ) && empty( $used[ $id ] ) ) {
			$chunks[]   = $map[ $id ];
			$used[ $id ] = true;
		}
	}
	foreach ( $map as $id => $chunk ) {
		if ( empty( $used[ $id ] ) ) {
			$chunks[] = $chunk;
		}
	}
	$main = $info['main'];
	return substr( $html, 0, $main['start_tag_end'] ) . "\n" . implode( "\n", $chunks ) . "\n" . substr( $html, $main['end'] );
}

/**
 * Locate a saved element. Block paths stay valid after a section moves.
 *
 * @param string $html Page HTML.
 * @param string $path Editor path.
 * @return array|null
 */
function amz_ve_locate( $html, $path ) {
	$path = (string) $path;
	if ( preg_match( '/^block:(b\d+)(?: > (.*))?$/', $path, $match ) ) {
		$info = amz_ve_main_children( $html );
		$index = (int) substr( $match[1], 1 ) - 1;
		if ( ! isset( $info['children'][ $index ] ) ) {
			return null;
		}
		$block = $info['children'][ $index ];
		$rest  = isset( $match[2] ) ? $match[2] : '';
		if ( '' === $rest ) {
			return $block;
		}
		$steps = amz_ve_path_steps( $rest );
		if ( ! $steps ) {
			return null;
		}
		$inner = substr( $html, $block['start_tag_end'], $block['end'] - $block['start_tag_end'] );
		$found = amz_ve_find_element( $inner, $steps );
		if ( ! $found ) {
			return null;
		}
		$base = $block['start_tag_end'];
		$found['start']         += $base;
		$found['start_tag_end'] += $base;
		$found['end']           += $base;
		$found['close_end']     += $base;
		return $found;
	}
	$steps = amz_ve_path_steps( $path );
	return $steps ? amz_ve_find_element( $html, $steps ) : null;
}

/**
 * Replace or add a photo on an img or a banner box.
 *
 * @param string $tag Start tag.
 * @param string $src Photo URL.
 * @param string $alt Alt text.
 * @param string $name Element name.
 * @return string
 */
function amz_ve_apply_image_tag( $tag, $src, $alt, $name ) {
	if ( 'img' === $name ) {
		$tag = amz_ve_set_attr( $tag, 'src', $src );
		$tag = amz_ve_remove_attr( $tag, 'srcset' );
		$tag = amz_ve_remove_attr( $tag, 'sizes' );
		$tag = amz_ve_remove_attr( $tag, 'data-src' );
		$tag = amz_ve_remove_attr( $tag, 'data-srcset' );
		$tag = amz_ve_remove_attr( $tag, 'data-lazy-src' );
		if ( '' !== $alt ) {
			$tag = amz_ve_set_attr( $tag, 'alt', $alt );
		}
		return $tag;
	}
	$safe = str_replace( array( "'", '"', '(', ')', '\\', '<', '>' ), '', $src );
	$decl = "background-image:url('" . $safe . "')";
	if ( preg_match( '/\sstyle\s*=\s*("|\')(.*?)\1/is', $tag, $match ) ) {
		$existing = $match[2];
		if ( preg_match( '/background-image\s*:/i', $existing ) ) {
			$existing = preg_replace( '/background-image\s*:[^;]*/i', $decl, $existing, 1 );
		} else {
			$existing = rtrim( $existing, "; \t" ) . ';' . $decl;
		}
		return amz_ve_set_attr( $tag, 'style', $existing );
	}
	return amz_ve_set_attr( $tag, 'style', $decl );
}

/**
 * Add text alignment and font rules without dropping the other styles.
 *
 * @param string $tag Start tag.
 * @param string $css New declarations.
 * @return string
 */
function amz_ve_merge_style_attr( $tag, $css ) {
	if ( '' === $css ) {
		return $tag;
	}
	if ( preg_match( '/\sstyle\s*=\s*("|\')(.*?)\1/is', $tag, $match ) ) {
		$existing = preg_replace( '/(?:^|;)\s*(?:text-align|font-family|font-weight|font-style|font-size)\s*:[^;]*/i', '', $match[2] );
		$existing = trim( (string) $existing, " ;\t" );
		$css      = $existing ? $existing . ';' . $css : $css;
	}
	return amz_ve_set_attr( $tag, 'style', $css );
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
	$range = amz_ve_locate( $html, $item['path'] ?? '' );
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
		$src = isset( $item['src'] ) ? (string) $item['src'] : '';
		if ( ! empty( $item['id'] ) && function_exists( 'wp_get_attachment_image_url' ) ) {
			$fresh = wp_get_attachment_image_url( (int) $item['id'], 'full' );
			if ( is_string( $fresh ) && $fresh ) {
				$src = $fresh;
			}
		}
		$src = amz_ve_sanitize_src( $src );
		if ( ! $src ) {
			return $html;
		}
		$alt       = isset( $item['alt'] ) ? sanitize_text_field( (string) $item['alt'] ) : '';
		$start_tag = amz_ve_apply_image_tag( $start_tag, $src, $alt, $tag );
		return substr( $html, 0, $range['start'] ) . $start_tag . substr( $html, $range['start_tag_end'] );
	}
	if ( ! empty( $range['void'] ) ) {
		return $html;
	}
	$css = amz_ve_style_css( is_array( $item['style'] ?? null ) ? $item['style'] : array() );
	if ( $css ) {
		$start_tag = amz_ve_merge_style_attr( $start_tag, $css );
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
/**
 * Keep a normal photo address. Drop script and other schemes.
 *
 * @param string $src Raw address.
 * @return string
 */
function amz_ve_sanitize_src( $src ) {
	$src = esc_url_raw( trim( (string) $src ) );
	if ( ! $src ) {
		return '';
	}
	if ( preg_match( '#^https?://#i', $src ) ) {
		return $src;
	}
	if ( '/' === substr( $src, 0, 1 ) && '/' !== substr( $src, 1, 1 ) ) {
		return $src;
	}
	return '';
}

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
	$edits   = amz_ve_edits();
	$path    = function_exists( 'amz_ve_request_path' ) ? amz_ve_request_path() : '/';
	$page    = amz_ve_page_state( $edits, $path );
	$editing = function_exists( 'is_user_logged_in' ) && function_exists( 'current_user_can' ) && amz_ve_is_editing();
	if ( ! $edits['global'] && ! $page['items'] && ! $page['order'] && ! $editing ) {
		return $html;
	}
	$html = amz_ve_stamp_blocks( $html );
	foreach ( array( $edits['global'], $page['items'] ) as $bucket ) {
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
	if ( $page['order'] ) {
		$html = amz_ve_reorder_blocks( $html, $page['order'] );
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
	$state = amz_ve_page_state( $edits, $path );
	$has   = ! empty( $edits['global'] ) || ! empty( $state['items'] ) || ! empty( $state['order'] ) || amz_ve_is_editing();
	if ( ! $has ) {
		return;
	}
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}
	amz_ve_send_nocache();
	ob_start( 'amz_ve_apply_html' );
}
add_action( 'template_redirect', 'amz_ve_start_buffer', 0 );

/**
 * Ask caches not to keep a stale copy after an edit.
 */
function amz_ve_send_nocache() {
	if ( headers_sent() ) {
		return;
	}
	header( 'Cache-Control: no-store, no-cache, must-revalidate, max-age=0' );
	header( 'Pragma: no-cache' );
	header( 'CDN-Cache-Control: no-store' );
	header( 'Cloudflare-CDN-Cache-Control: no-store' );
}

/**
 * Keep the edited page out of the page cache.
 */
function amz_ve_nocache_editor() {
	$edits = amz_ve_edits();
	$state = amz_ve_page_state( $edits, amz_ve_request_path() );
	$has   = ! empty( $edits['global'] ) || ! empty( $state['items'] ) || ! empty( $state['order'] );
	if ( ! $has && ! amz_ve_is_editing() ) {
		return;
	}
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}
	amz_ve_send_nocache();
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
		$id  = isset( $raw['id'] ) ? (int) $raw['id'] : 0;
		$src = isset( $raw['src'] ) ? amz_ve_sanitize_src( (string) $raw['src'] ) : '';
		if ( $id > 0 && function_exists( 'wp_get_attachment_image_url' ) ) {
			$fresh = wp_get_attachment_image_url( $id, 'full' );
			if ( is_string( $fresh ) && $fresh ) {
				$src = $fresh;
			}
		}
		if ( ! $src ) {
			return null;
		}
		$item['src'] = $src;
		if ( $id > 0 ) {
			$item['id'] = $id;
		}
		if ( isset( $raw['alt'] ) ) {
			$item['alt'] = sanitize_text_field( (string) $raw['alt'] );
		}
		return $item;
	}
	$item['text'] = sanitize_textarea_field( (string) ( $raw['text'] ?? '' ) );
	if ( strlen( $item['text'] ) > 5000 ) {
		$item['text'] = function_exists( 'mb_substr' ) ? mb_substr( $item['text'], 0, 5000, 'UTF-8' ) : substr( $item['text'], 0, 5000 );
	}
	if ( ! empty( $raw['href'] ) ) {
		$href = amz_ve_sanitize_href( (string) $raw['href'] );
		if ( $href ) {
			$item['href'] = $href;
		}
	}
	$style = amz_ve_sanitize_style( $raw['style'] ?? array() );
	if ( $style ) {
		$item['style'] = $style;
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
function amz_ve_merge_items( $list, $items, &$accepted = 0 ) {
	foreach ( $items as $item ) {
		$clean = amz_ve_sanitize_item( $item );
		if ( ! $clean ) {
			continue;
		}
		$accepted++;
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
	$edits     = amz_ve_edits();
	$page_path = isset( $payload['path'] ) ? amz_ve_request_path_from( (string) $payload['path'] ) : amz_ve_request_path();
	$state     = amz_ve_page_state( $edits, $page_path );
	$accepted  = 0;
	$sent      = 0;
	if ( ! empty( $payload['global'] ) && is_array( $payload['global'] ) ) {
		$sent           += count( $payload['global'] );
		$edits['global'] = amz_ve_merge_items( $edits['global'], $payload['global'], $accepted );
	}
	if ( ! empty( $payload['page'] ) && is_array( $payload['page'] ) ) {
		$sent           += count( $payload['page'] );
		$state['items']  = amz_ve_merge_items( $state['items'], $payload['page'], $accepted );
	}
	if ( array_key_exists( 'order', $payload ) ) {
		$state['order'] = amz_ve_clean_order( $payload['order'] );
	}
	if ( ! empty( $payload['reset'] ) ) {
		if ( 'page' === $payload['reset'] ) {
			$state = array(
				'items' => array(),
				'order' => array(),
			);
		} elseif ( 'global' === $payload['reset'] ) {
			$edits['global'] = array();
		} elseif ( 'all' === $payload['reset'] ) {
			$edits = array(
				'global' => array(),
				'pages'  => array(),
			);
			$state = array(
				'items' => array(),
				'order' => array(),
			);
		}
	}
	if ( $state['items'] || $state['order'] ) {
		$edits['pages'][ $page_path ] = $state;
	} else {
		unset( $edits['pages'][ $page_path ] );
	}
	if ( $sent > 0 && 0 === $accepted && ! array_key_exists( 'order', $payload ) && empty( $payload['reset'] ) ) {
		wp_send_json_error( array( 'message' => __( 'That change could not be saved. Choose the photo again, then wait for Saved.', 'amz-visual-editor' ) ), 400 );
	}
	update_option( AMZ_VE_OPTION, $edits, true );
	wp_send_json_success(
		array(
			'message' => __( 'Saved.', 'amz-visual-editor' ),
			'saved'   => $accepted,
		)
	);
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
		<p><?php esc_html_e( 'Change banners, paragraphs, and other photos. Set the font, size, style, and alignment. Move a section up or down. Product names and product photos stay as they are in the shop.', 'amz-visual-editor' ); ?></p>
		<ol>
			<li><?php esc_html_e( 'Open the page you want to change.', 'amz-visual-editor' ); ?></li>
			<li><?php esc_html_e( 'Click Edit site in the top bar.', 'amz-visual-editor' ); ?></li>
			<li><?php esc_html_e( 'Click a paragraph or a banner. Choose a photo from WordPress, or set the text, font, and alignment, then Apply.', 'amz-visual-editor' ); ?></li>
			<li><?php esc_html_e( 'Use Up and Down on a section to move it. Header and footer changes show on every page.', 'amz-visual-editor' ); ?></li>
			<li><?php esc_html_e( 'Wait until the bar says Saved, clear the Hostinger cache, then refresh.', 'amz-visual-editor' ); ?></li>
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
