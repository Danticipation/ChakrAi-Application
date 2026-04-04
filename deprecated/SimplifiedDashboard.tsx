import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SimplifiedDashboardProps {
  userId: number;
}

export default function SimplifiedDashboard({ userId }: SimplifiedDashboardProps) {
  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Dashboard Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white">Welcome to TraI - Your Mental Wellness Companion</p>
          <p className="text-white mt-2">User ID: {userId}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-500/20 p-4 rounded-lg">
              <h3 className="text-white font-semibold">Journal</h3>
              <p className="text-white/80 text-sm">Write your thoughts</p>
            </div>
            <div className="bg-green-500/20 p-4 rounded-lg">
              <h3 className="text-white font-semibold">Mood Tracking</h3>
              <p className="text-white/80 text-sm">Track your emotions</p>
            </div>
            <div className="bg-purple-500/20 p-4 rounded-lg">
              <h3 className="text-white font-semibold">Chat</h3>
              <p className="text-white/80 text-sm">Talk to your AI therapist</p>
            </div>
            <div className="bg-indigo-500/20 p-4 rounded-lg">
              <h3 className="text-white font-semibold">Progress</h3>
              <p className="text-white/80 text-sm">View your wellness journey</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
