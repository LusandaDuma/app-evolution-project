import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut,
  Users,
  BookOpen,
  Award,
  Home,
  GraduationCap,
  ChevronRight,
  Search,
  MoreVertical,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  Calendar,
  Filter,
  Plus,
  Mail,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import wordmark from "@/assets/imbewu-wordmark.png";

export const Route = createFileRoute("/dashboard/coordinator")({
  component: CoordinatorDashboard,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type TabId = "home" | "learners" | "classes" | "progress" | "certificates";

interface Learner {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
  courses_enrolled: number;
  courses_completed: number;
  last_active: string | null;
}

interface ClassGroup {
  id: string;
  name: string;
  description: string;
  learner_count: number;
  created_at: string;
}

interface ProgressRecord {
  id: string;
  learner_name: string;
  course_title: string;
  progress: number;
  last_activity: string;
}

interface Certificate {
  id: string;
  learner_name: string;
  course_title: string;
  issued_at: string;
  status: "issued" | "pending";
}

function CoordinatorDashboard() {
  const { roles, loading, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [profile, setProfile] = useState<{ display_name: string } | null>(null);
  const [stats, setStats] = useState({
    totalLearners: 0,
    activeLearners: 0,
    coursesManaged: 0,
    certificatesIssued: 0,
  });

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth" });
      return;
    }
    if (roles.length > 0 && !roles.includes("coordinator")) {
      navigate({ to: "/dashboard" });
      return;
    }
  }, [loading, session, roles, navigate]);

  useEffect(() => {
    if (!session) return;

    async function fetchData() {
      const { data: profileData } = await db
        .from("profiles")
        .select("display_name")
        .eq("id", session!.user.id)
        .single();
      setProfile(profileData);

      // Fetch coordinator stats - in a real app these would be filtered by coordinator_id
      const [learners, courses, certificates] = await Promise.all([
        db.from("profiles").select("*", { count: "exact", head: true }),
        db.from("courses").select("*", { count: "exact", head: true }),
        db.from("student_badges").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalLearners: learners.count ?? 0,
        activeLearners: Math.floor((learners.count ?? 0) * 0.75),
        coursesManaged: courses.count ?? 0,
        certificatesIssued: certificates.count ?? 0,
      });
    }

    fetchData();
  }, [session]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="font-display text-2xl text-primary">Cultivating...</p>
      </div>
    );
  }

  const navItems: { id: TabId; label: string; icon: typeof Home }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "learners", label: "Learners", icon: Users },
    { id: "classes", label: "Classes", icon: GraduationCap },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "certificates", label: "Certificates", icon: Award },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border p-6">
          <img src={wordmark} alt="Imbewu" className="h-8 w-auto" />
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            Coordinator Portal
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <img src={wordmark} alt="Imbewu" className="h-6 w-auto" />
          <button
            onClick={signOut}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <div className="px-4 py-6 md:p-8">
          {activeTab === "home" && (
            <HomeTab
              profile={profile}
              stats={stats}
              greeting={greeting()}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === "learners" && <LearnersTab />}
          {activeTab === "classes" && <ClassesTab />}
          {activeTab === "progress" && <ProgressTab />}
          {activeTab === "certificates" && <CertificatesTab />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border bg-card/95 px-2 py-2 backdrop-blur-sm md:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all ${
              activeTab === item.id
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <item.icon
              className={`h-5 w-5 ${activeTab === item.id ? "text-primary" : ""}`}
            />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ============ HOME TAB ============
function HomeTab({
  profile,
  stats,
  greeting,
  onNavigate,
}: {
  profile: { display_name: string } | null;
  stats: {
    totalLearners: number;
    activeLearners: number;
    coursesManaged: number;
    certificatesIssued: number;
  };
  greeting: string;
  onNavigate: (tab: TabId) => void;
}) {
  const [recentActivity, setRecentActivity] = useState<
    { id: string; name: string; action: string; time: string }[]
  >([]);

  useEffect(() => {
    // Mock recent activity - in production this would fetch from lesson_progress
    setRecentActivity([
      { id: "1", name: "Thabo M.", action: "completed Soil Basics", time: "2 hours ago" },
      { id: "2", name: "Naledi K.", action: "started Water Conservation", time: "3 hours ago" },
      { id: "3", name: "Sipho N.", action: "earned First Harvest badge", time: "5 hours ago" },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-medium text-primary md:text-4xl">
          {greeting}, {profile?.display_name || "Coordinator"}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Monitor your learners and track their progress.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard
          icon={Users}
          value={stats.totalLearners}
          label="Total Learners"
          color="primary"
        />
        <StatCard
          icon={TrendingUp}
          value={stats.activeLearners}
          label="Active"
          color="gold"
        />
        <StatCard
          icon={BookOpen}
          value={stats.coursesManaged}
          label="Courses"
          color="primary"
        />
        <StatCard
          icon={Award}
          value={stats.certificatesIssued}
          label="Certificates"
          color="gold"
        />
      </div>

      {/* Recent Activity */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-foreground md:text-xl">
            Recent Activity
          </h2>
          <button
            onClick={() => onNavigate("progress")}
            className="flex items-center gap-1 text-sm font-medium text-primary"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  <span className="text-primary">{activity.name}</span> {activity.action}
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-3 font-display text-lg font-medium text-foreground md:text-xl">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate("learners")}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-[var(--shadow-soft)]"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Manage Learners</p>
              <p className="text-xs text-muted-foreground">View & assign</p>
            </div>
          </button>
          <button
            onClick={() => onNavigate("certificates")}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-[var(--shadow-soft)]"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10">
              <Award className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Issue Certificate</p>
              <p className="text-xs text-muted-foreground">Award learners</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Users;
  value: number;
  label: string;
  color: "primary" | "gold";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <Icon
        className={`h-5 w-5 ${color === "gold" ? "text-gold" : "text-primary"}`}
      />
      <p className="mt-2 font-display text-2xl font-medium text-foreground md:text-3xl">
        {value}
      </p>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

// ============ LEARNERS TAB ============
function LearnersTab() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    async function fetchLearners() {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, display_name, avatar_url");

      // Mock additional data - in production this would be joined
      const learnersWithStats = (profiles ?? []).map(
        (p: { id: string; display_name: string; avatar_url: string | null }) => ({
          ...p,
          email: `${p.display_name?.toLowerCase().replace(/\s/g, ".")}@email.com`,
          courses_enrolled: Math.floor(Math.random() * 5) + 1,
          courses_completed: Math.floor(Math.random() * 3),
          last_active: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
      );
      setLearners(learnersWithStats);
    }
    fetchLearners();
  }, []);

  const filteredLearners = learners.filter((l) => {
    const matchesSearch = l.display_name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    if (filter === "all") return matchesSearch;
    const isActive =
      l.last_active &&
      new Date(l.last_active) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    if (filter === "active") return matchesSearch && isActive;
    return matchesSearch && !isActive;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-primary md:text-4xl">
          Learners
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Manage and monitor your learners
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search learners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-2 text-xs font-medium transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Learners List */}
      <div className="space-y-3">
        {filteredLearners.map((learner) => (
          <LearnerCard key={learner.id} learner={learner} />
        ))}
        {filteredLearners.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No learners found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LearnerCard({ learner }: { learner: Learner }) {
  const isActive =
    learner.last_active &&
    new Date(learner.last_active) >
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-[var(--shadow-soft)]">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10">
        <User className="h-6 w-6 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {learner.display_name || "Unknown Learner"}
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {learner.courses_enrolled} enrolled
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {learner.courses_completed} completed
          </span>
        </div>
      </div>
      <button className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-secondary">
        <MoreVertical className="h-5 w-5" />
      </button>
    </div>
  );
}

// ============ CLASSES TAB ============
function ClassesTab() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Mock classes data - in production this would fetch from a classes table
    setClasses([
      {
        id: "1",
        name: "Soil Science 101",
        description: "Introduction to soil composition and health",
        learner_count: 24,
        created_at: "2026-01-15",
      },
      {
        id: "2",
        name: "Water Management",
        description: "Sustainable irrigation and conservation",
        learner_count: 18,
        created_at: "2026-02-20",
      },
      {
        id: "3",
        name: "Crop Rotation Basics",
        description: "Planning effective crop rotation cycles",
        learner_count: 15,
        created_at: "2026-03-10",
      },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-primary md:text-4xl">
            Classes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Organize learners into groups
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="shrink-0 bg-primary text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">New Class</span>
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <ClassCard key={cls.id} classGroup={cls} />
        ))}
        {classes.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No classes created yet</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-primary text-primary-foreground"
            >
              Create your first class
            </Button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateClassModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function ClassCard({ classGroup }: { classGroup: ClassGroup }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-all hover:border-primary/30">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <button className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-secondary">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
      <h3 className="mt-4 font-display text-lg font-medium text-foreground">
        {classGroup.name}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {classGroup.description}
      </p>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {classGroup.learner_count} learners
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(classGroup.created_at).toLocaleDateString()}
        </span>
      </div>
      <Button
        variant="outline"
        className="mt-4 w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
      >
        View Class
      </Button>
    </div>
  );
}

function CreateClassModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium text-foreground">
            Create New Class
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Class Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Soil Science 101"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this class..."
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border"
          >
            Cancel
          </Button>
          <Button className="flex-1 bg-primary text-primary-foreground">
            Create Class
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ PROGRESS TAB ============
function ProgressTab() {
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");

  useEffect(() => {
    async function fetchProgress() {
      const { data: enrolments } = await db
        .from("course_enrolments")
        .select("*, profiles(display_name), courses(title)")
        .order("updated_at", { ascending: false })
        .limit(20);

      const records = (enrolments ?? []).map(
        (e: {
          id: string;
          progress: number;
          updated_at: string;
          profiles: { display_name: string } | null;
          courses: { title: string } | null;
        }) => ({
          id: e.id,
          learner_name: e.profiles?.display_name || "Unknown",
          course_title: e.courses?.title || "Unknown Course",
          progress: e.progress ?? 0,
          last_activity: e.updated_at,
        })
      );
      setProgressRecords(records);
    }
    fetchProgress();
  }, []);

  const filteredRecords = progressRecords.filter((r) => {
    if (filter === "all") return true;
    if (filter === "completed") return r.progress >= 100;
    return r.progress > 0 && r.progress < 100;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-primary md:text-4xl">
          Progress Tracking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Monitor learner progress across courses
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "in-progress", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all"
              ? "All"
              : f === "in-progress"
              ? "In Progress"
              : "Completed"}
          </button>
        ))}
      </div>

      {/* Progress List */}
      <div className="space-y-3">
        {filteredRecords.map((record) => (
          <ProgressCard key={record.id} record={record} />
        ))}
        {filteredRecords.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No progress records found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressCard({ record }: { record: ProgressRecord }) {
  const isCompleted = record.progress >= 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {record.learner_name}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {record.course_title}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
            isCompleted
              ? "bg-gold/10 text-gold"
              : "bg-primary/10 text-primary"
          }`}
        >
          {isCompleted ? "Completed" : `${record.progress}%`}
        </span>
      </div>
      <div className="mt-3">
        <div className="h-2 rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all ${
              isCompleted ? "bg-gold" : "bg-primary"
            }`}
            style={{ width: `${Math.min(record.progress, 100)}%` }}
          />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>
          Last activity:{" "}
          {record.last_activity
            ? new Date(record.last_activity).toLocaleDateString()
            : "Never"}
        </span>
      </div>
    </div>
  );
}

// ============ CERTIFICATES TAB ============
function CertificatesTab() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showIssueModal, setShowIssueModal] = useState(false);

  useEffect(() => {
    // Mock certificates - in production would fetch from certificates table
    setCertificates([
      {
        id: "1",
        learner_name: "Thabo Mokoena",
        course_title: "Soil Science Fundamentals",
        issued_at: "2026-05-10",
        status: "issued",
      },
      {
        id: "2",
        learner_name: "Naledi Khumalo",
        course_title: "Water Conservation",
        issued_at: "2026-05-08",
        status: "issued",
      },
      {
        id: "3",
        learner_name: "Sipho Ndaba",
        course_title: "Crop Rotation",
        issued_at: "",
        status: "pending",
      },
    ]);
  }, []);

  const issuedCount = certificates.filter((c) => c.status === "issued").length;
  const pendingCount = certificates.filter((c) => c.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-primary md:text-4xl">
            Certificates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Issue and manage learner certificates
          </p>
        </div>
        <Button
          onClick={() => setShowIssueModal(true)}
          className="shrink-0 bg-primary text-primary-foreground"
        >
          <FileCheck className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Issue</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10">
              <Award className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="font-display text-2xl font-medium text-foreground">
                {issuedCount}
              </p>
              <p className="text-xs text-muted-foreground">Issued</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-2xl font-medium text-foreground">
                {pendingCount}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates List */}
      <div className="space-y-3">
        {certificates.map((cert) => (
          <CertificateCard key={cert.id} certificate={cert} />
        ))}
        {certificates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <Award className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No certificates yet</p>
          </div>
        )}
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <IssueCertificateModal onClose={() => setShowIssueModal(false)} />
      )}
    </div>
  );
}

function CertificateCard({ certificate }: { certificate: Certificate }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-[var(--shadow-soft)]">
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
          certificate.status === "issued" ? "bg-gold/10" : "bg-secondary"
        }`}
      >
        <Award
          className={`h-6 w-6 ${
            certificate.status === "issued" ? "text-gold" : "text-muted-foreground"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {certificate.learner_name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {certificate.course_title}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span
          className={`inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${
            certificate.status === "issued"
              ? "bg-gold/10 text-gold"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {certificate.status === "issued" ? "Issued" : "Pending"}
        </span>
        {certificate.issued_at && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {new Date(certificate.issued_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

function IssueCertificateModal({ onClose }: { onClose: () => void }) {
  const [learners, setLearners] = useState<{ id: string; display_name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedLearner, setSelectedLearner] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    async function fetchData() {
      const [learnersRes, coursesRes] = await Promise.all([
        db.from("profiles").select("id, display_name"),
        db.from("courses").select("id, title").eq("is_published", true),
      ]);
      setLearners(learnersRes.data ?? []);
      setCourses(coursesRes.data ?? []);
    }
    fetchData();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium text-foreground">
            Issue Certificate
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Learner
            </label>
            <select
              value={selectedLearner}
              onChange={(e) => setSelectedLearner(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">Select a learner...</option>
              {learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.display_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border"
          >
            Cancel
          </Button>
          <Button className="flex-1 bg-gold text-white hover:bg-gold/90">
            <Award className="mr-2 h-4 w-4" />
            Issue Certificate
          </Button>
        </div>
      </div>
    </div>
  );
}
