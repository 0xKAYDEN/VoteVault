// Ambient floating orbs + ember particles. Pure CSS + canvas, no deps.
import { useEffect, useRef } from "react";

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 38;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -Math.random() * 0.4 - 0.1,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.5 + 0.2,
      hue: Math.random() < 0.7 ? 0 : 18,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = window.innerHeight + 10; p.x = Math.random() * window.innerWidth; }
        if (p.x < -10) p.x = window.innerWidth + 10;
        if (p.x > window.innerWidth + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.a})`;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 55%, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/Asstets/bg.png')" }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      {/* Floating Orbs */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] animate-float-orb" />
      <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-primary-deep/25 blur-[140px] animate-float-orb" style={{ animationDelay: "-6s" }} />
      <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-[hsl(15_80%_35%/0.25)] blur-[120px] animate-float-orb" style={{ animationDelay: "-12s" }} />

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-70" />
    </div>
  );
}
