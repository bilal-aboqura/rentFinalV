import type { BookingLanguage, PaymentMethod, TripType } from '@/types';

export interface WhatsappMessageInput {
  language: BookingLanguage;
  referenceId: string;
  tripType: TripType;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  pickupLabel: string;
  pickupDetail: string;
  dropoffLabel: string;
  dropoffDetail: string;
  date: string;
  time: string;
  flightNumber?: string | null;
  returnDate?: string | null;
  returnTime?: string | null;
  returnFlightNumber?: string | null;
  returnPickupLabel?: string | null;
  returnPickupDetail?: string | null;
  returnDropoffLabel?: string | null;
  returnDropoffDetail?: string | null;
  carName: string;
  price: number;
  paymentMethod: PaymentMethod;
  notes?: string | null;
}

function paymentLabel(method: PaymentMethod, lang: BookingLanguage): string {
  if (lang === 'ar') {
    switch (method) {
      case 'cash':
        return 'نقدًا';
      case 'card_pos':
        return 'بطاقة / نقاط بيع';
      case 'bank_transfer':
        return 'تحويل بنكي';
    }
  }
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'card_pos':
      return 'Card / POS';
    case 'bank_transfer':
      return 'Bank Transfer';
  }
}

function tripTypeLabel(tripType: TripType, lang: BookingLanguage): string {
  if (lang === 'ar') return tripType === 'round_trip' ? 'ذهاب وعودة' : 'ذهاب فقط';
  return tripType === 'round_trip' ? 'Round trip' : 'One-way';
}

function endpointLine(
  lang: BookingLanguage,
  label: string,
  detail: string,
  kindAr: string,
  kindEn: string,
): string {
  const kind = lang === 'ar' ? kindAr : kindEn;
  const cleanDetail = detail.trim();
  const detailPart = cleanDetail && cleanDetail !== label ? ` — ${cleanDetail}` : '';
  return `${kind}: ${label}${detailPart}`;
}

/**
 * Builds a WhatsApp booking notification message containing every
 * detail the business owner needs, formatted so it can be forwarded
 * directly to a driver. Bilingual (AR / EN).
 */
export function buildWhatsappMessage(input: WhatsappMessageInput): string {
  const lang = input.language;
  const isAr = lang === 'ar';

  const lines: string[] = [];

  if (isAr) {
    lines.push('*🚗 طلب حجز جديد*');
    lines.push(`🔖 رقم الحجز: ${input.referenceId}`);
    lines.push('');
    lines.push(`🔹 نوع الرحلة: ${tripTypeLabel(input.tripType, lang)}`);
    lines.push(`🔹 اسم العميل: ${input.customerName}`);
    lines.push(`🔹 جوال العميل: ${input.customerPhone}`);
    if (input.customerEmail?.trim()) {
      lines.push(`🔹 البريد الإلكتروني: ${input.customerEmail.trim()}`);
    }
    lines.push(
      `🔹 الانطلاق: ${endpointLine(lang, input.pickupLabel, input.pickupDetail, '', '')}`,
    );
    lines.push(
      `🔹 الوجهة: ${endpointLine(lang, input.dropoffLabel, input.dropoffDetail, '', '')}`,
    );
    lines.push(`🔹 التاريخ: ${input.date}`);
    lines.push(`🔹 الوقت: ${input.time}`);
    if (input.flightNumber && input.flightNumber.trim()) {
      lines.push(`✈️ رقم الرحلة: ${input.flightNumber}`);
    }
    if (input.tripType === 'round_trip' && input.returnDate) {
      lines.push('');
      lines.push('🔁 تفاصيل العودة:');
      if (input.returnPickupLabel && input.returnDropoffLabel) {
        lines.push(
          `🔹 مسار العودة: ${input.returnPickupLabel}${
            input.returnPickupDetail &&
            input.returnPickupDetail.trim() &&
            input.returnPickupDetail.trim() !== input.returnPickupLabel
              ? ` — ${input.returnPickupDetail.trim()}`
              : ''
          } ← ${
            input.returnDropoffLabel
          }${
            input.returnDropoffDetail &&
            input.returnDropoffDetail.trim() &&
            input.returnDropoffDetail.trim() !== input.returnDropoffLabel
              ? ` — ${input.returnDropoffDetail.trim()}`
              : ''
          }`,
        );
      }
      lines.push(`🔹 تاريخ العودة: ${input.returnDate}`);
      lines.push(`🔹 وقت العودة: ${input.returnTime}`);
      if (input.returnFlightNumber && input.returnFlightNumber.trim()) {
        lines.push(`✈️ رقم رحلة العودة: ${input.returnFlightNumber}`);
      }
    }
    lines.push('');
    lines.push(`🚙 السيارة: ${input.carName}`);
    lines.push(`💰 المبلغ: ${input.price} ريال`);
    lines.push(`💳 الدفع: ${paymentLabel(input.paymentMethod, lang)}`);
    if (input.notes && input.notes.trim()) {
      lines.push(`📝 ملاحظات: ${input.notes.trim()}`);
    }
    lines.push('');
    lines.push('يرجى التواصل مع العميل عبر واتساب لتأكيد الحجز. شكرًا لكم.');
  } else {
    lines.push('*🚗 New Booking Request*');
    lines.push(`🔖 Booking Ref: ${input.referenceId}`);
    lines.push('');
    lines.push(`• Trip type: ${tripTypeLabel(input.tripType, lang)}`);
    lines.push(`• Customer: ${input.customerName}`);
    lines.push(`• Phone / WhatsApp: ${input.customerPhone}`);
    if (input.customerEmail?.trim()) {
      lines.push(`• Email: ${input.customerEmail.trim()}`);
    }
    lines.push(`• From: ${input.pickupLabel}${input.pickupDetail ? ` — ${input.pickupDetail}` : ''}`);
    lines.push(
      `• To: ${input.dropoffLabel}${input.dropoffDetail ? ` — ${input.dropoffDetail}` : ''}`,
    );
    lines.push(`• Date: ${input.date}`);
    lines.push(`• Time: ${input.time}`);
    if (input.flightNumber && input.flightNumber.trim()) {
      lines.push(`✈️ Flight No: ${input.flightNumber}`);
    }
    if (input.tripType === 'round_trip' && input.returnDate) {
      lines.push('');
      lines.push('🔁 Return trip:');
      if (input.returnPickupLabel && input.returnDropoffLabel) {
        lines.push(
          `• Return route: ${input.returnPickupLabel}${
            input.returnPickupDetail &&
            input.returnPickupDetail.trim() &&
            input.returnPickupDetail.trim() !== input.returnPickupLabel
              ? ` — ${input.returnPickupDetail.trim()}`
              : ''
          } to ${input.returnDropoffLabel}${
            input.returnDropoffDetail &&
            input.returnDropoffDetail.trim() &&
            input.returnDropoffDetail.trim() !== input.returnDropoffLabel
              ? ` — ${input.returnDropoffDetail.trim()}`
              : ''
          }`,
        );
      }
      lines.push(`• Return date: ${input.returnDate}`);
      lines.push(`• Return time: ${input.returnTime}`);
      if (input.returnFlightNumber && input.returnFlightNumber.trim()) {
        lines.push(`✈️ Return flight: ${input.returnFlightNumber}`);
      }
    }
    lines.push('');
    lines.push(`🚙 Car: ${input.carName}`);
    lines.push(`💰 Total: ${input.price} SAR`);
    lines.push(`💳 Payment: ${paymentLabel(input.paymentMethod, lang)}`);
    if (input.notes && input.notes.trim()) {
      lines.push(`📝 Notes: ${input.notes.trim()}`);
    }
    lines.push('');
    lines.push('Please contact the customer on WhatsApp to confirm. Thank you.');
  }

  return lines.join('\n');
}

/** Builds a wa.me / api.whatsapp.com URL with the prefilled message. */
export function buildWhatsappUrl(whatsappNumber: string, message: string): string {
  const phone = whatsappNumber.replace(/[^\d]/g, '');
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}
