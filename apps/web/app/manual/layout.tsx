"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Receipt, 
  Wallet, 
  ShieldCheck, 
  Settings, 
  ChevronRight,
  Menu,
  X,
  Banknote,
  Coins,
  Award,
  GraduationCap,
  Network,
  Briefcase,
  Layers,
  UserCircle,
  Building2,
  Globe,
  LayoutDashboard,
  FileBadge,
  Lock,
  Palmtree,
  Timer,
  GitPullRequest,
  ClipboardList,
  CalendarCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

const sidebarItems = [
  {
    title: "Introduction",
    items: [
      { name: "Overview", href: "/manual", icon: BookOpen },
      { name: "Dashboard & Navigation", href: "/manual/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Administration",
    items: [
      { name: "User Management", href: "/manual/user-management", icon: Users },
      { name: "Organization Settings", href: "/manual/org-settings", icon: Settings },
      { name: "Pending Changes", href: "/manual/pending-changes", icon: GitPullRequest },
      { name: "Org Units", href: "/manual/org-units", icon: Network },
      { name: "Plantilla & Recruitment", href: "/manual/plantilla-recruitment", icon: ClipboardList },
      { name: "Positions", href: "/manual/positions", icon: Briefcase },
      { name: "Ranks", href: "/manual/ranks", icon: Layers },
      { name: "Policy Config", href: "/manual/policy-config", icon: Settings },
    ],
  },
  {
    title: "Employee Center",
    items: [
      { name: "My Profile", href: "/manual/my-profile", icon: UserCircle },
      { name: "My Payslips", href: "/manual/my-payslips", icon: FileBadge },
      { name: "My Learning", href: "/manual/my-learning", icon: GraduationCap },
      { name: "My Organization", href: "/manual/my-organization", icon: Building2 },
      { name: "My Team", href: "/manual/my-team", icon: LayoutDashboard },
      { name: "Account Security", href: "/manual/account-security", icon: Lock },
    ],
  },
  {
    title: "Financials",
    items: [
      { name: "Payroll", href: "/manual/payroll", icon: Banknote },
      { name: "Compensation", href: "/manual/compensation", icon: Coins },
      { name: "Expense Filing", href: "/manual/expense-filing", icon: Receipt },
      { name: "Team Budgets", href: "/manual/team-budgets", icon: Wallet },
    ],
  },
  {
    title: "Core Modules",
    items: [
      { name: "Leave Management", href: "/manual/leave-management", icon: Calendar },
    ],
  },
  {
    title: "Attendance & Operations",
    items: [
      { name: "Attendance & Timesheets", href: "/manual/attendance", icon: Timer },
      { name: "Holidays & Shifts", href: "/manual/holidays-shifts", icon: Palmtree },
    ],
  },
  {
    title: "Talent Management",
    items: [
      { name: "Skills & Talent", href: "/manual/skills", icon: Award },
      { name: "Training", href: "/manual/training", icon: GraduationCap },
    ],
  },
  {
    title: "Technical",
    items: [
      { name: "Security", href: "/manual/security", icon: ShieldCheck },
    ],
  },
];

export default function ManualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-72 flex-col border-r bg-gray-50/50 sticky top-0 h-screen">
        <div className="p-6 border-b bg-white">
          <Link href="/manual" className="flex items-center gap-2 font-bold text-xl text-blue-900">
            <div className="bg-blue-600 p-1 rounded text-white italic">H</div>
            Hybrid HRIS
          </Link>
          <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">User Manual</p>
        </div>
        <ScrollArea className="flex-1 px-4 py-6">
          <nav className="space-y-8">
            {sidebarItems.map((group) => (
              <div key={group.title} className="space-y-2">
                <h4 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {group.title}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <item.icon className={cn(
                          "w-4 h-4",
                          isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                        )} />
                        {item.name}
                        {isActive && <ChevronRight className="ml-auto w-3 h-3 text-blue-400" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
        <div className="p-4 border-t bg-white">
          <Button variant="outline" className="w-full justify-start gap-2" asChild>
            <Link href="/">
              <Menu className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b bg-white flex items-center justify-between px-4 z-50">
        <Link href="/manual" className="font-bold text-blue-900 flex items-center gap-2">
          <div className="bg-blue-600 px-1.5 py-0.5 rounded text-white text-xs italic">H</div>
          Manual
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out border-r",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <ScrollArea className="h-full px-4 py-20">
          <nav className="space-y-8">
            {sidebarItems.map((group) => (
              <div key={group.title} className="space-y-2">
                <h4 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {group.title}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg",
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full pt-16 lg:pt-0">
        <div className="max-w-4xl mx-auto px-6 py-10 lg:py-16">
          {children}
        </div>
      </main>
    </div>
  );
}
