import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Users, Plus, Mail, Calendar, Clock, Trash2, Quote, UserPlus, Share2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getRandomQuote } from "@shared/quotes";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Partners() {
  const [quote] = useState(() => getRandomQuote("accountability"));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPartnerEmail, setNewPartnerEmail] = useState("");
  const [newPartnerName, setNewPartnerName] = useState("");
  const [shareProgress, setShareProgress] = useState(true);
  const [shareGoals, setShareGoals] = useState(true);
  const [wamDay, setWamDay] = useState("0");
  const [wamTime, setWamTime] = useState("10:00");

  const { data: partners, isLoading } = trpc.partner.list.useQuery();
  const createPartner = trpc.partner.create.useMutation();
  const deletePartner = trpc.partner.delete.useMutation();
  const utils = trpc.useUtils();

  const handleAddPartner = async () => {
    if (!newPartnerEmail) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      await createPartner.mutateAsync({
        partnerEmail: newPartnerEmail,
        partnerName: newPartnerName || undefined,
        shareProgress,
        shareGoals,
        wamDay: parseInt(wamDay),
        wamTime,
      });
      utils.partner.list.invalidate();
      setIsAddDialogOpen(false);
      setNewPartnerEmail("");
      setNewPartnerName("");
      toast.success("Accountability partner invited!");
    } catch (error) {
      toast.error("Failed to add partner");
    }
  };

  const handleDeletePartner = async (id: number) => {
    try {
      await deletePartner.mutateAsync({ id });
      utils.partner.list.invalidate();
      toast.success("Partner removed");
    } catch (error) {
      toast.error("Failed to remove partner");
    }
  };

  return (
    <AppLayout currentPage="partners">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Users className="h-7 w-7 text-primary" />
              Accountability Partners
            </h1>
            <p className="text-muted-foreground mt-1">
              Share your progress and hold each other accountable
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Partner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Accountability Partner</DialogTitle>
                <DialogDescription>
                  Add someone to share your progress with and schedule Weekly Accountability Meetings (WAM).
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Partner's Email</Label>
                  <Input
                    type="email"
                    placeholder="partner@example.com"
                    value={newPartnerEmail}
                    onChange={(e) => setNewPartnerEmail(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Partner's Name (optional)</Label>
                  <Input
                    placeholder="John Doe"
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="font-medium">Sharing Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Share Execution Scores</p>
                      <p className="text-xs text-muted-foreground">Let your partner see your weekly scores</p>
                    </div>
                    <Switch checked={shareProgress} onCheckedChange={setShareProgress} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Share Goals</p>
                      <p className="text-xs text-muted-foreground">Let your partner see your goal details</p>
                    </div>
                    <Switch checked={shareGoals} onCheckedChange={setShareGoals} />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="font-medium">WAM Schedule</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select value={wamDay} onValueChange={setWamDay}>
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
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={wamTime}
                        onChange={(e) => setWamTime(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddPartner}
                  disabled={createPartner.isPending}
                  className="gradient-primary text-primary-foreground"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quote Card */}
        <div className="quote-card">
          <Quote className="h-5 w-5 text-primary/40 mb-2" />
          <p className="text-sm italic text-foreground/90">"{quote.text}"</p>
          <p className="text-xs text-primary mt-2">— {quote.chapter}</p>
        </div>

        {/* About WAM */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Accountability Meeting (WAM)
            </CardTitle>
            <CardDescription>
              A powerful tool for maintaining commitment and focus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground/80">
              The WAM is a brief weekly meeting with your accountability partner where you:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                Share your execution score for the week
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                Discuss what worked and what didn't
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                Make commitments for the coming week
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                Hold each other accountable to your goals
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Partners List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Your Partners</CardTitle>
            <CardDescription>
              People you've invited to be accountability partners
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 bg-muted rounded-lg" />
                ))}
              </div>
            ) : partners && partners.length > 0 ? (
              <div className="space-y-4">
                {partners.map((partner) => (
                  <div 
                    key={partner.id}
                    className="p-4 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {partner.partnerName || partner.partnerEmail}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {partner.partnerEmail}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          partner.status === 'accepted' 
                            ? 'bg-green-500/10 text-green-500' 
                            : partner.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                        }`}>
                          {partner.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePartner(partner.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">WAM Day</p>
                        <p className="font-medium">{DAYS[partner.wamDay ?? 0]}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">WAM Time</p>
                        <p className="font-medium">{partner.wamTime || "10:00"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sharing</p>
                        <p className="font-medium">
                          {partner.shareProgress && partner.shareGoals 
                            ? "Full" 
                            : partner.shareProgress 
                              ? "Scores" 
                              : partner.shareGoals 
                                ? "Goals" 
                                : "None"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  No accountability partners yet
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Partner
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Partner Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Choose someone who is also committed to growth and accountability</li>
              <li>• Schedule your WAM at the same time each week for consistency</li>
              <li>• Keep meetings brief (15-20 minutes) and focused</li>
              <li>• Be honest about your scores and challenges</li>
              <li>• Celebrate wins together, no matter how small</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
