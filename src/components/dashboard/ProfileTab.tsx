import { Loader2, User, Phone, Mail as MailIcon, MapPin, Edit as EditIcon, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileTabProps {
  user: any;
  profile: any;
  isEditingProfile: boolean;
  isSavingProfile: boolean;
  profileFormData: {
    full_name: string;
    phone: string;
    address: string;
  };
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  onFormDataChange: (data: { full_name: string; phone: string; address: string }) => void;
}

export function ProfileTab({
  user,
  profile,
  isEditingProfile,
  isSavingProfile,
  profileFormData,
  onEditToggle,
  onSave,
  onCancel,
  onFormDataChange,
}: ProfileTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            My Profile
          </div>
          {!isEditingProfile && (
            <Button variant="outline" onClick={onEditToggle} size="sm">
              <EditIcon className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        {isEditingProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileFormData.full_name}
                  onChange={(e) => onFormDataChange({...profileFormData, full_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileFormData.phone}
                  onChange={(e) => onFormDataChange({...profileFormData, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profileFormData.address}
                onChange={(e) => onFormDataChange({...profileFormData, address: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={onSave} disabled={isSavingProfile}>
                {isSavingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{profile?.full_name || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{profile?.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MailIcon className="w-4 h-4 text-muted-foreground" />
                <span>{user?.email || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{profile?.address || 'Not set'}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
