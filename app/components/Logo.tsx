interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-12 h-12" }: LogoProps) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <img 
        src="/steptionsLogo.png" 
        alt="STEPTIONS Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  )
}