import { LucideIcon } from "lucide-react";

interface CategoryChipProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const CategoryChip = ({ icon: Icon, label, isActive, onClick }: CategoryChipProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
        isActive
          ? "gradient-hero text-primary-foreground shadow-card"
          : "bg-card text-muted-foreground hover:text-foreground shadow-card"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
};

export default CategoryChip;
