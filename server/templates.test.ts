import { describe, it, expect } from 'vitest';
import { CYCLE_TEMPLATES, getTemplateById, getTemplatesByCategory } from '../shared/templates';

describe('Cycle Templates', () => {
  it('should have valid template data structure', () => {
    expect(CYCLE_TEMPLATES.length).toBeGreaterThan(0);
    
    for (const template of CYCLE_TEMPLATES) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.category).toMatch(/^(fitness|business|learning|personal)$/);
      expect(template.icon).toBeTruthy();
      expect(template.goals.length).toBeGreaterThan(0);
      
      for (const goal of template.goals) {
        expect(goal.title).toBeTruthy();
        expect(goal.description).toBeTruthy();
        expect(goal.tactics.length).toBeGreaterThan(0);
        
        for (const tactic of goal.tactics) {
          expect(tactic.title).toBeTruthy();
          expect(tactic.weeklyTarget).toBeGreaterThan(0);
          expect(tactic.unit).toBeTruthy();
        }
      }
    }
  });

  it('should have at least 5 templates', () => {
    expect(CYCLE_TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });

  it('should have templates in each category', () => {
    const categories = ['fitness', 'business', 'learning', 'personal'] as const;
    
    for (const category of categories) {
      const templatesInCategory = CYCLE_TEMPLATES.filter(t => t.category === category);
      expect(templatesInCategory.length).toBeGreaterThan(0);
    }
  });

  it('should get template by id', () => {
    const template = getTemplateById('fitness-transformation');
    expect(template).toBeTruthy();
    expect(template?.name).toBe('Fitness Transformation');
    expect(template?.category).toBe('fitness');
  });

  it('should return undefined for non-existent template id', () => {
    const template = getTemplateById('non-existent-template');
    expect(template).toBeUndefined();
  });

  it('should get templates by category', () => {
    const fitnessTemplates = getTemplatesByCategory('fitness');
    expect(fitnessTemplates.length).toBeGreaterThan(0);
    expect(fitnessTemplates.every(t => t.category === 'fitness')).toBe(true);
    
    const businessTemplates = getTemplatesByCategory('business');
    expect(businessTemplates.length).toBeGreaterThan(0);
    expect(businessTemplates.every(t => t.category === 'business')).toBe(true);
  });

  it('should have fitness transformation template with correct structure', () => {
    const template = getTemplateById('fitness-transformation');
    expect(template).toBeTruthy();
    expect(template!.goals.length).toBe(2);
    
    // First goal should be about exercise
    expect(template!.goals[0].title).toContain('Exercise');
    expect(template!.goals[0].tactics.length).toBeGreaterThanOrEqual(3);
    
    // Second goal should be about nutrition
    expect(template!.goals[1].title).toContain('Nutrition');
    expect(template!.goals[1].tactics.length).toBeGreaterThanOrEqual(3);
  });

  it('should have business growth template with correct structure', () => {
    const template = getTemplateById('business-growth');
    expect(template).toBeTruthy();
    expect(template!.goals.length).toBe(3);
    
    // Should have revenue, network, and marketing goals
    const goalTitles = template!.goals.map(g => g.title.toLowerCase());
    expect(goalTitles.some(t => t.includes('revenue') || t.includes('sales'))).toBe(true);
    expect(goalTitles.some(t => t.includes('network'))).toBe(true);
    expect(goalTitles.some(t => t.includes('marketing'))).toBe(true);
  });

  it('should have skill mastery template with correct structure', () => {
    const template = getTemplateById('skill-mastery');
    expect(template).toBeTruthy();
    expect(template!.category).toBe('learning');
    expect(template!.goals.length).toBe(2);
  });

  it('should have unique template ids', () => {
    const ids = CYCLE_TEMPLATES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have reasonable weekly targets for tactics', () => {
    for (const template of CYCLE_TEMPLATES) {
      for (const goal of template.goals) {
        for (const tactic of goal.tactics) {
          // Weekly targets should be between 1 and 50
          expect(tactic.weeklyTarget).toBeGreaterThanOrEqual(1);
          expect(tactic.weeklyTarget).toBeLessThanOrEqual(50);
        }
      }
    }
  });
});
