import React, { useState, useEffect } from 'react';
import { Github, ArrowRight, Terminal } from 'lucide-react';

const NODES = {
  eureka:  { x: 300, y: 20,  w: 160, h: 50, label: 'eureka-server', sub: 'registry · :8761' },
  gateway: { x: 300, y: 110, w: 160, h: 50, label: 'api-gateway',   sub: 'public entry · :8080' },
  student: { x: 60,  y: 200, w: 160, h: 50, label: 'student-service', sub: 'auth · CRUD · :8081' },
  course:  { x: 540, y: 200, w: 160, h: 50, label: 'course-service',  sub: 'enrollment · :8082' },
};

function Code({ children }) {
  return <code className="font-mono text-[0.85em] bg-[#131B2E] border border-[#232E48] text-[#5EEAD4] px-1.5 py-0.5 rounded">{children}</code>;
}

const FLOW = [
  {
    id: 1,
    title: 'Client calls the gateway',
    body: <>POST <Code>/courses/enroll</Code> hits the single public port, <Code>:8080</Code>. Nothing outside the system ever talks to a service directly.</>,
    active: ['gateway'],
    lines: [],
  },
  {
    id: 2,
    title: 'Gateway routes by path',
    body: <>The path predicate matches <Code>/courses/**</Code> and resolves <Code>course-service</Code>'s current address through Eureka — no hardcoded host or port.</>,
    active: ['gateway', 'eureka', 'course'],
    lines: ['gw-eureka', 'gw-course'],
  },
  {
    id: 3,
    title: 'Course Service calls Student Service',
    body: <>Before saving anything, it asks <Code>student-service</Code> — over the network, via OpenFeign — whether the given student ID actually exists.</>,
    active: ['course', 'eureka', 'student'],
    lines: ['course-eureka', 'course-student'],
  },
  {
    id: 4,
    title: 'Found → saved. Not found → rejected.',
    body: <>A real student returns <Code>201 Created</Code>. An invalid ID returns <Code>400</Code> with a clear message — no bad data ever reaches the database.</>,
    active: ['student', 'course'],
    lines: ['course-student'],
  },
];

const STACK = [
  ['runtime', 'Java 17 · Spring Boot 3.5.13 · Spring Cloud 2025.0.0'],
  ['discovery', 'Netflix Eureka'],
  ['inter-service calls', 'OpenFeign, resolved through Eureka'],
  ['gateway', 'Spring Cloud Gateway (servlet / MVC)'],
  ['auth', 'Custom JWT + full OAuth 2.0 / OIDC, built from scratch'],
  ['persistence', 'Spring Data JPA · MySQL, one database per service'],
  ['docs', 'springdoc-openapi / Swagger UI'],
  ['deploy', 'Docker Compose (full stack) · GitHub Actions → Railway'],
];

const DEBUG = [
  {
    tag: '3 separate services',
    title: 'Spring Cloud version drift',
    body: 'Spring Initializr kept defaulting to a newer Spring Boot version than requested, which pulled in a Spring Cloud release built for a different Boot major version — surfacing as an unrelated-looking ClassNotFoundException deep in Spring internals, not a clear version error.',
    fix: 'Pinned Spring Boot 3.5.13 and Spring Cloud 2025.0.0 explicitly in every service\'s pom.xml, and started checking the generated parent version before writing any code.',
  },
  {
    tag: 'runtime only',
    title: 'A cast that compiled, then crashed',
    body: '(Course) Map.of(...) satisfied the compiler for a method returning ResponseEntity<Course>, then threw a ClassCastException the moment an error branch actually executed.',
    fix: 'Changed the return type to ResponseEntity<?> and removed the fake cast — the compiler catches this correctly once the signature is honest.',
  },
  {
    tag: 'path drift',
    title: 'A working endpoint that quietly moved',
    body: 'A cross-service call kept failing with a generic 500. The real cause: an earlier API cleanup had renamed the route it depended on.',
    fix: 'Traced it by testing the target service directly in Postman, bypassing the service-to-service call entirely — isolated the bug to a stale path in one request.',
  },
  {
    tag: 'security',
    title: 'A credential that shouldn\'t have shipped',
    body: 'A real database password was sitting in a public repo\'s config file, committed alongside everything else.',
    fix: 'Rotated the password immediately, moved secrets to environment variables, and excluded .env from version control going forward.',
  },
];

function edgePath(id) {
  switch (id) {
    case 'gw-eureka':   return 'M380,110 L380,70';
    case 'gw-course':   return 'M460,150 L620,150 L620,200';
    case 'course-eureka': return 'M620,200 L620,150 L460,150 L460,45 L460,45';
    case 'course-student': return 'M540,225 L260,225';
    default: return '';
  }
}

export default function App() {
  const [step, setStep] = useState(0);
  const [openDebug, setOpenDebug] = useState(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 150);
    return () => clearTimeout(t);
  }, []);

  const activeSet = new Set(FLOW[step].active);
  const activeLines = new Set(FLOW[step].lines);

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E7ECF3]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-[#0B1220]/85 backdrop-blur border-b border-[#232E48]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-display font-semibold text-[1.05rem]">
            student<span className="text-[#5EEAD4]">·</span>management
          </div>
          <div className="hidden sm:flex gap-7 text-sm text-[#8892A6]">
            <a href="#flow" className="hover:text-[#E7ECF3]">How it works</a>
            <a href="#stack" className="hover:text-[#E7ECF3]">Stack</a>
            <a href="#debugging" className="hover:text-[#E7ECF3]">Debugging</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="border-b border-[#232E48] pt-20 pb-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="font-mono text-[0.82rem] text-[#5EEAD4] mb-4">
            4 services · service discovery · single gateway
          </div>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.08] max-w-xl mb-5">
            A monolith, split into a working microservices system
          </h1>
          <p className="max-w-xl text-[#8892A6] text-base sm:text-lg mb-8">
            Student record management, rebuilt as four independently deployable services — with real service discovery, cross-service validation over the network, and one public entry point.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="https://github.com/poojadeep45/student-management-microservices" className="inline-flex items-center gap-2 bg-[#5EEAD4] text-[#08131B] px-5 py-2.5 rounded-md text-sm font-medium hover:-translate-y-px transition-transform">
              <Github size={16} strokeWidth={2} /> View on GitHub
            </a>
            <a href="#flow" className="inline-flex items-center gap-2 border border-[#232E48] px-5 py-2.5 rounded-md text-sm font-medium hover:border-[#5EEAD4] transition-colors">
              See the request flow <ArrowRight size={15} />
            </a>
          </div>

          {/* Diagram */}
          <div className="mt-12 bg-[#131B2E] border border-[#232E48] rounded-xl p-6">
            <svg viewBox="0 0 780 280" className="w-full h-auto">
              {Object.entries(NODES).map(([key, n]) => {
                const on = activeSet.has(key);
                return (
                  <g key={key} className="transition-opacity duration-300" opacity={step === 0 && key !== 'gateway' ? 0.35 : (on ? 1 : 0.35)}>
                    <rect
                      x={n.x} y={n.y} width={n.w} height={n.h} rx="6"
                      fill="#0F1930"
                      stroke={on ? '#5EEAD4' : '#232E48'}
                      strokeWidth="1.3"
                    />
                    <text x={n.x + n.w/2} y={n.y + 22} textAnchor="middle" className="font-mono" fontSize="12" fill="#E7ECF3">{n.label}</text>
                    <text x={n.x + n.w/2} y={n.y + 38} textAnchor="middle" fontSize="10.5" fill="#8892A6">{n.sub}</text>
                  </g>
                );
              })}
              {['gw-eureka','gw-course','course-eureka','course-student'].map(id => (
                <path
                  key={id}
                  d={edgePath(id)}
                  className={`topo-line ${drawn ? 'drawn' : ''}`}
                  fill="none"
                  stroke="#5EEAD4"
                  strokeWidth="1.6"
                  opacity={activeLines.has(id) ? 1 : 0.08}
                />
              ))}
            </svg>
            <p className="text-center text-[#8892A6] text-xs mt-2">Click through the steps below to trace a request across the diagram</p>
          </div>
        </div>
      </header>

      {/* Flow */}
      <section id="flow" className="py-16 border-b border-[#232E48]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-2xl mb-2">What happens on one request</h2>
          <p className="text-[#8892A6] max-w-xl mb-10">Enrolling a student in a course touches every service — click a step to highlight it in the diagram above.</p>

          <div className="flex flex-col">
            {FLOW.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setStep(i)}
                className={`text-left grid grid-cols-[36px_1fr] gap-4 py-5 border-t first:border-t-0 border-[#232E48] transition-colors ${step === i ? 'bg-[#131B2E]/60' : ''}`}
              >
                <div className={`font-mono text-sm pt-0.5 ${step === i ? 'text-[#5EEAD4]' : 'text-[#8892A6]'}`}>
                  0{f.id}
                </div>
                <div>
                  <h3 className={`text-[0.98rem] font-semibold mb-1 ${step === i ? 'text-[#5EEAD4]' : ''}`}>{f.title}</h3>
                  <p className="text-[#8892A6] text-sm max-w-xl">{f.body}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section id="stack" className="py-16 border-b border-[#232E48]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-2xl mb-2">Stack</h2>
          <p className="text-[#8892A6] max-w-xl mb-10">Every piece chosen to stay consistent — no reactive code, no mixed Boot versions once things were sorted out.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#232E48] border border-[#232E48] rounded-lg overflow-hidden">
            {STACK.map(([k, v]) => (
              <div key={k} className="bg-[#131B2E] px-5 py-4">
                <span className="font-mono text-[0.8rem] text-[#5EEAD4] block mb-1.5">{k}</span>
                <span className="text-[#8892A6] text-sm">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Debugging */}
      <section id="debugging" className="py-16 border-b border-[#232E48]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-2xl mb-2">What actually broke</h2>
          <p className="text-[#8892A6] max-w-xl mb-10">Click any of these — the parts worth remembering weren't the tutorials, they were the failures that had nothing to do with the code being wrong.</p>

          <div>
            {DEBUG.map((d, i) => {
              const open = openDebug === i;
              return (
                <div key={i} className="border-t first:border-t-0 border-[#232E48]">
                  <button
                    onClick={() => setOpenDebug(open ? null : i)}
                    className="w-full text-left py-5 flex items-start justify-between gap-4"
                  >
                    <div>
                      <h3 className="text-[0.98rem] font-semibold mb-1 flex items-baseline gap-2.5 flex-wrap">
                        {d.title}
                        <span className="font-mono text-[0.72rem] text-[#F0B429] font-normal">{d.tag}</span>
                      </h3>
                      {!open && <p className="text-[#8892A6] text-sm max-w-xl">{d.body}</p>}
                    </div>
                    <span className={`font-mono text-[#8892A6] text-lg transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {open && (
                    <div className="pb-6 -mt-1 max-w-xl">
                      <p className="text-[#8892A6] text-sm mb-3">{d.body}</p>
                      <div className="flex gap-2.5 items-start bg-[#131B2E] border border-[#232E48] rounded-md p-3">
                        <Terminal size={14} className="text-[#5EEAD4] mt-0.5 flex-shrink-0" />
                        <p className="text-[#E7ECF3] text-sm">{d.fix}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[#8892A6]">
          <span>Built as a hands-on exercise in splitting a real system, not just wiring the tools together.</span>
          <a href="https://github.com/poojadeep45" className="text-[#E7ECF3] border-b border-[#232E48] hover:border-[#5EEAD4] transition-colors">
            github.com/poojadeep45
          </a>
        </div>
      </footer>
    </div>
  );
}