
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
import { TrialModeToggle } from "@/components/TrialModeToggle";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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

function NavLink({ href, icon: Icon, label, onClick }: { href: string; icon: React.ElementType; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-4 text-muted-foreground hover:text-foreground", isActive && "text-foreground")}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

function NavTooltipLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string; }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link
                    href={href}
                    className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8", isActive && "bg-accent text-accent-foreground")}
                >
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{label}</span>
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
}


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
    <div className="flex h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Link
          href="/home"
          className="group hidden items-center gap-2 text-lg font-semibold sm:flex"
        >
          <Image src="/media/app_logo.png" alt="ChemStock Logo" width={24} height={24} className="h-6 w-6" />
          <span className="">ChemStock</span>
        </Link>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs px-6">
            <SheetHeader className="p-0 text-left">
              <SheetTitle>
                <Link
                  href="/home"
                  className="group flex items-center gap-2 text-lg font-semibold"
                  onClick={handleNavClick}
                >
                  <Image src="/media/app_logo.png" alt="ChemStock Logo" width={24} height={24} className="h-6 w-6" />
                  <span>ChemStock</span>
                </Link>
              </SheetTitle>
            </SheetHeader>
            <Separator className="my-4" />
            <nav className="grid gap-6 text-lg font-medium">
              {navItems.map(item => <NavLink key={item.href} {...item} onClick={handleNavClick} />)}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="ml-auto flex items-center gap-2">
          <TrialModeToggle />
          <Link href="/cart">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Shopping Cart</span>
            </Button>
          </Link>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profileUrl} alt={user.displayName || "User"} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
                <DropdownMenuItem>Dashboard</DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </Link>
              <Link href="/support">
                <DropdownMenuItem>Support</DropdownMenuItem>
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
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden bg-muted/40">
        <aside className="hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <TooltipProvider>
                {navItems.map(item => <NavTooltipLink key={item.href} {...item} />)}
            </TooltipProvider>
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-4 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
