import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Shield, RefreshCw, Loader2 } from "lucide-react";

type Challenge = "math" | "slider" | "click_sequence";

interface VoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: number;
  serverName: string;
  trackingParam?: string;
  onSuccess: () => void;
}

const COOLDOWN_HOURS = 12;

// Lightweight fingerprint without external deps
function fingerprint(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
  ];
  let h = 0;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(36);
}

export function VoteDialog({ open, onOpenChange, serverId, serverName, trackingParam, onSuccess }: VoteDialogProps) {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge>("math");
  const [submitting, setSubmitting] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState<number | null>(null);

  // honeypot
  const honeyRef = useRef<HTMLInputElement>(null);

  // math
  const [mathQ, setMathQ] = useState({ a: 0, b: 0, op: "+" as "+" | "-" | "x" });
  const [mathAns, setMathAns] = useState("");

  // slider
  const [sliderTarget, setSliderTarget] = useState(60);
  const [sliderVal, setSliderVal] = useState([0]);

  // click sequence
  const [seq, setSeq] = useState<number[]>([]);
  const [userSeq, setUserSeq] = useState<number[]>([]);
  const [seqShowing, setSeqShowing] = useState(true);

  const newChallenge = () => {
    const choices: Challenge[] = ["math", "slider", "click_sequence"];
    const c = choices[Math.floor(Math.random() * choices.length)];
    setChallenge(c);
    if (c === "math") {
      const a = Math.floor(Math.random() * 12) + 2;
      const b = Math.floor(Math.random() * 12) + 2;
      const op = (["+", "-", "x"] as const)[Math.floor(Math.random() * 3)];
      setMathQ({ a, b, op });
      setMathAns("");
    } else if (c === "slider") {
      setSliderTarget(Math.floor(Math.random() * 60) + 30);
      setSliderVal([0]);
    } else {
      const s = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6));
      setSeq(s);
      setUserSeq([]);
      setSeqShowing(true);
      setTimeout(() => setSeqShowing(false), 2400);
    }
  };

  // Check cooldown when opening
  useEffect(() => {
    if (!open || !user) return;
    newChallenge();
    (async () => {
      try {
        const { cooldownLeft: left } = await api.votes.checkCooldown(serverId);
        setCooldownLeft(left);
      } catch (err) {
        console.error("Error checking cooldown:", err);
      }
    })();
  }, [open, user, serverId]);

  const verify = (): boolean => {
    if (honeyRef.current?.value) return false; // honeypot triggered
    if (challenge === "math") {
      const expected = mathQ.op === "+" ? mathQ.a + mathQ.b : mathQ.op === "-" ? mathQ.a - mathQ.b : mathQ.a * mathQ.b;
      return parseInt(mathAns, 10) === expected;
    }
    if (challenge === "slider") {
      return Math.abs(sliderVal[0] - sliderTarget) <= 2;
    }
    if (challenge === "click_sequence") {
      return userSeq.length === seq.length && userSeq.every((v, i) => v === seq[i]);
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("You must be signed in to vote"); return; }
    if (cooldownLeft) { toast.error("You're on cooldown for this server"); return; }
    if (!verify()) {
      toast.error("Verification failed. Try the new challenge.");
      newChallenge();
      return;
    }

    setSubmitting(true);
    const fp = fingerprint();
    try {
      await api.votes.submit({
        server_id: serverId,
        voter_fingerprint: fp,
        challenge_type_passed: challenge,
        tracking_param: trackingParam,
      });
      toast.success(`Vote recorded for ${serverName}!`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error("Vote failed: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cooldownText = useMemo(() => {
    if (!cooldownLeft) return null;
    const h = Math.floor(cooldownLeft / 3600_000);
    const m = Math.floor((cooldownLeft % 3600_000) / 60_000);
    return `${h}h ${m}m remaining`;
  }, [cooldownLeft]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verify your vote
          </DialogTitle>
          <DialogDescription>
            Voting for <span className="text-foreground font-semibold">{serverName}</span> — complete the challenge below.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Sign in to vote.</p>
            <Button variant="hero" asChild><a href="/auth">Sign In</a></Button>
          </div>
        ) : cooldownLeft ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-2">You've already voted recently.</p>
            <p className="font-mono-num text-primary text-lg">{cooldownText}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Honeypot — hidden */}
            <input ref={honeyRef} type="text" tabIndex={-1} autoComplete="off"
              className="absolute opacity-0 pointer-events-none h-0 w-0" aria-hidden />

            {challenge === "math" && (
              <div className="glass rounded-lg p-5 text-center">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Solve</div>
                <div className="font-display text-3xl font-bold mb-3 font-mono-num">
                  {mathQ.a} {mathQ.op} {mathQ.b} = ?
                </div>
                <Input
                  type="number" inputMode="numeric"
                  value={mathAns} onChange={(e) => setMathAns(e.target.value)}
                  placeholder="Your answer"
                  className="text-center font-mono-num text-lg max-w-[160px] mx-auto"
                />
              </div>
            )}

            {challenge === "slider" && (
              <div className="glass rounded-lg p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">
                  Drag the slider to <span className="text-primary font-bold font-mono-num">{sliderTarget}</span>
                </div>
                <Slider value={sliderVal} onValueChange={setSliderVal} min={0} max={100} step={1} />
                <div className="text-center mt-2 font-mono-num text-lg">{sliderVal[0]}</div>
              </div>
            )}

            {challenge === "click_sequence" && (
              <div className="glass rounded-lg p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">
                  {seqShowing ? "Memorize this order" : "Click the dots in the same order"}
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const idx = seq.indexOf(i);
                    const highlight = seqShowing && idx >= 0;
                    const clicked = userSeq.includes(i);
                    return (
                      <button
                        key={i}
                        disabled={seqShowing}
                        onClick={() => !clicked && setUserSeq([...userSeq, i])}
                        className={`aspect-square rounded-lg border transition-all text-xs font-mono-num
                          ${highlight ? "bg-primary border-primary/60 text-white scale-105" :
                            clicked ? "bg-primary/40 border-primary/50" :
                            "bg-white/5 border-white/10 hover:bg-white/10"}`}
                      >
                        {highlight ? idx + 1 : clicked ? userSeq.indexOf(i) + 1 : ""}
                      </button>
                    );
                  })}
                </div>
                <div className="text-center mt-2 text-xs text-muted-foreground">
                  {userSeq.length}/{seq.length}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={newChallenge} className="shrink-0">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="vote" className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Vote"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
