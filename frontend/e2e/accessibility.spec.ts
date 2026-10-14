import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.1 AA Accessibility Automated Audits', () => {
    test('homepage should pass axe WCAG 2.1 AA audit with 0 critical or serious violations', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const scanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .disableRules(['color-contrast'])
            .analyze();

        const criticalAndSerious = scanResults.violations.filter(
            v => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalAndSerious).toEqual([]);
    });

    test('assessment landing should pass axe WCAG 2.1 AA audit', async ({ page }) => {
        await page.goto('/test');
        await page.waitForLoadState('networkidle');

        const scanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .disableRules(['color-contrast'])
            .analyze();

        const criticalAndSerious = scanResults.violations.filter(
            v => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalAndSerious).toEqual([]);
    });

    test('blog listing should pass axe WCAG 2.1 AA audit', async ({ page }) => {
        await page.goto('/blog');
        await page.waitForLoadState('networkidle');

        const scanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .disableRules(['color-contrast'])
            .analyze();

        const criticalAndSerious = scanResults.violations.filter(
            v => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalAndSerious).toEqual([]);
    });

    test('mentors listing should pass axe WCAG 2.1 AA audit', async ({ page }) => {
        await page.goto('/mentors');
        await page.waitForLoadState('networkidle');

        const scanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .disableRules(['color-contrast'])
            .analyze();

        const criticalAndSerious = scanResults.violations.filter(
            v => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalAndSerious).toEqual([]);
    });
});
