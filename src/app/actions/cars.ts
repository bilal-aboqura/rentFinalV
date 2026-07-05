'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { Car, CreateCarInput, PublicFleetCar, ServerActionResponse, VehicleClass } from '@/types';

const PUBLIC_ASSETS_BUCKET = 'public_assets';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CAR_SELECT =
  'id, name, name_ar, vehicle_class, passenger_capacity, luggage_capacity, image_url, sort_order, is_active, created_at, updated_at';

const VEHICLE_CLASSES: VehicleClass[] = ['standard', 'executive', 'van'];

function toCar(row: unknown): Car | null {
  if (typeof row !== 'object' || row === null) return null;
  const r = row as Record<string, unknown>;
  if (
    typeof r.id !== 'string' ||
    typeof r.name !== 'string' ||
    typeof r.name_ar !== 'string' ||
    typeof r.vehicle_class !== 'string' ||
    typeof r.passenger_capacity !== 'number' ||
    typeof r.luggage_capacity !== 'number' ||
    typeof r.sort_order !== 'number' ||
    typeof r.is_active !== 'boolean'
  ) {
    return null;
  }
  return {
    id: r.id,
    name: r.name,
    name_ar: r.name_ar,
    vehicle_class: r.vehicle_class as VehicleClass,
    passenger_capacity: r.passenger_capacity,
    luggage_capacity: r.luggage_capacity,
    image_url: typeof r.image_url === 'string' ? r.image_url : null,
    sort_order: r.sort_order,
    is_active: r.is_active,
    created_at: typeof r.created_at === 'string' ? r.created_at : '',
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : '',
  };
}

/**
 * Public: list active cars ordered for display. Safe under RLS.
 */
export async function getActiveCarsAction(): Promise<Car[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cars')
      .select(CAR_SELECT)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) return [];
    return (data ?? []).map(toCar).filter((c): c is Car => c !== null);
  } catch {
    return [];
  }
}

/**
 * Public fleet cards for the homepage. This intentionally uses the
 * same cars table as the booking step so fleet display and booking
 * options cannot drift apart.
 */
export async function getPublicFleetCarsAction(): Promise<PublicFleetCar[]> {
  try {
    const supabase = await createClient();
    const cars = await getActiveCarsAction();
    if (cars.length === 0) return [];

    const { data } = await supabase
      .from('pricing_rules')
      .select('vehicle_class, price');

    const minPriceByClass = new Map<VehicleClass, number>();
    for (const row of (data ?? []) as { vehicle_class: VehicleClass; price: number }[]) {
      const price = Number(row.price);
      const current = minPriceByClass.get(row.vehicle_class);
      if (Number.isFinite(price) && (current === undefined || price < current)) {
        minPriceByClass.set(row.vehicle_class, price);
      }
    }

    return cars.map((car) => ({
      id: car.id,
      name: car.name,
      name_ar: car.name_ar,
      passenger_capacity: car.passenger_capacity,
      luggage_capacity: car.luggage_capacity,
      image_url: car.image_url,
      sort_order: car.sort_order,
      starting_price: minPriceByClass.get(car.vehicle_class) ?? null,
    }));
  } catch {
    return [];
  }
}

/**
 * Admin: list all cars (active + inactive).
 */
export async function getAdminCarsAction(): Promise<Car[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cars')
    .select(CAR_SELECT)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return [];
  }
  return (data ?? []).map(toCar).filter((c): c is Car => c !== null);
}

export async function createCarAction(
  input: CreateCarInput,
): Promise<ServerActionResponse<Car>> {
  if (!input.name.trim() || !input.name_ar.trim()) {
    return { success: false, error: 'Car name (EN + AR) is required.' };
  }
  if (!VEHICLE_CLASSES.includes(input.vehicle_class)) {
    return { success: false, error: 'Invalid vehicle class.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cars')
    .insert({
      name: input.name.trim(),
      name_ar: input.name_ar.trim(),
      vehicle_class: input.vehicle_class,
      passenger_capacity: input.passenger_capacity,
      luggage_capacity: input.luggage_capacity,
      image_url: input.image_url ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .select(CAR_SELECT)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to create car.' };
  }

  revalidatePath('/');
  const car = toCar(data);
  if (!car) return { success: false, error: 'Failed to read created car.' };
  return { success: true, data: car };
}

export async function updateCarAction(
  id: string,
  input: Partial<CreateCarInput>,
): Promise<ServerActionResponse<Car>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cars')
    .update({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.name_ar !== undefined ? { name_ar: input.name_ar.trim() } : {}),
      ...(input.vehicle_class !== undefined ? { vehicle_class: input.vehicle_class } : {}),
      ...(input.passenger_capacity !== undefined
        ? { passenger_capacity: input.passenger_capacity }
        : {}),
      ...(input.luggage_capacity !== undefined
        ? { luggage_capacity: input.luggage_capacity }
        : {}),
      ...(input.image_url !== undefined ? { image_url: input.image_url } : {}),
      ...(input.sort_order !== undefined ? { sort_order: input.sort_order } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(CAR_SELECT)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to update car.' };
  }

  revalidatePath('/');
  const car = toCar(data);
  if (!car) return { success: false, error: 'Failed to read updated car.' };
  return { success: true, data: car };
}

export async function deleteCarAction(
  id: string,
): Promise<ServerActionResponse<{ id: string }>> {
  const supabase = await createClient();
  const { error } = await supabase.from('cars').delete().eq('id', id);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath('/');
  return { success: true, data: { id } };
}

function extensionForMimeType(type: string): string {
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/webp') return 'webp';
  return 'png';
}

function withCacheBust(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

async function ensurePublicAssetsBucket() {
  const serviceClient = await createServiceClient();
  const { data: buckets, error: listError } = await serviceClient.storage.listBuckets();
  if (listError) {
    return { success: false as const, error: listError.message };
  }

  const existingBucket = buckets?.find((bucket) => bucket.name === PUBLIC_ASSETS_BUCKET);
  if (existingBucket) {
    return { success: true as const };
  }

  const { error: createError } = await serviceClient.storage.createBucket(PUBLIC_ASSETS_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
  });

  if (createError) {
    return { success: false as const, error: createError.message };
  }

  return { success: true as const };
}

export async function uploadCarImage(
  carId: string,
  formData: FormData,
): Promise<ServerActionResponse<Car>> {
  if (!UUID_PATTERN.test(carId)) {
    return { success: false, error: 'معرف السيارة غير صالح.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { success: false, error: 'يرجى اختيار صورة قبل الرفع.' };
  }

  const isValidType = ALLOWED_IMAGE_TYPES.some((t) => t === file.type);
  if (!isValidType) {
    return { success: false, error: 'الصور يجب أن تكون بصيغة PNG أو JPG أو WebP.' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { success: false, error: 'يجب ألا يزيد حجم الصورة عن 5 ميجابايت.' };
  }

  try {
    const bucketResult = await ensurePublicAssetsBucket();
    if (!bucketResult.success) {
      return { success: false, error: `تعذر تجهيز مساحة تخزين الصور: ${bucketResult.error}` };
    }

    const extension = extensionForMimeType(file.type);
    const storagePath = `cars/${carId}.${extension}`;
    const serviceClient = await createServiceClient();
    const bucket = serviceClient.storage.from(PUBLIC_ASSETS_BUCKET);
    const { error: uploadError } = await bucket.upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      return { success: false, error: `تعذر رفع الصورة: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = bucket.getPublicUrl(storagePath);
    const versionedPublicUrl = withCacheBust(publicUrl);

    const { data, error } = await serviceClient
      .from('cars')
      .update({ image_url: versionedPublicUrl, updated_at: new Date().toISOString() })
      .eq('id', carId)
      .select(CAR_SELECT)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? 'تعذر حفظ رابط الصورة.' };
    }

    revalidatePath('/');
    const car = toCar(data);
    if (!car) return { success: false, error: 'تم رفع الصورة لكن تعذر قراءة بيانات السيارة.' };
    return { success: true, data: car };
  } catch {
    return { success: false, error: 'تعذر رفع صورة السيارة.' };
  }
}
