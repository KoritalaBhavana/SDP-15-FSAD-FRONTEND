import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { adminApi } from "@/lib/api";
import { DEFAULT_AVATAR, getAvatarSrc } from "@/lib/avatar";
import { toast } from "sonner";
import { Users, Building, Map, Calendar, Shield } from "lucide-react";

type ApplicationStatus = "applied" | "interview_scheduled" | "interviewed" | "appointed" | "rejected";

type Candidate = {
  id: string;
  name: string;
  role: "host" | "guide" | "chef";
  city: string;
  experience: string;
  email: string;
  status: ApplicationStatus;
  interviewDate?: string;
  resumeFile: string;
};

type DashboardUser = {
  id: string;
  name: string;
  role: "tourist" | "host" | "guide" | "chef";
  email: string;
  city: string;
  status: string;
  backendId?: number;
};

export default function AdminDashboard() {
  const { user, updateProfile } = useAuth();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("overview");
  const [adminName, setAdminName] = useState(user?.name || "");
  const [adminEmail, setAdminEmail] = useState(user?.email || "");
  const [adminAvatar, setAdminAvatar] = useState(user?.avatar || "");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "tourist" | "host" | "guide" | "chef">("all");
  const [candidateFilter, setCandidateFilter] = useState<"all" | "pending" | "interviewed" | "appointed">("all");
  const [pendingDecision, setPendingDecision] = useState<{ candidateId: string; action: "appoint" | "reject" } | null>(null);
  const [users, setUsers] = useState<DashboardUser[]>([]);

  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [stats, setStats] = useState<{ totalUsers: number; tourists: number; hosts: number; guides: number; chefs: number; pendingInterviews: number }>({
    totalUsers: 0,
    tourists: 0,
    hosts: 0,
    guides: 0,
    chefs: 0,
    pendingInterviews: 0,
  });

  const pendingInterviews = candidates.filter((candidate) => candidate.status === "applied" || candidate.status === "interview_scheduled").length;

  const visibleUsers = users.filter((entry) => userRoleFilter === "all" || entry.role === userRoleFilter);
  const isPendingStatus = (status: string) => status.trim().toUpperCase() === "PENDING";
  const statusLabel = (status: string) => {
    const normalized = status.trim().toUpperCase();
    if (normalized === "APPROVED") return "Approved";
    if (normalized === "REJECTED") return "Rejected";
    if (normalized === "ACTIVE") return "Approved";
    return "Pending";
  };

  const handleUserDecision = async (userId: string, status: "APPROVED" | "REJECTED") => {
    const targetUser = users.find((entry) => entry.id === userId);
    if (!targetUser) {
      toast.error("User not found.");
      return;
    }

    try {
      if (targetUser.backendId) {
        if (status === "APPROVED") {
          await adminApi.approveUser(targetUser.backendId);
        } else {
          await adminApi.rejectUser(targetUser.backendId);
        }
      }
      setUsers((prev) => status === "REJECTED"
        ? prev.filter((entry) => entry.id !== userId)
        : prev.map((entry) => (entry.id === userId ? { ...entry, status } : entry)));
      setStats((prev) => ({
        ...prev,
        totalUsers: status === "REJECTED" ? Math.max(0, prev.totalUsers - 1) : prev.totalUsers,
        pendingInterviews: Math.max(0, prev.pendingInterviews - 1),
      }));
      toast.success(status === "APPROVED" ? "User request approved." : "User request rejected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update user status.");
    }
  };

  const visibleCandidates = candidates.filter((candidate) => {
    if (candidateFilter === "pending") {
      return candidate.status === "applied" || candidate.status === "interview_scheduled";
    }

    if (candidateFilter === "interviewed") {
      return candidate.status === "interviewed";
    }

    if (candidateFilter === "appointed") {
      return candidate.status === "appointed";
    }

    return activeTab === "appointments" ? candidate.status === "appointed" : candidate.status !== "appointed";
  });

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab === "profile") {
      setActiveTab("profile");
    }
  }, [location.search]);

  useEffect(() => {
    setAdminName(user?.name || "");
    setAdminEmail(user?.email || "");
    setAdminAvatar(user?.avatar || "");
  }, [user]);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [dashboard, allUsers, pendingUsers] = await Promise.all([
          adminApi.dashboard(),
          adminApi.users(),
          adminApi.pendingUsers(),
        ]);

        if (dashboard || Array.isArray(allUsers)) {
          const sourceUsers = Array.isArray(allUsers) ? allUsers : [];
          setStats({
            totalUsers: Number(dashboard?.totalUsers || sourceUsers.length || 0),
            tourists: sourceUsers.filter((entry: any) => String(entry.role).toUpperCase() === "TOURIST").length,
            hosts: sourceUsers.filter((entry: any) => String(entry.role).toUpperCase() === "HOST").length,
            guides: sourceUsers.filter((entry: any) => String(entry.role).toUpperCase() === "GUIDE").length,
            chefs: sourceUsers.filter((entry: any) => String(entry.role).toUpperCase() === "CHEF").length,
            pendingInterviews: Number(dashboard?.pendingInterviews || pendingUsers?.length || 0),
          });
        }

        setUsers(Array.isArray(pendingUsers) ? pendingUsers.map((entry: any) => ({
          id: `api-${entry.id}`,
          backendId: Number(entry.id),
          name: entry.name,
          role: String(entry.role || "tourist").toLowerCase() as DashboardUser["role"],
          email: entry.email,
          city: entry.location || "-",
          status: entry.status || (entry.isApproved ? "APPROVED" : "PENDING"),
        })) : []);
      } catch {
        setUsers([]);
      }
    };

    loadAdminData();
  }, []);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAdminAvatar(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    updateProfile({ name: adminName.trim(), email: adminEmail.trim(), avatar: adminAvatar });
    toast.success("Admin profile updated.");
  };

  const updateCandidateStatus = (id: string, status: ApplicationStatus) => {
    setCandidates((prev) => prev.map((candidate) => (candidate.id === id ? { ...candidate, status } : candidate)));
  };

  const scheduleInterview = (id: string) => {
    const date = "Feb 26, 2026";
    setCandidates((prev) => prev.map((candidate) => (candidate.id === id ? { ...candidate, status: "interview_scheduled", interviewDate: date } : candidate)));
    toast.success("Interview call scheduled.");
  };

  const markInterviewDone = (id: string) => {
    updateCandidateStatus(id, "interviewed");
    toast.success("Interview marked as completed.");
  };

  const appointCandidate = (id: string) => {
    updateCandidateStatus(id, "appointed");
    toast.success("Candidate appointed successfully.");
  };

  const rejectCandidate = (id: string) => {
    updateCandidateStatus(id, "rejected");
    toast.success("Candidate rejected.");
  };

  const decisionCandidate = pendingDecision
    ? candidates.find((candidate) => candidate.id === pendingDecision.candidateId) || null
    : null;

  const confirmDecision = () => {
    if (!pendingDecision) {
      return;
    }

    if (pendingDecision.action === "appoint") {
      appointCandidate(pendingDecision.candidateId);
    } else {
      rejectCandidate(pendingDecision.candidateId);
    }

    setPendingDecision(null);
  };

  const handleOverviewStatClick = (label: string) => {
    if (label === "Tourists") {
      setActiveTab("users");
      setUserRoleFilter("tourist");
      return;
    }

    if (label === "Homestay Hosts") {
      setActiveTab("users");
      setUserRoleFilter("host");
      return;
    }

    if (label === "Guides") {
      setActiveTab("users");
      setUserRoleFilter("guide");
      return;
    }

    if (label === "Chefs") {
      setActiveTab("users");
      setUserRoleFilter("chef");
      return;
    }

    if (label === "Pending Approvals") {
      setActiveTab("users");
      setUserRoleFilter("all");
      return;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-card border-b border-border px-4 md:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <img src={getAvatarSrc(user?.avatar)} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/30" onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }} />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Admin Dashboard 🛡️</h1>
                  <p className="text-muted-foreground text-sm">Manage users, interviews, and appointments</p>
                </div>
              </div>
            </div>

            <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border">
              {[
                { id: "overview", label: "Overview" },
                { id: "users", label: "Users" },
                { id: "interviews", label: "Interviews" },
                { id: "appointments", label: "Appointments" },
                { id: "profile", label: "Profile" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "interviews") setCandidateFilter("all");
                    if (tab.id === "appointments") setCandidateFilter("appointed");
                  }}
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
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: <Users className="h-5 w-5" /> },
                  { label: "Tourists", value: stats.tourists.toLocaleString(), icon: <Users className="h-5 w-5" /> },
                  { label: "Homestay Hosts", value: stats.hosts.toString(), icon: <Building className="h-5 w-5" /> },
                  { label: "Guides", value: stats.guides.toString(), icon: <Map className="h-5 w-5" /> },
                  { label: "Chefs", value: stats.chefs.toString(), icon: <Shield className="h-5 w-5" /> },
                  { label: "Pending Approvals", value: stats.pendingInterviews.toString(), icon: <Calendar className="h-5 w-5" /> },
                ].map((stat) => (
                  <button
                    key={stat.label}
                    onClick={() => handleOverviewStatClick(stat.label)}
                    className="card-travel p-4 text-left w-full"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-primary">{stat.icon}</span>
                      <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{stat.label}</p>
                  </button>
                ))}
              </div>

              <div className="card-travel p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setActiveTab("users")} className="btn-outline-primary text-sm py-1.5">Manage Users</button>
                  <button onClick={() => { setActiveTab("interviews"); setCandidateFilter("all"); }} className="btn-outline-primary text-sm py-1.5">Take Interviews</button>
                  <button onClick={() => { setActiveTab("appointments"); setCandidateFilter("appointed"); }} className="btn-outline-primary text-sm py-1.5">Appoint Candidates</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">User Management</h2>
                <div className="flex gap-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "tourist", label: "Tourists" },
                    { id: "host", label: "Hosts" },
                    { id: "guide", label: "Guides" },
                    { id: "chef", label: "Chefs" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setUserRoleFilter(filter.id as "all" | "tourist" | "host" | "guide" | "chef")}
                      className={`text-xs px-3 py-1.5 rounded-full border ${userRoleFilter === filter.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {visibleUsers.map((entry) => (
                  <div key={entry.id} className="card-travel p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.email} • {entry.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs capitalize text-muted-foreground">{entry.role}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusLabel(entry.status) === "Approved" ? "bg-green-100 text-green-700" : statusLabel(entry.status) === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-destructive"}`}>
                        {statusLabel(entry.status)}
                      </span>
                      {isPendingStatus(entry.status) && (
                        <div className="flex gap-2 mt-2 justify-end">
                          <button
                            onClick={() => void handleUserDecision(entry.id, "APPROVED")}
                            className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => void handleUserDecision(entry.id, "REJECTED")}
                            className="text-xs bg-red-100 text-destructive px-2.5 py-1 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {visibleUsers.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">
                    No pending approvals.
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeTab === "interviews" || activeTab === "appointments") && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="text-xl font-bold text-foreground">Interview & Appointment Management</h2>
                <div className="flex gap-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "pending", label: "Pending" },
                    { id: "interviewed", label: "Interviewed" },
                    { id: "appointed", label: "Appointed" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setCandidateFilter(filter.id as "all" | "pending" | "interviewed" | "appointed")}
                      className={`text-xs px-3 py-1.5 rounded-full border ${candidateFilter === filter.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {visibleCandidates.map((candidate) => (
                  <div key={candidate.id} className="card-travel p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-foreground">{candidate.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{candidate.role} • {candidate.city} • {candidate.experience}</p>
                        <p className="text-xs text-muted-foreground mt-1">{candidate.email}</p>
                        <a
                          href={candidate.resumeFile}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary font-medium hover:underline mt-1 inline-block"
                        >
                          View Resume File
                        </a>
                        {candidate.interviewDate && <p className="text-xs text-primary mt-1">Interview: {candidate.interviewDate}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                        candidate.status === "appointed"
                          ? "bg-green-100 text-green-700"
                          : candidate.status === "rejected"
                          ? "bg-red-100 text-destructive"
                          : candidate.status === "interviewed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {candidate.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {(candidate.status === "applied" || candidate.status === "rejected") && (
                        <button onClick={() => scheduleInterview(candidate.id)} className="btn-outline-primary text-xs py-1.5 px-3">Schedule Call</button>
                      )}
                      {candidate.status === "interview_scheduled" && (
                        <button onClick={() => markInterviewDone(candidate.id)} className="btn-outline-primary text-xs py-1.5 px-3">Mark Interview Done</button>
                      )}
                      {(candidate.status === "interviewed" || candidate.status === "interview_scheduled") && (
                        <button onClick={() => setPendingDecision({ candidateId: candidate.id, action: "appoint" })} className="btn-primary text-xs py-1.5 px-3">Appoint</button>
                      )}
                      {candidate.status !== "appointed" && (
                        <button onClick={() => setPendingDecision({ candidateId: candidate.id, action: "reject" })} className="text-xs text-destructive border border-destructive rounded-xl px-3 py-1.5 hover:bg-destructive/10 transition-colors">Reject</button>
                      )}
                    </div>
                  </div>
                ))}
                {visibleCandidates.length === 0 && (
                  <div className="card-travel p-6 text-center text-muted-foreground">
                    No candidates found for this filter.
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
                    src={getAvatarSrc(adminAvatar)}
                    alt="Admin"
                    className="w-16 h-16 rounded-2xl object-cover border border-border"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                  <label className="btn-outline-primary text-sm py-1.5 px-3 cursor-pointer">
                    Change Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="space-y-3">
                  <input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="input-search w-full" placeholder="Name" />
                  <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="input-search w-full" placeholder="Email" />
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={handleSaveProfile} className="btn-primary text-sm py-1.5">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {pendingDecision && decisionCandidate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-5">
            <h3 className="text-lg font-bold text-foreground mb-2">Confirm {pendingDecision.action === "appoint" ? "Appointment" : "Rejection"}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Please review resume before you {pendingDecision.action === "appoint" ? "appoint" : "reject"} this candidate.
            </p>

            <div className="card-travel p-3 mb-3">
              <p className="font-semibold text-foreground text-sm">{decisionCandidate.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{decisionCandidate.role} • {decisionCandidate.city}</p>
              <a
                href={decisionCandidate.resumeFile}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-medium hover:underline mt-2 inline-block"
              >
                Open Resume File
              </a>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setPendingDecision(null)} className="btn-outline-primary text-sm py-1.5">Cancel</button>
              <button
                onClick={confirmDecision}
                className={`${pendingDecision.action === "appoint" ? "btn-primary" : "text-destructive border border-destructive hover:bg-destructive/10"} text-sm py-1.5 px-4 rounded-xl transition-colors`}
              >
                Confirm {pendingDecision.action === "appoint" ? "Appoint" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
