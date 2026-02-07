/**
 * Icon library - Lucide React only (consistent, tree-shakable, professional).
 * Use consistent sizing: default className "h-5 w-5"
 */

import type { SVGProps } from 'react';
import { forwardRef } from 'react';
import {
  CheckCircle,
  Sparkles,
  Zap,
  BookOpen,
  ArrowRight,
  User,
  Users,
  LogOut,
  Home,
  CreditCard,
  Map,
  CircleUser,
  Globe,
  List,
  ChevronDown,
  Calendar,
  Search,
  ArrowLeft,
  Briefcase,
  MessageSquare,
  Target,
  BarChart3,
  Clock,
  BookMarked,
  Twitter,
  Linkedin,
  Github,
  Instagram,
  Facebook,
  Wand2,
  Dna,
  Gift,
  AlignJustify,
  LayoutDashboard,
  GraduationCap,
  HelpCircle,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconProps = SVGProps<SVGSVGElement> & {
  className?: string;
  size?: number | string;
};

const sizeClass = 'h-5 w-5';

const iconWrapper = (Icon: typeof CheckCircle, name: string) => {
  const Wrapped = forwardRef<SVGSVGElement, IconProps>(
    ({ className, ...props }, ref) => (
      <Icon ref={ref} className={cn(sizeClass, className)} {...props} />
    )
  );
  Wrapped.displayName = name;
  return Wrapped;
};

export const IconCheckCircle = iconWrapper(CheckCircle, 'IconCheckCircle');
export const IconSparkle = iconWrapper(Sparkles, 'IconSparkle');
export const IconMagicWand = iconWrapper(Wand2, 'IconMagicWand');
export const IconDna = iconWrapper(Dna, 'IconDna');
export const IconMessageSquare = iconWrapper(MessageSquare, 'IconMessageSquare');
export const IconLightning = iconWrapper(Zap, 'IconLightning');
export const IconBookOpen = iconWrapper(BookOpen, 'IconBookOpen');
export const IconArrowRight = iconWrapper(ArrowRight, 'IconArrowRight');
export const IconUser = iconWrapper(User, 'IconUser');
export const IconUsers = iconWrapper(Users, 'IconUsers');
export const IconSignOut = iconWrapper(LogOut, 'IconSignOut');
export const IconHouse = iconWrapper(Home, 'IconHouse');
export const IconCreditCard = iconWrapper(CreditCard, 'IconCreditCard');
export const IconMapTrifold = iconWrapper(Map, 'IconMapTrifold');
export const IconUserCircle = iconWrapper(CircleUser, 'IconUserCircle');
export const IconGlobe = iconWrapper(Globe, 'IconGlobe');
export const IconList = iconWrapper(List, 'IconList');
export const IconMenu = iconWrapper(AlignJustify, 'IconMenu');
export const IconCaretDown = iconWrapper(ChevronDown, 'IconCaretDown');
export const IconCalendar = iconWrapper(Calendar, 'IconCalendar');
export const IconMagnifyingGlass = iconWrapper(Search, 'IconMagnifyingGlass');
export const IconArrowLeft = iconWrapper(ArrowLeft, 'IconArrowLeft');
export const IconTwitter = iconWrapper(Twitter, 'IconTwitter');
export const IconLinkedin = iconWrapper(Linkedin, 'IconLinkedin');
export const IconGithub = iconWrapper(Github, 'IconGithub');
export const IconInstagram = iconWrapper(Instagram, 'IconInstagram');
export const IconFacebook = iconWrapper(Facebook, 'IconFacebook');
export const IconBriefcase = iconWrapper(Briefcase, 'IconBriefcase');
export const IconTarget = iconWrapper(Target, 'IconTarget');
export const IconBook2 = iconWrapper(BookMarked, 'IconBook2');
export const IconChartBarTabler = iconWrapper(BarChart3, 'IconChartBarTabler');
export const IconClockTabler = iconWrapper(Clock, 'IconClockTabler');
export const IconChartBar = iconWrapper(BarChart3, 'IconChartBar');
export const IconClock = iconWrapper(Clock, 'IconClock');
export const IconGift = iconWrapper(Gift, 'IconGift');
export const IconLayoutDashboard = iconWrapper(LayoutDashboard, 'IconLayoutDashboard');
export const IconGraduationCap = iconWrapper(GraduationCap, 'IconGraduationCap');
export const IconHelpCircle = iconWrapper(HelpCircle, 'IconHelpCircle');
export const IconTicket = iconWrapper(Ticket, 'IconTicket');