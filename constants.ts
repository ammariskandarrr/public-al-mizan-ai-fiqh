import { Home, MessageSquare, FileText, Mic, User as UserIcon } from 'lucide-react';
import { AppRoute, NavItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: Home, route: AppRoute.DASHBOARD },
  { label: 'Shariah Finance Chatbot', icon: MessageSquare, route: AppRoute.CHAT },
  { label: 'Shariah Document Analyzer', icon: FileText, route: AppRoute.DOCUMENTS },
  { label: 'AI Live Sharia Consulting', icon: Mic, route: AppRoute.CONSULTANT },
  { label: 'Profile', icon: UserIcon, route: AppRoute.PROFILE },
];

export const MOCK_PRICING_PLANS = [
  {
    name: 'Basic',
    price: 'Free',
    features: ['Access to Basic Fiqh Chat', '1 Document Analysis/mo', 'Community Support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Scholar',
    price: '$29/mo',
    features: ['Advanced AI Reasoning', 'Unlimited Document Analysis', 'Priority Support', 'Live Voice Consultation'],
    cta: 'Subscribe Now',
    popular: true,
  },
  {
    name: 'Institution',
    price: 'Custom',
    features: ['API Access', 'Dedicated Account Manager', 'Custom Compliance Models'],
    cta: 'Contact Sales',
    popular: false,
  },
];