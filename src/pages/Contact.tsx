import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement actual contact form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>Contact Us — VoteVault</title>
        <meta name="description" content="Get in touch with the VoteVault team. We're here to help with any questions or concerns." />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs uppercase tracking-widest text-muted-foreground">
            <MessageSquare className="h-3 w-3 text-primary" />
            Get in touch
          </div>
          <h1 className="font-display font-bold uppercase tracking-tight text-4xl md:text-6xl mb-4">
            <span className="block text-gradient">CONTACT</span>
            <span className="block shimmer text-crimson-gradient">US</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
            Have questions or feedback? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-crimson shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Email Us</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Send us an email and we'll respond within 24 hours.
              </p>
              <a href="mailto:votevaultsupport@gmail.com" className="text-sm text-primary hover:text-primary-glow transition">
                votevaultsupport@gmail.com
              </a>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/5 border border-white/10 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Community Support</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Join our community for quick help and discussions.
              </p>
              <a href="#" className="text-sm text-primary hover:text-primary-glow transition">
                Join Discord
              </a>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="bg-white/[0.03] border-white/10 focus-visible:ring-primary/50"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  className="bg-white/[0.03] border-white/10 focus-visible:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                Subject
              </label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What's this about?"
                required
                className="bg-white/[0.03] border-white/10 focus-visible:ring-primary/50"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us more..."
                required
                rows={6}
                className="bg-white/[0.03] border-white/10 focus-visible:ring-primary/50 resize-none"
              />
            </div>

            <Button type="submit" variant="hero" size="lg" disabled={loading} className="w-full md:w-auto">
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
