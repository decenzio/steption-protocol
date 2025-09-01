import HeaderApp from "@/app/components/HeaderApp";
import WelcomeSection from "@/app/components/WelcomeSection";
import DashboardGrid from "@/app/components/DashboardGrid";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #eff6ff, #fff7ed)' }}>
      <HeaderApp />
      
      {/* Demo Warning Banner */}
      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mx-4 mt-4 rounded-r-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-orange-700 font-semibold">
              ⚠️ This is just a demo - Not a live trading platform
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <WelcomeSection />
        <DashboardGrid />
      </main>
    </div>
  )
}