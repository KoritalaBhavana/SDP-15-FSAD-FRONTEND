export interface FrontendHomestay {
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

const DEFAULT_HOMESTAY_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80";
const DEFAULT_HOST_IMAGE = "https://i.pravatar.cc/150?img=50";

export const adaptHomestay = (item: any): FrontendHomestay => {
  const amenities = typeof item?.amenities === "string"
    ? item.amenities.split(",").map((entry: string) => entry.trim()).filter(Boolean)
    : Array.isArray(item?.amenities)
      ? item.amenities
      : ["WiFi", "Home Food"];

  const guests = Number(item?.maxGuests || item?.guests || 2);
  const location = [item?.city, item?.state].filter(Boolean).join(", ") || item?.location || "India";

  return {
    id: String(item?.id ?? ""),
    name: item?.title || item?.name || "TravelNest Homestay",
    location,
    price: Number(item?.pricePerNight || item?.price || 0),
    rating: Number(item?.rating || 0),
    reviews: Number(item?.reviewCount || item?.reviews || 0),
    image: item?.imageUrl || item?.imageUrls?.split(",")[0]?.trim() || item?.image || DEFAULT_HOMESTAY_IMAGE,
    category: item?.category || "Family Stay",
    amenities,
    description: item?.description || "A verified homestay listed on TravelNestPro.",
    distance: item?.distanceInfo || item?.distance || "Prime location",
    host: item?.hostName || "Local Host",
    hostImage: item?.hostImage || DEFAULT_HOST_IMAGE,
    bedrooms: Math.max(1, Math.ceil(guests / 2)),
    guests,
    isFeatured: Number(item?.rating || 0) >= 4.7,
    diningOptions: ["Home Food", "Chef Available"],
  };
};
