"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-around px-2 py-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1"
            >
              <div className={isActive ? "text-accent-blue" : "text-text-secondary"}>
                {item.icon}
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  isActive ? "text-accent-blue" : "text-text-secondary"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-3 h-0.5 w-8 rounded-full bg-accent-blue"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
