
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Beaker,
  FlaskConical,
  Home,
  LineChart,
  Menu,
  User,
  ShoppingCart,
  Activity,
  Atom,
  LogOut,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/chemicals", icon: FlaskConical, label: "Chemicals" },
    { href: "/equipment", icon: Beaker, label: "Equipment" },
    { href: "/chemical-viewer", icon: Atom, label: "Viewer" },
    { href: "/activity", icon: Activity, label: "My Activity" },
    { href: "/reports", icon: LineChart, label: "Reports" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut, isAdmin } = useAuth();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load user profile image from Firestore
  useEffect(() => {
    const loadProfileImage = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileUrl(userData.profileUrl || user.photoURL || '');
        } else {
          setProfileUrl(user.photoURL || '');
        }
      } catch (error) {
        console.error('Error loading profile image:', error);
        setProfileUrl(user.photoURL || '');
      }
    };

    loadProfileImage();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleNavClick = () => setSheetOpen(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full flex-col">
        {/* Modern Navbar */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-4 sm:px-8 pl-6 sm:pl-10">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold mr-6"
          >
            <Image src="/media/app_logo.png" alt="ChemStock Logo" width={28} height={28} className="h-7 w-7" />
            <span className="hidden sm:inline-block text-lg">ChemStock</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map(item => {
              const pathname = usePathname();
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Admin Badge */}
            {isAdmin && (
              <Badge variant="outline" className="hidden sm:flex gap-1 bg-primary/10 text-primary border-primary/20">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}

            {/* Shopping Cart */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/cart">
                  <Button variant="ghost" size="icon">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">Shopping Cart</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Shopping Cart</TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profileUrl} alt={user.displayName || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem>
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <Link href="/support">
                  <DropdownMenuItem>
                    <Activity className="mr-2 h-4 w-4" />
                    Support
                  </DropdownMenuItem>
                </Link>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <Link href="/admin">
                      <DropdownMenuItem>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button size="icon" variant="ghost">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader className="text-left">
                  <SheetTitle>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 font-semibold"
                      onClick={handleNavClick}
                    >
                      <Image src="/media/app_logo.png" alt="ChemStock Logo" width={24} height={24} className="h-6 w-6" />
                      <span>ChemStock</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <Separator className="my-4" />
                <nav className="flex flex-col gap-2">
                  {navItems.map(item => {
                    const pathname = usePathname();
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive 
                            ? "bg-accent text-accent-foreground" 
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                        onClick={handleNavClick}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                {isAdmin && (
                  <>
                    <Separator className="my-4" />
                    <div className="px-3">
                      <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
                        <Shield className="h-3 w-3" />
                        Admin Access
                      </Badge>
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-muted/40">
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
    </TooltipProvider>
  );
}
