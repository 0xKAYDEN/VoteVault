import { Twitter, Youtube, Twitch, Globe, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialLinksProps {
  social_discord?: string;
  social_twitter?: string;
  social_youtube?: string;
  social_twitch?: string;
  social_website?: string;
}

export function SocialLinks({
  social_discord,
  social_twitter,
  social_youtube,
  social_twitch,
  social_website,
}: SocialLinksProps) {
  const links = [
    { icon: MessageCircle, url: social_discord, label: "Discord", color: "hover:text-[#5865F2]" },
    { icon: Twitter, url: social_twitter, label: "Twitter", color: "hover:text-[#1DA1F2]" },
    { icon: Youtube, url: social_youtube, label: "YouTube", color: "hover:text-[#FF0000]" },
    { icon: Twitch, url: social_twitch, label: "Twitch", color: "hover:text-[#9146FF]" },
    { icon: Globe, url: social_website, label: "Website", color: "hover:text-primary" },
  ].filter((link) => link.url);

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {links.map((link) => {
        const Icon = link.icon;
        const isFullUrl = link.url?.startsWith("http://") || link.url?.startsWith("https://");
        const href = isFullUrl ? link.url : `https://${link.url}`;

        return (
          <Button
            key={link.label}
            variant="ghost"
            size="icon"
            asChild
            className={`h-9 w-9 ${link.color}`}
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
            >
              <Icon className="h-4 w-4" />
            </a>
          </Button>
        );
      })}
    </div>
  );
}
