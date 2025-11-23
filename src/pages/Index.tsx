import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { FileText, Users, Zap, Shield } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">KnowledgeHub</h1>
          </div>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
              Collaborate on Knowledge,{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Seamlessly
              </span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Build your team's knowledge base with real-time collaboration. 
              Organize, share, and grow your collective wisdom.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="shadow-lg" onClick={() => navigate("/auth")}>
                Start for Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Work together in real-time with your team members on shared documents and workspaces.
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Experience blazing-fast performance with instant search and real-time updates.
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your data is encrypted and secure with enterprise-grade security features.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
