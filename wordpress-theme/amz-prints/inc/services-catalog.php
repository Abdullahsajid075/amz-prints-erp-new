<?php
/**
 * Full AMZ Prints service catalog (EN + UR) with images
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function amz_prints_services_catalog() {
	return array(
		array(
			'slug'  => 'printing-services',
			'en'    => 'Printing Services',
			'ur'    => 'پرنٹنگ سروسز',
			'image' => 'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Digital Printing', 'ur' => 'ڈیجیٹل پرنٹنگ' ),
				array( 'en' => 'Offset Printing', 'ur' => 'آفسیٹ پرنٹنگ' ),
				array( 'en' => 'Large Format Printing', 'ur' => 'بڑے سائز کی پرنٹنگ' ),
				array( 'en' => 'UV Printing', 'ur' => 'یو وی پرنٹنگ' ),
				array( 'en' => 'Screen Printing', 'ur' => 'اسکرین پرنٹنگ' ),
				array( 'en' => 'DTF Printing', 'ur' => 'ڈی ٹی ایف پرنٹنگ' ),
				array( 'en' => 'Sublimation Printing', 'ur' => 'سبلیمیشن پرنٹنگ' ),
			),
		),
		array(
			'slug'  => 'branding-signage',
			'en'    => 'Branding & Signage',
			'ur'    => 'برانڈنگ اور سائن بورڈز',
			'image' => 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Indoor Sign Boards', 'ur' => 'انڈور سائن بورڈز' ),
				array( 'en' => 'Outdoor Sign Boards', 'ur' => 'آؤٹ ڈور سائن بورڈز' ),
				array( 'en' => 'Acrylic Signage', 'ur' => 'ایکریلک سائنیج' ),
				array( 'en' => 'LED Signage', 'ur' => 'ایل ای ڈی سائنیج' ),
				array( 'en' => 'Roll-Up Standees', 'ur' => 'رول اپ اسٹینڈیز' ),
				array( 'en' => 'Backdrop Stands', 'ur' => 'بیک ڈراپ اسٹینڈز' ),
				array( 'en' => 'Vehicle Branding', 'ur' => 'گاڑیوں کی برانڈنگ' ),
			),
		),
		array(
			'slug'  => 'marketing-materials',
			'en'    => 'Marketing Materials',
			'ur'    => 'مارکیٹنگ میٹریل',
			'image' => 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Business Cards', 'ur' => 'بزنس کارڈز' ),
				array( 'en' => 'Flyers', 'ur' => 'فلائرز' ),
				array( 'en' => 'Brochures', 'ur' => 'بروشرز' ),
				array( 'en' => 'Catalogs', 'ur' => 'کیٹلاگز' ),
				array( 'en' => 'Posters', 'ur' => 'پوسٹرز' ),
				array( 'en' => 'Letterheads', 'ur' => 'لیٹر ہیڈز' ),
				array( 'en' => 'Envelopes', 'ur' => 'لفافے' ),
				array( 'en' => 'Presentation Folders', 'ur' => 'پریزنٹیشن فولڈرز' ),
			),
		),
		array(
			'slug'  => 'packaging-solutions',
			'en'    => 'Packaging Solutions',
			'ur'    => 'پیکجنگ سلوشنز',
			'image' => 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Product Boxes', 'ur' => 'پروڈکٹ باکسز' ),
				array( 'en' => 'Food Packaging', 'ur' => 'فوڈ پیکجنگ' ),
				array( 'en' => 'Cosmetic Boxes', 'ur' => 'کاسمیٹک باکسز' ),
				array( 'en' => 'Shopping Bags', 'ur' => 'شاپنگ بیگز' ),
				array( 'en' => 'Stickers & Labels', 'ur' => 'اسٹیکرز اور لیبلز' ),
				array( 'en' => 'Custom Packaging', 'ur' => 'کسٹم پیکجنگ' ),
			),
		),
		array(
			'slug'  => 'promotional-items',
			'en'    => 'Promotional Items',
			'ur'    => 'پروموشنل آئٹمز',
			'image' => 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Mugs', 'ur' => 'مگس' ),
				array( 'en' => 'T-Shirts', 'ur' => 'ٹی شرٹس' ),
				array( 'en' => 'Caps', 'ur' => 'کیپس' ),
				array( 'en' => 'Pens', 'ur' => 'قلم' ),
				array( 'en' => 'Keychains', 'ur' => 'کی چینز' ),
				array( 'en' => 'Diaries', 'ur' => 'ڈائریاں' ),
				array( 'en' => 'USB Drives', 'ur' => 'یو ایس بی ڈرائیوز' ),
				array( 'en' => 'Gift Items', 'ur' => 'گفٹ آئٹمز' ),
			),
		),
		array(
			'slug'  => 'corporate-branding',
			'en'    => 'Corporate Branding',
			'ur'    => 'کارپوریٹ برانڈنگ',
			'image' => 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Company Profile Design', 'ur' => 'کمپنی پروفائل ڈیزائن' ),
				array( 'en' => 'Logo Design', 'ur' => 'لوگو ڈیزائن' ),
				array( 'en' => 'Brand Identity', 'ur' => 'برانڈ آئیڈنٹیٹی' ),
				array( 'en' => 'Office Branding', 'ur' => 'آفس برانڈنگ' ),
				array( 'en' => 'Event Branding', 'ur' => 'ایونٹ برانڈنگ' ),
				array( 'en' => 'Exhibition Stands', 'ur' => 'نمائش اسٹینڈز' ),
			),
		),
		array(
			'slug'  => 'document-office-printing',
			'en'    => 'Document & Office Printing',
			'ur'    => 'دستاویزات اور آفس پرنٹنگ',
			'image' => 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Photocopying', 'ur' => 'فوٹو کاپی' ),
				array( 'en' => 'Document Printing', 'ur' => 'دستاویز پرنٹنگ' ),
				array( 'en' => 'Binding', 'ur' => 'بائنڈنگ' ),
				array( 'en' => 'Lamination', 'ur' => 'لیمینیشن' ),
				array( 'en' => 'ID Cards', 'ur' => 'آئی ڈی کارڈز' ),
				array( 'en' => 'Certificates', 'ur' => 'سرٹیفکیٹس' ),
				array( 'en' => 'Thesis Printing', 'ur' => 'تھیسس پرنٹنگ' ),
			),
		),
		array(
			'slug'  => 'graphic-design',
			'en'    => 'Graphic Design',
			'ur'    => 'گرافک ڈیزائن',
			'image' => 'https://images.unsplash.com/photo-1626785774573-4b7993143459?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Logo Design', 'ur' => 'لوگو ڈیزائن' ),
				array( 'en' => 'Social Media Designs', 'ur' => 'سوشل میڈیا ڈیزائنز' ),
				array( 'en' => 'Banner Design', 'ur' => 'بینر ڈیزائن' ),
				array( 'en' => 'Brochure Design', 'ur' => 'بروشر ڈیزائن' ),
				array( 'en' => 'Packaging Design', 'ur' => 'پیکجنگ ڈیزائن' ),
				array( 'en' => 'UI/UX Design', 'ur' => 'یو آئی / یو ایکس ڈیزائن' ),
			),
		),
		array(
			'slug'  => 'web-digital-services',
			'en'    => 'Web & Digital Services',
			'ur'    => 'ویب اور ڈیجیٹل سروسز',
			'image' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Website Design', 'ur' => 'ویب سائٹ ڈیزائن' ),
				array( 'en' => 'E-Commerce Websites', 'ur' => 'ای کامرس ویب سائٹس' ),
				array( 'en' => 'ERP Solutions', 'ur' => 'ای آر پی سلوشنز' ),
				array( 'en' => 'Mobile App Development', 'ur' => 'موبائل ایپ ڈیولپمنٹ' ),
				array( 'en' => 'SEO Services', 'ur' => 'ایس ای او سروسز' ),
				array( 'en' => 'Digital Marketing', 'ur' => 'ڈیجیٹل مارکیٹنگ' ),
			),
		),
		array(
			'slug'  => 'it-technology-services',
			'en'    => 'IT & Technology Services',
			'ur'    => 'آئی ٹی اور ٹیکنالوجی سروسز',
			'image' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Software Development', 'ur' => 'سافٹ ویئر ڈیولپمنٹ' ),
				array( 'en' => 'Network Solutions', 'ur' => 'نیٹ ورک سلوشنز' ),
				array( 'en' => 'CCTV Installation', 'ur' => 'سی سی ٹی وی انسٹالیشن' ),
				array( 'en' => 'Biometric Systems', 'ur' => 'بائیو میٹرک سسٹمز' ),
				array( 'en' => 'Cloud Solutions', 'ur' => 'کلاؤڈ سلوشنز' ),
				array( 'en' => 'Cybersecurity', 'ur' => 'سائبر سیکیورٹی' ),
				array( 'en' => 'IT Support', 'ur' => 'آئی ٹی سپورٹ' ),
			),
		),
		array(
			'slug'  => 'photography-media',
			'en'    => 'Photography & Media',
			'ur'    => 'فوٹوگرافی اور میڈیا',
			'image' => 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Product Photography', 'ur' => 'پروڈکٹ فوٹوگرافی' ),
				array( 'en' => 'Corporate Photography', 'ur' => 'کارپوریٹ فوٹوگرافی' ),
				array( 'en' => 'Videography', 'ur' => 'ویڈیوگرافی' ),
				array( 'en' => 'Video Editing', 'ur' => 'ویڈیو ایڈیٹنگ' ),
				array( 'en' => 'Motion Graphics', 'ur' => 'موشن گرافکس' ),
			),
		),
		array(
			'slug'  => 'custom-printing',
			'en'    => 'Custom Printing',
			'ur'    => 'کسٹم پرنٹنگ',
			'image' => 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=800&q=80',
			'items' => array(
				array( 'en' => 'Wedding Cards', 'ur' => 'شادی کارڈز' ),
				array( 'en' => 'Invitation Cards', 'ur' => 'دعوت نامے' ),
				array( 'en' => 'Menu Cards', 'ur' => 'مینو کارڈز' ),
				array( 'en' => 'Certificates', 'ur' => 'سرٹیفکیٹس' ),
				array( 'en' => 'Calendars', 'ur' => 'کیلنڈرز' ),
				array( 'en' => 'Notebooks', 'ur' => 'نوٹ بکس' ),
				array( 'en' => 'Custom Gifts', 'ur' => 'کسٹم گفٹس' ),
			),
		),
	);
}

function amz_prints_svc_label( $row ) {
	$lang = amz_prints_lang();
	if ( 'ur' === $lang && ! empty( $row['ur'] ) ) {
		return $row['ur'];
	}
	return isset( $row['en'] ) ? $row['en'] : '';
}

function amz_prints_service_quote_url( $service_en ) {
	return add_query_arg( 'service', rawurlencode( $service_en ), home_url( '/quote/' ) );
}

function amz_prints_service_section_url( $slug ) {
	return home_url( '/services/#' . $slug );
}
