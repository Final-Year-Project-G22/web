import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* NAV */}
      <div className="flex justify-between items-center px-10 py-4 border-b">
        <h1 className="font-semibold text-lg">The Trusted Architect</h1>
        <div className="flex gap-6 text-sm">
          <span>Contact Support</span>
          <span className="bg-muted px-3 py-1 rounded-full">EN</span>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1">
        {/* LEFT */}
        <div className="hidden md:flex w-1/2 bg-indigo-900 text-white p-16 flex-col justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-6">Empowering Ethiopian MUMEs</h1>
            <p className="text-gray-300 mb-10">Secure access to your business advisory toolkit.</p>
          </div>
          <p className="text-xs">ADISU SERATEGNA</p>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
          <div className="w-full max-w-md space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Login to your Account</h2>
              <p className="text-sm text-green-600">እንኳን ደህና መጡ</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input placeholder="name@company.com" />
              </div>

              <div>
                <div className="flex justify-between">
                  <Label>Password</Label>
                  <span className="text-xs text-blue-600 cursor-pointer">Forgot Password?</span>
                </div>
                <Input type="password" placeholder="••••••••" />
              </div>

              <Button className="w-full bg-green-700 hover:bg-green-800">Sign In →</Button>
            </div>

            <div className="flex items-center gap-3">
              <Separator />
              <span className="text-xs text-muted-foreground">OR CONTINUE WITH</span>
              <Separator />
            </div>

            <Button variant="outline" className="w-full">
              Sign in with Google
            </Button>

            <p className="text-sm text-center">
              Don't have an account? <span className="text-green-700 cursor-pointer">Sign Up</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
