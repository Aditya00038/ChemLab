import { Beaker, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingIcons() {
  return (
    <>
      <Beaker className={cn(
        "absolute top-[10%] left-[5%] h-16 w-16 text-primary/10",
        "animate-[float-up-down_8s_ease-in-out_infinite]"
      )} />
      <FlaskConical className={cn(
        "absolute top-[20%] right-[10%] h-24 w-24 text-primary/10",
        "animate-[float-up-down_12s_ease-in-out_infinite]"
      )} />
      <Beaker className={cn(
        "absolute bottom-[15%] right-[20%] h-12 w-12 text-primary/10",
        "animate-[float-up-down_10s_ease-in-out_infinite]"
      )} />
       <FlaskConical className={cn(
        "absolute bottom-[5%] left-[15%] h-20 w-20 text-primary/10",
        "animate-[float-up-down_9s_ease-in-out_infinite]"
      )} />
    </>
  );
}