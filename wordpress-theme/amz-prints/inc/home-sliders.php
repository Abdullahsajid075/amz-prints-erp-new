<?php
/**
 * Homepage image sliders. Three independent sliders, each with up to six
 * image-only slides, an optional link per slide, and an optional phone image.
 *
 * Slider 1 keeps the original amz_banner_{n} setting ids so images uploaded
 * before the redesign still show.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const AMZ_PRINTS_SLIDER_MAX = 6;

/**
 * Setting id prefix for one slide.
 *
 * @param int $slider Slider number, 1 to 3.
 * @param int $slide  Slide number, 1 to 6.
 * @return string
 */
function amz_prints_slider_key( $slider, $slide ) {
	return 1 === (int) $slider ? 'amz_banner_' . $slide : 'amz_slider' . $slider . '_' . $slide;
}

/**
 * Display settings for one slider.
 *
 * @param int $slider Slider number.
 * @return array{effect:string,interval:int,width:string}
 */
function amz_prints_slider_options( $slider ) {
	$defaults = array(
		1 => array( 'slide', 'boxed' ),
		2 => array( 'fade', 'boxed' ),
		3 => array( 'zoom', 'boxed' ),
	);
	$def      = $defaults[ $slider ] ?? $defaults[2];
	$effect   = (string) amz_prints_mod( 'amz_slider' . $slider . '_effect', $def[0] );
	$width    = (string) amz_prints_mod( 'amz_slider' . $slider . '_width', $def[1] );
	$interval = absint( amz_prints_mod( 'amz_slider' . $slider . '_interval', 5 ) );
	return array(
		'effect'   => in_array( $effect, array( 'slide', 'fade', 'zoom' ), true ) ? $effect : $def[0],
		'width'    => in_array( $width, array( 'full', 'boxed' ), true ) ? $width : $def[1],
		'interval' => min( 20, max( 2, $interval ? $interval : 5 ) ),
	);
}

/**
 * Slides with an uploaded image, in order.
 *
 * @param int $slider Slider number.
 * @return array<int,array{id:int,mobile:int,url:string,alt:string}>
 */
function amz_prints_slider_slides( $slider ) {
	$out = array();
	for ( $i = 1; $i <= AMZ_PRINTS_SLIDER_MAX; $i++ ) {
		$key = amz_prints_slider_key( $slider, $i );
		$id  = absint( amz_prints_mod( $key, 0 ) );
		if ( ! $id || ! wp_get_attachment_image_url( $id, 'full' ) ) {
			continue;
		}
		$out[] = array(
			'id'     => $id,
			'mobile' => absint( amz_prints_mod( $key . '_mobile', 0 ) ),
			'url'    => trim( (string) amz_prints_mod( $key . '_url', '' ) ),
			'alt'    => trim( (string) get_post_meta( $id, '_wp_attachment_image_alt', true ) ),
		);
	}
	return $out;
}

/**
 * Print one image slider. Prints nothing when it has no images.
 *
 * @param int  $slider Slider number.
 * @param bool $first  True for the slider at the very top of the page.
 * @return bool Whether anything was printed.
 */
function amz_prints_image_slider( $slider, $first = false ) {
	$slides = amz_prints_slider_slides( $slider );
	if ( ! $slides || ! function_exists( 'amz_prints_banner_picture' ) ) {
		return false;
	}
	$opt   = amz_prints_slider_options( $slider );
	$count = count( $slides );
	$class = 'amz-slider amz-slider--' . $opt['width'] . ' amz-slider--fx-' . $opt['effect'] . ( $first ? ' amz-slider--top' : '' );
	?>
	<section class="<?php echo esc_attr( $class ); ?>" data-amz-slider style="--slider-interval: <?php echo esc_attr( (string) ( $opt['interval'] * 1000 ) ); ?>ms" aria-roledescription="carousel" aria-label="<?php echo esc_attr( sprintf( __( 'Banner slider %d', 'amz-prints' ), $slider ) ); ?>">
		<div class="amz-slider__frame">
			<div class="amz-slider__viewport">
				<div class="amz-slider__track" data-slider-track>
					<?php foreach ( $slides as $i => $slide ) : ?>
						<?php
						$alt  = $slide['alt'] ? $slide['alt'] : sprintf( __( 'AMZ Prints banner %d', 'amz-prints' ), $i + 1 );
						$html = amz_prints_banner_picture( $slide['id'], $slide['mobile'], $alt, ! ( $first && 0 === $i ) );
						$cls  = 'amz-slider__slide' . ( 0 === $i ? ' is-active' : '' );
						$aria = sprintf( __( '%1$d of %2$d', 'amz-prints' ), $i + 1, $count );
						?>
						<?php if ( $slide['url'] ) : ?>
							<a class="<?php echo esc_attr( $cls ); ?>" href="<?php echo esc_url( $slide['url'] ); ?>" data-slider-slide role="group" aria-roledescription="slide" aria-label="<?php echo esc_attr( $aria ); ?>"><?php echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
						<?php else : ?>
							<div class="<?php echo esc_attr( $cls ); ?>" data-slider-slide role="group" aria-roledescription="slide" aria-label="<?php echo esc_attr( $aria ); ?>"><?php echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
						<?php endif; ?>
					<?php endforeach; ?>
				</div>
			</div>
			<?php if ( $count > 1 ) : ?>
				<button type="button" class="amz-slider__arrow amz-slider__arrow--prev" data-slider-prev aria-label="<?php esc_attr_e( 'Previous slide', 'amz-prints' ); ?>">
					<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
				<button type="button" class="amz-slider__arrow amz-slider__arrow--next" data-slider-next aria-label="<?php esc_attr_e( 'Next slide', 'amz-prints' ); ?>">
					<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
				<div class="amz-slider__dots">
					<?php foreach ( $slides as $i => $slide ) : ?>
						<button type="button" class="<?php echo 0 === $i ? 'is-active' : ''; ?>" data-slider-dot="<?php echo esc_attr( (string) $i ); ?>" aria-label="<?php echo esc_attr( sprintf( __( 'Go to slide %d', 'amz-prints' ), $i + 1 ) ); ?>"><i></i></button>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
		</div>
	</section>
	<?php
	return true;
}

/**
 * Preload the first image of the top slider when it has no phone image.
 */
function amz_prints_slider_preload() {
	if ( ! is_front_page() ) {
		return;
	}
	$slides = amz_prints_slider_slides( 1 );
	if ( $slides && ! $slides[0]['mobile'] ) {
		echo '<link rel="preload" as="image" href="' . esc_url( wp_get_attachment_image_url( $slides[0]['id'], 'full' ) ) . '" fetchpriority="high">' . "\n";
	}
}
add_action( 'wp_head', 'amz_prints_slider_preload', 1 );

/**
 * Line icons for the homepage feature and shortcut cards.
 *
 * @param string $name Icon name.
 * @return string
 */
function amz_prints_home_icon( $name ) {
	$open  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
	$icons = array(
		'bag'     => '<path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
		'track'   => '<circle cx="12" cy="10" r="3"/><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/>',
		'quote'   => '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
		'cv'      => '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="9" r="2.5"/><path d="M8 17c.8-2 2.2-3 4-3s3.2 1 4 3"/>',
		'id'      => '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2.5"/><path d="M13 10h5M13 14h4"/>',
		'code'    => '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
		'zap'     => '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
		'palette' => '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.7 1.6-1.6 0-.5-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.7 1.7-1.7H16a5 5 0 0 0 5-5C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>',
		'shield'  => '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
		'truck'   => '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
	);
	return isset( $icons[ $name ] ) ? $open . $icons[ $name ] . '</svg>' : '';
}

/**
 * The four selling points shown in the top strip.
 *
 * @return array<int,array{0:string,1:string,2:string}> Icon, title, text.
 */
function amz_prints_home_features() {
	return array(
		array( 'zap', amz_prints_mod( 'amz_feature_1_title', 'Fast turnaround' ), amz_prints_mod( 'amz_feature_1_text', 'Quick quotes and on-time delivery.' ) ),
		array( 'palette', amz_prints_mod( 'amz_feature_2_title', 'Color-true printing' ), amz_prints_mod( 'amz_feature_2_text', 'Proofed artwork and calibrated presses.' ) ),
		array( 'track', amz_prints_mod( 'amz_feature_3_title', 'Live order tracking' ), amz_prints_mod( 'amz_feature_3_text', 'Follow every job with your order number.' ) ),
		array( 'shield', amz_prints_mod( 'amz_feature_4_title', 'Authorized NADRA partner' ), amz_prints_mod( 'amz_feature_4_text', 'Official e-services at our counter.' ) ),
	);
}

/**
 * Whether the site-wide top strip is on.
 *
 * @return bool
 */
function amz_prints_topbar_enabled() {
	return (bool) amz_prints_mod( 'amz_show_topbar', true );
}

/**
 * @param string[] $classes Body classes.
 * @return string[]
 */
function amz_prints_topbar_body_class( $classes ) {
	if ( amz_prints_topbar_enabled() ) {
		$classes[] = 'has-topbar';
	}
	return $classes;
}
add_filter( 'body_class', 'amz_prints_topbar_body_class' );

/**
 * Thin strip above the header with the four selling points. On phones the
 * items scroll, which is why the list is printed twice.
 */
function amz_prints_topbar() {
	if ( ! amz_prints_topbar_enabled() ) {
		return;
	}
	$features = amz_prints_home_features();
	?>
	<div class="amz-topbar" role="region" aria-label="<?php esc_attr_e( 'Why AMZ Prints', 'amz-prints' ); ?>">
		<div class="amz-topbar__track">
			<?php for ( $copy = 0; $copy < 2; $copy++ ) : ?>
				<ul class="amz-topbar__list"<?php echo $copy ? ' aria-hidden="true"' : ''; ?>>
					<?php foreach ( $features as $feature ) : ?>
						<li title="<?php echo esc_attr( $feature[2] ); ?>">
							<span class="amz-topbar__icon"><?php echo amz_prints_home_icon( $feature[0] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
							<strong><?php echo esc_html( $feature[1] ); ?></strong>
							<em><?php echo esc_html( $feature[2] ); ?></em>
						</li>
					<?php endforeach; ?>
				</ul>
			<?php endfor; ?>
		</div>
	</div>
	<?php
}

/**
 * Customizer: one section per slider under a "Homepage sliders" panel.
 *
 * @param WP_Customize_Manager $wp_customize Customizer.
 */
function amz_prints_sliders_customize( $wp_customize ) {
	$wp_customize->add_panel( 'amz_home_sliders', array(
		'title'       => __( 'Homepage sliders', 'amz-prints' ),
		'description' => __( 'Three image-only sliders on the homepage. Each slide is one image, with an optional link and an optional phone image. A slider with no images is hidden.', 'amz-prints' ),
		'priority'    => 31,
	) );
	$places = array(
		1 => __( 'Top of the homepage', 'amz-prints' ),
		2 => __( 'After the products', 'amz-prints' ),
		3 => __( 'Before the clients', 'amz-prints' ),
	);
	foreach ( $places as $slider => $place ) {
		$section = 'amz_slider_' . $slider;
		$def     = amz_prints_slider_options( $slider );
		$wp_customize->add_section( $section, array(
			'title'       => sprintf( __( 'Slider %d', 'amz-prints' ), $slider ),
			'description' => sprintf( __( 'Position: %s. Wide images around 1920×700 px look best; all slides in one slider should be the same size.', 'amz-prints' ), $place ),
			'panel'       => 'amz_home_sliders',
		) );

		$wp_customize->add_setting( 'amz_slider' . $slider . '_effect', array(
			'default'           => $def['effect'],
			'sanitize_callback' => static function ( $v ) {
				return in_array( $v, array( 'slide', 'fade', 'zoom' ), true ) ? $v : 'slide';
			},
		) );
		$wp_customize->add_control( 'amz_slider' . $slider . '_effect', array(
			'label'   => __( 'Sliding effect', 'amz-prints' ),
			'section' => $section,
			'type'    => 'select',
			'choices' => array(
				'slide' => __( 'Slide', 'amz-prints' ),
				'fade'  => __( 'Fade', 'amz-prints' ),
				'zoom'  => __( 'Fade with slow zoom', 'amz-prints' ),
			),
		) );
		$wp_customize->add_setting( 'amz_slider' . $slider . '_interval', array(
			'default'           => 5,
			'sanitize_callback' => 'absint',
		) );
		$wp_customize->add_control( 'amz_slider' . $slider . '_interval', array(
			'label'       => __( 'Seconds per slide', 'amz-prints' ),
			'section'     => $section,
			'type'        => 'number',
			'input_attrs' => array( 'min' => 2, 'max' => 20 ),
		) );
		$wp_customize->add_setting( 'amz_slider' . $slider . '_width', array(
			'default'           => $def['width'],
			'sanitize_callback' => static function ( $v ) {
				return 'boxed' === $v ? 'boxed' : 'full';
			},
		) );
		$wp_customize->add_control( 'amz_slider' . $slider . '_width', array(
			'label'   => __( 'Width', 'amz-prints' ),
			'section' => $section,
			'type'    => 'select',
			'choices' => array(
				'full'  => __( 'Full screen width', 'amz-prints' ),
				'boxed' => __( 'Boxed with rounded corners', 'amz-prints' ),
			),
		) );

		for ( $i = 1; $i <= AMZ_PRINTS_SLIDER_MAX; $i++ ) {
			$key = amz_prints_slider_key( $slider, $i );
			if ( ! $wp_customize->get_setting( $key ) ) {
				$wp_customize->add_setting( $key, array( 'default' => 0, 'sanitize_callback' => 'absint' ) );
			}
			$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, $key, array(
				'label'     => sprintf( __( 'Slide %d image', 'amz-prints' ), $i ),
				'section'   => $section,
				'mime_type' => 'image',
			) ) );
			if ( ! $wp_customize->get_setting( $key . '_url' ) ) {
				$wp_customize->add_setting( $key . '_url', array( 'default' => '', 'sanitize_callback' => 'esc_url_raw' ) );
			}
			$wp_customize->add_control( $key . '_url', array(
				'label'   => sprintf( __( 'Slide %d link (optional)', 'amz-prints' ), $i ),
				'section' => $section,
				'type'    => 'url',
			) );
			if ( ! $wp_customize->get_setting( $key . '_mobile' ) ) {
				$wp_customize->add_setting( $key . '_mobile', array( 'default' => 0, 'sanitize_callback' => 'absint' ) );
			}
			$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, $key . '_mobile', array(
				'label'       => sprintf( __( 'Slide %d phone image (optional)', 'amz-prints' ), $i ),
				'description' => __( 'Shown on phones instead, for example 800×800 px.', 'amz-prints' ),
				'section'     => $section,
				'mime_type'   => 'image',
			) ) );
		}
	}
}
add_action( 'customize_register', 'amz_prints_sliders_customize', 20 );
