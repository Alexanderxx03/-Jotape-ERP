import React from 'react';

interface JotaPeLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export default function JotaPeLogo({ className, ...props }: JotaPeLogoProps) {
  return (
    <svg
      viewBox="0 0 460 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible" }}
      {...props}
    >
      <defs>
        {/* Gradients to exactly match the 3D aesthetic of the original brand image */}
        <linearGradient id="grad-A" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4bc0ff" />
          <stop offset="100%" stopColor="#21A2FF" />
        </linearGradient>
        <linearGradient id="grad-P" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e830a7" />
          <stop offset="100%" stopColor="#D41C95" />
        </linearGradient>
        <linearGradient id="grad-E" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff4b2b" />
          <stop offset="100%" stopColor="#E00B21" />
        </linearGradient>
      </defs>

      {/* 
        Using Lilita One font via CSS variable defined in layout.tsx.
        Vector text allows perfect stroke scaling, gradients, and prevents cutting.
      */}
      <g 
        style={{ fontFamily: 'var(--font-lilita), system-ui, sans-serif', fontSize: '110px' }} 
        stroke="#ffffff" 
        strokeWidth="6"
        strokeLinejoin="round"
        className="drop-shadow-[0_6px_0_rgba(0,0,0,0.15)] dark:drop-shadow-[0_6px_0_rgba(255,255,255,0.05)]"
      >
        {/* JOTA */}
        <text x="10" y="110" fill="#FFE600" transform="rotate(-6 10 110)">J</text>
        <text x="65" y="110" fill="#FF8B00" transform="rotate(2 65 110)">O</text>
        <text x="145" y="110" fill="#86CB2D" transform="rotate(-3 145 110)">T</text>
        <text x="215" y="110" fill="url(#grad-A)" transform="rotate(4 215 110)">A</text>
        
        {/* PE */}
        <text x="315" y="110" fill="url(#grad-P)" transform="rotate(-5 315 110)">P</text>
        <text x="385" y="110" fill="url(#grad-E)" transform="rotate(-2 385 110)">E</text>
      </g>
    </svg>
  );
}
