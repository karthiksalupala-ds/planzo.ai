const DestinationCardSkeleton = () => {
  return (
    <div className="rounded-2xl bg-card shadow-card overflow-hidden animate-pulse">
      <div className="h-40 bg-muted/60" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-2/3 bg-muted/60 rounded" />
        <div className="h-3 w-1/2 bg-muted/50 rounded" />
        <div className="h-3 w-full bg-muted/50 rounded" />
        <div className="h-3 w-5/6 bg-muted/50 rounded" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 w-16 bg-muted/60 rounded" />
          <div className="h-3 w-20 bg-muted/50 rounded" />
        </div>
      </div>
    </div>
  );
};

export default DestinationCardSkeleton;
