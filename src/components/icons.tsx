import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8.5 2h7" />
      <path d="M6 22h12" />
      <path d="M12 2v2.34" />
      <path d="M12 11.66V22" />
      <path d="m6 12 1.25-1.25a2.83 2.83 0 0 1 4-4L12 6l.75.75a2.83 2.83 0 0 1 4 4L18 12" />
    </svg>
  );
}
