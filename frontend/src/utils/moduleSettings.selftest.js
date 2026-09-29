import { mergePosSettings, mergeInventorySettings, posStickerPayload, POS_STICKER_PRESETS } from './moduleSettings.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const fresh = mergePosSettings({});
assert(fresh.stickerWidthMm === 80, 'default POS roll width');
assert(fresh.stickerHeightMm === 40, 'default POS roll height');
assert(fresh.barcodeScan === true, 'barcode scan on');
assert(fresh.showBarcode === true, 'barcode on tags');

const migrated = mergePosSettings({ priceTags: { widthMm: 40, heightMm: 25, showBarcode: true } });
assert(migrated.stickerWidthMm === 80 && migrated.stickerHeightMm === 40, 'old 40x25 becomes POS 80x40');

const custom = mergePosSettings({ priceTags: { widthMm: 50, heightMm: 30 } });
assert(custom.stickerWidthMm === 50 && custom.stickerHeightMm === 30, 'keep custom tag size');

const posWins = mergePosSettings({
  pos: { stickerWidthMm: 80, stickerHeightMm: 40, barcodeScan: false },
  priceTags: { widthMm: 50, heightMm: 30 },
});
assert(posWins.stickerWidthMm === 80, 'POS sticker size wins');
assert(posWins.barcodeScan === false, 'scan can be turned off');

const payload = posStickerPayload(fresh);
assert(payload.widthMm === 80 && payload.heightMm === 40 && payload.showBarcode === true, 'print payload');
assert(POS_STICKER_PRESETS[0].widthMm === 80, 'first preset is POS roll');

const inv = mergeInventorySettings({
  inventory: { inventoryMode: { active: true, durationHours: 8, endsAt: '2026-09-30T12:00:00.000Z' } },
});
assert(inv.inventoryMode.active === true && inv.inventoryMode.durationHours === 8, 'inventory mode merged');
assert(mergeInventorySettings({}).inventoryMode.active === false, 'inventory mode default off');

console.log('moduleSettings sticker ok');
