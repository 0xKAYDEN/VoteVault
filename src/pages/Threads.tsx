import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, Plus, Search, Pin, Lock, Flame, Clock,
  Hash, HelpCircle, Megaphone, Gamepad2, Star, Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Map category slugs to lucide icons instead of emoji
const CATEGORY_ICONS: Record<string, any> = {
  general: Hash,
  "game-discussion": Gamepad2,
  "server-reviews": Star,
  "help-support": HelpCircle,
  announcements: Megaphone,
  "off-topic": Shuffle,
};

const Threads = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const category = searchParams.get("category") || "";
  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("search") || "";
  const mine = searchParams.get("mine") === "1";

  const { data: categories = [] } = useQuery({
    queryKey: ["thread-categories"],
    queryFn: () => api.threads.getCategories(),
    staleTime: 60 * 1000,
    refetchOnMount: true,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["threads", category, page, search, mine, user?.id],
    queryFn: () => api.threads.getAll({
      category: category || undefined,
      page,
      search: search || undefined,
      author: mine && user?.id ? user.id : undefined,
    }),
    staleTime: 0,
  });

  useEffect(() => { document.title = mine ? "My Threads — VoteVault" : "Community — VoteVault"; }, [mine]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(p => {
      if (searchInput) p.set("search", searchInput); else p.delete("search");
      p.set("page", "1");
      return p;
    });
  };

  const selectCategory = (slug: string) => {
    setSearchParams(p => {
      if (slug) p.set("category", slug); else p.delete("category");
      p.delete("search");
      p.set("page", "1");
      return p;
    });
    setSearchInput("");
  };

  const threads = data?.threads || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const activeCat = categories.find((c: any) => c.slug === category);

  return (
    <div className="container py-10 max-w-6xl">
      <Helmet>
        <title>Community Threads — VoteVault</title>
        <meta name="description" content="Join the VoteVault community discussion" />
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold mb-1">
            {mine ? "My Threads" : "Community"}
          </h1>
          <p className="text-muted-foreground">
            {mine ? "Threads you've started" : activeCat ? activeCat.name : "All discussions"}
          </p>
        </div>
        <div className="flex gap-2">
          {mine && (
            <Button variant="outline" onClick={() => setSearchParams({})}>
              All Threads
            </Button>
          )}
          {user && (
            <Button variant="hero" onClick={() => navigate("/threads/new")}>
              <Plus className="h-4 w-4 mr-2" /> New Thread
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-1">
          <button
            onClick={() => selectCategory("")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors",
              !category
                ? "bg-primary/15 text-primary-glow border border-primary/30"
                : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="flex-1 text-left">All Threads</span>
            {total > 0 && (
              <span className="text-xs opacity-60 font-mono tabular-nums bg-white/5 px-1.5 py-0.5 rounded">
                {total}
              </span>
            )}
          </button>

          {categories.map((cat: any) => {
            const Icon = CATEGORY_ICONS[cat.slug] || Hash;
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.slug)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  category === cat.slug
                    ? "bg-primary/15 text-primary-glow border border-primary/30"
                    : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{cat.name}</span>
                {Number(cat.thread_count) > 0 && (
                  <span className="text-xs opacity-60 font-mono tabular-nums bg-white/5 px-1.5 py-0.5 rounded">
                    {cat.thread_count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main */}
        <div className="space-y-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search threads..."
              className="flex-1"
            />
            <Button type="submit" variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  setSearchParams(p => { p.delete("search"); return p; });
                }}
              >
                Clear
              </Button>
            )}
          </form>

          {/* Thread list */}
          {isLoading || isFetching ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="glass rounded-xl h-20 shimmer" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground mb-2">
                {search ? `No threads matching "${search}"` : "No threads yet in this category."}
              </p>
              {user && (
                <Button variant="hero" className="mt-3" onClick={() => navigate("/threads/new")}>
                  <Plus className="h-4 w-4 mr-2" /> Start a Thread
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map((t: any) => {
                const CatIcon = CATEGORY_ICONS[t.category_slug] || Hash;
                return (
                  <Link
                    key={t.public_id}
                    to={`/threads/${t.public_id}`}
                    className="glass rounded-xl p-4 flex gap-4 hover:border-white/20 border border-white/5 transition-all block group"
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0 mt-0.5">
                      <AvatarImage src={t.author_avatar} />
                      <AvatarFallback>{t.author_display_name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {!!t.is_pinned && <Pin className="h-3 w-3 text-yellow-400 flex-shrink-0" />}
                        {!!t.is_locked && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                        <span className="font-semibold truncate group-hover:text-primary transition-colors">
                          {t.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <CatIcon className="h-3 w-3" />
                          {t.category_name}
                        </span>
                        <span>by {t.author_display_name || t.author_username}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(t.last_reply_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1 justify-end">
                        <MessageSquare className="h-3 w-3" />
                        {t.reply_count}
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Flame className="h-3 w-3" />
                        {t.view_count}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline" size="sm"
                disabled={page <= 1}
                onClick={() => {
                  setSearchParams(p => { p.set("page", String(page - 1)); return p; });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-3">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={page >= totalPages}
                onClick={() => {
                  setSearchParams(p => { p.set("page", String(page + 1)); return p; });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Threads;
