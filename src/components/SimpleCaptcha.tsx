import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SimpleCaptchaProps {
  onVerify: (isValid: boolean) => void;
}

export function SimpleCaptcha({ onVerify }: SimpleCaptchaProps) {
  const [captchaText, setCaptchaText] = useState("");
  const [userInput, setUserInput] = useState("");

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput("");
    onVerify(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (userInput.length === 6) {
      const isValid = userInput === captchaText;
      onVerify(isValid);
    } else {
      onVerify(false);
    }
  }, [userInput, captchaText]);

  return (
    <div className="space-y-2">
      <Label>Verification Code</Label>
      <div className="flex gap-2">
        <div className="flex-1 glass rounded-lg p-4 flex items-center justify-center border border-primary/20">
          <span
            className="font-mono text-2xl font-bold tracking-widest select-none"
            style={{
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              letterSpacing: "0.3em",
            }}
          >
            {captchaText}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={generateCaptcha}
          title="Generate new code"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        value={userInput}
        onChange={(e) => setUserInput(e.target.value.slice(0, 6))}
        placeholder="Enter the code above"
        maxLength={6}
        className="font-mono tracking-widest uppercase"
      />
      <p className="text-xs text-muted-foreground">
        Enter the 6-character code shown above
      </p>
    </div>
  );
}
