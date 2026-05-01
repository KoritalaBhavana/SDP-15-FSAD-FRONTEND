import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { homestaysApi } from "@/lib/api";
import { uploadFiles } from "@/lib/upload";
import { Home, MapPin, DollarSign, FileText, Image as ImageIcon, Calendar, CheckCircle2, Loader2, X } from "lucide-react";

const AMENITIES_OPTIONS = [
  "WiFi",
  "Kitchen",
  "Air Conditioning",
  "Heating",
  "TV",
  "Washer",
  "Dryer",
  "Parking",
  "Pool",
  "Garden",
  "Balcony",
  "Gym",
];

export default function HostOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [property, setProperty] = useState({
    title: "",
    location: "",
    city: "",
    state: "",
    pricePerNight: "",
    description: "",
    maxGuests: "4",
  });

  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<{ files: File[]; previews: string[] }>({ files: [], previews: [] });
  const [availability, setAvailability] = useState({
    checkInDate: "",
    checkOutDate: "",
  });

  useEffect(() => {
    if (!user || user.role !== "host") {
      navigate("/auth", { replace: true });
    }
  }, [navigate, user]);

  if (!user || user.role !== "host") return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    const previews = files.map((file) => URL.createObjectURL(file));
    setImages({ files, previews });
  };

  const removeImage = (index: number) => {
    setImages((prev) => ({
      files: prev.files.filter((_, i) => i !== index),
      previews: prev.previews.filter((_, i) => i !== index),
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handlePropertyChange = (field: keyof typeof property, value: string) => {
    setProperty((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (value: string) => {
    handlePropertyChange("location", value);
    // Simple parsing of location - assuming "City, State" format
    const parts = value.split(",").map((p) => p.trim());
    if (parts.length >= 1) handlePropertyChange("city", parts[0]);
    if (parts.length >= 2) handlePropertyChange("state", parts[1]);
  };

  const validateStep1 = () => {
    if (!property.title.trim()) {
      toast.error("Please enter property name");
      return false;
    }
    if (!property.location.trim()) {
      toast.error("Please enter location");
      return false;
    }
    if (!property.pricePerNight || Number(property.pricePerNight) <= 0) {
      toast.error("Please enter valid price per night");
      return false;
    }
    if (!property.description.trim()) {
      toast.error("Please enter property description");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (images.files.length === 0) {
      toast.error("Please upload at least one image");
      return false;
    }
    if (amenities.length === 0) {
      toast.error("Please select at least one amenity");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!availability.checkInDate || !availability.checkOutDate) {
      toast.error("Please select check-in and check-out dates");
      return false;
    }
    if (new Date(availability.checkInDate) >= new Date(availability.checkOutDate)) {
      toast.error("Check-out date must be after check-in date");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      // Upload images
      const imageUrls = await uploadFiles(images.files);

      // Create property
      await homestaysApi.create({
        hostId: Number(user.id),
        title: property.title.trim(),
        description: property.description.trim(),
        location: property.location.trim(),
        city: property.city.trim(),
        state: property.state.trim(),
        category: "Homestay",
        pricePerNight: Number(property.pricePerNight),
        maxGuests: Number(property.maxGuests),
        amenities: amenities.join(", "),
        imageUrl: imageUrls[0] || "",
        imageUrls: imageUrls.join(","),
        distanceInfo: `${property.city}, ${property.state}`,
        checkInDate: availability.checkInDate,
        checkOutDate: availability.checkOutDate,
      });

      toast.success("🎉 Property submitted! Waiting for admin approval...");
      setSubmitted(true);
      setTimeout(() => {
        navigate("/host-dashboard", { replace: true });
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message || "Failed to submit property");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Navbar />
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-2xl shadow-lg mt-20">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Submission Successful!</h2>
          <p className="text-muted-foreground mb-4">
            Your property has been submitted for admin approval. You'll be redirected shortly.
          </p>
          <div className="text-sm text-gray-500">Redirecting to dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">🏡 Start Your Hosting Journey</h1>
            <p className="text-muted-foreground">Complete 3 simple steps to list your property</p>
          </div>

          {/* Progress bar */}
          <div className="mb-8 bg-white rounded-full p-1 shadow-md">
            <div className="flex justify-between mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      s === step
                        ? "bg-blue-600 text-white scale-110"
                        : s < step
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {s < step ? "✓" : s}
                  </div>
                  <span className="text-xs mt-1 font-medium text-gray-600">
                    {s === 1 && "Property"}
                    {s === 2 && "Images"}
                    {s === 3 && "Availability"}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative h-1 bg-gray-200 rounded-full">
              <div
                className="h-1 bg-blue-600 rounded-full transition-all"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              />
            </div>
          </div>

          {/* Form content */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* STEP 1: Property Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Home className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold">Property Details</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Property Name *</label>
                  <input
                    type="text"
                    value={property.title}
                    onChange={(e) => handlePropertyChange("title", e.target.value)}
                    placeholder="e.g., Mountain View Cottage"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Location *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={property.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      placeholder="e.g., Manali, Himachal Pradesh"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <MapPin className="w-5 h-5 text-gray-400 mt-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Price per Night (₹) *</label>
                    <input
                      type="number"
                      value={property.pricePerNight}
                      onChange={(e) => handlePropertyChange("pricePerNight", e.target.value)}
                      placeholder="e.g., 2500"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Max Guests</label>
                    <input
                      type="number"
                      value={property.maxGuests}
                      onChange={(e) => handlePropertyChange("maxGuests", e.target.value)}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
                  <textarea
                    value={property.description}
                    onChange={(e) => handlePropertyChange("description", e.target.value)}
                    placeholder="Describe your property, ambiance, nearby attractions..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Images & Amenities */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold">Images & Amenities</h2>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Upload Images (Max 5) *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Drag and drop your images here or <span className="text-blue-600 font-semibold">click to browse</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {images.previews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.previews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <img src={preview} alt={`Preview ${idx}`} className="w-full h-32 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-4">Select Amenities *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AMENITIES_OPTIONS.map((amenity) => (
                      <label
                        key={amenity}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          amenities.includes(amenity)
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-300 bg-white hover:border-blue-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={amenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                        <span className="text-sm font-medium">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Availability */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold">Set Availability</h2>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Define your initial availability. You can update this anytime from your dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Check-in Date *</label>
                    <input
                      type="date"
                      value={availability.checkInDate}
                      onChange={(e) =>
                        setAvailability((prev) => ({ ...prev, checkInDate: e.target.value }))
                      }
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Check-out Date *</label>
                    <input
                      type="date"
                      value={availability.checkOutDate}
                      onChange={(e) =>
                        setAvailability((prev) => ({ ...prev, checkOutDate: e.target.value }))
                      }
                      min={availability.checkInDate || new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Property:</strong> {property.title || "Not set"}</p>
                    <p><strong>Location:</strong> {property.location || "Not set"}</p>
                    <p><strong>Price:</strong> ₹{property.pricePerNight}/night</p>
                    <p><strong>Images:</strong> {images.files.length} uploaded</p>
                    <p><strong>Amenities:</strong> {amenities.length} selected</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 gap-4">
              <button
                onClick={handlePrevious}
                disabled={step === 1 || loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Property
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
