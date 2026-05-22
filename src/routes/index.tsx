import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sprout, GraduationCap, Users, Award, Leaf, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import wordmark from "@/assets/imbewu-wordmark.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Imbewu — Agriculture Learning, Cultivated" },
      {
        name: "description",
        content:
          "Imbewu is a luxurious agriculture learning platform for students, coordinators, and independent growers. Master modern farming through expertly crafted courses.",
      },
      { property: "og:title", content: "Imbewu — Agriculture Learning, Cultivated" },
      {
        property: "og:description",
        content: "A refined learning platform for the next generation of farmers and agronomists.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <Pillars />
      <Courses />
      <Roles />
      <Cta />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={wordmark}
            alt="Imbewu"
            width={140}
            height={42}
            className="h-10 w-auto"
          />
        </Link>
        <nav className="hidden items-center gap-10 md:flex">
          {[
            { label: "Courses", href: "#courses" },
            { label: "Approach", href: "#approach" },
            { label: "For Educators", href: "#roles" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link to="/auth">
              Begin
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative gold flourish */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-10 h-[560px] w-[560px] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-emerald)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 pb-28 pt-20 md:grid-cols-12 md:pb-36 md:pt-28">
        <div className="md:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-foreground/80">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            A refined agriculture academy
          </span>

          <h1 className="mt-8 font-display text-6xl font-medium leading-[1.02] tracking-tight text-primary md:text-7xl lg:text-8xl">
            Grow knowledge.
            <br />
            <span className="italic text-foreground/85">Cultivate</span>{" "}
            <span className="relative inline-block">
              mastery.
              <svg
                className="absolute -bottom-3 left-0 h-3 w-full text-gold"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 8 Q 50 2 100 6 T 198 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Imbewu is an agriculture learning platform built for the modern grower —
            structured courses, hands-on field work, and an AI copilot trained on
            indigenous and regenerative practices.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              size="lg"
              className="h-12 bg-primary px-7 text-primary-foreground shadow-[var(--shadow-luxe)] hover:bg-primary/90"
            >
              Explore the catalog
              <ArrowRight />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-primary/30 px-7 text-primary hover:bg-primary/5"
            >
              How Imbewu works
            </Button>
          </div>

          <dl className="mt-14 grid max-w-lg grid-cols-3 gap-8 border-t border-border/60 pt-8">
            {[
              { k: "120+", v: "Curated lessons" },
              { k: "18", v: "Provinces served" },
              { k: "4.9", v: "Learner rating" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-4xl font-medium text-primary">{s.k}</dt>
                <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Hero card stack */}
        <div className="relative md:col-span-5">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
            <div
              className="absolute inset-0 rounded-[2rem] shadow-[var(--shadow-luxe)]"
              style={{ background: "var(--gradient-emerald)" }}
            />
            <div className="absolute inset-0 flex flex-col justify-between rounded-[2rem] p-8 text-cream">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-cream/70">
                  Featured course
                </span>
                <Leaf className="h-5 w-5 text-gold" />
              </div>

              <div>
                <h3 className="font-display text-4xl font-medium leading-tight">
                  Regenerative
                  <br />
                  Soil Stewardship
                </h3>
                <p className="mt-3 text-sm text-cream/80">
                  12 lessons · Field certification · Coordinator-led
                </p>
                <div className="mt-6 h-px w-full bg-gold/60" />
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-cream/60">
                      Instructor
                    </p>
                    <p className="mt-1 font-display text-lg">Dr. N. Mthembu</p>
                  </div>
                  <button className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-primary transition-transform hover:scale-105">
                    Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Floating accent card */}
            <div className="absolute -bottom-10 -left-10 w-56 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gold/15 text-gold">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-lg text-primary">Certified</p>
                  <p className="text-xs text-muted-foreground">SAQA-aligned</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  const items = [
    {
      icon: Sprout,
      title: "Indigenous wisdom",
      body: "Lessons grounded in southern African agricultural heritage, taught with the precision of modern agronomy.",
    },
    {
      icon: BookOpen,
      title: "Structured pathways",
      body: "From seedling to harvest — each course is composed of dense, well-paced lessons with hands-on field exercises.",
    },
    {
      icon: Sparkles,
      title: "Nolwazi AI copilot",
      body: "An always-on advisor trained on regenerative practices, soil science, and crop calendars.",
    },
  ];

  return (
    <section id="approach" className="border-y border-border/60 bg-secondary/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Our approach</p>
          <h2 className="mt-4 font-display text-5xl font-medium text-primary md:text-6xl">
            Learning that takes root.
          </h2>
        </div>
        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {items.map((i) => (
            <div key={i.title} className="group">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground transition-transform group-hover:-rotate-6">
                <i.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-6 font-display text-2xl font-medium text-foreground">
                {i.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{i.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Courses() {
  const courses = [
    {
      tag: "Soil",
      title: "Regenerative Soil Stewardship",
      lessons: 12,
      level: "Intermediate",
    },
    {
      tag: "Water",
      title: "Drip Irrigation & Catchment Design",
      lessons: 9,
      level: "Beginner",
    },
    {
      tag: "Crops",
      title: "Heirloom Maize Cultivation",
      lessons: 14,
      level: "Advanced",
    },
    {
      tag: "Livestock",
      title: "Rotational Grazing Fundamentals",
      lessons: 10,
      level: "Intermediate",
    },
  ];
  return (
    <section id="courses" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Catalog</p>
            <h2 className="mt-4 font-display text-5xl font-medium text-primary md:text-6xl">
              Four seasons.
              <br />
              <span className="italic">A library that grows with you.</span>
            </h2>
          </div>
          <Button variant="ghost" className="text-primary hover:bg-primary/5">
            View all 24 courses
            <ArrowRight />
          </Button>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {courses.map((c, idx) => (
            <article
              key={c.title}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-[var(--shadow-soft)]"
            >
              <div
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform group-hover:scale-x-100"
                style={{ background: "var(--gradient-gold)" }}
              />
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                  {c.tag}
                </span>
                <span className="font-display text-2xl text-gold/70">
                  0{idx + 1}
                </span>
              </div>
              <h3 className="mt-8 font-display text-2xl font-medium leading-tight text-foreground">
                {c.title}
              </h3>
              <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4 text-xs text-muted-foreground">
                <span>{c.lessons} lessons</span>
                <span>{c.level}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roles() {
  const roles = [
    {
      icon: GraduationCap,
      title: "Students",
      body: "Follow a personal pathway from foundational soil science to advanced agronomy.",
    },
    {
      icon: Users,
      title: "Coordinators",
      body: "Manage classes, issue certificates, and track learner progress in real time.",
    },
    {
      icon: Leaf,
      title: "Independent growers",
      body: "Self-paced libraries, the Nolwazi AI copilot, and FieldWise diagnostics.",
    },
  ];
  return (
    <section
      id="roles"
      className="relative overflow-hidden py-28 text-cream"
      style={{ background: "var(--gradient-emerald)" }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">For every role</p>
          <h2 className="mt-4 font-display text-5xl font-medium md:text-6xl">
            One platform.
            <br />
            <span className="italic text-gold">Many hands in the soil.</span>
          </h2>
        </div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-gold/30 md:grid-cols-3">
          {roles.map((r) => (
            <div
              key={r.title}
              className="bg-primary/95 p-10 transition-colors hover:bg-primary/80"
            >
              <r.icon className="h-9 w-9 text-gold" />
              <h3 className="mt-8 font-display text-3xl font-medium">{r.title}</h3>
              <p className="mt-4 leading-relaxed text-cream/75">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Leaf className="mx-auto h-10 w-10 text-gold" />
        <h2 className="mt-8 font-display text-5xl font-medium leading-[1.05] text-primary md:text-7xl">
          The seed is planted.
          <br />
          <span className="italic">Now grow.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Join thousands of learners cultivating their craft with Imbewu.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            className="h-12 bg-primary px-8 shadow-[var(--shadow-luxe)] hover:bg-primary/90"
            asChild
          >
            <Link to="/auth">
              Create your account
              <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 border-primary/30 px-8 text-primary" asChild>
            <a href="#courses">Browse courses</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-10">
        <img src={wordmark} alt="Imbewu" width={120} height={36} className="h-9 w-auto" loading="lazy" />
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          © {new Date().getFullYear()} Imbewu · Cultivated in South Africa
        </p>
      </div>
    </footer>
  );
}