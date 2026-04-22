export default function RegisterLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo skeleton */}
        <div className="text-center mb-8">
          <div className="h-8 w-32 bg-[#e2e8f0] rounded-lg mx-auto animate-pulse" />
        </div>

        {/* Card skeleton */}
        <div className="bg-white rounded-3xl border border-[rgba(0,0,0,0.06)] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="h-6 w-32 bg-[#e2e8f0] rounded-lg mx-auto animate-pulse" />
          <div className="h-4 w-48 bg-[#f0f0f0] rounded-lg mx-auto animate-pulse" />

          {/* Form skeleton */}
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-[#e2e8f0] rounded animate-pulse" />
                <div className="h-12 bg-[#f0f0f0] rounded-[14px] animate-pulse" />
              </div>
            ))}
          </div>

          {/* Button skeleton */}
          <div className="h-[52px] bg-[#e2e8f0] rounded-2xl animate-pulse mt-6" />

          {/* Link skeleton */}
          <div className="h-4 w-40 bg-[#f0f0f0] rounded mx-auto animate-pulse mt-6" />
        </div>
      </div>
    </div>
  )
}
