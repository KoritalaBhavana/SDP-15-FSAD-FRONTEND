import { homestays } from "@/lib/mockData";

const HOST_HOMESTAYS_STORAGE_KEY = "travelnest_host_homestays_v1";
const HOMESTAYS_UPDATED_EVENT = "travelnest:homestays-updated";

export interface HomestayRecord {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  amenities: string[];
  description: string;
  distance: string;
  host: string;
  hostImage: string;
  bedrooms: number;
  guests: number;
  isFeatured: boolean;
  diningOptions: string[];
}

export interface HostDashboardProperty {
  id: string;
  name: string;
  location: string;
  price: number;
  status: string;
  bookings: number;
  rating: number;
  image: string;
  isHostCreated: boolean;
}

const DEFAULT_HOST_HOMESTAY_IMAGE = "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=600&q=80";

const isBrowser = () => typeof window !== "undefined";

const readStoredHostHomestays = (): HomestayRecord[] => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HOST_HOMESTAYS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredHostHomestays = (records: HomestayRecord[]) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(HOST_HOMESTAYS_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(HOMESTAYS_UPDATED_EVENT));
};

const upsertStoredHostHomestays = (record: HomestayRecord) => {
  const existing = getHostCreatedHomestays();
  const next = [record, ...existing.filter((item) => item.id !== record.id)];
  writeStoredHostHomestays(next);
};

export const toHostDashboardProperty = (homestay: HomestayRecord): HostDashboardProperty => ({
  id: homestay.id,
  name: homestay.name,
  location: homestay.location,
  price: homestay.price,
  status: "Active",
  bookings: 0,
  rating: homestay.rating,
  image: homestay.image,
  isHostCreated: true,
});

export const getHostCreatedHomestays = (): HomestayRecord[] => {
  return readStoredHostHomestays();
};

export const getHostDashboardProperties = (): HostDashboardProperty[] => {
  return getHostCreatedHomestays().map(toHostDashboardProperty);
};

export const getAllHomestays = (): HomestayRecord[] => {
  return [...homestays, ...getHostCreatedHomestays()];
};

export const addHostHomestay = (params: {
  name: string;
  location: string;
  price: number;
  image?: string;
  hostName?: string;
  hostAvatar?: string;
}): HomestayRecord => {
  const createdHomestay: HomestayRecord = {
    id: `host-${Date.now()}`,
    name: params.name.trim(),
    location: params.location.trim(),
    price: params.price,
    rating: 0,
    reviews: 0,
    image: params.image?.trim() || DEFAULT_HOST_HOMESTAY_IMAGE,
    category: "Family Stay",
    amenities: ["WiFi", "Home Food", "Parking"],
    description: "A newly listed homestay by a local host. Contact host for detailed stay inclusions.",
    distance: "New listing",
    host: params.hostName?.trim() || "Local Host",
    hostImage: params.hostAvatar || "https://i.pravatar.cc/150?img=50",
    bedrooms: 2,
    guests: 4,
    isFeatured: false,
    diningOptions: ["Home Food"],
  };

  const existing = getHostCreatedHomestays();
  writeStoredHostHomestays([createdHomestay, ...existing]);

  return createdHomestay;
};

export const syncHostHomestay = (record: HomestayRecord): HomestayRecord => {
  upsertStoredHostHomestays(record);
  return record;
};

export const deleteHostHomestay = (homestayId: string): boolean => {
  const existing = getHostCreatedHomestays();
  const updated = existing.filter((homestay) => homestay.id !== homestayId);

  if (updated.length === existing.length) {
    return false;
  }

  writeStoredHostHomestays(updated);
  return true;
};

export const HOMESTAY_UPDATED_EVENT_NAME = HOMESTAYS_UPDATED_EVENT;
