import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Loading States Components
 * Reusable loading indicators and skeleton loaders for consistent UX
 */

// ============================================================================
// SPINNER COMPONENTS
// ============================================================================

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Spinner = ({ size = "md", className }: SpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
  );
};

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fullScreen?: boolean;
}

export const LoadingSpinner = ({ message, size = "lg", fullScreen = false }: LoadingSpinnerProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Spinner size={size} />
      {message && <p className="text-sm text-muted-foreground animate-pulse">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{content}</div>;
};

// ============================================================================
// SKELETON LOADERS
// ============================================================================

export const ServerCardSkeleton = () => (
  <Card className="glass overflow-hidden">
    <CardHeader className="pb-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </CardContent>
  </Card>
);

export const ServerListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <ServerCardSkeleton key={i} />
    ))}
  </div>
);

export const ServerCompactSkeleton = () => (
  <Card className="glass">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    </CardContent>
  </Card>
);

export const ServerCompactGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <ServerCompactSkeleton key={i} />
    ))}
  </div>
);

export const ServerRowSkeleton = () => (
  <div className="glass rounded-lg p-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded flex-shrink-0" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-12" />
      <Skeleton className="h-6 w-12" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

export const ServerRowListSkeleton = ({ count = 10 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <ServerRowSkeleton key={i} />
    ))}
  </div>
);

export const DashboardCardSkeleton = () => (
  <Card className="glass">
    <CardHeader>
      <Skeleton className="h-5 w-1/3 mb-2" />
      <Skeleton className="h-8 w-1/2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
  </Card>
);

export const DashboardStatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <DashboardCardSkeleton key={i} />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    <div className="flex gap-4 pb-3 border-b border-white/10">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-8 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-start gap-6">
      <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <Skeleton className="h-10 w-32" />
  </div>
);

export const ChartSkeleton = () => (
  <Card className="glass">
    <CardHeader>
      <Skeleton className="h-5 w-1/3" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

// ============================================================================
// BUTTON LOADING STATES
// ============================================================================

interface ButtonLoadingProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
}

export const ButtonLoading = ({ children, isLoading, loadingText, className }: ButtonLoadingProps) => {
  if (!isLoading) return <>{children}</>;

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Spinner size="sm" />
      {loadingText || children}
    </span>
  );
};

// ============================================================================
// PAGE LOADING WRAPPER
// ============================================================================

interface PageLoadingProps {
  isLoading: boolean;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
  message?: string;
}

export const PageLoading = ({ isLoading, skeleton, children, message }: PageLoadingProps) => {
  if (!isLoading) return <>{children}</>;

  if (skeleton) return <>{skeleton}</>;

  return <LoadingSpinner message={message} size="lg" />;
};

// ============================================================================
// INLINE LOADING
// ============================================================================

interface InlineLoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const InlineLoading = ({ message, size = "sm" }: InlineLoadingProps) => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <Spinner size={size} />
    {message && <span className="text-sm">{message}</span>}
  </div>
);

// ============================================================================
// OVERLAY LOADING
// ============================================================================

interface OverlayLoadingProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const OverlayLoading = ({ isLoading, message, children }: OverlayLoadingProps) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
      </div>
    )}
  </div>
);
