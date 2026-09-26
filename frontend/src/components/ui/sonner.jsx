import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-800 group-[.toaster]:border group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:pointer-events-auto",
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold",
          description: "group-[.toast]:text-slate-500",
          actionButton:
            "group-[.toast]:bg-[#ff6d00] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600",
          success: "group-[.toaster]:border-emerald-200 group-[.toaster]:bg-emerald-50",
          error: "group-[.toaster]:border-rose-200 group-[.toaster]:bg-rose-50",
          warning: "group-[.toaster]:border-amber-200 group-[.toaster]:bg-amber-50",
          info: "group-[.toaster]:border-sky-200 group-[.toaster]:bg-sky-50",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }
