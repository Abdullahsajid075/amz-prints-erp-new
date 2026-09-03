<?php
/**
 * WhatsApp Flow button + AI Assistant
 *
 * @package AMZ_Prints
 */

$wa_enabled = (bool) amz_prints_mod( 'amz_wa_enabled', true );
$wa_number  = preg_replace( '/\D+/', '', amz_prints_mod( 'amz_whatsapp', amz_prints_mod( 'amz_phone', '923000000000' ) ) );
$wa_label   = amz_prints_mod( 'amz_wa_button_label', '' );
if ( ! $wa_label ) {
	$wa_label = amz_t( 'wa_chat' );
}
$wa_msg = amz_prints_mod(
	'amz_wa_message',
	amz_prints_is_rtl()
		? 'السلام علیکم، مجھے پرنٹنگ سروسز کے بارے میں معلومات چاہیے۔'
		: 'Hello AMZ Prints, I need help with a printing service.'
);
$wa_flow_url = trim( (string) amz_prints_mod( 'amz_wa_flow_url', '' ) );
$wa_href     = $wa_flow_url
	? $wa_flow_url
	: ( $wa_number ? 'https://wa.me/' . $wa_number . '?text=' . rawurlencode( $wa_msg ) : '#' );

$ai_enabled = (bool) amz_prints_mod( 'amz_ai_enabled', true );
$quick      = array(
	array( 'en' => 'Get a Quote', 'ur' => 'کوٹیشن لیں', 'action' => 'quote' ),
	array( 'en' => 'Track Order', 'ur' => 'آرڈر ٹریک', 'action' => 'track' ),
	array( 'en' => 'Our Services', 'ur' => 'سروسز', 'action' => 'services' ),
	array( 'en' => 'WhatsApp', 'ur' => 'واٹس ایپ', 'action' => 'whatsapp' ),
);
?>

<div class="float-stack" id="float-stack">
	<?php if ( $wa_enabled && ( $wa_number || $wa_flow_url ) ) : ?>
	<div class="wa-flow" id="wa-flow">
		<button type="button" class="wa-flow__fab" id="wa-flow-toggle" aria-expanded="false" aria-controls="wa-flow-panel">
			<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M16.01 3C9.39 3 4 8.39 4 15.02c0 2.66.87 5.12 2.35 7.12L4 29l7.1-2.28A11.95 11.95 0 0 0 16.01 27C22.63 27 28 21.61 28 14.98 28 8.39 22.63 3 16.01 3zm0 21.82c-2.1 0-4.05-.6-5.7-1.64l-.41-.25-4.21 1.35 1.37-4.1-.27-.43a9.7 9.7 0 0 1-1.5-5.24c0-5.38 4.38-9.76 9.76-9.76s9.76 4.38 9.76 9.76-4.38 9.76-9.8 9.76zm5.37-7.3c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.63.07-.29-.15-1.23-.45-2.34-1.44-.86-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.52.07-.79.37-.27.29-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.2-.56-.34z"/></svg>
		</button>
		<div class="wa-flow__panel" id="wa-flow-panel" hidden>
			<div class="wa-flow__head">
				<span class="wa-flow__badge">WhatsApp</span>
				<strong><?php echo esc_html( $wa_label ); ?></strong>
				<p><?php echo esc_html( amz_prints_is_rtl() ? 'فوری مدد کے لیے نیچے آپشن منتخب کریں' : 'Choose an option to start a WhatsApp conversation' ); ?></p>
			</div>
			<div class="wa-flow__actions">
				<a class="wa-flow__action" href="<?php echo esc_url( $wa_href ); ?>" target="_blank" rel="noopener noreferrer" data-wa-preset="general">
					<span><?php echo esc_html( amz_prints_is_rtl() ? 'جنرل پوچھ گچھ' : 'General inquiry' ); ?></span>
				</a>
				<a class="wa-flow__action" href="<?php echo esc_url( 'https://wa.me/' . $wa_number . '?text=' . rawurlencode( amz_prints_is_rtl() ? 'مجھے کوٹیشن چاہیے' : 'I need a quote' ) ); ?>" target="_blank" rel="noopener noreferrer">
					<span><?php echo esc_html( amz_t( 'quote' ) ); ?></span>
				</a>
				<a class="wa-flow__action" href="<?php echo esc_url( 'https://wa.me/' . $wa_number . '?text=' . rawurlencode( amz_prints_is_rtl() ? 'آرڈر سٹیٹس معلوم کرنا ہے' : 'I want to check order status' ) ); ?>" target="_blank" rel="noopener noreferrer">
					<span><?php echo esc_html( amz_t( 'track_order' ) ); ?></span>
				</a>
				<a class="wa-flow__action" href="<?php echo esc_url( 'https://wa.me/' . $wa_number . '?text=' . rawurlencode( amz_prints_is_rtl() ? 'نادرا ای سروسز کے بارے میں' : 'NADRA e-services inquiry' ) ); ?>" target="_blank" rel="noopener noreferrer">
					<span><?php echo esc_html( amz_t( 'nadra' ) ); ?></span>
				</a>
				<?php if ( $wa_flow_url ) : ?>
				<a class="wa-flow__action wa-flow__action--primary" href="<?php echo esc_url( $wa_flow_url ); ?>" target="_blank" rel="noopener noreferrer">
					<span><?php echo esc_html( amz_prints_is_rtl() ? 'واٹس ایپ فلو کھولیں' : 'Open WhatsApp Flow' ); ?></span>
				</a>
				<?php endif; ?>
			</div>
			<a class="wa-flow__direct" href="<?php echo esc_url( $wa_href ); ?>" target="_blank" rel="noopener noreferrer">
				<?php echo esc_html( amz_prints_is_rtl() ? 'واٹس ایپ چیٹ شروع کریں' : 'Start WhatsApp chat' ); ?>
			</a>
		</div>
	</div>
	<?php endif; ?>

	<?php if ( $ai_enabled ) : ?>
	<div class="ai-chat" id="ai-chat">
		<button type="button" class="ai-chat__toggle" id="ai-chat-toggle" aria-expanded="false" aria-controls="ai-chat-panel">
			<span class="ai-chat__pulse"></span>
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>
		</button>
		<div class="ai-chat__panel" id="ai-chat-panel" hidden>
			<div class="ai-chat__head">
				<div>
					<strong><?php echo esc_html( amz_t( 'chat_title' ) ); ?></strong>
					<small><?php echo esc_html( amz_prints_is_rtl() ? 'آن لائن اسسٹنٹ' : 'Online assistant' ); ?></small>
				</div>
				<button type="button" class="ai-chat__close" id="ai-chat-close" aria-label="Close">×</button>
			</div>
			<div class="ai-chat__quick" id="ai-chat-quick">
				<?php foreach ( $quick as $q ) : ?>
					<button type="button" class="ai-chat__chip" data-ai-action="<?php echo esc_attr( $q['action'] ); ?>">
						<?php echo esc_html( amz_prints_is_rtl() ? $q['ur'] : $q['en'] ); ?>
					</button>
				<?php endforeach; ?>
			</div>
			<div class="ai-chat__messages" id="ai-chat-messages">
				<div class="ai-chat__bubble ai-chat__bubble--bot"><?php echo esc_html( amz_t( 'chat_hello' ) ); ?></div>
			</div>
			<form class="ai-chat__form" id="ai-chat-form">
				<input type="text" id="ai-chat-input" placeholder="<?php echo esc_attr( amz_t( 'chat_placeholder' ) ); ?>" autocomplete="off" required>
				<button type="submit" class="btn btn--primary btn--sm"><?php echo esc_html( amz_t( 'chat_send' ) ); ?></button>
			</form>
		</div>
	</div>
	<?php endif; ?>
</div>
