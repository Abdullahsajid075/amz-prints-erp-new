<?php
/**
 * Official company profile content for portrait classic catalogs.
 *
 * @package AMZ_Prints
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Shared identity + company facts for both books.
 *
 * @return array
 */
function amz_prints_profile_identity() {
	$c = amz_prints_catalog_context();
	return array_merge(
		$c,
		array(
			'registered'   => 'Amazon Printings PVT Ltd.',
			'brand'        => 'Amazon Printing Services',
			'business'     => 'Printing, Advertising, Branding & Digital Services',
			'ceo'          => 'Muhammad Abdullah Sajid',
			'ceo_title'    => 'Chief Executive Officer',
			'hq'           => 'King Chowk / King Road, Mandi Bahauddin, Pakistan',
			'whatsapp'     => '0327-6650001',
			'website'      => 'amzprints.com',
			'wa_display'   => '0327-6650001',
			'wa_link'      => 'https://wa.me/923276650001',
			'site_url'     => 'https://amzprints.com',
			'vision'       => 'To become a trusted and leading printing, branding, advertising and digital solutions company, delivering innovative, high-quality and reliable solutions to businesses, organizations and individuals in Pakistan and international markets.',
			'mission'      => 'To provide professional printing, branding, design, advertising and digital solutions through modern technology, skilled professionals, quality materials and customer-focused service.',
			'values'       => array( 'Quality', 'Customer Satisfaction', 'Innovation', 'Reliability', 'Professionalism', 'Integrity', 'Creativity', 'Timely Delivery', 'Continuous Improvement', 'Technology & Modernization' ),
			'overview'     => 'Amazon Printings PVT Ltd. — trading as Amazon Printing Services — is a full-service printing, branding, advertising and digital solutions company based in Mandi Bahauddin, Pakistan. We deliver commercial print, large-format campaigns, signage, vehicle branding, packaging, graphic design, NADRA facilitation, websites, custom software and digital marketing under one roof.',
			'history'      => 'Built to serve local businesses and growing brands, Amazon Printing Services combines press craftsmanship with modern digital capability. From King Road, Mandi Bahauddin, we support customers across Punjab and Pakistan, with expansion focus toward GCC and international markets through associated technology partners.',
			'expertise'    => array( 'Digital & Offset Printing', 'Large Format & Signage', 'Brand Identity & Graphic Design', 'Vehicle & Shop Branding', 'Packaging & Promotional Print', 'Websites, Software & Digital Marketing' ),
			'strengths'    => array( 'One-stop print + branding + digital', 'In-house design and production', 'Quality materials and finishing', 'Fast, reliable turnaround', 'Corporate and retail experience', 'Local support with WhatsApp ordering' ),
			'workforce'    => array(
				array( '13', 'Production Unit' ),
				array( '7', 'Office Staff' ),
				array( '1', 'Marketing Manager' ),
				array( '1', 'Assistant Marketing' ),
				array( '6', 'Graphic Design Interns' ),
				array( '1', 'Office Support' ),
				array( '4', 'Female Office Workers' ),
			),
			'departments'  => array( 'Management', 'Administration', 'Graphic Design', 'Digital Printing', 'Offset Printing', 'Large Format Printing', 'Signage & Acrylic', 'Production', 'Finishing', 'Sales', 'Marketing', 'Customer Support', 'IT / Digital Services', 'Accounts & Finance' ),
			'facilities'   => array( 'Digital Printing Unit', 'Offset Printing Facilities', 'Large Format Printing', 'Signage Production Unit', 'Acrylic Cutting', '3D Sign Board Production', 'Vinyl / Sticker Production', 'DTF Printing', 'Finishing & Cutting', 'Packaging / Finishing Area', 'Quality Control', 'Waste Management Area' ),
			'tech'         => array( 'Business Website', 'E-Commerce System', 'ERP System', 'Inventory Management', 'Customer Management', 'Order Management', 'Accounting System', 'WhatsApp Integration', 'Online Ordering', 'Cloud Database', 'Business Automation', 'CRM', 'Digital Marketing Tools' ),
			'erp'          => array( 'Sales', 'Purchases', 'Inventory', 'Products', 'Customers', 'Suppliers', 'Invoices', 'Payments', 'Expenses', 'Accounts', 'Employees', 'Production', 'Orders', 'Reports', 'Dashboard', 'User Roles & Permissions' ),
			'segments'     => array( 'Individuals', 'Retail Businesses', 'Corporate Companies', 'Schools', 'Colleges', 'Universities', 'Hospitals', 'Pharmacies', 'Restaurants', 'Hotels', 'Real Estate', 'Banks', 'Government Organizations', 'NGOs', 'Startups', 'Manufacturers', 'Distributors', 'Advertising Agencies', 'Event Management Companies' ),
			'markets'      => array( 'Mandi Bahauddin', 'Punjab', 'Pakistan' ),
			'expansion'    => array( 'Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait', 'United Kingdom', 'Europe', 'Estonia' ),
			'quality'      => array( 'Quality raw materials', 'Professional design process', 'Pre-production checking', 'Production quality control', 'Color consistency', 'Finishing inspection', 'Final product inspection', 'Customer approval where required', 'Timely delivery', 'Continuous improvement' ),
			'why'          => array(
				'One-stop printing and branding solution',
				'Wide range of printing services',
				'Professional graphic design',
				'Modern production capabilities',
				'Customized solutions',
				'Corporate printing expertise',
				'Competitive pricing',
				'Quality-focused production',
				'Fast turnaround',
				'Customer-focused service',
				'Digital and traditional printing under one roof',
				'Branding + printing + digital services from one company',
			),
			'infra'        => array( 'Office', 'Customer Service Area', 'Design Department', 'Production Area', 'Printing Machines', 'Cutting Machines', 'Acrylic Unit', 'Signage Unit', 'Storage / Inventory', 'Finishing Area', 'Dispatch Area' ),
			'online'       => array( 'Website: amzprints.com', 'Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'WhatsApp Business', 'Google Business Profile', 'YouTube' ),
			'group'        => array(
				array(
					'name' => 'Bitrex Solutions',
					'desc' => 'IT & digital solutions company with Pakistan operations (Lahore / Islamabad presence) and an international business focus.',
				),
				array(
					'name' => 'Telenoc',
					'desc' => 'Regional / international technology support based in Riyadh, Saudi Arabia, supporting operations across the wider GCC region.',
				),
			),
		)
	);
}

/**
 * Print catalog service chapters.
 *
 * @return array
 */
function amz_prints_print_service_chapters() {
	return array(
		array(
			'title' => 'Digital Printing',
			'intro' => 'Fast, precise color and mono output for everyday documents and marketing pieces.',
			'items' => array( 'Digital Printing', 'Color Printing', 'Black & White Printing', 'A4 / A5 / A6 Printing', 'Certificates', 'Result Cards', 'Invitations', 'Menus', 'Brochures', 'Flyers', 'Catalogues', 'Reports', 'Company Profiles', 'Documents', 'Forms' ),
		),
		array(
			'title' => 'Offset Printing',
			'intro' => 'High-volume, color-true commercial print for stationery, books and packaging runs.',
			'items' => array( 'Business Cards', 'Letterheads', 'Envelopes', 'Brochures', 'Flyers', 'Books', 'Registers', 'Notebooks', 'Catalogues', 'Corporate Stationery', 'Packaging Materials', 'Bulk Printing' ),
		),
		array(
			'title' => 'Large Format Printing',
			'intro' => 'Indoor and outdoor campaigns that command attention at street and event scale.',
			'items' => array( 'Flex Printing', 'Vinyl Printing', 'Banners', 'Outdoor Advertising', 'Indoor Advertising', 'Promotional Backdrops', 'Event Backdrops', 'Billboards', 'Shop Branding', 'Wall Graphics' ),
		),
		array(
			'title' => 'Signage Solutions',
			'intro' => 'Durable identity for storefronts, offices and wayfinding.',
			'items' => array( 'Acrylic Sign Boards', '3D Sign Boards', 'LED Sign Boards', 'Light Boxes', 'Shop Signs', 'Office Signs', 'Reception Signs', 'Directional Signs', 'Safety Signs', 'Corporate Signage' ),
		),
		array(
			'title' => 'Branding Services',
			'intro' => 'Complete visual identity systems from logo to brand kits and corporate stationery.',
			'items' => array( 'Complete Brand Identity', 'Logo Design', 'Brand Guidelines', 'Brand Kit', 'Business Card Design', 'Letterhead Design', 'Envelope Design', 'Invoice Design', 'Company Profile Design', 'Marketing Material Design', 'Packaging Design', 'Product Label Design', 'Social Media Branding', 'Corporate Branding' ),
		),
		array(
			'title' => 'Vehicle Branding',
			'intro' => 'Moving billboards — wraps and graphics for cars, vans, trucks and fleets.',
			'items' => array( 'Car Branding', 'Van Branding', 'Truck Branding', 'Bus Branding', 'Commercial Vehicle Branding', 'Full Vehicle Wrap', 'Partial Vehicle Wrap', 'Vinyl Graphics', 'Promotional Vehicle Graphics' ),
		),
		array(
			'title' => 'Promotional Printing',
			'intro' => 'Wearables and gifts that keep your brand in customers’ hands.',
			'items' => array( 'T-Shirts', 'Workwear', 'Worker Jackets', 'Caps', 'Mugs', 'Magic Mugs', 'Promotional Bags', 'Corporate Gifts', 'Keychains', 'Promotional Accessories', 'DTF Printing', 'Heat Transfer Printing' ),
		),
		array(
			'title' => 'Cards & Stationery',
			'intro' => 'Premium cards, IDs and office stationery with sharp finishing.',
			'items' => array( 'UV Visiting Cards', 'Premium Visiting Cards', 'PVC Cards', 'Membership Cards', 'ID Cards', 'Employee Cards', 'Loyalty Cards', 'Invitation Cards', 'Wedding Cards', 'Result Cards', 'Certificates', 'Letterheads', 'Envelopes', 'Receipt Books', 'Invoice Books', 'Registers', 'Notebooks' ),
		),
		array(
			'title' => 'Stickers & Labels',
			'intro' => 'Product and packaging labels with clean cuts and durable adhesives.',
			'items' => array( 'Vinyl Stickers', 'Product Labels', 'Packaging Labels', 'Die-Cut Stickers', 'Transparent Stickers', 'Promotional Stickers', 'Barcode Labels', 'Product Branding Labels' ),
		),
		array(
			'title' => 'Packaging Solutions',
			'intro' => 'Retail-ready packs that protect products and sell on the shelf.',
			'items' => array( 'Product Boxes', 'Packaging Sleeves', 'Food Packaging', 'Product Labels', 'Shopping Bags', 'Custom Packaging', 'Retail Packaging', 'Corporate Packaging' ),
		),
		array(
			'title' => 'Exhibition & Events',
			'intro' => 'Stands, backdrops and event systems for launches and trade shows.',
			'items' => array( 'Roll-Up Stands', 'Exhibition Backdrops', 'Promotional Stands', 'Event Banners', 'Step & Repeat Backdrops', 'Table Displays', 'Promotional Boards', 'Event Signage' ),
		),
		array(
			'title' => 'Graphic Design',
			'intro' => 'Creative that works in print and on screen — campaigns, menus, catalogues and more.',
			'items' => array( 'Logo Design', 'Social Media Posts', 'Posters', 'Flyers', 'Brochures', 'Catalogues', 'Product Designs', 'Advertising Designs', 'Menu Designs', 'Packaging Designs', 'Corporate Designs', 'Presentation Designs', 'Marketing Campaign Designs' ),
		),
		array(
			'title' => 'Studio & Documentation',
			'intro' => 'Everyday office and citizen services — photos, docs, NADRA facilitation and more.',
			'items' => array( 'Passport Size Photos', 'Photo Printing', 'Document Printing', 'Scanning', 'Photocopy', 'Document Formatting', 'NADRA E-Services', 'Online Application Assistance', 'Office Documentation', 'CV / Resume Design' ),
		),
	);
}

/**
 * Digital / IT catalog chapters.
 *
 * @return array
 */
function amz_prints_digital_service_chapters() {
	return array(
		array(
			'title' => 'Website Design & Development',
			'intro' => 'Business, corporate, ecommerce and fully custom websites built to convert.',
			'groups' => array(
				'Business Websites' => array( 'Corporate Websites', 'Company Profile Websites', 'Service-Based Websites', 'Portfolio Websites', 'Personal Websites', 'Agency Websites', 'Professional Landing Pages' ),
				'E-Commerce' => array( 'Online Stores', 'WooCommerce Development', 'Custom E-Commerce Platforms', 'Product Catalogue Websites', 'Shopping Cart Systems', 'Online Ordering', 'Order Management', 'Customer Accounts', 'Wishlist & Comparison', 'Payment Gateway Integration', 'Shipping Integration', 'WhatsApp Order Integration' ),
				'Custom Development' => array( 'Fully Customized Websites', 'Custom UI/UX', 'Custom Frontend', 'Custom Backend', 'Database Integration', 'API Integration', 'Admin Dashboards', 'Customer Portals', 'Membership Systems', 'Booking Systems', 'Multi-Vendor Platforms' ),
				'Technologies' => array( 'WordPress', 'WooCommerce', 'HTML / CSS', 'JavaScript', 'React', 'Next.js', 'Node.js', 'PHP', 'Laravel', 'MySQL', 'PostgreSQL', 'Supabase', 'REST APIs' ),
			),
		),
		array(
			'title' => 'UI/UX Design',
			'intro' => 'Modern, responsive and conversion-focused digital experiences.',
			'groups' => array(
				'Services' => array( 'Website UI Design', 'Mobile App UI Design', 'Web Application UI', 'Dashboard Design', 'SaaS UI Design', 'Landing Page Design', 'E-Commerce UI', 'UX Research', 'User Flow Design', 'Wireframing', 'Prototyping', 'Design Systems', 'Responsive Design', 'UX Audit', 'Conversion-Focused Design' ),
				'Deliverables' => array( 'Figma Designs', 'Interactive Prototypes', 'Web Design Systems', 'Mobile App Screens', 'Component Libraries', 'Developer Handoff' ),
			),
		),
		array(
			'title' => 'Custom Software Development',
			'intro' => 'Software shaped around how your business actually works.',
			'groups' => array(
				'Business Software' => array( 'Custom Business Management Systems', 'ERP Systems', 'CRM Systems', 'POS Systems', 'Inventory Management', 'Accounting Systems', 'HR Management', 'Payroll Systems', 'School Management', 'Hospital Management', 'Pharmacy Management', 'Restaurant Management', 'Hotel Management', 'Property Management', 'Warehouse Management', 'Transport Management' ),
				'Custom Applications' => array( 'Web Applications', 'Desktop Applications', 'Cloud-Based Applications', 'SaaS Platforms', 'Customer Portals', 'Employee Portals', 'Admin Panels', 'Booking Platforms', 'Marketplace Platforms', 'Subscription Platforms', 'Membership Platforms' ),
			),
		),
		array(
			'title' => 'ERP & Business Automation',
			'intro' => 'Replace manual processes with centralized digital systems.',
			'groups' => array(
				'ERP Modules' => array( 'Sales', 'Purchase', 'Inventory', 'Products', 'Customers', 'Suppliers', 'Accounts', 'Expenses', 'Invoices', 'Payments', 'Employees', 'Attendance', 'Payroll', 'Production', 'Procurement', 'Warehouse', 'Reporting', 'Business Dashboard' ),
				'Automation' => array( 'Automated Invoicing', 'Automated Order Processing', 'WhatsApp Notifications', 'Email Notifications', 'Customer Follow-Ups', 'Stock Alerts', 'Payment Reminders', 'Sales Reports', 'Automated Workflows', 'Approval Workflows', 'Document Generation', 'Data Synchronization' ),
			),
		),
		array(
			'title' => 'Mobile App Development',
			'intro' => 'Android, iOS and cross-platform apps for customers and teams.',
			'groups' => array(
				'Applications' => array( 'Android Apps', 'iOS Apps', 'Cross-Platform Applications', 'Business Apps', 'Customer Apps', 'E-Commerce Apps', 'Booking Apps', 'Delivery Apps', 'Employee Apps', 'Education Apps', 'Healthcare Apps', 'Service-Based Apps' ),
				'Services' => array( 'UI/UX Design', 'App Development', 'API Development', 'Database Integration', 'Authentication', 'Push Notifications', 'Payment Integration', 'App Testing', 'App Deployment', 'Maintenance & Updates' ),
			),
		),
		array(
			'title' => 'Web Apps, APIs & Backend',
			'intro' => 'Secure portals, APIs, databases and system integrations.',
			'groups' => array(
				'Web Applications' => array( 'Customer Portals', 'Employee Portals', 'Admin Dashboards', 'CRM Platforms', 'ERP Platforms', 'SaaS Applications', 'Booking Systems', 'Reporting Dashboards', 'Document Management', 'Workflow Management' ),
				'API & Integration' => array( 'REST API Development', 'Third-Party API Integration', 'Payment APIs', 'WhatsApp APIs', 'Google APIs', 'Shipping APIs', 'SMS / Email APIs', 'CRM / ERP Integrations', 'Website + ERP / CRM', 'E-Commerce + Inventory', 'Mobile App + Backend' ),
				'Database & Backend' => array( 'Database Design', 'PostgreSQL', 'MySQL', 'MongoDB', 'Supabase', 'Migration & Backup', 'Optimization & Security', 'Authentication Systems', 'Role-Based Access', 'Automated Jobs', 'Notification Systems' ),
			),
		),
		array(
			'title' => 'Cloud, Hosting & Maintenance',
			'intro' => 'Reliable hosting, deployment and ongoing website care.',
			'groups' => array(
				'Cloud & Hosting' => array( 'Website Hosting', 'Cloud Hosting', 'VPS Hosting', 'Server Configuration', 'Domain & DNS', 'SSL Installation', 'CDN Configuration', 'Cloud Database', 'Backup Solutions', 'Server Monitoring' ),
				'Deployment' => array( 'Hostinger', 'Vercel', 'GitHub-Based Deployment', 'CI/CD Setup', 'Production Deployment', 'SSL & Security Configuration' ),
				'Maintenance' => array( 'Website Updates', 'Content Updates', 'Plugin Updates', 'Security Updates', 'Bug Fixing', 'Performance Optimization', 'Backup Management', 'Malware Removal', 'Technical Support', 'Website Migration' ),
			),
		),
		array(
			'title' => 'SEO & Local Search',
			'intro' => 'Improve visibility and attract relevant organic traffic.',
			'groups' => array(
				'SEO Services' => array( 'SEO Audit', 'Keyword Research', 'Competitor Analysis', 'On-Page SEO', 'Technical SEO', 'Local SEO', 'E-Commerce SEO', 'Content SEO', 'Off-Page SEO', 'Link Building', 'Google Business Profile Optimization', 'SEO Reporting' ),
				'On-Page & Technical' => array( 'Meta Titles & Descriptions', 'Heading & URL Optimization', 'Internal Linking', 'Image SEO', 'Schema Markup', 'Website Speed', 'Core Web Vitals', 'Sitemap & Robots.txt', 'Indexing & Crawlability', 'Broken Link Fixing' ),
				'Local SEO' => array( 'Google Business Profile', 'Local Keyword Research', 'Google Maps Optimization', 'Local Citations', 'Location Pages', 'Review Strategy', 'NAP Optimization', 'Local Search Reporting' ),
			),
		),
		array(
			'title' => 'Social Media & Digital Marketing',
			'intro' => 'Strategy, creatives, ads and growth across major platforms.',
			'groups' => array(
				'Social Management' => array( 'Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'YouTube', 'Pinterest', 'X / Twitter', 'Content Planning', 'Post Design', 'Reels & Stories', 'Community Management', 'Monthly Reporting' ),
				'Paid Marketing' => array( 'Facebook Advertising', 'Instagram Advertising', 'Lead Generation', 'Traffic & Engagement Campaigns', 'Brand Awareness', 'Conversion Campaigns', 'Retargeting', 'A/B Testing', 'Performance Reporting' ),
				'Digital Marketing' => array( 'Digital Strategy', 'Search Engine Marketing', 'Content Marketing', 'Email Marketing', 'Lead Generation', 'Conversion Optimization', 'Influencer Marketing', 'Analytics & Reporting' ),
				'Google Ads' => array( 'Search Ads', 'Display Ads', 'YouTube Advertising', 'Shopping Ads', 'Remarketing', 'Campaign Setup', 'Conversion Tracking', 'Optimization' ),
			),
		),
		array(
			'title' => 'E-Commerce, CRM & SaaS',
			'intro' => 'Online stores, customer systems and subscription platforms.',
			'groups' => array(
				'E-Commerce' => array( 'E-Commerce Website', 'WooCommerce', 'Product Catalogue', 'Checkout & Payments', 'Shipping Integration', 'Order Management', 'Inventory Integration', 'Coupons', 'WhatsApp / Email / SMS Notifications', 'E-Commerce SEO & Ads' ),
				'CRM' => array( 'Customer Database', 'Lead Management', 'Sales Pipeline', 'Follow-Up Management', 'Task Management', 'Sales Reports', 'Customer Segmentation', 'Automated Notifications', 'Role-Based Access' ),
				'SaaS' => array( 'Multi-Tenant Applications', 'Subscription Management', 'Billing Systems', 'Usage Tracking', 'Admin Dashboards', 'API Integration', 'Cloud Deployment', 'Analytics' ),
			),
		),
		array(
			'title' => 'Security, Communication & Consulting',
			'intro' => 'Protect systems, connect channels and plan technology with confidence.',
			'groups' => array(
				'Security' => array( 'SSL Configuration', 'Website Security', 'Malware Detection & Removal', 'Security Hardening', 'User Access Control', 'Backup Strategy', 'Server & Database Security', 'Vulnerability Assessment' ),
				'Email & WhatsApp' => array( 'Professional Email Setup', 'Domain Email', 'Email Migration', 'Newsletters', 'WhatsApp Business Setup', 'Website WhatsApp Button', 'Order Notifications', 'WhatsApp API Integration' ),
				'Consulting & Support' => array( 'IT Strategy', 'Digital Transformation', 'Software Selection', 'Website & E-Commerce Consultation', 'SEO & Marketing Consultation', 'Business Automation Consultation', 'Software Maintenance', 'Feature Development', 'Technical Support' ),
			),
		),
	);
}

/**
 * Digital packages.
 *
 * @return array
 */
function amz_prints_digital_packages() {
	return array(
		array(
			'title' => 'Startup Digital Package',
			'items' => array( 'Logo & Brand Identity', 'Business Website', 'Domain & Hosting', 'Google Business Profile', 'Social Media Setup', 'Basic SEO', 'Business Email' ),
		),
		array(
			'title' => 'Business Growth Package',
			'items' => array( 'Professional Website', 'SEO', 'Social Media Management', 'Content Creation', 'Digital Marketing', 'Google Ads', 'Analytics', 'WhatsApp Integration' ),
		),
		array(
			'title' => 'E-Commerce Package',
			'items' => array( 'E-Commerce Website', 'WooCommerce', 'Product Setup', 'Payment Integration', 'Shipping Integration', 'WhatsApp Integration', 'SEO', 'Social Media', 'Digital Advertising' ),
		),
		array(
			'title' => 'Enterprise / Custom',
			'items' => array( 'Custom Software', 'ERP / CRM', 'Business Automation', 'Mobile Application', 'API Integration', 'Cloud Infrastructure', 'Database', 'Security', 'Analytics Dashboard', 'Ongoing Technical Support' ),
		),
	);
}

/**
 * Digital process steps.
 *
 * @return array
 */
function amz_prints_digital_process() {
	return array(
		array( '01', 'Discovery', 'Understand the client’s business, requirements and objectives.' ),
		array( '02', 'Planning', 'Define scope, features, technology and project roadmap.' ),
		array( '03', 'UI/UX Design', 'Create wireframes, interfaces and prototypes.' ),
		array( '04', 'Development', 'Build the website, application or software.' ),
		array( '05', 'Integration', 'Connect APIs, databases, payment systems and third-party services.' ),
		array( '06', 'Testing', 'Functionality, usability, performance and security testing.' ),
		array( '07', 'Deployment', 'Launch on the client’s hosting or cloud infrastructure.' ),
		array( '08', 'Training', 'Provide necessary training and documentation.' ),
		array( '09', 'Support', 'Maintenance, updates and technical support.' ),
	);
}
