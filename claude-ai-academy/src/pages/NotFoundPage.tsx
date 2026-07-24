import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Compass className="h-8 w-8" aria-hidden />
      </span>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="max-w-md text-muted-foreground">
          The lesson or page you're looking for doesn't exist. Try the global
          search (Ctrl+K) or head back to the start.
        </p>
      </div>
      <Button asChild>
        <Link to="/">
          <Home aria-hidden /> Back to Home
        </Link>
      </Button>
    </div>
  );
}
