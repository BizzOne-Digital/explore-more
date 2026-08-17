"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Save,
  Trash2,
  UserX,
  UserCheck,
  Key,
  Users,
  History,
  Edit,
  Plus,
  X,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  studentId?: string;
  staffId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Profile {
  dateOfBirth?: string;
  ageRange?: string;
  schoolStatus?: string;
  bio?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  title?: string;
  specialties?: string[];
  isPublished?: boolean;
}

interface Relationship {
  _id: string;
  guardianId?: { _id: string; name: string; email: string };
  studentId?: { _id: string; name: string; email: string; studentId?: string };
  relationship: string;
  status: string;
  consentGiven: boolean;
  createdAt: string;
}

interface Activity {
  _id: string;
  action: string;
  entity: string;
  details?: string;
  performedBy?: { name: string; email: string; staffId?: string };
  changes?: Record<string, { old: unknown; new: unknown }>;
  createdAt: string;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});

  useEffect(() => {
    fetchUserData();
  }, [resolvedParams.id]);

  async function fetchUserData() {
    try {
      setLoading(true);
      const [userRes, activityRes] = await Promise.all([
        fetch(`/api/admin/users/${resolvedParams.id}`),
        fetch(`/api/admin/users/${resolvedParams.id}/activity`),
      ]);

      if (userRes.ok) {
        const data = await userRes.json();
        setUser(data.data.user);
        setProfile(data.data.profile);
        setRelationships(data.data.guardianLinks || data.data.studentLinks || []);
        setFormData(data.data.user);
      }

      if (activityRes.ok) {
        const actData = await activityRes.json();
        setActivities(actData.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/users/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to update user");
        setSaving(false);
        return;
      }

      setEditMode(false);
      fetchUserData();
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!user) return;
    
    const action = user.isActive ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${resolvedParams.id}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (res.ok) {
        fetchUserData();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  async function handleDelete() {
    if (!user) return;
    
    if (
      !confirm(
        `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${resolvedParams.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/users");
        router.refresh();
      } else {
        alert("Failed to delete user");
      }
    } catch (error) {
      alert("Failed to delete user");
    }
  }

  function formatDate(dateString: string) {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  }

  function formatFullDate(dateString: string) {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-white/60">Loading user data...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <User className="h-12 w-12 text-white/40" />
        <p className="mt-4 text-white/60">User not found</p>
        <Link href="/admin/users" className="mt-4 text-sm text-explore-teal hover:text-explore-teal/80">
          Back to users
        </Link>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    student: "Student",
    parent: "Parent",
    instructor: "Instructor",
    administrator: "Administrator",
  };

  const roleColors: Record<string, string> = {
    student: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    parent: "bg-green-500/10 text-green-400 border-green-500/30",
    instructor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    administrator: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                  roleColors[user.role]
                }`}
              >
                {roleLabels[user.role]}
              </span>
              {user.studentId && (
                <span className="font-mono text-sm text-explore-teal">{user.studentId}</span>
              )}
              {user.staffId && (
                <span className="font-mono text-sm text-explore-teal">{user.staffId}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData(user);
                }}
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-explore-teal/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleDeactivate}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  user.isActive
                    ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                    : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                }`}
              >
                {user.isActive ? (
                  <>
                    <UserX className="h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Reactivate
                  </>
                )}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/60">Account Status</h3>
            {user.isActive ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
          </div>
          <p className={`text-lg font-semibold ${user.isActive ? "text-green-400" : "text-red-400"}`}>
            {user.isActive ? "Active" : "Deactivated"}
          </p>
          <p className="mt-1 text-sm text-white/60">
            Created {formatDate(user.createdAt)}
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/60">Email Verification</h3>
            {user.emailVerified ? (
              <CheckCircle className="h-5 w-5 text-blue-400" />
            ) : (
              <XCircle className="h-5 w-5 text-yellow-400" />
            )}
          </div>
          <p className={`text-lg font-semibold ${user.emailVerified ? "text-blue-400" : "text-yellow-400"}`}>
            {user.emailVerified ? "Verified" : "Unverified"}
          </p>
          <p className="mt-1 text-sm text-white/60">
            {user.emailVerified ? "Email confirmed" : "Email needs confirmation"}
          </p>
        </div>
      </div>

      {/* User Information */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">User Information</h3>
        
        {editMode ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Name</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Email</label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Phone</label>
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Role</label>
              <select
                value={formData.role || ""}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
              >
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="instructor">Instructor</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/60">Email</p>
              <p className="mt-1 font-medium text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Phone</p>
              <p className="mt-1 font-medium text-white">{user.phone || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Role</p>
              <p className="mt-1 font-medium text-white">{roleLabels[user.role]}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Last Updated</p>
              <p className="mt-1 font-medium text-white">{formatFullDate(user.updatedAt)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Relationships */}
      {relationships.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Relationships</h3>
          <div className="space-y-3">
            {relationships.map((rel) => (
              <div
                key={rel._id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="font-medium text-white">
                    {rel.guardianId?.name || rel.studentId?.name}
                  </p>
                  <p className="text-sm text-white/60">
                    {rel.relationship} • {rel.guardianId?.email || rel.studentId?.email}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    rel.status === "approved"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {rel.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log */}
      {activities.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <History className="h-5 w-5" />
            Activity Log
          </h3>
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity) => (
              <div
                key={activity._id}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-white">{activity.action}</p>
                    {activity.details && (
                      <p className="mt-1 text-sm text-white/60">{activity.details}</p>
                    )}
                    {activity.performedBy && (
                      <p className="mt-2 text-xs text-white/40">
                        By: {activity.performedBy.name}
                        {activity.performedBy.staffId && (
                          <span className="ml-2 font-mono text-explore-teal">
                            {activity.performedBy.staffId}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Clock className="h-3 w-3" />
                    {formatDate(activity.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
