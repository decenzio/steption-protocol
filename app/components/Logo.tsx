interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-12 h-12" }: LogoProps) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <img 
        src="/logo.png" 
        alt="STEPTION PROTOCOL Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  )
}