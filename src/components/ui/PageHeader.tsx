import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "./Breadcrumb";
import { ReactNode } from "react";
import { useToastContext } from "../../contexts/ToastContext";

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  backPath?: string;
  onBack?: () => void;
  showShare?: boolean;
  shareUrl?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
  backPath,
  onBack,
  showShare = false,
  shareUrl,
  actions,
  className = "",
}: PageHeaderProps) => {
  const navigate = useNavigate();
  const { showToast } = useToastContext();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  const handleShare = async () => {
    const url = shareUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!", "success");
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  return (
    <div className={`golf-hero-bg safe-area-top ${className}`}>
      <div className="p-4 md:p-6 w-full max-w-6xl mx-auto">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {(backPath || onBack) && (
              <button
                onClick={handleBack}
                className="nav-back flex-shrink-0 mt-1"
                aria-label="Go back"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-emerald-100 text-sm md:text-base line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {showShare && (
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-white px-3 py-2.5 min-h-[44px] min-w-[44px] rounded-xl font-medium transition-all text-sm outline-none"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
                aria-label="Share tournament"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
};
