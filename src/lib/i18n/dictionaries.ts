export type Language = "ar" | "en";

export const LANGUAGES: Language[] = ["ar", "en"];

export const DEFAULT_LANGUAGE: Language = "ar";

export const LANGUAGE_LABELS: Record<Language, string> = {
  ar: "العربية",
  en: "English",
};

/**
 * Translation dictionary. Each key maps to { ar, en } so that key
 * parity between languages is trivial to verify and test.
 */
type Entry = { ar: string; en: string };

export const dictionary: Record<string, Entry> = {
  // ── Language switcher ───────────────────────────────────────
  "lang.switchTo": { ar: "English", en: "العربية" },
  "lang.name": { ar: "العربية", en: "English" },

  // ── Site header / nav ───────────────────────────────────────
  "nav.book": { ar: "احجز الآن", en: "Book Now" },
  "nav.fleet": { ar: "الأسطول", en: "Fleet" },
  "nav.howItWorks": { ar: "كيف نعمل", en: "How It Works" },
  "nav.experience": { ar: "لماذا نحن", en: "Why Us" },
  "nav.contact": { ar: "تواصل معنا", en: "Contact" },
  "nav.dashboard": { ar: "لوحة التحكم", en: "Dashboard" },
  "nav.open": { ar: "فتح القائمة", en: "Open menu" },
  "nav.close": { ar: "إغلاق القائمة", en: "Close menu" },

  // ── Hero ────────────────────────────────────────────────────
  "hero.cta": { ar: "ابدأ الحجز", en: "Start Booking" },
  "hero.secondary": { ar: "تحدّث مع الفريق", en: "Talk to Us" },

  // ── Booking: step titles ────────────────────────────────────
  "booking.title": { ar: "احجز رحلتك الآن", en: "Book Your Trip" },
  "booking.subtitle": {
    ar: "أكمل البيانات التالية لتأكيد طلب الحجز.",
    en: "Fill in the details below to submit your booking request.",
  },
  "booking.step.customer": { ar: "بيانات العميل", en: "Your Info" },
  "booking.step.trip": { ar: "تفاصيل الرحلة", en: "Trip Details" },
  "booking.step.car": { ar: "اختر السيارة", en: "Select Car" },
  "booking.step.payment": { ar: "طريقة الدفع", en: "Payment" },
  "booking.step.summary": { ar: "مراجعة الطلب", en: "Review" },
  "booking.step.done": { ar: "تم الإرسال", en: "Submitted" },

  // ── Buttons ─────────────────────────────────────────────────
  "btn.next": { ar: "التالي", en: "Next" },
  "btn.back": { ar: "السابق", en: "Back" },
  "btn.continue": { ar: "متابعة", en: "Continue" },
  "btn.submit": { ar: "إرسال طلب الحجز", en: "Submit Booking Request" },
  "btn.sendWhatsapp": { ar: "إرسال عبر واتساب", en: "Send via WhatsApp" },
  "btn.bookAnother": { ar: "حجز رحلة أخرى", en: "Book Another Trip" },
  "btn.startBooking": { ar: "ابدأ الحجز", en: "Start Booking" },

  // ── Customer fields ─────────────────────────────────────────
  "field.fullName": { ar: "الاسم الكامل", en: "Full Name" },
  "field.fullName.placeholder": { ar: "اكتب اسمك", en: "Enter your name" },
  "field.phone": { ar: "رقم الواتساب / الجوال", en: "WhatsApp / Phone Number" },
  "field.phone.placeholder": { ar: "مثال: 9665XXXXXXXX", en: "e.g. 9665XXXXXXXX" },
  "field.email": { ar: "البريد الإلكتروني (اختياري)", en: "Email (optional)" },
  "field.email.placeholder": { ar: "name@example.com", en: "name@example.com" },
  "field.notes": { ar: "ملاحظات", en: "Notes" },
  "field.notes.placeholder": {
    ar: "أي تفاصيل إضافية تود إضافتها",
    en: "Any extra details you'd like to add",
  },

  // ── Trip fields ─────────────────────────────────────────────
  "trip.type": { ar: "نوع الرحلة", en: "Trip Type" },
  "trip.oneWay": { ar: "ذهاب فقط", en: "One-way" },
  "trip.roundTrip": { ar: "ذهاب وعودة", en: "Round trip" },
  "trip.from": { ar: "من", en: "From" },
  "trip.to": { ar: "إلى", en: "To" },
  "trip.date": { ar: "التاريخ", en: "Date" },
  "trip.time": { ar: "الوقت (٢٤ ساعة)", en: "Time (24h)" },
  "trip.flightNumber": { ar: "رقم الرحلة", en: "Flight Number" },
  "trip.flightNumber.placeholder": { ar: "مثال: SV1230", en: "e.g. SV1230" },
  "trip.flightRequired": {
    ar: "رقم الرحلة مطلوب عند اختيار المطار.",
    en: "Flight number is required when an airport is selected.",
  },
  "trip.passengers": { ar: "عدد الركاب", en: "Passengers" },

  "trip.returnTitle": { ar: "تفاصيل العودة", en: "Return Trip Details" },
  "trip.returnDate": { ar: "تاريخ العودة", en: "Return Date" },
  "trip.returnTime": { ar: "وقت العودة (٢٤ ساعة)", en: "Return Time (24h)" },
  "trip.returnFlight": { ar: "رقم رحلة العودة", en: "Return Flight Number" },

  // ── Location type selectors ────────────────────────────────
  "loc.type": { ar: "النوع", en: "Type" },
  "loc.type.airport": { ar: "مطار", en: "Airport" },
  "loc.type.hotel": { ar: "فندق", en: "Hotel" },
  "loc.type.address": { ar: "عنوان", en: "Address" },
  "loc.type.other": { ar: "أخرى", en: "Other" },
  "loc.selectAirport": { ar: "اختر المطار", en: "Select Airport" },
  "loc.airportOther": { ar: "اسم المطار", en: "Airport Name" },
  "loc.airportDetail.placeholder": {
    ar: "مثال: صالة الوصول 1 أو اسم المطار إذا لم يكن ظاهرًا",
    en: "e.g. Arrival terminal 1 or the airport name if not listed",
  },
  "loc.hotelName": { ar: "اسم الفندق", en: "Hotel Name" },
  "loc.hotelName.placeholder": {
    ar: "مثال: أبراج البيت، الصفوة",
    en: "e.g. Abraj Al Bait, Al Safwah",
  },
  "loc.address.placeholder": { ar: "اكتب العنوان بالكامل", en: "Enter the full address" },
  "loc.routeCity": { ar: "المدينة / المنطقة", en: "City / Area" },
  "loc.detail": { ar: "التفاصيل", en: "Details" },

  // ── Car selection ───────────────────────────────────────────
  "car.title": { ar: "اختر السيارة المناسبة", en: "Choose Your Car" },
  "car.passengers": { ar: "راكب", en: "pax" },
  "car.luggage": { ar: "حقائب", en: "bags" },
  "car.perTrip": { ar: "للرحلة", en: "per trip" },
  "car.select": { ar: "اختيار", en: "Select" },
  "car.selected": { ar: "مختارة", en: "Selected" },
  "car.noPricing": {
    ar: "لا تتوفر أسعار محددة لهذا الخط. تواصل معنا لتأكيد السعر.",
    en: "No fixed price for this route. Contact us to confirm the rate.",
  },
  "car.class.standard": { ar: "اقتصادية", en: "Standard" },
  "car.class.executive": { ar: "تنفيذية", en: "Executive" },
  "car.class.van": { ar: "عائلية / فان", en: "Van" },

  // ── Payment ─────────────────────────────────────────────────
  "payment.title": { ar: "اختر طريقة الدفع", en: "Select Payment Method" },
  "payment.cash": { ar: "نقدًا", en: "Cash" },
  "payment.cash.desc": { ar: "ادفع للسائق عند الاستلام", en: "Pay the driver on arrival" },
  "payment.card_pos": { ar: "بطاقة / نقاط بيع", en: "Card / POS" },
  "payment.card_pos.desc": {
    ar: "ادفع بالبطاقة عبر جهاز نقاط البيع",
    en: "Pay by card through the POS device",
  },
  "payment.bank_transfer": { ar: "تحويل بنكي", en: "Bank Transfer" },
  "payment.bank_transfer.desc": {
    ar: "حوّل المبلغ وأرسل الإيصال عبر واتساب",
    en: "Transfer the amount and send the receipt via WhatsApp",
  },
  "payment.bank.name": { ar: "اسم البنك", en: "Bank Name" },
  "payment.bank.holder": { ar: "اسم صاحب الحساب", en: "Account Holder" },
  "payment.bank.iban": { ar: "رقم الآيبان / الحساب", en: "IBAN / Account No." },
  "payment.bank.qr": { ar: "رمز QR / باركود التحويل", en: "Transfer QR / Barcode" },
  "payment.bank.note": {
    ar: "بعد التحويل، أرسل إيصال التحويل عبر واتساب لتأكيد الحجز.",
    en: "After transferring, send the receipt via WhatsApp to confirm.",
  },

  // ── Summary ─────────────────────────────────────────────────
  "summary.title": { ar: "راجع تفاصيل حجزك", en: "Review Your Booking" },
  "summary.customer": { ar: "بيانات العميل", en: "Customer" },
  "summary.trip": { ar: "تفاصيل الرحلة", en: "Trip" },
  "summary.car": { ar: "السيارة", en: "Car" },
  "summary.payment": { ar: "الدفع", en: "Payment" },
  "summary.total": { ar: "الإجمالي", en: "Total" },
  "summary.roundTripNote": {
    ar: "تشمل الذهاب والعودة",
    en: "Includes outbound and return",
  },

  // ── Success ─────────────────────────────────────────────────
  "success.title": { ar: "تم إرسال طلب الحجز بنجاح", en: "Booking Request Sent" },
  "success.message": {
    ar: "تم استلام طلبك بنجاح. سنتواصل معك عبر واتساب لتأكيد الحجز.",
    en: "Your booking request has been sent successfully. We will contact you on WhatsApp to confirm the booking.",
  },
  "success.reference": { ar: "رقم الطلب", en: "Booking Ref" },
  "success.whatsappHint": {
    ar: "اضغط الزر لإرسال التفاصيل إلى واتساب الشركة وتسريع التأكيد.",
    en: "Tap the button to send the details to our WhatsApp and speed up confirmation.",
  },
  "success.whatsappAuto": {
    ar: "تم إرسال إشعار واتساب إلى فريق الحجز تلقائيًا، وسنتواصل معك للتأكيد.",
    en: "A WhatsApp notification was sent to our booking team automatically. We’ll contact you to confirm.",
  },
  "success.popupBlocked": {
    ar: "إذا لم يفتح واتساب تلقائيًا، استخدم الزر أدناه.",
    en: "If WhatsApp didn't open automatically, use the button below.",
  },

  // ── Validation errors ───────────────────────────────────────
  "err.required": { ar: "هذا الحقل مطلوب", en: "This field is required" },
  "err.name": { ar: "الاسم مطلوب", en: "Name is required" },
  "err.phone": { ar: "رقم هاتف صحيح مطلوب", en: "A valid phone number is required" },
  "err.email": { ar: "بريد إلكتروني غير صحيح", en: "Invalid email address" },
  "err.from": { ar: "مكان الانطلاق مطلوب", en: "Pickup location is required" },
  "err.to": { ar: "وجهة الرحلة مطلوبة", en: "Drop-off location is required" },
  "err.sameLocation": {
    ar: "يجب أن يكون الانطلاق والوجهة مختلفين",
    en: "Pickup and drop-off must be different",
  },
  "err.date": { ar: "التاريخ مطلوب", en: "Date is required" },
  "err.time": { ar: "الوقت مطلوب", en: "Time is required" },
  "err.pastDate": {
    ar: "يجب أن يكون التاريخ والوقت في المستقبل",
    en: "Date and time must be in the future",
  },
  "err.flight": { ar: "رقم الرحلة مطلوب", en: "Flight number is required" },
  "err.car": { ar: "اختر سيارة", en: "Please select a car" },
  "err.payment": { ar: "اختر طريقة الدفع", en: "Select a payment method" },
  "err.returnDate": { ar: "تاريخ العودة مطلوب", en: "Return date is required" },
  "err.returnTime": { ar: "وقت العودة مطلوب", en: "Return time is required" },
  "err.generic": {
    ar: "تعذّر إرسال الطلب. حاول مرة أخرى.",
    en: "Could not submit the request. Please try again.",
  },

  // ── Booking statuses (admin + customer) ────────────────────
  "status.Pending": { ar: "قيد الانتظار", en: "Pending" },
  "status.Confirmed": { ar: "مؤكد", en: "Confirmed" },
  "status.Assigned": { ar: "مُسند للسائق", en: "Assigned to Driver" },
  "status.Completed": { ar: "مكتمل", en: "Completed" },
  "status.Cancelled": { ar: "ملغى", en: "Cancelled" },
};

export type Dictionary = typeof dictionary;
