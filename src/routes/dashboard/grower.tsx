import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut,
  BookOpen,
  Home,
  ChevronRight,
  Play,
  Clock,
  Sparkles,
  Send,
  Leaf,
  Camera,
  Upload,
  Sun,
  Droplets,
  Bug,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  Search,
  Filter,
  MapPin,
  Sprout,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import wordmark from "@/assets/imbewu-wordmark.png";

export const Route = createFileRoute("/dashboard/grower")({
  component: GrowerDashboard,
});

// Type-safe wrapper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type TabId = "home" | "library" | "fieldwise" | "nolwazi" | "farm";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  duration_hours: number;
  is_published: boolean;
  progress?: number;
  started?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DiagnosisResult {
  condition: string;
  confidence: number;
  description: string;
  treatment: string;
  severity: "low" | "medium" | "high";
}

interface FarmNote {
  id: string;
  title: string;
  content: string;
  date: string;
  type: "observation" | "task" | "harvest";
}

function GrowerDashboard() {
  const { roles, loading, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [profile, setProfile] = useState<{ display_name: string } | null>(null);
  const [stats, setStats] = useState({
    coursesStarted: 0,
    coursesCompleted: 0,
    hoursLearned: 12,
    diagnoses: 3,
  });

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth" });
      return;
    }
    if (roles.length > 0 && !roles.includes("independent")) {
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

      const [started, completed] = await Promise.all([
        db
          .from("course_enrolments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session!.user.id),
        db
          .from("course_enrolments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session!.user.id)
          .eq("completed", true),
      ]);

      setStats({
        coursesStarted: started.count ?? 0,
        coursesCompleted: completed.count ?? 0,
        hoursLearned: 12,
        diagnoses: 3,
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
    { id: "library", label: "Library", icon: BookOpen },
    { id: "fieldwise", label: "FieldWise", icon: Leaf },
    { id: "nolwazi", label: "Nolwazi", icon: MessageCircle },
    { id: "farm", label: "My Farm", icon: Sprout },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-primary/10 bg-card p-4 md:flex">
        <div className="mb-8">
          <img src={wordmark} alt="Imbewu" className="h-10" />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <Button
          variant="ghost"
          className="mt-auto justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:ml-64 md:pb-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-primary/10 bg-card/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <img src={wordmark} alt="Imbewu" className="h-8" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut()}
            className="text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Tab Content */}
        <div className="p-4 md:p-8">
          {activeTab === "home" && (
            <HomeTab
              profile={profile}
              stats={stats}
              greeting={greeting()}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "library" && <LibraryTab userId={session?.user.id} />}
          {activeTab === "fieldwise" && <FieldWiseTab />}
          {activeTab === "nolwazi" && <NolwaziTab />}
          {activeTab === "farm" && <FarmTab />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-primary/10 bg-card/95 px-2 py-2 backdrop-blur-sm md:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors ${
              activeTab === item.id
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ============ HOME TAB ============ */
function HomeTab({
  profile,
  stats,
  greeting,
  setActiveTab,
}: {
  profile: { display_name: string } | null;
  stats: { coursesStarted: number; coursesCompleted: number; hoursLearned: number; diagnoses: number };
  greeting: string;
  setActiveTab: (tab: TabId) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl text-foreground md:text-3xl">
          {greeting}, {profile?.display_name?.split(" ")[0] || "Grower"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your self-paced farming journey continues
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Courses Started"
          value={stats.coursesStarted}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.coursesCompleted}
          color="bg-accent/20 text-accent-foreground"
        />
        <StatCard
          icon={Clock}
          label="Hours Learned"
          value={stats.hoursLearned}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={Leaf}
          label="Diagnoses"
          value={stats.diagnoses}
          color="bg-emerald-100 text-emerald-700"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 font-display text-lg text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveTab("library")}
            className="flex flex-col items-center gap-2 rounded-xl border border-primary/10 bg-card p-4 transition-colors hover:border-primary/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">Browse Courses</span>
          </button>
          <button
            onClick={() => setActiveTab("fieldwise")}
            className="flex flex-col items-center gap-2 rounded-xl border border-primary/10 bg-card p-4 transition-colors hover:border-primary/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Camera className="h-6 w-6 text-emerald-700" />
            </div>
            <span className="text-sm font-medium text-foreground">Diagnose Plant</span>
          </button>
          <button
            onClick={() => setActiveTab("nolwazi")}
            className="flex flex-col items-center gap-2 rounded-xl border border-primary/10 bg-card p-4 transition-colors hover:border-primary/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Sparkles className="h-6 w-6 text-amber-700" />
            </div>
            <span className="text-sm font-medium text-foreground">Ask Nolwazi</span>
          </button>
          <button
            onClick={() => setActiveTab("farm")}
            className="flex flex-col items-center gap-2 rounded-xl border border-primary/10 bg-card p-4 transition-colors hover:border-primary/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sprout className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">My Farm Notes</span>
          </button>
        </div>
      </div>

      {/* Weather Widget */}
      <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <h3 className="mb-3 font-display text-lg text-foreground">Today&apos;s Conditions</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sun className="h-10 w-10 text-amber-500" />
            <div>
              <p className="text-2xl font-semibold text-foreground">24°C</p>
              <p className="text-sm text-muted-foreground">Sunny, clear skies</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span>45%</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Good</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Course */}
      <div>
        <h2 className="mb-3 font-display text-lg text-foreground">Recommended for You</h2>
        <div className="rounded-xl border border-primary/10 bg-card overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Leaf className="h-16 w-16 text-primary/40" />
          </div>
          <div className="p-4">
            <h3 className="font-display text-lg text-foreground">Organic Pest Management</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              Learn natural methods to protect your crops from common pests without harmful chemicals.
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                4 hours
              </span>
              <Button size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Start Learning
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Home;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-primary/10 bg-card p-3">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-display text-xl text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ============ LIBRARY TAB ============ */
function LibraryTab({ userId }: { userId?: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "started" | "available">("all");
  const [startedIds, setStartedIds] = useState<Set<string>>(new Set());
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    async function fetchCourses() {
      setLoadingCourses(true);
      const { data: coursesData } = await db
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      setCourses(coursesData ?? []);

      if (userId) {
        const { data: enrolments } = await db
          .from("course_enrolments")
          .select("course_id, progress")
          .eq("user_id", userId);

        const startedMap = new Map<string, number>(
          (enrolments ?? []).map((e: { course_id: string; progress: number }) => [
            e.course_id,
            e.progress,
          ] as [string, number])
        );
        setStartedIds(new Set<string>(Array.from(startedMap.keys())));
        setProgressMap(startedMap);
      }

      setLoadingCourses(false);
    }

    fetchCourses();
  }, [userId]);

  const handleStartCourse = async (courseId: string) => {
    if (!userId) return;
    await db.from("course_enrolments").insert({
      user_id: userId,
      course_id: courseId,
      progress: 0,
      completed: false,
    });
    setStartedIds((prev) => new Set(prev).add(courseId));
    setProgressMap((prev) => new Map(prev).set(courseId, 0));
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "started") return matchesSearch && startedIds.has(course.id);
    if (filter === "available") return matchesSearch && !startedIds.has(course.id);
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl text-foreground md:text-3xl">Course Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Learn at your own pace with our curated courses
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-primary/10 bg-card py-2 pl-10 pr-4 text-sm focus:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="flex rounded-lg border border-primary/10 bg-card p-1">
          {(["all", "started", "available"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loadingCourses ? (
        <div className="grid place-items-center py-12">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="grid place-items-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No courses found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredCourses.map((course) => {
            const isStarted = startedIds.has(course.id);
            const progress = progressMap.get(course.id) ?? 0;

            return (
              <div
                key={course.id}
                className="overflow-hidden rounded-xl border border-primary/10 bg-card"
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-12 w-12 text-primary/40" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg text-foreground line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {course.duration_hours}h
                    </span>
                    {isStarted ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-primary/20">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => handleStartCourse(course.id)}>
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ FIELDWISE TAB ============ */
function FieldWiseTab() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setDiagnosis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);

    // Simulated AI diagnosis
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockDiagnoses: DiagnosisResult[] = [
      {
        condition: "Powdery Mildew",
        confidence: 92,
        description:
          "A fungal disease that appears as white powdery spots on leaves and stems.",
        treatment:
          "Apply neem oil or a baking soda solution. Ensure good air circulation and avoid overhead watering.",
        severity: "medium",
      },
      {
        condition: "Nitrogen Deficiency",
        confidence: 87,
        description:
          "Yellowing of older leaves starting from the tips, indicating lack of nitrogen.",
        treatment:
          "Apply organic compost or a nitrogen-rich fertilizer. Consider planting nitrogen-fixing cover crops.",
        severity: "low",
      },
      {
        condition: "Aphid Infestation",
        confidence: 95,
        description:
          "Small green or black insects clustering on new growth and undersides of leaves.",
        treatment:
          "Spray with soapy water or introduce ladybugs. Remove heavily infested parts.",
        severity: "high",
      },
    ];

    setDiagnosis(mockDiagnoses[Math.floor(Math.random() * mockDiagnoses.length)]);
    setAnalyzing(false);
  };

  const clearDiagnosis = () => {
    setSelectedImage(null);
    setDiagnosis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const severityColors = {
    low: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    high: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl text-foreground md:text-3xl">FieldWise Diagnostics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a photo of your plant to identify issues
        </p>
      </div>

      {/* Upload Area */}
      {!selectedImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-8 transition-colors hover:border-primary/40 hover:bg-primary/10"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <p className="mb-1 font-medium text-foreground">Take or upload a photo</p>
          <p className="text-sm text-muted-foreground">Tap to capture or select from gallery</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative overflow-hidden rounded-xl border border-primary/10">
            <img
              src={selectedImage}
              alt="Plant to diagnose"
              className="w-full object-cover"
              style={{ maxHeight: "300px" }}
            />
            <button
              onClick={clearDiagnosis}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Analyze Button */}
          {!diagnosis && (
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full gap-2"
              size="lg"
            >
              {analyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Plant
                </>
              )}
            </Button>
          )}

          {/* Diagnosis Result */}
          {diagnosis && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/10 bg-card p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg text-foreground">{diagnosis.condition}</h3>
                    <p className="text-sm text-muted-foreground">
                      {diagnosis.confidence}% confidence
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${severityColors[diagnosis.severity]}`}
                  >
                    {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)} Severity
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-foreground">Description</h4>
                    <p className="text-sm text-muted-foreground">{diagnosis.description}</p>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-foreground">Recommended Treatment</h4>
                    <p className="text-sm text-muted-foreground">{diagnosis.treatment}</p>
                  </div>
                </div>
              </div>

              <Button variant="outline" onClick={clearDiagnosis} className="w-full">
                Diagnose Another Plant
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Recent Diagnoses */}
      <div>
        <h2 className="mb-3 font-display text-lg text-foreground">Recent Diagnoses</h2>
        <div className="space-y-2">
          {[
            { condition: "Tomato Blight", date: "2 days ago", severity: "high" as const },
            { condition: "Nutrient Deficiency", date: "5 days ago", severity: "low" as const },
            { condition: "Spider Mites", date: "1 week ago", severity: "medium" as const },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-primary/10 bg-card p-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    item.severity === "high"
                      ? "bg-red-100"
                      : item.severity === "medium"
                      ? "bg-amber-100"
                      : "bg-green-100"
                  }`}
                >
                  {item.severity === "high" ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : item.severity === "medium" ? (
                    <Bug className="h-4 w-4 text-amber-600" />
                  ) : (
                    <Leaf className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.condition}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ NOLWAZI TAB ============ */
function NolwaziTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Sawubona! I'm Nolwazi, your AI farming assistant. Ask me anything about crops, soil, pests, or sustainable farming practices. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const responses = [
      "That's a great question! For optimal tomato growth, ensure they receive 6-8 hours of direct sunlight daily. Water deeply but infrequently, and use mulch to retain moisture.",
      "Based on what you've described, it sounds like your soil might be lacking in nitrogen. Consider adding compost or planting nitrogen-fixing crops like beans nearby.",
      "For organic pest control, I recommend companion planting. Marigolds can deter many common pests, and basil planted near tomatoes improves their flavor and repels flies.",
      "The best time to plant in your region would be after the last frost, typically in early spring. You can start seeds indoors 6-8 weeks before transplanting.",
    ];

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responses[Math.floor(Math.random() * responses.length)],
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const suggestedQuestions = [
    "How do I improve soil quality?",
    "Best crops for beginners?",
    "How to control aphids naturally?",
    "When should I water my plants?",
  ];

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col md:h-[calc(100vh-120px)]">
      <div className="mb-4">
        <h1 className="font-display text-2xl text-foreground md:text-3xl">Nolwazi AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your intelligent farming assistant
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-primary/10 bg-card p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-foreground"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">Nolwazi</span>
                  </div>
                )}
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-primary/10 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => setInput(q)}
              className="rounded-full border border-primary/20 bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask Nolwazi a question..."
          className="flex-1 rounded-lg border border-primary/10 bg-card px-4 py-2.5 text-sm focus:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ============ FARM TAB ============ */
function FarmTab() {
  const [notes, setNotes] = useState<FarmNote[]>([
    {
      id: "1",
      title: "Tomatoes flowering",
      content: "First flowers appearing on Roma tomatoes. Applied calcium to prevent blossom end rot.",
      date: "Today",
      type: "observation",
    },
    {
      id: "2",
      title: "Watering schedule",
      content: "Switched to early morning watering to reduce evaporation.",
      date: "Yesterday",
      type: "task",
    },
    {
      id: "3",
      title: "First spinach harvest",
      content: "Harvested 2kg of baby spinach. Leaves tender and healthy.",
      date: "3 days ago",
      type: "harvest",
    },
  ]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState<{ title: string; content: string; type: "observation" | "task" | "harvest" }>({ title: "", content: "", type: "observation" });

  const handleAddNote = () => {
    if (!newNote.title.trim()) return;
    const note: FarmNote = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      date: "Just now",
      type: newNote.type,
    };
    setNotes((prev) => [note, ...prev]);
    setNewNote({ title: "", content: "", type: "observation" });
    setShowAddNote(false);
  };

  const noteTypeColors = {
    observation: "bg-blue-100 text-blue-700",
    task: "bg-amber-100 text-amber-700",
    harvest: "bg-green-100 text-green-700",
  };

  const noteTypeIcons = {
    observation: Leaf,
    task: CheckCircle,
    harvest: Sprout,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground md:text-3xl">My Farm</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your farming journey
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddNote(true)}>
          Add Note
        </Button>
      </div>

      {/* Farm Profile Card */}
      <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground">Home Garden</h3>
            <p className="text-sm text-muted-foreground">Johannesburg, Gauteng</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Growing: Tomatoes, Spinach, Peppers, Herbs
            </p>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-foreground">Add Farm Note</h3>
              <button
                onClick={() => setShowAddNote(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Note title"
                className="w-full rounded-lg border border-primary/10 bg-background px-3 py-2 text-sm focus:border-primary/30 focus:outline-none"
              />
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Details..."
                rows={3}
                className="w-full resize-none rounded-lg border border-primary/10 bg-background px-3 py-2 text-sm focus:border-primary/30 focus:outline-none"
              />
              <div className="flex gap-2">
                {(["observation", "task", "harvest"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewNote({ ...newNote, type })}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      newNote.type === type
                        ? noteTypeColors[type]
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <Button onClick={handleAddNote} className="w-full">
                Save Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div>
        <h2 className="mb-3 font-display text-lg text-foreground">Farm Notes</h2>
        <div className="space-y-3">
          {notes.map((note) => {
            const Icon = noteTypeIcons[note.type];
            return (
              <div
                key={note.id}
                className="rounded-xl border border-primary/10 bg-card p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full p-1.5 ${noteTypeColors[note.type]}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <h3 className="font-medium text-foreground">{note.title}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{note.date}</span>
                </div>
                <p className="text-sm text-muted-foreground">{note.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
