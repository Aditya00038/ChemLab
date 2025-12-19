"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ListChecks, ShoppingCart, Target, Beaker, User } from "lucide-react";
import { AnimatedGrid } from "@/components/animated-grid";
import { FloatingIcons } from "@/components/floating-icons";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const dashboardImage = PlaceHolderImages.find(p => p.id === 'dashboard-image');
  const labEquipmentImage = PlaceHolderImages.find(p => p.id === 'lab-equipment-image');
  const shoppingCartImage = PlaceHolderImages.find(p => p.id === 'shopping-cart-image');

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null;
  }


  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-dvh flex items-center justify-center text-center overflow-hidden">
          <AnimatedGrid />
          <FloatingIcons />
          {/* Top-right Login button - visible on home page only */}
          <div className="absolute top-6 right-6 z-30 block">
            <Button
              asChild
              size="sm"
              variant="default"
              className="rounded-md px-4 py-2 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all"
            >
              <Link href="/login" aria-label="Login to ChemStock" className="flex items-center gap-2 text-white">
                <span className="text-sm font-medium">Login</span>
              </Link>
            </Button>
          </div>
          <div className="z-20 space-y-6 px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-foreground">
              Modern Lab Inventory,
              <br />
              Perfectly Managed.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto text-muted-foreground">
              ChemStock is the all-in-one solution for real-time tracking,
              seamless checkouts, and smart reporting in your laboratory.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg" className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105">
                <Link href="/login">Get Started for Free</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Target, title: "Real-Time Tracking", description: "Know exactly what you have in stock, down to the last milliliter or gram." },
                { icon: Beaker, title: "Effortless Equipment Checkout", description: "Log check-outs and returns in seconds, maintaining full accountability." },
                { icon: ShoppingCart, title: "Automated Reordering", description: "Get low-stock alerts and generate purchase orders with a single click." },
                { icon: ListChecks, title: "Insightful Reporting", description: "Generate detailed usage and inventory reports for audits and planning." },
              ].map((feature, index) => (
                 <div key={index} className="group flex flex-col items-center text-center gap-4 p-6 rounded-lg border bg-card hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Alternating Feature Spotlights */}
        <div className="space-y-16 md:space-y-24 py-16 md:py-24 bg-muted/40 dark:bg-transparent">
           <div className="container mx-auto px-4 md:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-4 text-center lg:text-left">
                  <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Inventory At a Glance</div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">A Dashboard That Works For You</h2>
                  <p className="text-muted-foreground text-lg">
                    Stop wasting time with manual inventory checks. Our intuitive dashboard gives you a complete overview of your lab's assets, highlighting low-stock items so you can take action before you run out.
                  </p>
                </div>
                <div className="aspect-video overflow-hidden rounded-xl shadow-lg border hover:shadow-2xl transition-shadow">
                  {dashboardImage && <Image
                    alt="ChemStock Dashboard"
                    src={dashboardImage.imageUrl}
                    width={1280}
                    height={720}
                    className="w-full h-full object-cover"
                    data-ai-hint={dashboardImage.imageHint}
                  />}
                </div>
              </div>
            </div>
            
            <div className="container mx-auto px-4 md:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-4 text-center lg:text-left">
                  <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Seamless Workflow</div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Effortless Checkout & Returns</h2>
                  <p className="text-muted-foreground text-lg">
                    Log who is using what, and when. Faculty can quickly check out equipment, and the system automatically updates availability. Returning items and reporting damages is just as simple.
                  </p>
                </div>
                 <div className="aspect-video overflow-hidden rounded-xl shadow-lg border hover:shadow-2xl transition-shadow lg:order-first">
                   {labEquipmentImage && <Image
                    alt="Equipment checkout screen"
                    src={labEquipmentImage.imageUrl}
                    width={1280}
                    height={720}
                    className="w-full h-full object-cover"
                    data-ai-hint={labEquipmentImage.imageHint}
                  />}
                </div>
              </div>
            </div>

            <div className="container mx-auto px-4 md:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-4 text-center lg:text-left">
                  <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Never Run Out</div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Automated Shopping Cart</h2>
                  <p className="text-muted-foreground text-lg">
                    ChemStock automatically identifies chemicals that are running low and adds them to a pre-populated shopping cart. Review, adjust quantities, and place orders with your preferred supplier in minutes.
                  </p>
                </div>
                <div className="aspect-video overflow-hidden rounded-xl shadow-lg border hover:shadow-2xl transition-shadow">
                  {shoppingCartImage && <Image
                    alt="ChemStock Shopping Cart"
                    src={shoppingCartImage.imageUrl}
                    width={1280}
                    height={720}
                    className="w-full h-full object-cover"
                    data-ai-hint={shoppingCartImage.imageHint}
                  />}
                </div>
              </div>
            </div>
        </div>

        {/* Final CTA */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="bg-muted dark:bg-transparent dark:border dark:border-border rounded-2xl p-8 md:p-16 text-center shadow-inner-lg">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to Modernize Your Lab?</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4 mb-8">
                Take control of your inventory, empower your team, and focus on the science that matters. Get started with ChemStock today.
              </p>
              <Button asChild size="lg" className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105">
                <Link href="/login">Get Started for Free</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted p-6 md:py-8 w-full border-t">
        <div className="container mx-auto flex items-center justify-center text-sm text-muted-foreground">
          <p>&copy; 2024 ChemStock. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
