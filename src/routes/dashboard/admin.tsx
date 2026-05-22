import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Users, BookOpen, Award, Activity, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import wordmark from "@/assets/imbewu-wordmark.png";

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminDashboard,
});

// Use a type-safe wrapper to avoid TS errors on tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function AdminDashboard() {
  const { roles, loading, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ users: 0, courses: 0, enrolments: 0, badges: 0 });

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/auth" }); return; }
    if (roles.length > 0 && roles[0] !== "admin") { navigate({ to: "/dashboard" }); return; }
  }, [loading, session, roles, navigate]);

  useEffect(() => {
    async function fetchStats() {
      const [users, courses, enrolments, badges] = await Promise.all([
        db.from("profiles").select("*", { count: "exact", head: true }),
        db.from("courses").select("*", { count: "exact", head: true }),
        db.from("course_enrolments").select("*", { count: "exact", head: true }),
        db.from("student_badges").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        users: users.count ?? 0,
        courses: courses.count ?? 0,
        enrolments: enrolments.count ?? 0,
        badges: badges.count ?? 0,
      });
    }
    fetchStats();
  }, []);

  if (loading) return (
    <div className="grid min-h-screen place-items-center bg-background">
      <p className="font-display text-2xl text-primary">Cultivating…</p>
    </div>
  );

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "badges", label: "Badges", icon: Award },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Active Courses", value: stats.courses, icon: BookOpen },
    { label: "Enrolments", value: stats.enrolments, icon: Award },
    { label: "Badges Awarded", value: stats.badges, icon: Activity },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <img src={wordmark} alt="Imbewu" className="h-8 w-auto" />
          <p className="mt-1 text-xs text-muted-foreground uppercase tracking-widest">
            Admin Console
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
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
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">

        {activeTab === "overview" && (
          <div>
            <h1 className="font-display text-4xl font-medium text-primary">Good day, Admin.</h1>
            <p className="mt-2 text-muted-foreground">Here is what is happening on Imbewu today.</p>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
                >
                  <stat.icon className="h-5 w-5 text-gold" />
                  <p className="mt-4 font-display text-4xl font-medium text-primary">{stat.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h1 className="font-display text-4xl font-medium text-primary">Users</h1>
            <p className="mt-2 text-muted-foreground">Manage all platform users.</p>
            <UsersTab />
          </div>
        )}

        {activeTab === "courses" && (
          <div>
            <h1 className="font-display text-4xl font-medium text-primary">Courses</h1>
            <p className="mt-2 text-muted-foreground">Manage course visibility and content.</p>
            <CoursesTab />
          </div>
        )}

        {activeTab === "badges" && (
          <div>
            <h1 className="font-display text-4xl font-medium text-primary">Badges</h1>
            <p className="mt-2 text-muted-foreground">View all awarded badges.</p>
            <BadgesTab />
          </div>
        )}

        {activeTab === "activity" && (
          <div>
            <h1 className="font-display text-4xl font-medium text-primary">Activity</h1>
            <p className="mt-2 text-muted-foreground">Platform activity log.</p>
            <ActivityTab />
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h1 className="font-display text-4xl font-medium text-primary">Settings</h1>
            <p className="mt-2 text-muted-foreground">Platform configuration.</p>
            <SettingsTab />
          </div>
        )}

      </main>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    db.from("profiles").select("*").then(({ data }: any) => setUsers(data ?? []));
  }, []);

  const filtered = users.filter((u) =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mt-6">
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              {["Name", "Role", "Status", "Last Login"].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">
                  {user.first_name} {user.last_name}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    user.role === "admin" ? "bg-purple-100 text-purple-700" :
                    user.role === "coordinator" ? "bg-blue-100 text-blue-700" :
                    user.role === "independent" ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {user.role ?? "student"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoursesTab() {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    db.from("courses").select("*").then(({ data }: any) => setCourses(data ?? []));
  }, []);

  async function toggleVisibility(id: string, current: boolean) {
    await db.from("courses").update({ is_published: !current }).eq("id", id);
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_published: !current } : c))
    );
  }

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <div key={course.id} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-xl font-medium text-foreground">{course.title}</h3>
            <button
              onClick={() => toggleVisibility(course.id, course.is_published)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                course.is_published
                  ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                  : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"
              }`}
            >
              {course.is_published ? "Visible" : "Hidden"}
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        </div>
      ))}
      {courses.length === 0 && (
        <div className="col-span-3 py-12 text-center text-muted-foreground">
          No courses yet.
        </div>
      )}
    </div>
  );
}

function BadgesTab() {
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    db.from("student_badges").select("*, profiles(first_name, last_name), badges(name)")
      .then(({ data }: any) => setBadges(data ?? []));
  }, []);

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-secondary/50">
          <tr>
            {["User", "Badge", "Awarded"].map((h) => (
              <th key={h} className="px-6 py-4 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {badges.map((b) => (
            <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
              <td className="px-6 py-4 font-medium text-foreground">
                {b.profiles?.first_name} {b.profiles?.last_name}
              </td>
              <td className="px-6 py-4">
                <span className="px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-semibold">
                  {b.badges?.name ?? "Badge"}
                </span>
              </td>
              <td className="px-6 py-4 text-muted-foreground">
                {b.awarded_at ? new Date(b.awarded_at).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
          {badges.length === 0 && (
            <tr>
              <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">No badges awarded yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTab() {
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => {
    db.from("lesson_progress")
      .select("*, profiles(first_name, last_name), lessons(title)")
      .order("completed_at", { ascending: false })
      .limit(20)
      .then(({ data }: any) => setProgress(data ?? []));
  }, []);

  return (
    <div className="mt-6 space-y-3">
      {progress.map((p) => (
        <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {p.profiles?.first_name} {p.profiles?.last_name} completed{" "}
              <span className="text-primary">{p.lessons?.title ?? "a lesson"}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {p.completed_at ? new Date(p.completed_at).toLocaleString() : "—"}
            </p>
          </div>
        </div>
      ))}
      {progress.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">No activity yet.</div>
      )}
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="mt-6 max-w-lg rounded-2xl border border-border bg-card p-8 space-y-6">
      <div>
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Platform name</label>
        <input
          defaultValue="Imbewu"
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Contact email</label>
        <input
          defaultValue="imbewu@admin.local"
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Allow new signups</span>
        <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Maintenance mode</span>
        <input type="checkbox" className="h-4 w-4 accent-primary" />
      </div>
      <Button className="w-full bg-primary text-primary-foreground">Save settings</Button>
    </div>
  );
}
