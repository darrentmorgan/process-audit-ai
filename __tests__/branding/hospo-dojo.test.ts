import { 
  hospoDojoBrandingFixture, 
  hospoDojoBrandColorPairs,
  hospoDojoBrandLandingContent 
} from '@/fixtures/brands/hospo-dojo';

describe('Hospo Dojo Branding', () => {
  describe('Brand Configuration', () => {
    it('should have correct name and slug', () => {
      expect(hospoDojoBrandingFixture.name).toBe('Hospo Dojo');
      expect(hospoDojoBrandingFixture.slug).toBe('hospo-dojo');
    });

    it('should have complete color palette', () => {
      const colors = hospoDojoBrandingFixture.colors;
      expect(colors.primary).toBe('#42551C');
      expect(colors.background).toBe('#FFFFFF');
      expect(colors.surface).toBe('#EAE8DD');
    });

    it('should have correct typography configuration', () => {
      const typography = hospoDojoBrandingFixture.typography;
      expect(typography.baseFontSize).toBe(16);
      expect(typography.lineHeight).toBe(1.5);
    });
  });

  describe('Accessibility Color Validation', () => {
    hospoDojoBrandColorPairs.forEach(pair => {
      it(`should validate ${pair.description} color contrast`, () => {
        expect(pair.contrastRatio).toBeGreaterThanOrEqual(
          pair.description.includes('headings') ? 4.5 : 7.0
        );
      });
    });
  });

  describe('Landing Page Content', () => {
    it('should have complete hero content', () => {
      const hero = hospoDojoBrandLandingContent.hero;
      expect(hero.headline).toBe('PREP FOR SUCCESS');
      expect(hero.subheadline).toContain('BATTLE-READY');
    });

    it('should have 3 features', () => {
      expect(hospoDojoBrandLandingContent.features).toHaveLength(3);
    });

    it('should have CTA content', () => {
      const cta = hospoDojoBrandLandingContent.cta;
      expect(cta.primary).toBe('Join the Dojo');
      expect(cta.secondary).toBe('Start Training');
    });
  });
});