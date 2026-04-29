import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Send, Hash, Gamepad2, Star, HelpCircle, Megaphone, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<string, any> = {
  general: Hash,
  "game-discussion": Gamepad2,
  "server-reviews": Star,
  "help-support": HelpCircle,
  announcements: Megaphone,
  "off-topic": Shuffle,
};

const NewThread = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    document.title = "New Thread — VoteVault";
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const { data: categories = [] } = useQuery({
    queryKey: ["thread-categories"],
    queryFn: () => api.threads.getCategories(),
  });

  const mutation = useMutation({
    mutationFn: () => api.threads.create({ category_id: Number(categoryId), title, body }),
    onSuccess: (data) => {
      toast.success("Thread created!");
      navigate(`/threads/${data.public_id}`);
    },
    onError: (e: any) => toast.error(e.message || "Failed to create thread"),
  });

  const canSubmit = title.trim().length >= 3 && body.trim().length >= 10 && categoryId;

  return (
    <div className="container py-10 max-w-3xl">
      <Helmet><title>New Thread — VoteVault</title></Helmet>

      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/threads"><ArrowLeft className="h-4 w-4 mr-2" />Back to Threads</Link>
      </Button>

      <div className="glass rounded-2xl p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold mb-6">Start a New Thread</h1>

        <div className="space-y-5">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => {
                  const Icon = CATEGORY_ICONS[c.slug] || Hash;
                  return (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={255}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{title.length}/255</p>
          </div>

          <div>
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Share your thoughts in detail..."
              rows={8}
              maxLength={20000}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{body.length}/20000</p>
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            variant="hero"
            size="lg"
            className="w-full"
          >
            {mutation.isPending ? "Posting..." : <><Send className="h-4 w-4 mr-2" />Post Thread</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewThread;
