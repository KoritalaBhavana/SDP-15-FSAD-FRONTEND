import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { attractionsApi, guideBookingsApi, itinerariesApi, usersApi } from "@/lib/api";
import { uploadFiles } from "@/lib/upload";
import { DEFAULT_AVATAR, getAvatarSrc } from "@/lib/avatar";
import { toast } from "sonner";
import { Star, MapPin, MessageSquare, Calendar, BookOpen, Camera, TrendingUp } from "lucide-react";

export default function GuideDashboard() {
  const { user, updateProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);
  const [isAddingAttraction, setIsAddingAttraction] = useState(false);
  const [editingItineraryId, setEditingItineraryId] = useState<string | null>(null);
  const [itineraryTitle, setItineraryTitle] = useState("");
  const [itineraryDays, setItineraryDays] = useState(1);
  const [itineraryPlaces, setItineraryPlaces] = useState(1);
  const [activeReplyTarget, setActiveReplyTarget] = useState<string | null>(null);
  const [replyTextByTarget, setReplyTextByTarget] = useState<Record<string, string>>({});
  const [guideName, setGuideName] = useState(user?.name || "");
  const [guideEmail, setGuideEmail] = useState(user?.email || "");
  const [guideAvatar, setGuideAvatar] = useState(user?.avatar || "");
  const [guideAbout, setGuideAbout] = useState("");
  const [newAttractionName, setNewAttractionName] = useState("");
  const [newAttractionLocation, setNewAttractionLocation] = useState("");
  const [newAttractionImage, setNewAttractionImage] = useState("");
  const [newAttractionCategory, setNewAttractionCategory] = useState("Nature");
  const [newAttractionDescription, setNewAttractionDescription] = useState("");
  const [newAttractionDistance, setNewAttractionDistance] = useState("1 km");
  const [newAttractionBestTime, setNewAttractionBestTime] = useState("October - March");
  const [newAttractionEntryFee, setNewAttractionEntryFee] = useState(0);

  const [bookingRequests, setBookingRequests] = useState<any[]>([]);

  const reviews: any[] = [];

  const messages: any[] = [];

  const myGuideProfile = {
    name: user?.name || "",
    image: user?.avatar || "",
    about: "",
    location: "",
    specialties: [] as string[],
    languages: [] as string[],
    experience: "",
    price: 0,
    rating: 0,
    reviews: 0,
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "itineraries", label: "My Itineraries", icon: BookOpen },
    { id: "attractions", label: "Attractions", icon: MapPin },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "profile", label: "Profile", icon: BookOpen },
  ];

  const [itineraries, setItineraries] = useState<any[]>([]);

  const [guideAttractions, setGuideAttractions] = useState<any[]>([]);
  const validTabs = ["overview", "itineraries", "attractions", "bookings", "reviews", "messages", "profile"];

  const handleTabChange = (tabId: string) => {
    if (!validTabs.includes(tabId)) {
      return;
    }

    setActiveTab(tabId);

    const params = new URLSearchParams(location.search);
    params.set("tab", tabId);
    params.delete("t");

    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const handleBookingStatus = (requestId: string, status: "Confirmed" | "Rejected") => {
    const saveStatus = async () => {
      try {
        await guideBookingsApi.updateStatus(Number(requestId), status.toUpperCase());
      } catch {
        // Local mock rows do not exist in the backend.
      }
      setBookingRequests((prev) => prev.map((request) => (request.id === requestId ? { ...request, status } : request)));
      toast.success(status === "Confirmed" ? "Booking request accepted." : "Booking request rejected.");
    };

    void saveStatus();
  };

  const handleSaveProfile = () => {
    const saveProfile = async () => {
      try {
        if (user?.id) {
          await usersApi.update(Number(user.id), {
            name: guideName.trim(),
            email: guideEmail.trim(),
            profileImage: guideAvatar,
            bio: guideAbout,
          });
        }
        updateProfile({ name: guideName.trim(), email: guideEmail.trim(), avatar: guideAvatar });
        toast.success("Guide profile updated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update profile.");
      }
    };

    void saveProfile();
  };

  const openAttractionInMaps = (name: string, locationName: string) => {
    const query = encodeURIComponent(`${name}, ${locationName}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab("overview");
    }
  }, [location.search]);

  useEffect(() => {
    setGuideName(user?.name || myGuideProfile.name);
    setGuideEmail(user?.email || "");
    setGuideAvatar(user?.avatar || myGuideProfile.image);
    setGuideAbout(myGuideProfile.about);
  }, [myGuideProfile.about, myGuideProfile.image, myGuideProfile.name, user]);

  useEffect(() => {
    const loadGuideData = async () => {
      if (!user?.id) {
        return;
      }
      try {
        const [apiItineraries, apiAttractions, apiBookings] = await Promise.all([
          itinerariesApi.getByGuide(Number(user.id)),
          attractionsApi.getByGuide(Number(user.id)),
          guideBookingsApi.getByGuide(Number(user.id)),
        ]);

        if (Array.isArray(apiItineraries) && apiItineraries.length > 0) {
          setItineraries(apiItineraries.map((item: any) => ({
            id: String(item.id),
            title: item.title,
            days: item.durationDays || 1,
            places: String(item.places || "").split(",").length,
            rating: 4.8,
            views: 0,
          })));
        }

        if (Array.isArray(apiAttractions) && apiAttractions.length > 0) {
          setGuideAttractions(apiAttractions.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            location: item.location || item.city,
            image: item.imageUrl,
            rating: Number(item.rating || 0),
            entryFee: Number(item.entryFee || 0),
            bestTime: item.bestTime || "Anytime",
            distance: `${item.distanceKm || 0} km`,
            description: item.description,
            category: item.category || "General",
          })));
        }

        if (Array.isArray(apiBookings) && apiBookings.length > 0) {
          setBookingRequests(apiBookings.map((item: any) => ({
            id: String(item.id),
            tourist: `Tourist #${item.touristId}`,
            dates: item.bookingDate,
            activity: item.activityType || "Guided Tour",
            amount: Number(item.totalAmount || 0),
            status: item.status || "Pending",
          })));
        }
      } catch {
        setItineraries([]);
        setGuideAttractions([]);
        setBookingRequests([]);
      }
    };

    loadGuideData();
  }, [user?.id]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const upload = async () => {
      try {
        const [url] = await uploadFiles([file]);
        setGuideAvatar(url);
        toast.success("Profile image uploaded.");
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          setGuideAvatar(String(reader.result || ""));
        };
        reader.readAsDataURL(file);
      }
    };

    void upload();
  };

  const handleEditItinerary = (id: string) => {
    const selected = itineraries.find((it) => it.id === id);
    if (!selected) {
      return;
    }

    setEditingItineraryId(id);
    setItineraryTitle(selected.title);
    setItineraryDays(selected.days);
    setItineraryPlaces(selected.places);
  };

  const handleSaveItinerary = () => {
    if (!editingItineraryId) {
      return;
    }

    if (!itineraryTitle.trim()) {
      toast.error("Itinerary title is required.");
      return;
    }

    const saveItinerary = async () => {
      try {
        await itinerariesApi.update(Number(editingItineraryId), {
          guideId: Number(user?.id),
          title: itineraryTitle.trim(),
          description: "Guide-created itinerary",
          durationDays: itineraryDays,
          places: Array.from({ length: itineraryPlaces }, (_, index) => `Place ${index + 1}`).join(","),
          price: 1500,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update itinerary.");
        return;
      }

      setItineraries((prev) => prev.map((it) => (
        it.id === editingItineraryId
          ? { ...it, title: itineraryTitle.trim(), days: itineraryDays, places: itineraryPlaces }
          : it
      )));
      setEditingItineraryId(null);
      toast.success("Itinerary updated.");
    };

    void saveItinerary();
  };

  const handleCreateItinerary = () => {
    if (!itineraryTitle.trim()) {
      toast.error("Itinerary title is required.");
      return;
    }

    const createItinerary = async () => {
      try {
        const created = await itinerariesApi.create({
          guideId: Number(user?.id),
          title: itineraryTitle.trim(),
          description: "Guide-created itinerary",
          durationDays: itineraryDays,
          places: Array.from({ length: itineraryPlaces }, (_, index) => `Place ${index + 1}`).join(","),
          price: 1500,
        });
        const createdId = String(created.id);
        setItineraries((prev) => [
          {
            id: createdId,
            title: itineraryTitle.trim(),
            days: itineraryDays,
            places: itineraryPlaces,
            rating: 0,
            views: 0,
          },
          ...prev,
        ]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create itinerary.");
        return;
      }

      setIsCreatingItinerary(false);
      toast.success("Itinerary created.");
    };

    void createItinerary();
  };

  const handleAttractionImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const upload = async () => {
      try {
        const [url] = await uploadFiles([file]);
        setNewAttractionImage(url);
        toast.success("Attraction image uploaded.");
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          setNewAttractionImage(String(reader.result || ""));
        };
        reader.readAsDataURL(file);
      }
    };

    void upload();
  };

  const resetAttractionForm = () => {
    setNewAttractionName("");
    setNewAttractionLocation("");
    setNewAttractionImage("");
    setNewAttractionCategory("Nature");
    setNewAttractionDescription("");
    setNewAttractionDistance("1 km");
    setNewAttractionBestTime("October - March");
    setNewAttractionEntryFee(0);
  };

  const handleAddAttraction = () => {
    if (!newAttractionName.trim() || !newAttractionLocation.trim() || !newAttractionDescription.trim()) {
      toast.error("Please fill attraction name, location and description.");
      return;
    }

    if (!newAttractionImage) {
      toast.error("Please upload an attraction image.");
      return;
    }

    const addAttraction = async () => {
      try {
        const created = await attractionsApi.create({
          name: newAttractionName.trim(),
          description: newAttractionDescription.trim(),
          location: newAttractionLocation.trim(),
          city: newAttractionLocation.trim(),
          category: newAttractionCategory,
          imageUrl: newAttractionImage,
          entryFee: Math.max(0, newAttractionEntryFee || 0),
          bestTime: newAttractionBestTime.trim() || "October - March",
          distanceKm: Number.parseFloat(newAttractionDistance) || 1,
          addedBy: Number(user?.id),
        });
        const newAttraction = {
          id: String(created.id),
          name: newAttractionName.trim(),
          location: newAttractionLocation.trim(),
          image: newAttractionImage,
          rating: Number(created.rating || 0),
          entryFee: Math.max(0, newAttractionEntryFee || 0),
          bestTime: newAttractionBestTime.trim() || "October - March",
          distance: newAttractionDistance.trim() || "1 km",
          description: newAttractionDescription.trim(),
          category: newAttractionCategory,
        };

        setGuideAttractions((prev) => [newAttraction, ...prev]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not add attraction.");
        return;
      }
      setIsAddingAttraction(false);
      resetAttractionForm();
      toast.success("Attraction added successfully.");
    };

    void addAttraction();
  };

  const handleSendReply = (targetId: string, targetName: string) => {
    const replyText = (replyTextByTarget[targetId] || "").trim();
    if (!replyText) {
      toast.error("Type your reply first.");
      return;
    }

    setReplyTextByTarget((prev) => ({ ...prev, [targetId]: "" }));
    setActiveReplyTarget(null);
    toast.success(`Reply sent to ${targetName}.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-card border-b border-border px-4 md:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <img
                src={getAvatarSrc(user?.avatar, guideAvatar, myGuideProfile.image)}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/30"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
              />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">Guide Dashboard 🧭</h1>
                <p className="text-muted-foreground text-sm">Share your local expertise with the world</p>
              </div>
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <Star className="h-4 w-4 fill-primary" />
                <span className="font-bold">{myGuideProfile.rating}</span>
                <span className="text-xs">({myGuideProfile.reviews} reviews)</span>
              </div>
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
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
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Tourists", value: String(bookingRequests.length), icon: "👥", tab: "bookings" },
                  { label: "Itineraries", value: String(itineraries.length), icon: "📍", tab: "itineraries" },
                  { label: "Avg Rating", value: "0.0", icon: "⭐", tab: "reviews" },
                  { label: "Earnings", value: `₹${bookingRequests.filter((b) => b.status === "Confirmed").reduce((sum, b) => sum + Number(b.amount || 0), 0).toLocaleString("en-IN")}`, icon: "💰", tab: "bookings" },
                ].map((stat) => (
                  <button
                    key={stat.label}
                    type="button"
                    onClick={() => handleTabChange(stat.tab)}
                    className="card-travel p-4 text-center w-full hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </button>
                ))}
              </div>

              {/* Profile Card */}
              <div className="card-travel p-6">
                <div className="flex items-start gap-5">
                  <img
                    src={getAvatarSrc(user?.avatar, guideAvatar, myGuideProfile.image)}
                    alt={myGuideProfile.name}
                    className="w-20 h-20 rounded-2xl object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-foreground">{user?.name || myGuideProfile.name}</h2>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" /> {myGuideProfile.location}
                        </p>
                      </div>
                      <button type="button" onClick={() => handleTabChange("profile")} className="btn-outline-primary text-sm py-1.5">Edit Profile</button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">{myGuideProfile.about}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {myGuideProfile.specialties.map((s) => (
                        <span key={s} className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium">{s}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      <span>🌐 {myGuideProfile.languages.join(", ")}</span>
                      <span>📅 {myGuideProfile.experience} experience</span>
                      <span className="font-bold text-primary">₹{myGuideProfile.price}/day</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Bookings */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Recent Requests</h2>
                <div className="space-y-3">
                  {bookingRequests.map((b) => (
                    <div key={b.id} className="card-travel p-4 flex items-center gap-4">
                      <div className="w-10 h-10 gradient-warm rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        {b.tourist[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">{b.tourist}</p>
                        <p className="text-xs text-muted-foreground">{b.activity} • {b.dates}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">₹{b.amount.toLocaleString()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === "Confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {b.status}
                        </span>
                      </div>
                      {b.status === "Pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => handleBookingStatus(b.id, "Confirmed")} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors">Accept</button>
                          <button onClick={() => handleBookingStatus(b.id, "Rejected")} className="bg-red-100 text-destructive px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors">Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {bookingRequests.length === 0 && (
                    <div className="card-travel p-6 text-center text-muted-foreground">No data yet. Start by adding your first listing.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "itineraries" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">My Itineraries</h2>
                <button
                  onClick={() => {
                    setItineraryTitle("");
                    setItineraryDays(1);
                    setItineraryPlaces(1);
                    setIsCreatingItinerary(true);
                  }}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" /> Create New
                </button>
              </div>
              <div className="space-y-4">
                {itineraries.map((it) => (
                  <div key={it.id} className="card-travel p-5 flex items-center gap-4">
                    <div className="w-12 h-12 gradient-nature rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{it.title}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>📅 {it.days} days</span>
                        <span>📍 {it.places} places</span>
                        <span>👁️ {it.views} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-bold text-foreground">{it.rating}</span>
                    </div>
                    <button onClick={() => handleEditItinerary(it.id)} className="btn-outline-primary text-sm py-1.5">Edit</button>
                  </div>
                ))}
                {itineraries.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">No data yet. Start by adding your first listing.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "attractions" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Tourist Attractions</h2>
                <button
                  onClick={() => {
                    resetAttractionForm();
                    setIsAddingAttraction(true);
                  }}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" /> Add Attraction
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {guideAttractions.map((attr) => (
                  <div key={attr.id} className="card-travel flex gap-4 p-4">
                    <img
                      src={attr.image}
                      alt={attr.name}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0 cursor-pointer"
                      onClick={() => openAttractionInMaps(attr.name, attr.location)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&q=80";
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-foreground">{attr.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{attr.description.substring(0, 80)}...</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>📍 {attr.distance}</span>
                        <span>🕐 {attr.bestTime}</span>
                        <span>🎟 {attr.entryFee === 0 ? "Free" : `₹${attr.entryFee}`}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {guideAttractions.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">No data yet. Start by adding your first listing.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "bookings" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-6">Booking Management</h2>
              <div className="space-y-3">
                {bookingRequests.map((booking) => (
                  <div key={booking.id} className="card-travel p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{booking.tourist} • {booking.activity}</p>
                      <p className="text-sm text-muted-foreground">{booking.dates} • ₹{booking.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${booking.status === "Confirmed" ? "bg-green-100 text-green-700" : booking.status === "Rejected" ? "bg-red-100 text-destructive" : "bg-yellow-100 text-yellow-700"}`}>{booking.status}</span>
                      {booking.status === "Pending" && (
                        <>
                          <button onClick={() => handleBookingStatus(booking.id, "Confirmed")} className="btn-outline-primary text-xs py-1.5 px-2">Accept</button>
                          <button onClick={() => handleBookingStatus(booking.id, "Rejected")} className="btn-outline-primary text-xs py-1.5 px-2">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {bookingRequests.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">No data yet. Start by adding your first listing.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-6">Reviews</h2>
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="card-travel p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{review.tourist}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{review.text}</p>
                    <div className="mt-3">
                      <button
                        onClick={() => setActiveReplyTarget(`review-${review.id}`)}
                        className="btn-outline-primary text-xs py-1.5 px-3"
                      >
                        Reply
                      </button>
                      {activeReplyTarget === `review-${review.id}` && (
                        <div className="mt-2 flex gap-2">
                          <input
                            value={replyTextByTarget[`review-${review.id}`] || ""}
                            onChange={(e) => setReplyTextByTarget((prev) => ({ ...prev, [`review-${review.id}`]: e.target.value }))}
                            className="input-search w-full"
                            placeholder="Type your reply"
                          />
                          <button
                            onClick={() => handleSendReply(`review-${review.id}`, review.tourist)}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            Send
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">No data yet. Start by adding your first listing.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-6">Messages</h2>
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="card-travel p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{message.from}</p>
                      <p className="text-sm text-muted-foreground">{message.text}</p>
                      {activeReplyTarget === `message-${message.id}` && (
                        <div className="mt-2 flex gap-2">
                          <input
                            value={replyTextByTarget[`message-${message.id}`] || ""}
                            onChange={(e) => setReplyTextByTarget((prev) => ({ ...prev, [`message-${message.id}`]: e.target.value }))}
                            className="input-search w-full"
                            placeholder="Type your reply"
                          />
                          <button
                            onClick={() => handleSendReply(`message-${message.id}`, message.from)}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            Send
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-2">{message.time}</p>
                      <button onClick={() => setActiveReplyTarget(`message-${message.id}`)} className="btn-outline-primary text-xs py-1.5 px-3">Reply</button>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">No data yet. Start by adding your first listing.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-6">Profile Settings</h2>
              <div className="card-travel p-6 max-w-xl">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={guideAvatar || myGuideProfile.image}
                    alt="Guide"
                    className="w-16 h-16 rounded-2xl object-cover border border-border"
                  />
                  <label className="btn-outline-primary text-sm py-1.5 px-3 cursor-pointer">
                    Change Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="space-y-3">
                  <input value={guideName} onChange={(e) => setGuideName(e.target.value)} className="input-search w-full" placeholder="Name" />
                  <input value={guideEmail} onChange={(e) => setGuideEmail(e.target.value)} className="input-search w-full" placeholder="Email" />
                  <textarea value={guideAbout} onChange={(e) => setGuideAbout(e.target.value)} className="input-search w-full h-24" placeholder="About" />
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={handleSaveProfile} className="btn-primary text-sm py-1.5">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {isCreatingItinerary && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-5">
              <h3 className="text-lg font-bold text-foreground mb-4">Create Itinerary</h3>
              <div className="space-y-3">
                <input
                  value={itineraryTitle}
                  onChange={(e) => setItineraryTitle(e.target.value)}
                  className="input-search w-full"
                  placeholder="Itinerary title"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min={1}
                    value={itineraryDays}
                    onChange={(e) => setItineraryDays(Math.max(1, Number(e.target.value) || 1))}
                    className="input-search w-full"
                    placeholder="Days"
                  />
                  <input
                    type="number"
                    min={1}
                    value={itineraryPlaces}
                    onChange={(e) => setItineraryPlaces(Math.max(1, Number(e.target.value) || 1))}
                    className="input-search w-full"
                    placeholder="Places"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsCreatingItinerary(false)} className="btn-outline-primary text-sm py-1.5">Cancel</button>
                <button onClick={handleCreateItinerary} className="btn-primary text-sm py-1.5">Create</button>
              </div>
            </div>
          </div>
        )}

        {editingItineraryId && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-5">
              <h3 className="text-lg font-bold text-foreground mb-4">Edit Itinerary</h3>
              <div className="space-y-3">
                <input
                  value={itineraryTitle}
                  onChange={(e) => setItineraryTitle(e.target.value)}
                  className="input-search w-full"
                  placeholder="Itinerary title"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min={1}
                    value={itineraryDays}
                    onChange={(e) => setItineraryDays(Math.max(1, Number(e.target.value) || 1))}
                    className="input-search w-full"
                    placeholder="Days"
                  />
                  <input
                    type="number"
                    min={1}
                    value={itineraryPlaces}
                    onChange={(e) => setItineraryPlaces(Math.max(1, Number(e.target.value) || 1))}
                    className="input-search w-full"
                    placeholder="Places"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setEditingItineraryId(null)} className="btn-outline-primary text-sm py-1.5">Cancel</button>
                <button onClick={handleSaveItinerary} className="btn-primary text-sm py-1.5">Save</button>
              </div>
            </div>
          </div>
        )}

        {isAddingAttraction && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-xl p-5">
              <h3 className="text-lg font-bold text-foreground mb-4">Add Attraction</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={newAttractionName} onChange={(e) => setNewAttractionName(e.target.value)} className="input-search w-full md:col-span-2" placeholder="Attraction name" />
                <input value={newAttractionLocation} onChange={(e) => setNewAttractionLocation(e.target.value)} className="input-search w-full" placeholder="Location" />
                <input value={newAttractionDistance} onChange={(e) => setNewAttractionDistance(e.target.value)} className="input-search w-full" placeholder="Distance (e.g. 2 km)" />
                <input value={newAttractionBestTime} onChange={(e) => setNewAttractionBestTime(e.target.value)} className="input-search w-full" placeholder="Best time" />
                <input type="number" min={0} value={newAttractionEntryFee} onChange={(e) => setNewAttractionEntryFee(Number(e.target.value) || 0)} className="input-search w-full" placeholder="Entry fee" />
                <select value={newAttractionCategory} onChange={(e) => setNewAttractionCategory(e.target.value)} className="input-search w-full">
                  <option>Nature</option>
                  <option>Adventure</option>
                  <option>Heritage</option>
                  <option>Spiritual</option>
                </select>
                <textarea value={newAttractionDescription} onChange={(e) => setNewAttractionDescription(e.target.value)} className="input-search w-full md:col-span-2 h-24" placeholder="Description" />
                <div className="md:col-span-2 flex items-center gap-3">
                  <label className="btn-outline-primary text-sm py-1.5 px-3 cursor-pointer">
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleAttractionImageUpload} />
                  </label>
                  <span className="text-xs text-muted-foreground">{newAttractionImage ? "Image selected" : "No image selected"}</span>
                </div>
                {newAttractionImage && (
                  <img src={newAttractionImage} alt="Attraction preview" className="md:col-span-2 w-full h-40 rounded-xl object-cover border border-border" />
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsAddingAttraction(false)} className="btn-outline-primary text-sm py-1.5">Cancel</button>
                <button onClick={handleAddAttraction} className="btn-primary text-sm py-1.5">Add Attraction</button>
              </div>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
