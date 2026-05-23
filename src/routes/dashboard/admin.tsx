import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut, Users, BookOpen, Activity, Settings, LayoutDashboard,
  Plus, Trash2, Eye, EyeOff, ChevronLeft, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import wordmark from "@/assets/imbewu-wordmark.svg";
import { getErrorMessage, logError } from "@/lib/errors";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin — Imbewu" }] }),
  component: AdminDashboard,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const ROLE_OPTIONS: AppRole[] = ["student", "coordinator", "admin", "independent"];

type Profile = { id: string; display_name: string | null; avatar_url: string | null; created_at: string };
type Course = { id: string; title: string; description: string | null; is_published: boolean; created_at: string };
type Lesson = { id: string; course_id: string; title: string; content: string | null; position: number };

function AdminDashboard() {
  const { roles, loading, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ users: 0, courses: 0, enrolments: 0, completions: 0 });

  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/auth" }); return; }
    if (!isAdmin) { navigate({ to: "/dashboard" }); return; }
  }, [loading, session, isAdmin, navigate]);

  useEffect(() => {
    if (!session || !isAdmin) return;
    (async () => {
      try {
        const [u, c, e, p] = await Promise.all([
          db.from("profiles").select("*", { count: "exact", head: true }),
          db.from("courses").select("*", { count: "exact", head: true }),
          db.from("course_enrolments").select("*", { count: "exact", head: true }),
          db.from("lesson_progress").select("*", { count: "exact", head: true }),
        ]);
        setStats({
          users: u.count ?? 0, courses: c.count ?? 0,
          enrolments: e.count ?? 0, completions: p.count ?? 0,
        });
      } catch (err) {
        logError("AdminStats", err);
        toast.error(getErrorMessage(err, "admin"));
      }
    })();
  }, [session, isAdmin, activeTab]);

  if (loading || !session || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="font-display text-2xl text-primary">Cultivating…</p>
      </div>
    );
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Courses", value: stats.courses, icon: BookOpen },
    { label: "Enrolments", value: stats.enrolments, icon: Activity },
    { label: "Lessons Completed", value: stats.completions, icon: Activity },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <img src={wordmark} alt="Imbewu" className="h-8 w-auto" />
          <p className="mt-1 text-xs text-muted-foreground uppercase tracking-widest">Admin Console</p>
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
          <Button variant="ghost" onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {activeTab === "overview" && (
          <div>
            <h1 className="font-display text-4xl font-medium text-primary">Good day, Admin.</h1>
            <p className="mt-2 text-muted-foreground">Here is what is happening on Imbewu today.</p>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <stat.icon className="h-5 w-5 text-gold" />
                  <p className="mt-4 font-display text-4xl font-medium text-primary">{stat.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && <UsersTab currentUserId={session.user.id} />}
        {activeTab === "courses" && <CoursesTab currentUserId={session.user.id} />}
        {activeTab === "activity" && <ActivityTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

/* ----------------------------- USERS TAB ----------------------------- */

function UsersTab({ currentUserId }: { currentUserId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, AppRole[]>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [{ data: ps }, { data: rs }] = await Promise.all([
        db.from("profiles").select("*").order("created_at", { ascending: false }),
        db.from("user_roles").select("user_id, role"),
      ]);
      setProfiles(ps ?? []);
      const map: Record<string, AppRole[]> = {};
      for (const r of (rs ?? []) as { user_id: string; role: AppRole }[]) {
        (map[r.user_id] ||= []).push(r.role);
      }
      setRolesByUser(map);
    } catch (err) {
      logError("UsersTab", err);
      toast.error(getErrorMessage(err, "admin"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function changeRole(userId: string, newRole: AppRole) {
    try {
      await db.from("user_roles").delete().eq("user_id", userId);
      const { error } = await db.from("user_roles").insert({ user_id: userId, role: newRole });
      if (error) throw error;
      toast.success("Role updated");
      setRolesByUser((m) => ({ ...m, [userId]: [newRole] }));
    } catch (err) {
      logError("ChangeRole", err);
      toast.error(getErrorMessage(err, "admin"));
    }
  }

  const filtered = useMemo(
    () => profiles.filter((p) => (p.display_name ?? "").toLowerCase().includes(search.toLowerCase())),
    [profiles, search],
  );

  return (
    <div>
      <h1 className="font-display text-4xl font-medium text-primary">Users</h1>
      <p className="mt-2 text-muted-foreground">Manage user roles across the platform.</p>
      <Input
        placeholder="Search by name…"
        value={search} onChange={(e) => setSearch(e.target.value)}
        className="mt-6 max-w-sm"
      />
      <div className="mt-4 rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              {["Name", "Role", "Joined", "Actions"].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!loading && filtered.map((p) => {
              const r = rolesByUser[p.id]?.[0] ?? "student";
              const isSelf = p.id === currentUserId;
              return (
                <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{p.display_name ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      r === "admin" ? "bg-purple-100 text-purple-700" :
                      r === "coordinator" ? "bg-blue-100 text-blue-700" :
                      r === "independent" ? "bg-amber-100 text-amber-700" :
                      "bg-green-100 text-green-700"
                    }`}>{r}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <Select value={r} onValueChange={(v) => changeRole(p.id, v as AppRole)} disabled={isSelf}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------- COURSES TAB ---------------------------- */

function CoursesTab({ currentUserId }: { currentUserId: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [openNew, setOpenNew] = useState(false);

  async function load() {
    const { data } = await db.from("courses").select("*").order("created_at", { ascending: false });
    setCourses(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function toggle(c: Course) {
    const { error } = await db.from("courses").update({ is_published: !c.is_published }).eq("id", c.id);
    if (error) return toast.error(getErrorMessage(error, "admin"));
    setCourses((prev) => prev.map((x) => x.id === c.id ? { ...x, is_published: !c.is_published } : x));
  }

  async function remove(c: Course) {
    if (!confirm(`Delete "${c.title}" and all its lessons?`)) return;
    const { error } = await db.from("courses").delete().eq("id", c.id);
    if (error) return toast.error(getErrorMessage(error, "admin"));
    toast.success("Course deleted");
    setCourses((prev) => prev.filter((x) => x.id !== c.id));
  }

  if (selected) {
    return <CourseDetail course={selected} onBack={() => { setSelected(null); load(); }} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-medium text-primary">Courses</h1>
          <p className="mt-2 text-muted-foreground">Create and manage learning content.</p>
        </div>
        <Button onClick={() => setOpenNew(true)} className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> New Course
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-xl font-medium text-foreground">{c.title}</h3>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                c.is_published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}>{c.is_published ? "Published" : "Draft"}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">{c.description ?? "No description."}</p>
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected(c)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggle(c)}>
                {c.is_published ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
                {c.is_published ? "Unpublish" : "Publish"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => remove(c)}
                className="ml-auto text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground rounded-2xl border border-dashed border-border">
            No courses yet. Create your first one.
          </div>
        )}
      </div>

      <NewCourseDialog
        open={openNew} onOpenChange={setOpenNew} createdBy={currentUserId}
        onCreated={() => { setOpenNew(false); load(); }}
      />
    </div>
  );
}

function NewCourseDialog({
  open, onOpenChange, createdBy, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; createdBy: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim()) return toast.error("Title is required");
    setSaving(true);
    const { error } = await db.from("courses").insert({
      title: title.trim(), description: description.trim() || null, created_by: createdBy,
    });
    setSaving(false);
    if (error) return toast.error(getErrorMessage(error, "admin"));
    toast.success("Course created");
    setTitle(""); setDescription("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Course</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="t">Title</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Soil basics" />
          </div>
          <div>
            <Label htmlFor="d">Description</Label>
            <Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------- COURSE DETAIL --------------------------- */

function CourseDetail({ course, onBack }: { course: Course; onBack: () => void }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description ?? "");

  async function loadLessons() {
    const { data } = await db.from("lessons").select("*").eq("course_id", course.id).order("position");
    setLessons(data ?? []);
  }
  useEffect(() => { loadLessons(); }, [course.id]);

  async function saveCourse() {
    const { error } = await db.from("courses").update({
      title: title.trim(), description: description.trim() || null,
    }).eq("id", course.id);
    if (error) return toast.error(getErrorMessage(error, "admin"));
    toast.success("Course updated");
  }

  async function removeLesson(id: string) {
    if (!confirm("Delete this lesson?")) return;
    const { error } = await db.from("lessons").delete().eq("id", id);
    if (error) return toast.error(getErrorMessage(error, "admin"));
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to courses
      </Button>
      <h1 className="font-display text-4xl font-medium text-primary">Edit course</h1>

      <div className="mt-6 max-w-2xl rounded-2xl border border-border bg-card p-6 space-y-4">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>
        <Button onClick={saveCourse}>Save changes</Button>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-2xl font-medium text-primary">Lessons</h2>
        <Button size="sm" onClick={() => setOpenNew(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add lesson
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {lessons.map((l, i) => (
          <div key={l.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary text-sm font-semibold">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{l.title}</p>
              {l.content && <p className="text-xs text-muted-foreground truncate">{l.content}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeLesson(l.id)}
              className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {lessons.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground text-sm">
            No lessons yet.
          </div>
        )}
      </div>

      <NewLessonDialog
        open={openNew} onOpenChange={setOpenNew} courseId={course.id}
        nextPosition={lessons.length}
        onCreated={() => { setOpenNew(false); loadLessons(); }}
      />
    </div>
  );
}

function NewLessonDialog({
  open, onOpenChange, courseId, nextPosition, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; courseId: string; nextPosition: number; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim()) return toast.error("Title is required");
    setSaving(true);
    const { error } = await db.from("lessons").insert({
      course_id: courseId, title: title.trim(), content: content.trim() || null, position: nextPosition,
    });
    setSaving(false);
    if (error) return toast.error(getErrorMessage(error, "admin"));
    setTitle(""); setContent("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Lesson</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="lt">Title</Label>
            <Input id="lt" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="lc">Content</Label>
            <Textarea id="lc" value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------- ACTIVITY ----------------------------- */

function ActivityTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: progress } = await db
          .from("lesson_progress")
          .select("id, completed_at, user_id, lesson_id, lessons(title, course_id, courses(title))")
          .order("completed_at", { ascending: false })
          .limit(30);

        const userIds = Array.from(new Set((progress ?? []).map((p: any) => p.user_id)));
        const { data: profs } = userIds.length
          ? await db.from("profiles").select("id, display_name").in("id", userIds)
          : { data: [] };
        const nameById = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.display_name]));

        setItems((progress ?? []).map((p: any) => ({ ...p, display_name: nameById[p.user_id] ?? "Someone" })));
      } catch (err) {
        logError("Activity", err);
        toast.error(getErrorMessage(err, "admin"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl font-medium text-primary">Activity</h1>
      <p className="mt-2 text-muted-foreground">Recent lesson completions across the platform.</p>
      <div className="mt-6 space-y-3">
        {loading && <p className="text-muted-foreground">Loading…</p>}
        {!loading && items.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                <span className="text-foreground">{p.display_name}</span> completed{" "}
                <span className="text-primary">{p.lessons?.title ?? "a lesson"}</span>
                {p.lessons?.courses?.title && <span className="text-muted-foreground"> in {p.lessons.courses.title}</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {p.completed_at ? new Date(p.completed_at).toLocaleString() : "—"}
              </p>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No activity yet.</div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- SETTINGS ----------------------------- */

function SettingsTab() {
  return (
    <div>
      <h1 className="font-display text-4xl font-medium text-primary">Settings</h1>
      <p className="mt-2 text-muted-foreground">Platform configuration.</p>
      <div className="mt-6 max-w-lg rounded-2xl border border-border bg-card p-8 space-y-6">
        <div>
          <Label>Platform name</Label>
          <Input defaultValue="Imbewu" className="mt-2" />
        </div>
        <div>
          <Label>Contact email</Label>
          <Input defaultValue="imbewu@admin.local" className="mt-2" />
        </div>
        <p className="text-xs text-muted-foreground">
          These settings are placeholders. Wire them to a `platform_settings` table when needed.
        </p>
      </div>
    </div>
  );
}
