import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomestayCard from "@/components/HomestayCard";
import { useHomestays } from "@/hooks/useHomestays";
import { attractionsApi, bookingsApi, notificationsApi, usersApi } from "@/lib/api";
import { uploadFiles } from "@/lib/upload";
import { DEFAULT_AVATAR, getAvatarSrc } from "@/lib/avatar";
import { loadWishlistIds } from "@/lib/travelPreferences";
import { toast } from "sonner";
import {
  Search, Heart, MapPin, Calendar, Bell, LayoutDashboard,
  Bookmark, History, Star, TrendingUp, User, Settings
} from "lucide-react";

export default function TouristDashboard() {
  const { user, updateProfile } = useAuth();
  const location = useLocation();
  const homestays = useHomestays();
  const [activeTab, setActiveTab] = useState("discover");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || "");
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [selectedBlogTrip, setSelectedBlogTrip] = useState<{ name: string; location: string; date: string } | null>(null);
  const [blogDraft, setBlogDraft] = useState("");
  const [publishedBlogs, setPublishedBlogs] = useState<Array<{ id: string; title: string; content: string; createdAt: string }>>([]);

  const [notifications, setNotifications] = useState<string[]>([]);

  const tabs = [
    { id: "discover", label: "Discover", icon: LayoutDashboard },
    { id: "attractions", label: "Attractions", icon: Bookmark },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "bookings", label: "My Bookings", icon: Calendar },
    { id: "history", label: "History", icon: History },
    { id: "profile", label: "Profile", icon: User },
  ];

  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [touristAttractions, setTouristAttractions] = useState<any[]>([]);

  const historyTrips = upcomingTrips.filter((trip) => trip.status === "Completed");

  const handleStatClick = (label: string) => {
    if (label === "Trips Taken") {
      setActiveTab("history");
      return;
    }
    if (label === "Wishlist") {
      setActiveTab("wishlist");
      return;
    }
    if (label === "Reviews Given") {
      toast.success("Reviews section will be available in your profile soon.");
      return;
    }
    if (label === "Places Visited") {
      setActiveTab("history");
    }
  };

  const handleSaveProfile = () => {
    const saveProfile = async () => {
      try {
        if (user?.id) {
          await usersApi.update(Number(user.id), {
            name: profileName.trim(),
            email: profileEmail.trim(),
            profileImage: profileAvatar,
          });
        }
        updateProfile({ name: profileName.trim(), email: profileEmail.trim(), avatar: profileAvatar });
        toast.success("Profile settings updated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update profile.");
      }
    };

    void saveProfile();
  };

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    const allowedTabs = new Set(["discover", "attractions", "wishlist", "bookings", "history", "profile"]);

    if (tab && allowedTabs.has(tab)) {
      setActiveTab(tab);
      return;
    }

    if (!tab) {
      setActiveTab("discover");
    }
  }, [location.search]);

  useEffect(() => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
    setProfileAvatar(user?.avatar || "");
  }, [user]);

  useEffect(() => {
    const loadTouristData = async () => {
      if (!user?.id) {
        return;
      }
      try {
        const apiBookings = await bookingsApi.getByTourist(Number(user.id));
        if (Array.isArray(apiBookings)) {
          setUpcomingTrips(apiBookings.map((booking: any) => ({
            id: String(booking.id),
            homestay: `Homestay #${booking.homestayId}`,
            location: "India",
            dates: `${booking.checkIn} - ${booking.checkOut}`,
            guests: booking.guests,
            amount: Number(booking.totalAmount || 0),
            status: booking.status || "Pending",
            image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&q=80",
          })));
        }
      } catch {
        setUpcomingTrips([]);
      }
    };

    loadTouristData();
  }, [user?.id]);

  useEffect(() => {
    const syncWishlist = async () => {
      if (!user?.id || user.role !== "tourist") {
        setWishlistIds([]);
        return;
      }
      const ids = await loadWishlistIds(Number(user.id));
      setWishlistIds(ids);
    };

    void syncWishlist();
  }, [user?.id, user?.role]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) {
        return;
      }
      try {
        const response = await notificationsApi.getByUser(Number(user.id));
        if (Array.isArray(response)) {
          setNotifications(response.map((item: any) => item.message || String(item)));
        }
      } catch {
        setNotifications([]);
      }
    };

    void loadNotifications();
  }, [user?.id]);

  useEffect(() => {
    const loadAttractions = async () => {
      try {
        const response = await attractionsApi.getAll();
        setTouristAttractions(Array.isArray(response) ? response.map((attr: any) => ({
          id: String(attr.id),
          name: attr.name,
          location: attr.location || attr.city || "",
          image: attr.imageUrl || "",
          bestTime: attr.bestTime || "Anytime",
          description: attr.description || "",
          category: attr.category || "General",
          distance: `${attr.distanceKm || 0} km`,
          entryFee: Number(attr.entryFee || 0),
        })) : []);
      } catch {
        setTouristAttractions([]);
      }
    };

    void loadAttractions();
  }, []);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const upload = async () => {
      try {
        const [url] = await uploadFiles([file]);
        setProfileAvatar(url);
        toast.success("Profile image uploaded.");
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          setProfileAvatar(String(reader.result || ""));
        };
        reader.readAsDataURL(file);
      }
    };

    void upload();
  };

  const activeBookings = upcomingTrips.filter((trip) => trip.status !== "Cancelled");
  const wishlistedHomestays = homestays.filter((item) => wishlistIds.includes(Number(item.id)));
  const selectedTrip = upcomingTrips.find((trip) => trip.id === selectedTripId) || null;

  const handleViewBookingDetails = (tripId: string) => {
    setSelectedTripId(tripId);
  };

  const handleCancelBooking = (tripId: string) => {
    const cancelBooking = async () => {
      try {
        await bookingsApi.updateStatus(Number(tripId), "CANCELLED");
        setUpcomingTrips((prev) => prev.map((trip) => (trip.id === tripId ? { ...trip, status: "Cancelled" } : trip)));
        if (selectedTripId === tripId) {
          setSelectedTripId(null);
        }
        toast.success("Booking cancelled.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not cancel booking.");
      }
    };

    if (window.confirm("Cancel this booking?")) {
      void cancelBooking();
    }
  };

  const handleOpenBlogEditor = (trip: { name: string; location: string; date: string }) => {
    setSelectedBlogTrip(trip);
    setBlogDraft("");
  };

  const handlePublishBlog = () => {
    if (!selectedBlogTrip) return;
    const trimmedDraft = blogDraft.trim();

    if (trimmedDraft.length < 20) {
      toast.error("Please write at least 20 characters before publishing.");
      return;
    }

    const title = `${selectedBlogTrip.name} • ${selectedBlogTrip.location}`;
    setPublishedBlogs((prev) => [
      {
        id: `${Date.now()}`,
        title,
        content: trimmedDraft,
        createdAt: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      },
      ...prev,
    ]);
    setSelectedBlogTrip(null);
    setBlogDraft("");
    toast.success("Your travel blog has been published.");
  };

  const handleSkipBlog = () => {
    setSelectedBlogTrip(null);
    setBlogDraft("");
    toast.success("No problem. You can write a blog later anytime.");
  };

  const openAttractionInMaps = (name: string, locationName: string) => {
    const query = encodeURIComponent(`${name}, ${locationName}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 md:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={getAvatarSrc(user?.avatar)}
                  alt={user?.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/30"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}! 👋</h1>
                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Ready for your next adventure?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => setActiveTab("profile")}
                  className="p-2 hover:bg-muted rounded-xl transition-colors"
                  title="Profile Settings"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setNotificationsOpen((v) => !v)}
                  className="relative p-2 hover:bg-muted rounded-xl transition-colors"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-lg z-20 p-3">
                    <p className="font-semibold text-sm text-foreground mb-2">Notifications</p>
                    <div className="space-y-2">
                      {notifications.map((item, i) => (
                        <div key={i} className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-6 border-b border-border overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {activeTab === "discover" && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Trips Taken", value: String(historyTrips.length), icon: "\u2708\uFE0F" },
                  { label: "Wishlist", value: String(wishlistIds.length), icon: "\u2764\uFE0F" },
                  { label: "Reviews Given", value: "0", icon: "\u2B50" },
                  { label: "Places Visited", value: String(historyTrips.length), icon: "\uD83D\uDCCD" },
                ].map((stat) => (
                  <button
                    key={stat.label}
                    onClick={() => handleStatClick(stat.label)}
                    className="card-travel p-4 text-center w-full"
                  >
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </button>
                ))}
              </div>

              {/* Upcoming Trips */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> Upcoming Trips
                </h2>
                <div className="space-y-3">
                  {activeBookings.map((trip) => (
                    <div key={trip.id} className="card-travel p-4 flex items-center gap-4">
                      <img
                        src={trip.image}
                        alt={trip.homestay}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=100&q=80"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{trip.homestay}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {trip.location}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">📅 {trip.dates} • 👥 {trip.guests} guests</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-primary">₹{trip.amount.toLocaleString()}</div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trip.status === "Confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {trip.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {activeBookings.length === 0 && (
                    <div className="card-travel p-6 text-center text-muted-foreground">
                      No data yet. Start by adding your first item.
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Recommended for You
                  </h2>
                  <Link to="/homestays" className="text-primary text-sm font-medium">View all</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {homestays.slice(0, 3).map((h) => (
                    <HomestayCard key={h.id} homestay={h} />
                  ))}
                  {homestays.length === 0 && (
                    <div className="card-travel p-6 text-center text-muted-foreground">
                      No data yet. Start by adding your first item.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Nearby Attractions
                  </h2>
                  <button onClick={() => setActiveTab("attractions")} className="text-primary text-sm font-medium">View all</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {touristAttractions.slice(0, 3).map((attr) => (
                    <div key={attr.id} className="card-travel overflow-hidden">
                      <img
                        src={attr.image}
                        alt={attr.name}
                        className="w-full h-40 object-cover cursor-pointer"
                        onClick={() => openAttractionInMaps(attr.name, attr.location)}
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80"; }}
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground">{attr.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{attr.location} • {attr.bestTime}</p>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{attr.description}</p>
                      </div>
                    </div>
                  ))}
                  {touristAttractions.length === 0 && (
                    <div className="card-travel p-6 text-center text-muted-foreground">
                      No data yet. Start by adding your first item.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "attractions" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Tourist Attractions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {touristAttractions.map((attr) => (
                  <div key={attr.id} className="card-travel overflow-hidden">
                    <img
                      src={attr.image}
                      alt={attr.name}
                      className="w-full h-44 object-cover cursor-pointer"
                      onClick={() => openAttractionInMaps(attr.name, attr.location)}
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80"; }}
                    />
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-foreground">{attr.name}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{attr.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">📍 {attr.location} • {attr.distance}</p>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{attr.description}</p>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>🕐 {attr.bestTime}</span>
                        <span>{attr.entryFee === 0 ? "Free Entry" : `₹${attr.entryFee} entry`}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {touristAttractions.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">
                    No data yet. Start by adding your first item.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "wishlist" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" /> My Wishlist
              </h2>
              {wishlistedHomestays.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wishlistedHomestays.map((h) => (
                    <HomestayCard key={h.id} homestay={h} />
                  ))}
                </div>
              ) : (
                <div className="card-travel p-6 text-center text-muted-foreground">
                  Your wishlist is empty. Tap the heart on any homestay to save it here.
                </div>
              )}
            </div>
          )}

          {activeTab === "bookings" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Active Bookings
              </h2>
              <div className="space-y-4">
                {activeBookings.map((trip) => (
                  <div key={trip.id} className="card-travel p-6">
                    <div className="flex items-start gap-4">
                      <img
                        src={trip.image}
                        alt={trip.homestay}
                        className="w-20 h-20 rounded-xl object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=100&q=80"; }}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-foreground text-lg">{trip.homestay}</h3>
                            <p className="text-muted-foreground">{trip.location}</p>
                          </div>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${trip.status === "Confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {trip.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Dates</p>
                            <p className="text-sm font-medium text-foreground">{trip.dates}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Guests</p>
                            <p className="text-sm font-medium text-foreground">{trip.guests} guests</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="text-sm font-bold text-primary">₹{trip.amount.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleViewBookingDetails(trip.id)}
                            className="text-sm btn-outline-primary py-1.5"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleCancelBooking(trip.id)}
                            className="text-sm text-destructive border border-destructive rounded-xl px-4 py-1.5 hover:bg-destructive/10 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {activeBookings.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">
                    No active bookings right now.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Profile Settings
              </h2>
              <div className="card-travel p-6 max-w-xl">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={getAvatarSrc(profileAvatar)}
                    alt="Profile"
                    className="w-16 h-16 rounded-2xl object-cover border border-border"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                  <label className="btn-outline-primary text-sm py-1.5 px-3 cursor-pointer">
                    Change Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="space-y-3">
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="input-search w-full"
                    placeholder="Name"
                  />
                  <input
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="input-search w-full"
                    placeholder="Email"
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={handleSaveProfile} className="btn-primary text-sm py-1.5">Save</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Travel History
              </h2>
              <div className="card-travel p-4 mb-4">
                <h3 className="font-semibold text-foreground">Share your experience (optional)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Loved your stay? Write a short blog for fellow travellers. Prefer not to write now? You can skip it.
                </p>
              </div>
              <div className="space-y-3">
                {historyTrips.map((h) => (
                  <div key={h.id} className="card-travel p-4 flex items-center gap-4">
                    <div className="w-12 h-12 gradient-warm rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg">🏠</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{h.homestay}</h3>
                      <p className="text-sm text-muted-foreground">{h.location} - {h.dates}</p>
                      <button
                        onClick={() => handleOpenBlogEditor({ name: h.homestay, location: h.location, date: h.dates })}
                        className="text-sm text-primary font-medium hover:underline mt-1"
                      >
                        Write blog (optional)
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">₹{h.amount.toLocaleString()}</div>
                      <div className="flex items-center gap-0.5 justify-end">
                        {Array.from({ length: 0 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-accent text-accent" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {historyTrips.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">
                    No data yet. Start by adding your first item.
                  </div>
                )}
              </div>

              {publishedBlogs.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-foreground mb-3">Your Published Blogs</h3>
                  <div className="space-y-3">
                    {publishedBlogs.map((blog) => (
                      <div key={blog.id} className="card-travel p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-semibold text-foreground">{blog.title}</h4>
                          <span className="text-xs text-muted-foreground">{blog.createdAt}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{blog.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedTrip && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md p-5">
              <h3 className="text-lg font-bold text-foreground mb-4">Booking Details</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">Homestay:</span> {selectedTrip.homestay}</p>
                <p><span className="font-semibold text-foreground">Location:</span> {selectedTrip.location}</p>
                <p><span className="font-semibold text-foreground">Dates:</span> {selectedTrip.dates}</p>
                <p><span className="font-semibold text-foreground">Guests:</span> {selectedTrip.guests}</p>
                <p><span className="font-semibold text-foreground">Amount:</span> ₹{selectedTrip.amount.toLocaleString()}</p>
                <p><span className="font-semibold text-foreground">Status:</span> {selectedTrip.status}</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setSelectedTripId(null)} className="btn-outline-primary text-sm py-1.5">Close</button>
              </div>
            </div>
          </div>
        )}

        {selectedBlogTrip && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-5">
              <h3 className="text-lg font-bold text-foreground">Write your travel blog</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedBlogTrip.name} • {selectedBlogTrip.location} • {selectedBlogTrip.date}
              </p>
              <textarea
                value={blogDraft}
                onChange={(e) => setBlogDraft(e.target.value)}
                placeholder="Share your experience, highlights, and tips for other travellers..."
                className="mt-4 w-full min-h-40 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">This is optional. You can skip now and write later.</p>
                <p className="text-xs text-muted-foreground">{blogDraft.trim().length} characters</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={handleSkipBlog} className="btn-outline-primary text-sm py-1.5">Skip for now</button>
                <button onClick={handlePublishBlog} className="btn-primary text-sm py-1.5">Publish blog</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
