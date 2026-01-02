import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Settings as SettingsIcon, Bell, Save, Calendar, Clock, Quote, Plus, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getRandomQuote } from "@shared/quotes";
import { useLocation } from "wouter";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Settings() {
  const [, setLocation] = useLocation();
  const [quote] = useState(() => getRandomQuote());

  const { data: cycles } = trpc.cycle.list.useQuery();
  const activeCycle = cycles?.find(c => c.status === 'active') || cycles?.[0];

  const { data: reminder, isLoading } = trpc.reminder.get.useQuery();

  const [dailyReminderTime, setDailyReminderTime] = useState("20:00");
  const [weeklyReviewDay, setWeeklyReviewDay] = useState("0");
  const [weeklyReviewTime, setWeeklyReviewTime] = useState("18:00");
  const [enableDailyReminders, setEnableDailyReminders] = useState(true);
  const [enableWeeklyReminders, setEnableWeeklyReminders] = useState(true);

  const upsertReminder = trpc.reminder.upsert.useMutation();
  const createCycle = trpc.cycle.create.useMutation();
  const testNotification = trpc.notification.testNotification.useMutation();
  const utils = trpc.useUtils();

  const handleTestNotification = async () => {
    try {
      const result = await testNotification.mutateAsync();
      if (result.success) {
        toast.success("Test notification sent! Check your notifications.");
      } else {
        toast.error("Notification service unavailable. Please try again later.");
      }
    } catch (error) {
      toast.error("Failed to send test notification");
    }
  };

  useEffect(() => {
    if (reminder) {
      setDailyReminderTime(reminder.dailyReminderTime || "20:00");
      setWeeklyReviewDay(reminder.weeklyReviewDay?.toString() || "0");
      setWeeklyReviewTime(reminder.weeklyReviewTime || "18:00");
      setEnableDailyReminders(reminder.enableDailyReminders ?? true);
      setEnableWeeklyReminders(reminder.enableWeeklyReminders ?? true);
    }
  }, [reminder]);

  const handleSave = async () => {
    try {
      await upsertReminder.mutateAsync({
        dailyReminderTime,
        weeklyReviewDay: parseInt(weeklyReviewDay),
        weeklyReviewTime,
        enableDailyReminders,
        enableWeeklyReminders,
      });
      utils.reminder.get.invalidate();
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleCreateNewCycle = async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84); // 12 weeks

    try {
      await createCycle.mutateAsync({
        title: `12-Week Cycle - ${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
        startDate,
        endDate,
      });
      utils.cycle.list.invalidate();
      toast.success("New cycle created!");
      setLocation("/checklist");
    } catch (error) {
      toast.error("Failed to create cycle");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <SettingsIcon className="h-7 w-7 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure your reminders and preferences
            </p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={upsertReminder.isPending}
            className="gradient-primary text-primary-foreground"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>

        {/* Quote Card */}
        <div className="quote-card">
          <Quote className="h-5 w-5 text-primary/40 mb-2" />
          <p className="text-sm italic text-foreground/90">"{quote.text}"</p>
          <p className="text-xs text-primary mt-2">— {quote.chapter}</p>
        </div>

        {/* Cycle Management */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Cycle Management
            </CardTitle>
            <CardDescription>
              Manage your 12-week cycles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCycle ? (
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{activeCycle.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: <span className="capitalize">{activeCycle.status}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activeCycle.startDate).toLocaleDateString()} - {new Date(activeCycle.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Week</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.min(
                        Math.max(1, Math.ceil((Date.now() - new Date(activeCycle.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))),
                        12
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No active cycle</p>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleCreateNewCycle}
              disabled={createCycle.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Cycle
            </Button>
          </CardContent>
        </Card>

        {/* Daily Reminders */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Daily Reminders
            </CardTitle>
            <CardDescription>
              Get reminded to update your scorecard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Enable Daily Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Receive a daily reminder to update your scorecard
                </p>
              </div>
              <Switch
                checked={enableDailyReminders}
                onCheckedChange={setEnableDailyReminders}
              />
            </div>

            {enableDailyReminders && (
              <div className="space-y-2">
                <Label>Reminder Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={dailyReminderTime}
                    onChange={(e) => setDailyReminderTime(e.target.value)}
                    className="w-32 bg-input border-border"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose a time when you typically end your work day
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Review Reminders */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Review Reminders
            </CardTitle>
            <CardDescription>
              Get reminded to complete your weekly review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Enable Weekly Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly reminder for your review
                </p>
              </div>
              <Switch
                checked={enableWeeklyReminders}
                onCheckedChange={setEnableWeeklyReminders}
              />
            </div>

            {enableWeeklyReminders && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Review Day</Label>
                  <Select value={weeklyReviewDay} onValueChange={setWeeklyReviewDay}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Review Time</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={weeklyReviewTime}
                      onChange={(e) => setWeeklyReviewTime(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Notifications */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Test Notifications
            </CardTitle>
            <CardDescription>
              Verify your notification settings are working
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Send Test Notification</p>
                <p className="text-sm text-muted-foreground">
                  Send a test notification to verify everything is set up correctly
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleTestNotification}
                disabled={testNotification.isPending}
              >
                {testNotification.isPending ? "Sending..." : "Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Reminder Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Set your daily reminder for the end of your work day</li>
              <li>• Schedule your weekly review on Sunday evening or Monday morning</li>
              <li>• Block 15-30 minutes for your weekly review</li>
              <li>• Consider scheduling your WAM right after your weekly review</li>
              <li>• Consistency is key - same time, same day, every week</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
