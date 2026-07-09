import type {
  BookingHospitalitySelection,
  BookingLanguage,
  PaymentMethod,
  TripType,
} from '@/types';

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
  passengerCount: number;
  hospitalitySelections?: BookingHospitalitySelection[];
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
  if (lang === 'ar') {
    return tripType === 'round_trip' ? 'ذهاب وعودة' : 'ذهاب فقط';
  }

  return tripType === 'round_trip' ? 'Round trip' : 'One-way';
}

function detailSuffix(label: string, detail: string): string {
  const cleanDetail = detail.trim();
  return cleanDetail && cleanDetail !== label ? ` - ${cleanDetail}` : '';
}

function hospitalityLines(
  hospitalitySelections: BookingHospitalitySelection[] | undefined,
  lang: BookingLanguage,
): string[] {
  if (!hospitalitySelections?.length) {
    return [];
  }

  return [
    lang === 'ar' ? '☕ الضيافة المجانية:' : '☕ Complimentary hospitality:',
    ...hospitalitySelections.map((selection) => {
      const name = lang === 'ar' ? selection.name_ar : selection.name;
      return `• ${name}: ${selection.quantity}`;
    }),
  ];
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
    lines.push(`• نوع الرحلة: ${tripTypeLabel(input.tripType, lang)}`);
    lines.push(`• اسم العميل: ${input.customerName}`);
    lines.push(`• جوال العميل: ${input.customerPhone}`);
    if (input.customerEmail?.trim()) {
      lines.push(`• البريد الإلكتروني: ${input.customerEmail.trim()}`);
    }
    lines.push(`• الانطلاق: ${input.pickupLabel}${detailSuffix(input.pickupLabel, input.pickupDetail)}`);
    lines.push(`• الوجهة: ${input.dropoffLabel}${detailSuffix(input.dropoffLabel, input.dropoffDetail)}`);
    lines.push(`• التاريخ: ${input.date}`);
    lines.push(`• الوقت: ${input.time}`);
    lines.push(`• عدد الركاب: ${input.passengerCount}`);
    if (input.flightNumber?.trim()) {
      lines.push(`✈️ رقم الرحلة: ${input.flightNumber.trim()}`);
    }

    if (input.tripType === 'round_trip' && input.returnDate) {
      lines.push('');
      lines.push('🔁 تفاصيل العودة:');
      if (input.returnPickupLabel && input.returnDropoffLabel) {
        lines.push(
          `• مسار العودة: ${input.returnPickupLabel}${detailSuffix(input.returnPickupLabel, input.returnPickupDetail ?? '')} إلى ${input.returnDropoffLabel}${detailSuffix(input.returnDropoffLabel, input.returnDropoffDetail ?? '')}`,
        );
      }
      lines.push(`• تاريخ العودة: ${input.returnDate}`);
      lines.push(`• وقت العودة: ${input.returnTime}`);
      if (input.returnFlightNumber?.trim()) {
        lines.push(`✈️ رقم رحلة العودة: ${input.returnFlightNumber.trim()}`);
      }
    }

    lines.push('');
    lines.push(`🚙 السيارة: ${input.carName}`);
    lines.push(...hospitalityLines(input.hospitalitySelections, lang));
    lines.push(`💰 المبلغ: ${input.price} ريال`);
    lines.push(`💳 الدفع: ${paymentLabel(input.paymentMethod, lang)}`);
    if (input.notes?.trim()) {
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
    lines.push(`• From: ${input.pickupLabel}${detailSuffix(input.pickupLabel, input.pickupDetail)}`);
    lines.push(`• To: ${input.dropoffLabel}${detailSuffix(input.dropoffLabel, input.dropoffDetail)}`);
    lines.push(`• Date: ${input.date}`);
    lines.push(`• Time: ${input.time}`);
    lines.push(`• Passengers: ${input.passengerCount}`);
    if (input.flightNumber?.trim()) {
      lines.push(`✈️ Flight No: ${input.flightNumber.trim()}`);
    }

    if (input.tripType === 'round_trip' && input.returnDate) {
      lines.push('');
      lines.push('🔁 Return trip:');
      if (input.returnPickupLabel && input.returnDropoffLabel) {
        lines.push(
          `• Return route: ${input.returnPickupLabel}${detailSuffix(input.returnPickupLabel, input.returnPickupDetail ?? '')} to ${input.returnDropoffLabel}${detailSuffix(input.returnDropoffLabel, input.returnDropoffDetail ?? '')}`,
        );
      }
      lines.push(`• Return date: ${input.returnDate}`);
      lines.push(`• Return time: ${input.returnTime}`);
      if (input.returnFlightNumber?.trim()) {
        lines.push(`✈️ Return flight: ${input.returnFlightNumber.trim()}`);
      }
    }

    lines.push('');
    lines.push(`🚙 Car: ${input.carName}`);
    lines.push(...hospitalityLines(input.hospitalitySelections, lang));
    lines.push(`💰 Total: ${input.price} SAR`);
    lines.push(`💳 Payment: ${paymentLabel(input.paymentMethod, lang)}`);
    if (input.notes?.trim()) {
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
