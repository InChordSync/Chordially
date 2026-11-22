import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Layers, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "MentoRaft",
  description: "Guided, flexible learning spaces for courses, cohorts, tutors, and students."
};

type CourseCard = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  instructor_name: string | null;
  enrollment_mode: string;
  visibility: string;
  status: string;
};

export default async function HomePage() {
  const supabase = createAdminClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id,title,slug,description,short_description,instructor_name,enrollment_mode,visibility,status")
    .eq("status", "published")
    .in("visibility", ["public", "listed"])
    .order("created_at", { ascending: false });

  const courseRows = (courses ?? []) as CourseCard[];
  const featuredCourses = courseRows.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#07101d] text-slate-100">
      <LandingNav />

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-aqua">structured learning, flexible delivery</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
            Build focused learning spaces for every course you teach.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400 md:text-lg">
            MentoRaft helps tutors run invite-only or open courses with weekly modules, lessons, quizzes, assignments, live sessions, updates, and progress tracking in one calm workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/programs" className="inline-flex items-center gap-2 rounded-md bg-aqua px-5 py-3 text-sm font-semibold text-ink">
              Explore courses <ArrowRight size={17} />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-md border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">
              Student or tutor sign in
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1525] p-4 shadow-2xl shadow-black/30">
          <div className="rounded-lg border border-aqua/20 bg-aqua/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-aqua">platform view</p>
              <span className="rounded-md bg-aqua px-2 py-1 text-xs font-semibold text-ink">Live</span>
            </div>
            <div className="mt-5 grid gap-3">
              <PreviewRow icon={<BookOpen size={18} />} title="Course pages" text="Each course gets its own public overview, curriculum, tutor details, and access route." />
              <PreviewRow icon={<Layers size={18} />} title="Week -> Module -> Lesson" text="Tutors can curate content gradually while learners move through a controlled path." />
              <PreviewRow icon={<ShieldCheck size={18} />} title="Role-based control" text="Super admins manage the platform; tutors manage only assigned courses." />
              <PreviewRow icon={<Sparkles size={18} />} title="Progress and badges" text="Track lessons, quizzes, submissions, milestones, and student wins." />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-white/10 bg-[#0b1525] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-aqua">how it works</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Feature title="Create the course" text="Set the title, audience, tutor, visibility, and whether students can self-enroll or need an invite." />
            <Feature title="Build the learning path" text="Add weeks, modules, lessons, quizzes, assignments, resources, and live session details." />
            <Feature title="Guide the cohort" text="Send updates, answer questions, host chatrooms, review submissions, and track progress." />
          </div>
        </div>
      </section>

      <section id="courses" className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-aqua">courses</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Available learning spaces</h2>
          </div>
          <Link href="/login" className="text-sm font-semibold text-aqua hover:underline">Already enrolled?</Link>
        </div>

        {featuredCourses.length ? (
          <>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featuredCourses.map((course) => (
              <Link key={course.id} href={`/programs/${course.slug}`} className="group rounded-lg border border-white/10 bg-[#0b1525] p-5 transition hover:border-aqua/50 hover:bg-[#0e1a2d]">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid size-11 place-items-center rounded-lg bg-aqua/10 text-aqua">
                    <BookOpen size={21} />
                  </div>
                  <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-400">{course.enrollment_mode.replace("_", " ")}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{course.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{course.short_description || course.description}</p>
                {course.instructor_name ? <p className="mt-4 text-xs text-slate-500">Tutor: {course.instructor_name}</p> : null}
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-aqua">
                  View course <ArrowRight className="transition group-hover:translate-x-1" size={16} />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/programs" className="inline-flex items-center gap-2 rounded-md border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">
              See all courses <ArrowRight size={16} />
            </Link>
          </div>
          </>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-white/15 bg-[#0b1525] p-8 text-center">
            <UsersRound className="mx-auto text-aqua" size={28} />
            <h3 className="mt-4 text-lg font-semibold text-white">No public courses yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Once a course is published and marked public/listed, it will appear here automatically.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function PreviewRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#07101d] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-aqua">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#07101d] p-5">
      <CheckCircle2 className="text-aqua" size={21} />
      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
