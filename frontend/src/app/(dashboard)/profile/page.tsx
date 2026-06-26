import ProfileForm from '@/components/profile/ProfileForm';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-extrabold text-indigo-950 tracking-tight">Profile Settings</h2>
        <p className="text-zinc-500 mt-1 text-sm">
          Update skin properties, allergies, and preference levels.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
