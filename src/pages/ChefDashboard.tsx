import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { diningBookingsApi, reviewsApi, usersApi } from "@/lib/api";
import { uploadFiles } from "@/lib/upload";
import { DEFAULT_AVATAR, getAvatarSrc } from "@/lib/avatar";
import { Calendar, ChefHat, Clock, MessageSquare, Settings, Star, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";

type ChefBookingStatus = "Pending" | "Confirmed" | "Rejected";

type ChefReview = {
  id: string;
  guest: string;
  rating: number;
  comment: string;
  reply?: string;
};

export default function ChefDashboard() {
  const { user, updateProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [chefName, setChefName] = useState(user?.name || "");
  const [chefEmail, setChefEmail] = useState(user?.email || "");
  const [chefAvatar, setChefAvatar] = useState(user?.avatar || "");
  const [activeReplyReviewId, setActiveReplyReviewId] = useState<string | null>(null);
  const [replyTextByReviewId, setReplyTextByReviewId] = useState<Record<string, string>>({});

  const [chefBookings, setChefBookings] = useState<any[]>([]);
  const [chefReviews, setChefReviews] = useState<ChefReview[]>([]);

  const normalizeBookingStatus = (status: string | undefined): ChefBookingStatus => {
    const normalized = String(status || "Pending").trim().toUpperCase();
    if (normalized === "CONFIRMED") return "Confirmed";
    if (normalized === "REJECTED") return "Rejected";
    return "Pending";
  };

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    const allowedTabs = new Set(["overview", "bookings", "reviews", "profile"]);

    if (tab && allowedTabs.has(tab)) {
      setActiveTab(tab);
      return;
    }

    setActiveTab("overview");
  }, [location.search]);

  const handleTabChange = (tabId: string) => {
    const allowedTabs = new Set(["overview", "bookings", "reviews", "profile"]);
    if (!allowedTabs.has(tabId)) {
      return;
    }

    setActiveTab(tabId);

    const params = new URLSearchParams(location.search);
    params.set("tab", tabId);
    params.delete("t");
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  useEffect(() => {
    setChefName(user?.name || "");
    setChefEmail(user?.email || "");
    setChefAvatar(user?.avatar || "");
  }, [user]);

  useEffect(() => {
    const loadChefBookings = async () => {
      if (!user?.id) {
        return;
      }
      try {
        const apiBookings = await diningBookingsApi.getByChef(Number(user.id));
        if (Array.isArray(apiBookings) && apiBookings.length > 0) {
          setChefBookings(apiBookings.map((item: any) => ({
            id: String(item.id),
            guest: `Tourist #${item.touristId}`,
            homestay: item.restaurantName || "TravelNest Dining",
            date: item.bookingDate,
            meal: item.bookingTime || "Meal",
            status: normalizeBookingStatus(item.status),
            amount: Number(item.totalAmount || 0),
          })));
        }
      } catch {
        setChefBookings([]);
      }
    };

    loadChefBookings();
  }, [user?.id]);

  useEffect(() => {
    const loadChefReviews = async () => {
      if (!user?.id) {
        return;
      }
      try {
        const apiReviews = await reviewsApi.getByTarget("CHEF", Number(user.id));
        if (Array.isArray(apiReviews) && apiReviews.length > 0) {
          setChefReviews(apiReviews.map((review: any) => ({
            id: String(review.id),
            guest: `Tourist #${review.userId}`,
            rating: Number(review.rating || 0),
            comment: review.comment || "",
            reply: review.reply || "",
          })));
        }
      } catch {
        setChefReviews([]);
      }
    };

    loadChefReviews();
  }, [user?.id]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const upload = async () => {
      try {
        const [url] = await uploadFiles([file]);
        setChefAvatar(url);
        toast.success("Profile image uploaded.");
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          setChefAvatar(String(reader.result || ""));
        };
        reader.readAsDataURL(file);
      }
    };

    void upload();
  };

  const handleSaveProfile = () => {
    const saveProfile = async () => {
      try {
        if (user?.id) {
          await usersApi.update(Number(user.id), {
            name: chefName.trim(),
            email: chefEmail.trim(),
            profileImage: chefAvatar,
          });
        }
        updateProfile({ name: chefName.trim(), email: chefEmail.trim(), avatar: chefAvatar });
        toast.success("Chef profile updated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update profile.");
      }
    };

    void saveProfile();
  };

  const handleBookingStatus = async (bookingId: string, status: "Confirmed" | "Rejected") => {
    try {
      await diningBookingsApi.updateStatus(Number(bookingId), status.toUpperCase());
      setChefBookings((prev) => prev.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking)));
      toast.success(status === "Confirmed" ? "Booking request accepted." : "Booking request rejected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update booking status.");
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    const reply = (replyTextByReviewId[reviewId] || "").trim();
    if (!reply) {
      toast.error("Please type a reply first.");
      return;
    }

    try {
      await reviewsApi.reply(Number(reviewId), reply);
    } catch {
      // Keep local reply fallback if backend has no chef reviews yet.
    }

    setChefReviews((prev) => prev.map((review) => (review.id === reviewId ? { ...review, reply } : review)));
    setReplyTextByReviewId((prev) => ({ ...prev, [reviewId]: "" }));
    setActiveReplyReviewId(null);
    toast.success("Reply sent.");
  };

  const pendingBookings = chefBookings.filter((booking) => booking.status === "Pending").length;
  const confirmedBookings = chefBookings.filter((booking) => booking.status === "Confirmed").length;
  const monthlyEarnings = chefBookings.filter((booking) => booking.status === "Confirmed").reduce((sum, booking) => sum + booking.amount, 0);
  const averageRating = chefReviews.length > 0
    ? (chefReviews.reduce((sum, review) => sum + review.rating, 0) / chefReviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-card border-b border-border px-4 md:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <img src={getAvatarSrc(chefAvatar)} alt={chefName} className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/30" onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }} />
              <div>
                <h1 className="text-xl font-bold text-foreground">Chef Dashboard 👨‍🍳</h1>
                <p className="text-muted-foreground text-sm">Manage your meal bookings and profile</p>
              </div>
            </div>

            <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border">
              {[
                { id: "overview", label: "Overview" },
                { id: "bookings", label: "Bookings" },
                { id: "reviews", label: "Reviews" },
                { id: "profile", label: "Profile" },
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button type="button" onClick={() => handleTabChange("bookings")} className="card-travel p-4 text-left w-full">
                  <div className="flex items-center justify-between">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold text-foreground">{pendingBookings}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Pending Requests</p>
                </button>
                <button type="button" onClick={() => handleTabChange("bookings")} className="card-travel p-4 text-left w-full">
                  <div className="flex items-center justify-between">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold text-foreground">{confirmedBookings}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Confirmed Bookings</p>
                </button>
                <button type="button" onClick={() => handleTabChange("bookings")} className="card-travel p-4 text-left w-full">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold text-foreground">₹{monthlyEarnings.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Current Earnings</p>
                </button>
              </div>

              <div className="card-travel p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Your Chef Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Available for breakfast, lunch, and dinner</div>
                  <button type="button" onClick={() => handleTabChange("reviews")} className="flex items-center gap-2 text-left text-muted-foreground hover:text-foreground">
                    <Star className="h-4 w-4 text-accent" /> {averageRating} average guest rating
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "bookings" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-6">Meal Booking Requests</h2>
              <div className="space-y-3">
                {chefBookings.map((booking) => (
                  <div key={booking.id} className="card-travel p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{booking.guest} • {booking.meal}</p>
                      <p className="text-xs text-muted-foreground">{booking.homestay} • {booking.date}</p>
                      <p className="text-xs text-primary font-semibold mt-1">₹{booking.amount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${booking.status === "Confirmed" ? "bg-green-100 text-green-700" : booking.status === "Rejected" ? "bg-red-100 text-destructive" : "bg-yellow-100 text-yellow-700"}`}>
                        {booking.status}
                      </span>
                      {booking.status === "Pending" && (
                        <div className="flex gap-2 mt-2 justify-end">
                          <button onClick={() => handleBookingStatus(booking.id, "Confirmed")} className="btn-outline-primary text-xs py-1.5 px-2">Accept</button>
                          <button onClick={() => handleBookingStatus(booking.id, "Rejected")} className="btn-outline-primary text-xs py-1.5 px-2">Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chefBookings.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">No data yet. Start by adding your first listing.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Ratings & Replies</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-accent" />
                  <span>{averageRating} average rating</span>
                </div>
              </div>
              <div className="space-y-4">
                {chefReviews.map((review) => (
                  <div key={review.id} className="card-travel p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{review.guest}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${index < review.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveReplyReviewId(activeReplyReviewId === review.id ? null : review.id)}
                        className="btn-outline-primary text-xs py-1.5 px-3"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Reply
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">{review.comment}</p>
                    {review.reply && (
                      <div className="mt-3 rounded-xl bg-primary/5 border border-primary/15 px-3 py-2">
                        <p className="text-xs font-semibold text-primary">Your Reply</p>
                        <p className="text-sm text-foreground mt-1">{review.reply}</p>
                      </div>
                    )}
                    {activeReplyReviewId === review.id && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={replyTextByReviewId[review.id] || ""}
                          onChange={(e) => setReplyTextByReviewId((prev) => ({ ...prev, [review.id]: e.target.value }))}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          rows={3}
                          placeholder="Write your reply to this guest..."
                        />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setActiveReplyReviewId(null)} className="btn-outline-primary text-xs py-1.5 px-3">
                            Cancel
                          </button>
                          <button type="button" onClick={() => void handleReplySubmit(review.id)} className="btn-primary text-xs py-1.5 px-3">
                            Send Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {chefReviews.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">
                    No ratings yet. Guest reviews for chefs will appear here.
                  </div>
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
                    src={getAvatarSrc(chefAvatar)}
                    alt="Chef"
                    className="w-16 h-16 rounded-2xl object-cover border border-border"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                  <label className="btn-outline-primary text-sm py-1.5 px-3 cursor-pointer">
                    Change Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="space-y-3">
                  <input value={chefName} onChange={(e) => setChefName(e.target.value)} className="input-search w-full" placeholder="Name" />
                  <input value={chefEmail} onChange={(e) => setChefEmail(e.target.value)} className="input-search w-full" placeholder="Email" />
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={handleSaveProfile} className="btn-primary text-sm py-1.5 flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
