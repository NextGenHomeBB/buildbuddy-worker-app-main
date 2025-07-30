import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ImageCropper } from '@/components/ImageCropper';
import { User, Mail, Calendar, Building, Edit, Save, X, Camera, Upload, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { profileValidationSchema, sanitizeText } from '@/lib/security';
import { useAuth } from '@/contexts/AuthContext';
export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Construction Worker']);
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [newCustomRole, setNewCustomRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState('');

  const predefinedRoles = [
    t('roles.constructionWorker'),
    t('roles.electrician'),
    t('roles.plumber'),
    t('roles.carpenter'),
    t('roles.mason'),
    t('roles.roofer'),
    t('roles.painter'),
    t('roles.hvacTechnician'),
    t('roles.heavyEquipmentOperator'),
    t('roles.siteSupervisor'),
    t('roles.projectManager')
  ];
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const {
        data: profile
      } = await supabase.from('profiles').select('full_name, avatar_url, work_role').eq('id', user.id).single();
      if (profile) {
        setFullName(profile.full_name || '');
        setAvatarUrl(profile.avatar_url || '');
        
        // Handle JSONB array format from database
        const roles = profile.work_role;
        if (Array.isArray(roles)) {
          const predefined = roles.filter(role => predefinedRoles.includes(role));
          const custom = roles.filter(role => !predefinedRoles.includes(role));
          setSelectedRoles(predefined.length > 0 ? predefined : ['Construction Worker']);
          setCustomRoles(custom);
        } else {
          // Fallback for legacy single role format
          setSelectedRoles([roles || 'Construction Worker']);
          setCustomRoles([]);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleAddCustomRole = () => {
    const trimmedRole = newCustomRole.trim();
    if (trimmedRole && !customRoles.includes(trimmedRole) && !predefinedRoles.includes(trimmedRole)) {
      setCustomRoles(prev => [...prev, trimmedRole]);
      setNewCustomRole('');
    }
  };

  const handleRemoveCustomRole = (role: string) => {
    setCustomRoles(prev => prev.filter(r => r !== role));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // Check rate limiting before proceeding
    const { validateOperation } = await import('@/lib/security')
    const isAllowed = await validateOperation('profile_update', user.id)
    
    if (!isAllowed) {
      toast({
        title: 'Rate limit exceeded',
        description: 'Please wait before updating your profile again',
        variant: 'destructive',
      })
      return
    }

    // Combine all selected roles
    const allRoles = [...selectedRoles, ...customRoles];
    
    // Enhanced validation with work role limits
    const { enhancedProfileValidationSchema } = await import('@/lib/security')
    const validation = enhancedProfileValidationSchema.safeParse({
      full_name: fullName.trim(),
      work_role: allRoles
    });
    
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0]?.message || "Invalid input",
        variant: "destructive"
      });
      return;
    }

    if (allRoles.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please select at least one work role",
        variant: "destructive"
      });
      return;
    }

    const sanitizedName = sanitizeText(validation.data.full_name);
    const sanitizedRoles = allRoles.map(role => sanitizeText(role));
    
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: sanitizedName,
        work_role: sanitizedRoles
      });
      if (error) throw error;
      setFullName(sanitizedName);
      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.'
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
    // Reset to original values from database
    const originalName = user?.user_metadata?.full_name || '';
    setFullName(originalName);
    // Reset roles to their loaded values - we need to refetch from database
    if (user) {
      const fetchProfile = async () => {
        const { data: profile } = await supabase.from('profiles').select('work_role').eq('id', user.id).single();
        if (profile?.work_role) {
          const roles = Array.isArray(profile.work_role) ? profile.work_role : [profile.work_role];
          const predefined = roles.filter(role => predefinedRoles.includes(role));
          const custom = roles.filter(role => !predefinedRoles.includes(role));
          setSelectedRoles(predefined.length > 0 ? predefined : ['Construction Worker']);
          setCustomRoles(custom);
        }
      };
      fetchProfile();
    }
    setNewCustomRole('');
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
        title: t('profile.avatarUpdated'),
        description: t('profile.avatarUpdateSuccess')
      });
    } catch (error) {
      toast({
        title: t('profile.error'),
        description: t('profile.failedToUploadAvatar'),
        variant: 'destructive'
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCroppedImage = async (croppedImageBlob: Blob) => {
    // Convert blob to file for upload
    const file = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });
    await uploadAvatar(file);
  };

  const openImageCropper = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      openImageCropper(file);
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
        openImageCropper(file);
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
        openImageCropper(file);
      }
    };
    input.click();
  };
  return <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <img 
            src="/lovable-uploads/f8eff9bf-a328-4c88-bf0b-a0a5a85c77ec.png" 
            alt="NextGen Home" 
            className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/today')}
          />
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
              {fullName || user?.user_metadata?.full_name || 'Worker'}
            </CardTitle>
            <div className="flex flex-wrap gap-1 justify-center">
              {[...selectedRoles, ...customRoles].map((role, index) => (
                <Badge key={index} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Editable Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">{t('profile.fullName')}</Label>
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
            
            {/* Work Roles Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('profile.workRoles')}</Label>
              {isEditing ? (
                <div className="space-y-4">
                  {/* Predefined Roles Checkboxes */}
                  <div className="grid grid-cols-2 gap-2">
                    {predefinedRoles.map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={role}
                          checked={selectedRoles.includes(role)}
                          onCheckedChange={() => handleRoleToggle(role)}
                        />
                        <Label htmlFor={role} className="text-sm font-normal cursor-pointer">
                          {role}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Custom Roles Section */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('profile.customRoles')}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newCustomRole}
                        onChange={(e) => setNewCustomRole(e.target.value)}
                        placeholder={t('profile.addCustomRole')}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomRole()}
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleAddCustomRole}
                        disabled={!newCustomRole.trim()}
                      >
                        {t('common.add')}
                      </Button>
                    </div>

                    {/* Display Custom Roles */}
                    {customRoles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {customRoles.map((role, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="flex items-center gap-1"
                          >
                            {role}
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-destructive" 
                              onClick={() => handleRemoveCustomRole(role)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {[...selectedRoles, ...customRoles].length > 0 ? (
                        [...selectedRoles, ...customRoles].map((role, index) => (
                          <span key={index} className="text-foreground">
                            {role}{index < [...selectedRoles, ...customRoles].length - 1 ? ', ' : ''}
                          </span>
                        ))
                      ) : (
                        <span className="text-foreground">No roles selected</span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              )}
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
      
      <ImageCropper
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCroppedImage}
      />
    </div>;
}