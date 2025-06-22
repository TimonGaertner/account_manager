"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon, BriefcaseBusinessIcon, UsersIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "Workflow Stages", icon: BriefcaseBusinessIcon },
    { href: "/contacts", label: "All Contacts", icon: UsersIcon },
];

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 hidden md:flex px-8">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <BriefcaseBusinessIcon className="h-6 w-6" />
                        <span className="font-bold">Account Manager</span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    pathname === item.href
                                        ? "text-foreground"
                                        : "text-foreground/60"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    {/* Placeholder for future theme toggle or user menu */}
                </div>
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MenuIcon className="h-6 w-6" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <Link
                                href="/"
                                className="flex items-center space-x-2 mb-6"
                            >
                                <BriefcaseBusinessIcon className="h-6 w-6" />
                                <span className="font-bold">
                                    Account Manager
                                </span>
                            </Link>
                            <nav className="flex flex-col space-y-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "transition-colors hover:text-foreground/80 text-lg",
                                            pathname === item.href
                                                ? "text-foreground font-semibold"
                                                : "text-foreground/60"
                                        )}
                                    >
                                        <item.icon className="inline-block mr-2 h-5 w-5" />
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
