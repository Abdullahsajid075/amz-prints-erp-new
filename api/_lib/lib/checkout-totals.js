/**
 * Website checkout amounts. Delivery is PKR 250 only for home delivery
 * inside the 10 km area. Store pickup is free. The advance is 50%.
 */

const HOME_DELIVERY_FEE = 250;
const ADVANCE_RATE = 0.5;

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function websiteCheckoutTotals({ subtotal, discountAmount, deliveryMethod, withinRadius }) {
  const sub = money(Math.max(0, Number(subtotal) || 0));
  let discount = money(Math.max(0, Number(discountAmount) || 0));
  if (discount > sub) discount = sub;
  const method = String(deliveryMethod || '').trim().toLowerCase();
  const home = method === 'home' || method.includes('home');
  const pickup = method === 'pickup' || method.includes('pickup') || method.includes('store');
  if (!home && !pickup) {
    return { error: 'Select home delivery or store pickup.' };
  }
  if (home && withinRadius !== true) {
    if (withinRadius === false) {
      return {
        error: 'Your address is outside the 10 km delivery area. The standard delivery charge of PKR 250 is not applied. Choose store pickup or contact the office.',
        outsideArea: true,
      };
    }
    return { error: 'Confirm whether your address is within 10 km of the office.' };
  }
  const deliveryCharges = home ? HOME_DELIVERY_FEE : 0;
  const totalAmount = money(sub - discount + deliveryCharges);
  const advanceDue = money(totalAmount * ADVANCE_RATE);
  return {
    deliveryMethod: home ? 'Home Delivery' : 'Store Pickup',
    deliveryCharges,
    discountAmount: discount,
    subtotal: sub,
    totalAmount,
    advanceDue,
    balanceAmount: money(totalAmount - advanceDue),
  };
}

function assertDeclaredAdvance(declared, advanceDue, paymentMethod) {
  const due = money(advanceDue);
  const method = String(paymentMethod || '');
  if (method !== 'Bank Transfer') {
    return { declared: due };
  }
  const amount = money(declared);
  if (!(amount + 0.001 >= due)) {
    return { error: `The advance payment must be at least 50% of the order (Rs. ${due}).` };
  }
  return { declared: amount };
}

module.exports = {
  HOME_DELIVERY_FEE,
  ADVANCE_RATE,
  websiteCheckoutTotals,
  assertDeclaredAdvance,
};
