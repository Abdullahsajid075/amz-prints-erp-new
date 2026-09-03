<?php
/**
 * Classic portrait catalog page render helpers.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render a chips/list of strings.
 *
 * @param array  $items Items.
 * @param string $class Extra class.
 */
function amz_cp_chips( $items, $class = '' ) {
	echo '<ul class="cp-chips ' . esc_attr( $class ) . '">';
	foreach ( $items as $item ) {
		echo '<li>' . esc_html( $item ) . '</li>';
	}
	echo '</ul>';
}

/**
 * Two-column checklist.
 *
 * @param array $items Items.
 */
function amz_cp_checklist( $items ) {
	$mid = (int) ceil( count( $items ) / 2 );
	$cols = array( array_slice( $items, 0, $mid ), array_slice( $items, $mid ) );
	echo '<div class="cp-check-grid">';
	foreach ( $cols as $col ) {
		echo '<ul class="cp-check">';
		foreach ( $col as $item ) {
			echo '<li>' . esc_html( $item ) . '</li>';
		}
		echo '</ul>';
	}
	echo '</div>';
}

/**
 * Decorative page header.
 *
 * @param string $kicker Kicker.
 * @param string $title  Title.
 * @param bool   $gold   Gold theme.
 */
function amz_cp_head( $kicker, $title, $gold = false ) {
	echo '<header class="cp-head' . ( $gold ? ' cp-head--gold' : '' ) . '">';
	echo '<p class="cp-kicker' . ( $gold ? ' cp-kicker--gold' : '' ) . '">' . esc_html( $kicker ) . '</p>';
	echo '<h2 class="cp-h2">' . esc_html( $title ) . '</h2>';
	echo '<span class="cp-head__rule" aria-hidden="true"></span>';
	echo '</header>';
}

/**
 * Footer number.
 *
 * @param int    $n     Number.
 * @param string $brand Brand.
 */
function amz_cp_foot( &$n, $brand = 'Amazon Printing Services' ) {
	echo '<div class="cp-foot"><span class="cp-foot__mark" aria-hidden="true"></span><span>' . esc_html( $brand ) . '</span><span>' . esc_html( sprintf( '%02d', $n++ ) ) . '</span></div>';
}
