// app/daily-report/loading.tsx
import Card from "./components/ui";

export default function Loading() {
    return (
        <Card>
            {/* Header Skeleton */}
            <div className="text-center mb-8 animate-pulse">
                <div className="h-9 bg-gray-200 rounded-md w-3/4 mx-auto mb-2"></div>
                <div className="h-8 bg-gray-200 rounded-md w-1/4 mx-auto"></div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4 animate-pulse mb-8">
                <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
                <div className="h-32 bg-gray-200 rounded-lg w-full"></div>
            </div>

            {/* Button Skeleton */}
            <div className="flex justify-center animate-pulse">
                <div className="h-10 bg-gray-200 rounded-md w-24"></div>
            </div>
        </Card>
    );
}