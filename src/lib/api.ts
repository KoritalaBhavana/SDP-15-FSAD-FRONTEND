import apiClient from "@/lib/axios";

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  status?: string;
  isVerified?: boolean;
  isApproved?: boolean;
  onboardingCompleted?: boolean;
  isNew?: boolean;
  isNewUser?: boolean;
  token?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface HomestayPayload {
  hostId?: number;
  title: string;
  description?: string;
  location: string;
  city: string;
  state?: string;
  category?: string;
  pricePerNight: number;
  maxGuests: number;
  amenities?: string;
  imageUrl?: string;
  imageUrls?: string;
  distanceInfo?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface BookingPayload {
  homestayId: number;
  touristId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  specialRequests?: string;
}

export interface ReviewPayload {
  userId: number;
  targetId: number;
  targetType: string;
  rating: number;
  comment?: string;
}

export interface ItineraryPayload {
  guideId: number;
  title: string;
  description?: string;
  durationDays: number;
  places: string;
  price: number;
  imageUrls?: string;
}

export interface MessagePayload {
  senderId: number;
  receiverId: number;
  message: string;
}

export interface DiningBookingPayload {
  touristId: number;
  chefId?: number;
  restaurantName?: string;
  bookingDate: string;
  bookingTime?: string;
  guests: number;
  tableNumber?: number;
  type?: string;
  specialRequests?: string;
  totalAmount: number;
}

export interface GuideBookingPayload {
  touristId: number;
  guideId: number;
  bookingDate: string;
  durationDays: number;
  activityType: string;
  totalAmount: number;
  specialRequests?: string;
}

const throwApiError = (error: unknown): never => {
  const message = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
    || (error as { message?: string })?.message
    || "API request failed";
  throw new Error(message);
};

export const authApi = {
  async register(payload: RegisterPayload) {
    try {
      const response = await apiClient.post("/auth/register", payload);
      return response.data;
    } catch (error) {
      throwApiError(error);
    }
  },
  async login(payload: LoginPayload) {
    try {
      const response = await apiClient.post("/auth/login", payload);
      return response.data;
    } catch (error) {
      throwApiError(error);
    }
  },
  async google(token: string, role: string) {
    try {
      const response = await apiClient.post("/auth/google", { token, role });
      return response.data;
    } catch (error) {
      throwApiError(error);
    }
  },
};

export const usersApi = {
  async getById(id: number) { try { const response = await apiClient.get(`/users/${id}`); return response.data; } catch (error) { throwApiError(error); } },
  async update(id: number, payload: Record<string, unknown>) { try { const response = await apiClient.put(`/users/${id}`, payload); return response.data; } catch (error) { throwApiError(error); } },
  async updateImage(id: number, imageUrl: string) { try { const response = await apiClient.put(`/users/${id}/image`, { imageUrl }); return response.data; } catch (error) { throwApiError(error); } },
  async updateProfile(formData: FormData) { try { const response = await apiClient.put("/user/update-profile", formData); return response.data; } catch (error) { throwApiError(error); } },
  async requestVerification() { try { const response = await apiClient.post("/user/request-verification"); return response.data; } catch (error) { throwApiError(error); } },
  async getByRole(role: string) { try { const response = await apiClient.get(`/users/role/${role}`); return response.data; } catch (error) { throwApiError(error); } },
  async getPending() { try { const response = await apiClient.get("/users/pending"); return response.data; } catch (error) { throwApiError(error); } },
  async updateStatus(id: number, status: string) { try { const response = await apiClient.put(`/users/${id}/status`, { status }); return response.data; } catch (error) { throwApiError(error); } },
  async getStats() { try { const response = await apiClient.get("/users/stats"); return response.data; } catch (error) { throwApiError(error); } },
};

export const homestaysApi = {
  async create(payload: HomestayPayload) {
    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      const response = await apiClient.post("/properties", formData);
      return response.data;
    } catch (error) {
      throwApiError(error);
    }
  },
  async getAll() { try { const response = await apiClient.get("/properties"); return response.data; } catch (error) { throwApiError(error); } },
  async getById(id: number) { try { const response = await apiClient.get(`/properties/${id}`); return response.data; } catch (error) { throwApiError(error); } },
  async getByHost(hostId: number) { try { const response = await apiClient.get(`/homestays/host/${hostId}`); return response.data; } catch (error) { throwApiError(error); } },
  async update(id: number, payload: HomestayPayload) { try { const response = await apiClient.put(`/homestays/${id}`, payload); return response.data; } catch (error) { throwApiError(error); } },
  async remove(id: number) { try { const response = await apiClient.delete(`/homestays/${id}`); return response.data; } catch (error) { throwApiError(error); } },
  async search(city: string) { try { const response = await apiClient.get(`/homestays/search?city=${encodeURIComponent(city)}`); return response.data; } catch (error) { throwApiError(error); } },
  async toggle(id: number) { try { const response = await apiClient.patch(`/homestays/${id}/toggle`); return response.data; } catch (error) { throwApiError(error); } },
};

export const bookingsApi = {
  async create(payload: BookingPayload) { try { const response = await apiClient.post("/bookings", payload); return response.data; } catch (error) { throwApiError(error); } },
  async getByTourist(touristId: number) { try { const response = await apiClient.get(`/bookings/tourist/${touristId}`); return response.data; } catch (error) { throwApiError(error); } },
  async getByHost(hostId: number) { try { const response = await apiClient.get(`/bookings/host/${hostId}`); return response.data; } catch (error) { throwApiError(error); } },
  async getById(id: number) { try { const response = await apiClient.get(`/bookings/${id}`); return response.data; } catch (error) { throwApiError(error); } },
  async updateStatus(id: number, status: string) { try { const response = await apiClient.put(`/bookings/${id}/status`, { status }); return response.data; } catch (error) { throwApiError(error); } },
  async getHostEarnings(hostId: number) { try { const response = await apiClient.get(`/bookings/host/${hostId}/earnings`); return response.data; } catch (error) { throwApiError(error); } },
};

export const attractionsApi = {
  async create(payload: Record<string, unknown>) { try { const response = await apiClient.post("/attractions", payload); return response.data; } catch (error) { throwApiError(error); } },
  async getAll() { try { const response = await apiClient.get("/attractions"); return response.data; } catch (error) { throwApiError(error); } },
  async getById(id: number) { try { const response = await apiClient.get(`/attractions/${id}`); return response.data; } catch (error) { throwApiError(error); } },
  async search(city: string) { try { const response = await apiClient.get(`/attractions/search?city=${encodeURIComponent(city)}`); return response.data; } catch (error) { throwApiError(error); } },
  async getByGuide(guideId: number) { try { const response = await apiClient.get(`/attractions/guide/${guideId}`); return response.data; } catch (error) { throwApiError(error); } },
  async remove(id: number) { try { const response = await apiClient.delete(`/attractions/${id}`); return response.data; } catch (error) { throwApiError(error); } },
};

export const reviewsApi = {
  async create(payload: ReviewPayload) { try { const response = await apiClient.post("/reviews", payload); return response.data; } catch (error) { throwApiError(error); } },
  async getByTarget(targetType: string, targetId: number) { try { const response = await apiClient.get(`/reviews/${targetType}/${targetId}`); return response.data; } catch (error) { throwApiError(error); } },
  async reply(id: number, reply: string) { try { const response = await apiClient.put(`/reviews/${id}/reply`, { reply }); return response.data; } catch (error) { throwApiError(error); } },
  async getByUser(userId: number) { try { const response = await apiClient.get(`/reviews/user/${userId}`); return response.data; } catch (error) { throwApiError(error); } },
};

export const itinerariesApi = {
  async create(payload: ItineraryPayload) { try { const response = await apiClient.post("/itineraries", payload); return response.data; } catch (error) { throwApiError(error); } },
  async getAll() { try { const response = await apiClient.get("/itineraries"); return response.data; } catch (error) { throwApiError(error); } },
  async getByGuide(guideId: number) { try { const response = await apiClient.get(`/itineraries/guide/${guideId}`); return response.data; } catch (error) { throwApiError(error); } },
  async update(id: number, payload: ItineraryPayload) { try { const response = await apiClient.put(`/itineraries/${id}`, payload); return response.data; } catch (error) { throwApiError(error); } },
  async remove(id: number) { try { const response = await apiClient.delete(`/itineraries/${id}`); return response.data; } catch (error) { throwApiError(error); } },
};

export const messagesApi = {
  async send(payload: MessagePayload) { try { const response = await apiClient.post("/messages", payload); return response.data; } catch (error) { throwApiError(error); } },
  async conversation(user1: number, user2: number) { try { const response = await apiClient.get(`/messages/conversation?user1=${user1}&user2=${user2}`); return response.data; } catch (error) { throwApiError(error); } },
  async inbox(userId: number) { try { const response = await apiClient.get(`/messages/inbox/${userId}`); return response.data; } catch (error) { throwApiError(error); } },
};

export const notificationsApi = {
  async getCurrent() { try { const response = await apiClient.get("/notifications"); return response.data; } catch (error) { throwApiError(error); } },
  async getByUser(userId: number) { try { const response = await apiClient.get(`/notifications/${userId}`); return response.data; } catch (error) { throwApiError(error); } },
  async markRead(id: number) { try { const response = await apiClient.put(`/notifications/${id}/read`); return response.data; } catch (error) { throwApiError(error); } },
  async markAllRead(userId: number) { try { const response = await apiClient.put(`/notifications/user/${userId}/readall`); return response.data; } catch (error) { throwApiError(error); } },
};

export const adminApi = {
  async dashboard() { try { const response = await apiClient.get("/admin/dashboard"); return response.data; } catch (error) { throwApiError(error); } },
  async users() { try { const response = await apiClient.get("/admin/users"); return response.data; } catch (error) { throwApiError(error); } },
  async pendingUsers() { try { const response = await apiClient.get("/admin/pending-users"); return response.data; } catch (error) { throwApiError(error); } },
  async approveUser(id: number) { try { const response = await apiClient.put(`/admin/approve/${id}`); return response.data; } catch (error) { throwApiError(error); } },
  async rejectUser(id: number) { try { const response = await apiClient.put(`/admin/reject/${id}`); return response.data; } catch (error) { throwApiError(error); } },
  async approveProperty(id: number) { try { const response = await apiClient.put(`/admin/approve-property/${id}`); return response.data; } catch (error) { throwApiError(error); } },
};

export const hostApi = {
  async dashboard() { try { const response = await apiClient.get("/host/dashboard"); return response.data; } catch (error) { throwApiError(error); } },
};

export const guideApi = {
  async dashboard() { try { const response = await apiClient.get("/guide/dashboard"); return response.data; } catch (error) { throwApiError(error); } },
};

export const wishlistApi = {
  async add(touristId: number, homestayId: number) { try { const response = await apiClient.post("/wishlist", { touristId, homestayId }); return response.data; } catch (error) { throwApiError(error); } },
  async remove(touristId: number, homestayId: number) { try { const response = await apiClient.delete(`/wishlist/${touristId}/${homestayId}`); return response.data; } catch (error) { throwApiError(error); } },
  async getByTourist(touristId: number) { try { const response = await apiClient.get(`/wishlist/${touristId}`); return response.data; } catch (error) { throwApiError(error); } },
  async check(touristId: number, homestayId: number) { try { const response = await apiClient.get(`/wishlist/check/${touristId}/${homestayId}`); return response.data; } catch (error) { throwApiError(error); } },
};

export const diningBookingsApi = {
  async create(payload: DiningBookingPayload) { try { const response = await apiClient.post("/dining-bookings", payload); return response.data; } catch (error) { throwApiError(error); } },
  async getByTourist(touristId: number) { try { const response = await apiClient.get(`/dining-bookings/tourist/${touristId}`); return response.data; } catch (error) { throwApiError(error); } },
  async getByChef(chefId: number) { try { const response = await apiClient.get(`/dining-bookings/chef/${chefId}`); return response.data; } catch (error) { throwApiError(error); } },
  async updateStatus(id: number, status: string) { try { const response = await apiClient.put(`/dining-bookings/${id}/status`, { status }); return response.data; } catch (error) { throwApiError(error); } },
};

export const guideBookingsApi = {
  async create(payload: GuideBookingPayload) { try { const response = await apiClient.post("/guide-bookings", payload); return response.data; } catch (error) { throwApiError(error); } },
  async getByTourist(touristId: number) { try { const response = await apiClient.get(`/guide-bookings/tourist/${touristId}`); return response.data; } catch (error) { throwApiError(error); } },
  async getByGuide(guideId: number) { try { const response = await apiClient.get(`/guide-bookings/guide/${guideId}`); return response.data; } catch (error) { throwApiError(error); } },
  async updateStatus(id: number, status: string) { try { const response = await apiClient.put(`/guide-bookings/${id}/status`, { status }); return response.data; } catch (error) { throwApiError(error); } },
  async earnings(guideId: number) { try { const response = await apiClient.get(`/guide-bookings/guide/${guideId}/earnings`); return response.data; } catch (error) { throwApiError(error); } },
};
