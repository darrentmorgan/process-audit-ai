// Landing Page Type Definitions for ProcessAudit AI

export interface SectionBase {
  id: string
  title: string
  description?: string
}

export interface HeroSection extends SectionBase {
  headline: string
  subheadline: string
  ctaText: string
  ctaLink: string
  backgroundImage?: string
}

export interface FeatureItem {
  icon: string
  title: string
  description: string
}

export interface FeatureSection extends SectionBase {
  features: FeatureItem[]
}

export interface TestimonialItem {
  quote: string
  author: {
    name: string
    title: string
    avatar?: string
  }
}

export interface TestimonialSection extends SectionBase {
  testimonials: TestimonialItem[]
}

export interface CallToActionSection extends SectionBase {
  ctaText: string
  ctaLink: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
}

export interface LandingPageContent {
  hero: HeroSection
  features?: FeatureSection
  testimonials?: TestimonialSection
  cta: CallToActionSection
  customSections?: SectionBase[]
}

export interface OrganizationLandingPageProps {
  orgSlug: string
  content: LandingPageContent
}