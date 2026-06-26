'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Profile } from '@/types/profile';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Trash2, Plus, Sparkles } from 'lucide-react';

export default function ProfileForm() {
  const [profile, setProfile] = useState<Profile>({
    user_id: '',
    skin_type: 'normal',
    allergies: [],
    expertise_level: 'beginner',
    concerns: [],
  });
  const [customAllergen, setCustomAllergen] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsFetching(true);
    try {
      const response = await api.get('/profile/');
      setProfile(response.data);
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      const errMsg = error.response?.data?.detail || error.message || "Failed to load your skincare profile.";
      toast({
        title: "Load Error",
        description: errMsg,
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/profile/', profile);
      toast({
        title: "Profile Saved",
        description: "Your skincare profile has been successfully updated!",
      });
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      const errMsg = error.response?.data?.detail || error.message || "Failed to update skincare profile. Please try again.";
      toast({
        title: "Save Error",
        description: errMsg,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addAllergen = () => {
    const trimmed = customAllergen.trim();
    if (trimmed && !profile.allergies.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      setProfile({
        ...profile,
        allergies: [...profile.allergies, trimmed],
      });
      setCustomAllergen('');
    }
  };

  const removeAllergen = (allergen: string) => {
    setProfile({
      ...profile,
      allergies: profile.allergies.filter(a => a !== allergen),
    });
  };

  const toggleConcern = (concern: string) => {
    setProfile({
      ...profile,
      concerns: profile.concerns.includes(concern)
        ? profile.concerns.filter(c => c !== concern)
        : [...profile.concerns, concern],
    });
  };

  const CONCERNS = [
    'Acne / Breakouts',
    'Sensitivity / Redness',
    'Dryness / Dehydration',
    'Hyperpigmentation',
    'Anti-aging',
    'Large Pores',
    'Eczema-prone',
  ];

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-zinc-200 mt-6">
      <CardHeader>
        <div className="flex items-center gap-2 text-indigo-600 mb-1">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-wider uppercase">Skincare Profile</span>
        </div>
        <CardTitle className="text-2xl font-bold">Personalized Diagnostics</CardTitle>
        <CardDescription>
          Customize your biological skin parameters. The safety agents will cross-reference these when reviewing ingredients.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-zinc-700">Skin Type</Label>
          <Select
            value={profile.skin_type}
            onValueChange={(value) => setProfile({ ...profile, skin_type: value as any })}
          >
            <SelectTrigger className="bg-zinc-50 border-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal Skin</SelectItem>
              <SelectItem value="dry">Dry Skin</SelectItem>
              <SelectItem value="oily">Oily Skin</SelectItem>
              <SelectItem value="combination">Combination Skin</SelectItem>
              <SelectItem value="sensitive">Sensitive Skin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-zinc-700">Skincare Expertise Level</Label>
          <Select
            value={profile.expertise_level}
            onValueChange={(value) => setProfile({ ...profile, expertise_level: value as any })}
          >
            <SelectTrigger className="bg-zinc-50 border-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner (Simple warnings, basic terms)</SelectItem>
              <SelectItem value="intermediate">Intermediate (Standard compound breakdown)</SelectItem>
              <SelectItem value="expert">Expert (Detailed chemical analyses and safety structures)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-zinc-700 block">Active Skin Concerns</Label>
          <div className="flex flex-wrap gap-2">
            {CONCERNS.map((concern) => {
              const isSelected = profile.concerns.includes(concern);
              return (
                <Button
                  key={concern}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleConcern(concern)}
                  className={`rounded-full transition-all text-xs font-semibold ${isSelected ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                >
                  {concern}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-zinc-150">
          <Label className="text-sm font-semibold text-zinc-700">Allergies & Avoided Ingredients</Label>
          <div className="flex gap-2">
            <Input
              value={customAllergen}
              onChange={(e) => setCustomAllergen(e.target.value)}
              placeholder="e.g. Parabens, Retinol, Fragrance..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
              className="bg-zinc-50 border-zinc-200"
            />
            <Button onClick={addAllergen} type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 flex items-center">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {profile.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200 max-h-32 overflow-y-auto">
              {profile.allergies.map((allergen) => (
                <div
                  key={allergen}
                  className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold"
                >
                  {allergen}
                  <button
                    type="button"
                    onClick={() => removeAllergen(allergen)}
                    className="hover:bg-red-200 p-0.5 rounded-full transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-400 italic">No allergens declared. Click add to register a substance.</div>
          )}
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-base font-bold transition-colors">
          {isSaving ? 'Saving parameters...' : 'Save Skincare Profile'}
        </Button>
      </CardContent>
    </Card>
  );
}
