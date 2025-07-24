import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { User, Mail, Calendar, Building, Edit, Save, X, Camera, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { profileValidationSchema, sanitizeText } from '@/lib/security';
export default function Profile() {
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const {
        data: profile
      } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
      if (profile) {
        setFullName(profile.full_name || '');
        setAvatarUrl(profile.avatar_url || '');
      }
    };
    fetchProfile();
  }, [user]);
  const handleSignOut = async () => {
    await signOut();
  };
  const handleSaveProfile = async () => {
    if (!user) return;

    // Validate and sanitize input
    const validation = profileValidationSchema.safeParse({
      full_name: fullName.trim()
    });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0]?.message || "Invalid name",
        variant: "destructive"
      });
      return;
    }
    const sanitizedName = sanitizeText(validation.data.full_name);
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: sanitizedName
      });
      if (error) throw error;
      setFullName(sanitizedName);
      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your name has been updated successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original value
    const originalName = user?.user_metadata?.full_name || '';
    setFullName(originalName);
  };
  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(fileName, file, {
        upsert: true
      });
      if (uploadError) throw uploadError;
      const {
        data
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const {
        error: updateError
      } = await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: data.publicUrl
      });
      if (updateError) throw updateError;
      setAvatarUrl(data.publicUrl);
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };
  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadAvatar(file);
      }
    };
    input.click();
  };
  const handleGalleryUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadAvatar(file);
      }
    };
    input.click();
  };
  return <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div className="relative group cursor-pointer">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={avatarUrl || user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-2xl">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    {isUploadingAvatar && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>}
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Update Profile Picture</AlertDialogTitle>
                    <AlertDialogDescription>
                      Choose how you'd like to update your profile picture.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCameraCapture} className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Take Photo
                    </AlertDialogAction>
                    <AlertDialogAction onClick={handleGalleryUpload} className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload from Gallery
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <CardTitle className="text-xl">
              {user?.user_metadata?.full_name || 'Worker'}
            </CardTitle>
            <Badge variant="secondary" className="mx-auto">
              Construction Worker
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Editable Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              {isEditing ? <div className="flex gap-2">
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" className="flex-1" />
                  <Button size="sm" onClick={handleSaveProfile} disabled={isLoading}>
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </div> : <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="text-foreground">{fullName || 'No name set'}</span>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>}
            </div>
            
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(user?.created_at || '').toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Building className="w-4 h-4" />
              <span>NextGenHome</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => setIsEditing(true)}>
              <User className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="destructive" onClick={handleSignOut} className="w-full justify-start">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>;
}