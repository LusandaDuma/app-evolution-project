import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut,
  BookOpen,
  Award,
  Calendar,
  MessageCircle,
  Home,
  ChevronRight,
  Play,
  Clock,
  Sparkles,
  Send,
  X,
  Trophy,
  Target,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import wordmark from "@/assets/imbewu-wordmark.png";

export const Route = createFileRoute("/dashboard/student")({
  component: StudentDashboard,
});

// Type-safe wrapper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type TabId = "home" | "courses" | "badges" | "calendar" | "nolwazi";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  duration_hours: number;
  is_published: boolean;
  progress?: number;
  enrolled?: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  awarded_at?: string;
}

interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  type: "lesson" | "deadline" | "event";
  course_title?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function StudentDashboard() {
  const { roles, loading, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [profile, setProfile] = useState<{ display_name: string } | null>(null);
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    badgesEarned: 0,
    streak: 7,
  });

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth" });
      return;
    }
    // Allow students or if roles haven't loaded yet
    if (roles.length > 0 && !roles.includes("student")) {
      navigate({ to: "/dashboard" });
      return;
    }
  }, [loading, session, roles, navigate]);

  useEffect(() => {
    if (!session) return;

    async function fetchData() {
      // Fetch profile
      const { data: profileData } = await db
        .from("profiles")
        .select("display_name")
        .eq("id", session!.user.id)
        .single();
      setProfile(profileData);

      // Fetch stats
      const [enrolments, completed, badges] = await Promise.all([
        db
          .from("course_enrolments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session!.user.id),
        db
          .from("course_enrolments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session!.user.id)
          .eq("completed", true),
        db
          .from("student_badges")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session!.user.id),
      ]);

      setStats({
        coursesEnrolled: enrolments.count ?? 0,
        coursesCompleted: completed.count ?? 0,
        badgesEarned: badges.count ?? 0,
        streak: 7,
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
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "badges", label: "Badges", icon: Award },
    { id: "calendar", label: "Schedule", icon: Calendar },
    { id: "nolwazi", label: "Nolwazi", icon: MessageCircle },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border p-6">
          <img src={wordmark} alt="Imbewu" className="h-8 w-auto" />
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            Student Portal
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
          {activeTab === "courses" && <CoursesTab userId={session?.user.id} />}
          {activeTab === "badges" && <BadgesTab userId={session?.user.id} />}
          {activeTab === "calendar" && (
            <CalendarTab userId={session?.user.id} />
          )}
          {activeTab === "nolwazi" && <NolwaziTab />}
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
  stats: { coursesEnrolled: number; coursesCompleted: number; badgesEarned: number; streak: number };
  greeting: string;
  onNavigate: (tab: TabId) => void;
}) {
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function fetchRecent() {
      const { data } = await db
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .limit(3);
      setRecentCourses(data ?? []);
    }
    fetchRecent();
  }, []);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-medium text-primary md:text-4xl">
          {greeting}, {profile?.display_name || "Learner"}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Continue your journey in sustainable agriculture.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard
          icon={BookOpen}
          value={stats.coursesEnrolled}
          label="Enrolled"
          color="primary"
        />
        <StatCard
          icon={Trophy}
          value={stats.coursesCompleted}
          label="Completed"
          color="gold"
        />
        <StatCard
          icon={Award}
          value={stats.badgesEarned}
          label="Badges"
          color="primary"
        />
        <StatCard
          icon={Flame}
          value={stats.streak}
          label="Day Streak"
          color="gold"
        />
      </div>

      {/* Continue Learning */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-foreground md:text-xl">
            Continue Learning
          </h2>
          <button
            onClick={() => onNavigate("courses")}
            className="flex items-center gap-1 text-sm font-medium text-primary"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          {recentCourses.map((course) => (
            <CourseCard key={course.id} course={course} compact />
          ))}
          {recentCourses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
              <Target className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Start your first course to begin your journey
              </p>
              <Button
                onClick={() => onNavigate("courses")}
                className="mt-4 bg-primary text-primary-foreground"
              >
                Browse Courses
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-3 font-display text-lg font-medium text-foreground md:text-xl">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate("nolwazi")}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-[var(--shadow-soft)]"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Ask Nolwazi</p>
              <p className="text-xs text-muted-foreground">AI assistant</p>
            </div>
          </button>
          <button
            onClick={() => onNavigate("calendar")}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-[var(--shadow-soft)]"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10">
              <Calendar className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Schedule</p>
              <p className="text-xs text-muted-foreground">View calendar</p>
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
  icon: typeof BookOpen;
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

// ============ COURSES TAB ============
function CoursesTab({ userId }: { userId?: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<"all" | "enrolled" | "available">("all");
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchCourses() {
      const { data: allCourses } = await db
        .from("courses")
        .select("*")
        .eq("is_published", true);

      const { data: enrolments } = await db
        .from("course_enrolments")
        .select("course_id, progress")
        .eq("user_id", userId);

      const enrolledMap = new Map<string, number>(
        (enrolments ?? []).map((e: { course_id: string; progress: number }) => [
          e.course_id,
          e.progress,
        ] as [string, number])
      );
      setEnrolledIds(new Set<string>(Array.from(enrolledMap.keys())));

      const coursesWithProgress = (allCourses ?? []).map((c: Course) => ({
        ...c,
        enrolled: enrolledMap.has(c.id),
        progress: enrolledMap.get(c.id) ?? 0,
      }));

      setCourses(coursesWithProgress);
    }
    if (userId) fetchCourses();
  }, [userId]);

  const filteredCourses = courses.filter((c) => {
    if (filter === "enrolled") return c.enrolled;
    if (filter === "available") return !c.enrolled;
    return true;
  });

  async function handleEnroll(courseId: string) {
    if (!userId) return;
    await db.from("course_enrolments").insert({
      user_id: userId,
      course_id: courseId,
      progress: 0,
    });
    setEnrolledIds((prev) => new Set(prev).add(courseId));
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, enrolled: true, progress: 0 } : c
      )
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-primary md:text-4xl">
          Course Catalog
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Explore sustainable agriculture courses
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "enrolled", "available"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f === "enrolled" ? "My Courses" : "Available"}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onEnroll={() => handleEnroll(course.id)}
          />
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No courses found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({
  course,
  compact,
  onEnroll,
}: {
  course: Course;
  compact?: boolean;
  onEnroll?: () => void;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-[var(--shadow-soft)]">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {course.title}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${course.progress ?? 0}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {course.progress ?? 0}%
            </span>
          </div>
        </div>
        <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Play className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:border-primary/30">
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 p-6">
        <div className="grid h-full w-full place-items-center">
          <BookOpen className="h-12 w-12 text-primary/60" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-medium text-foreground">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {course.description}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{course.duration_hours || 4} hours</span>
        </div>
        {course.enrolled ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-primary">
                {course.progress}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <Button className="mt-4 w-full bg-primary text-primary-foreground">
              <Play className="mr-2 h-4 w-4" />
              Continue
            </Button>
          </div>
        ) : (
          <Button
            onClick={onEnroll}
            variant="outline"
            className="mt-4 w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Enroll Now
          </Button>
        )}
      </div>
    </div>
  );
}

// ============ BADGES TAB ============
function BadgesTab({ userId }: { userId?: string }) {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);

  useEffect(() => {
    async function fetchBadges() {
      const [earned, all] = await Promise.all([
        db
          .from("student_badges")
          .select("*, badges(*)")
          .eq("user_id", userId),
        db.from("badges").select("*"),
      ]);

      setEarnedBadges(
        (earned.data ?? []).map((e: { badges: Badge; awarded_at: string }) => ({
          ...e.badges,
          awarded_at: e.awarded_at,
        }))
      );
      setAllBadges(all.data ?? []);
    }
    if (userId) fetchBadges();
  }, [userId]);

  const earnedIds = new Set(earnedBadges.map((b) => b.id));
  const lockedBadges = allBadges.filter((b) => !earnedIds.has(b.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-primary md:text-4xl">
          Achievements
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Collect badges as you progress
        </p>
      </div>

      {/* Earned Badges */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-medium text-foreground">
          <Trophy className="h-5 w-5 text-gold" />
          Earned ({earnedBadges.length})
        </h2>
        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {earnedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} earned />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Award className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Complete courses to earn your first badge
            </p>
          </div>
        )}
      </section>

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-medium text-foreground">
            Available to Earn
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {lockedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BadgeCard({ badge, earned }: { badge: Badge; earned?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center transition-all ${
        earned
          ? "border-gold/30 bg-gold/5 shadow-[var(--shadow-soft)]"
          : "border-border bg-card/50 opacity-60"
      }`}
    >
      <div
        className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${
          earned ? "bg-gold/20" : "bg-secondary"
        }`}
      >
        <Award
          className={`h-7 w-7 ${earned ? "text-gold" : "text-muted-foreground"}`}
        />
      </div>
      <p
        className={`mt-3 text-sm font-medium ${
          earned ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {badge.name}
      </p>
      {earned && badge.awarded_at && (
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(badge.awarded_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

// ============ CALENDAR TAB ============
function CalendarTab({ userId }: { userId?: string }) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // Mock schedule data - in production, fetch from database
    setEvents([
      {
        id: "1",
        title: "Soil Health Fundamentals",
        date: new Date().toISOString(),
        type: "lesson",
        course_title: "Introduction to Farming",
      },
      {
        id: "2",
        title: "Assignment Due",
        date: new Date(Date.now() + 86400000 * 2).toISOString(),
        type: "deadline",
        course_title: "Crop Rotation",
      },
      {
        id: "3",
        title: "Live Q&A Session",
        date: new Date(Date.now() + 86400000 * 3).toISOString(),
        type: "event",
      },
    ]);
  }, [userId]);

  const daysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysCount };
  };

  const { firstDay, daysCount } = daysInMonth();
  const today = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-primary md:text-4xl">
          Schedule
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Keep track of lessons and deadlines
        </p>
      </div>

      {/* Calendar Mini */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-medium text-foreground">
            {selectedDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.setMonth(selectedDate.getMonth() - 1))
                )
              }
              className="rounded-lg p-2 hover:bg-secondary"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.setMonth(selectedDate.getMonth() + 1))
                )
              }
              className="rounded-lg p-2 hover:bg-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="py-2 font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysCount }).map((_, i) => {
            const day = i + 1;
            const isToday =
              day === today.getDate() &&
              selectedDate.getMonth() === today.getMonth() &&
              selectedDate.getFullYear() === today.getFullYear();
            return (
              <button
                key={day}
                className={`rounded-lg py-2 text-sm transition-all ${
                  isToday
                    ? "bg-primary font-medium text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <section>
        <h2 className="mb-3 font-display text-lg font-medium text-foreground">
          Upcoming
        </h2>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  event.type === "lesson"
                    ? "bg-primary/10"
                    : event.type === "deadline"
                      ? "bg-destructive/10"
                      : "bg-gold/10"
                }`}
              >
                {event.type === "lesson" ? (
                  <BookOpen className="h-5 w-5 text-primary" />
                ) : event.type === "deadline" ? (
                  <Clock className="h-5 w-5 text-destructive" />
                ) : (
                  <Calendar className="h-5 w-5 text-gold" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{event.title}</p>
                {event.course_title && (
                  <p className="text-sm text-muted-foreground">
                    {event.course_title}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============ NOLWAZI AI TAB ============
function NolwaziTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Sawubona! I am Nolwazi, your agricultural learning assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response - in production, call your AI endpoint
    setTimeout(() => {
      const responses = [
        "Great question! In sustainable farming, crop rotation helps maintain soil health by alternating plants with different nutrient needs.",
        "Companion planting is a wonderful technique. For example, planting marigolds near tomatoes can help repel pests naturally.",
        "Water conservation is essential. Consider drip irrigation systems which deliver water directly to plant roots, reducing waste by up to 60%.",
        "Composting is the foundation of organic farming. Start with a mix of green (nitrogen-rich) and brown (carbon-rich) materials.",
      ];
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col md:h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium text-primary">
              Nolwazi
            </h1>
            <p className="text-sm text-muted-foreground">
              Your AI farming assistant
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card/50 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border"
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about farming, crops, soil..."
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim()}
          className="rounded-xl bg-primary px-4 text-primary-foreground"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Suggested Questions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          "What is crop rotation?",
          "How to improve soil health?",
          "Best practices for irrigation",
        ].map((q) => (
          <button
            key={q}
            onClick={() => setInput(q)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
