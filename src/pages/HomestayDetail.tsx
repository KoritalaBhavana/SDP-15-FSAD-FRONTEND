import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { homestaysApi } from "@/lib/api";
import { adaptHomestay, type FrontendHomestay } from "@/lib/homestayApiAdapter";
import {
  Star, MapPin, Heart, Share2, ChevronLeft, ChevronRight,
  Wifi, Car, Utensils, Waves, Shield, Users, BedDouble,
  CheckCircle, X as XIcon
} from "lucide-react";
import { toast } from "sonner";
import { loadWishlistIds, toggleWishlist } from "@/lib/travelPreferences";

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-5 w-5" />,
  Parking: <Car className="h-5 w-5" />,
  "Home Food": <Utensils className="h-5 w-5" />,
  Breakfast: <Utensils className="h-5 w-5" />,
  Pool: <Waves className="h-5 w-5" />,
};

export default function HomestayDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [homestay, setHomestay] = useState<FrontendHomestay | null>(null);
  const [error, setError] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    let ignore = false;

    const loadHomestay = async () => {
      if (!id) {
        setError(true);
        return;
      }

      try {
        setError(false);
        setHomestay(null);
        const response = await homestaysApi.getById(Number(id));
        if (!ignore) {
          setHomestay(adaptHomestay(response));
        }
      } catch {
        if (!ignore) {
          setError(true);
          setHomestay(null);
        }
      }
    };

    void loadHomestay();

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    const syncWishlist = async () => {
      if (!homestay || !user?.id || user.role !== "tourist") {
        setWishlisted(false);
        return;
      }
      const ids = await loadWishlistIds(Number(user.id));
      setWishlisted(ids.includes(Number(homestay.id)));
    };

    void syncWishlist();
  }, [homestay?.id, user?.id, user?.role]);

  if (error) {
    return <p>Property not found or failed to load</p>;
  }

  if (!homestay) {
    return <p>Loading...</p>;
  }

  const images = [
    homestay.image,
    "https://images.unsplash.com/photo-1521783988139-89397d761dce?w=800&q=80",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    "https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=800&q=80",
  ];

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const canReserve = !!checkIn && !!checkOut && nights > 0;

  const subtotal = nights * homestay.price;
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;

  const handleContactHost = () => {
    if (!isLoggedIn) {
      navigate("/auth?mode=login");
      return;
    }

    const subject = `Host contact request - ${homestay.name}`;
    const body = [
      `Hi StayVista Team,`,
      "",
      `I want to contact host ${homestay.host} for ${homestay.name} (${homestay.location}).`,
      "Please share contact/availability details.",
      "",
      `Name: ${user?.name || ""}`,
      `Email: ${user?.email || ""}`,
    ].join("\n");

    window.location.href = `mailto:hosts@stayvista.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleReserveNow = () => {
    if (!canReserve) {
      toast.error("Please select valid check-in and check-out dates.");
      return;
    }

    navigate(`/booking/${homestay.id}?checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`);
  };

  const handleWishlistToggle = async () => {
    if (!user?.id || user.role !== "tourist") {
      toast.error("Sign in as a tourist to use your wishlist.");
      return;
    }

    const result = await toggleWishlist(Number(user.id), Number(homestay.id));
    setWishlisted(result.wishlisted);
    toast.success(result.wishlisted ? "Added to wishlist." : "Removed from wishlist.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Back */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <Link to="/homestays" className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to listings
          </Link>
        </div>

        {/* Image Gallery */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 mb-8">
          <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-80 md:h-[450px]">
            <div className="col-span-2 row-span-2 relative overflow-hidden group cursor-pointer" onClick={() => setImgIdx(0)}>
              <img src={images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80"; }} />
            </div>
            {images.slice(1, 4).map((img, i) => (
              <div key={i} className="relative overflow-hidden group cursor-pointer" onClick={() => setImgIdx(i + 1)}>
                <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80"; }} />
                {i === 2 && (
                  <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">+4 photos</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">{homestay.category}</span>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {homestay.name}
                    </h1>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={handleWishlistToggle}
                      className="p-2.5 border border-border rounded-xl hover:bg-muted transition-colors"
                    >
                      <Heart className={`h-5 w-5 ${wishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                    </button>
                    <button className="p-2.5 border border-border rounded-xl hover:bg-muted transition-colors">
                      <Share2 className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <strong className="text-foreground">{homestay.rating}</strong> ({homestay.reviews} reviews)
                  </span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{homestay.location}</span>
                  <span>• {homestay.distance}</span>
                </div>
                <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" /> {homestay.bedrooms} bedrooms</span>
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Up to {homestay.guests} guests</span>
                </div>
              </div>

              {/* Host */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl border border-border">
                <img src={homestay.hostImage} alt={homestay.host} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-foreground">Hosted by {homestay.host}</p>
                  <p className="text-sm text-muted-foreground">Superhost • Responds within 1 hour</p>
                </div>
                <button onClick={handleContactHost} className="ml-auto btn-outline-primary text-sm py-1.5">Contact Host</button>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-3">About this Stay</h2>
                <p className="text-muted-foreground leading-relaxed">{homestay.description}</p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Experience the warmth of Indian hospitality in a setting that feels like home. Your host will ensure you have everything you need for a comfortable and memorable stay, from local tips to home-cooked meals.
                </p>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {homestay.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                      <div className="text-primary">{amenityIcons[amenity] || <CheckCircle className="h-5 w-5" />}</div>
                      <span className="text-sm font-medium text-foreground">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* House Rules */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">House Rules</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { rule: "Check-in: 2:00 PM - 8:00 PM", allowed: true },
                    { rule: "Check-out: 11:00 AM", allowed: true },
                    { rule: "No smoking", allowed: false },
                    { rule: "No parties or events", allowed: false },
                    { rule: "Pets allowed", allowed: true },
                    { rule: "Quiet hours: 10 PM - 7 AM", allowed: true },
                  ].map(({ rule, allowed }) => (
                    <div key={rule} className="flex items-center gap-2 text-sm text-foreground">
                      {allowed
                        ? <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                        : <XIcon className="h-4 w-4 text-destructive flex-shrink-0" />}
                      {rule}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <h2 className="text-xl font-bold text-foreground">{homestay.rating} · {homestay.reviews} reviews</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { user: "Sneha Patel", avatar: "https://i.pravatar.cc/50?img=25", rating: 5, text: "Absolutely beautiful! The views were stunning and the host was incredibly welcoming.", date: "Jan 2025" },
                    { user: "Rohit Kumar", avatar: "https://i.pravatar.cc/50?img=65", rating: 5, text: "One of the best experiences of my life. The food was homemade and delicious!", date: "Dec 2024" },
                  ].map((rev) => (
                    <div key={rev.user} className="p-4 bg-muted/40 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={rev.avatar} alt={rev.user} className="w-9 h-9 rounded-full" />
                        <div>
                          <p className="font-semibold text-sm text-foreground">{rev.user}</p>
                          <p className="text-xs text-muted-foreground">{rev.date}</p>
                        </div>
                        <div className="ml-auto flex">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{rev.text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <div className="card-travel p-6 sticky top-24">
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-primary">₹{homestay.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">/night</span>
                  <div className="ml-auto flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold text-sm text-foreground">{homestay.rating}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Check In</label>
                      <input
                        type="date"
                        className="input-search w-full text-sm"
                        value={checkIn}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setCheckIn(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Check Out</label>
                      <input
                        type="date"
                        className="input-search w-full text-sm"
                        value={checkOut}
                        min={checkIn}
                        onChange={(e) => setCheckOut(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Guests</label>
                    <select
                      className="input-search w-full text-sm"
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                    >
                      {Array.from({ length: homestay.guests }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {nights > 0 && (
                  <div className="border-t border-border pt-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm text-foreground">
                      <span>₹{homestay.price.toLocaleString()} × {nights} nights</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>GST (12%)</span>
                      <span>₹{taxes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-foreground border-t border-border pt-2">
                      <span>Total</span>
                      <span className="text-primary">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleReserveNow}
                  className="btn-primary w-full text-center block disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!canReserve}
                >
                  {nights > 0 ? `Book for ₹${total.toLocaleString()}` : "Reserve Now"}
                </button>

                <div className="flex items-center gap-2 justify-center mt-3 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Free cancellation before 48 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
