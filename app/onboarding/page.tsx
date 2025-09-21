import { redirect } from 'next/navigation';

// This page acts as a router for the onboarding flow
// It redirects to the welcome page which handles the rest of the flow
export default function OnboardingPage() {
  redirect('/onboarding/welcome');
}