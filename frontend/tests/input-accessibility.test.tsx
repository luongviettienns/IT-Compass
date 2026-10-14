import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Input } from '../src/components/ui/Input';
import { Textarea } from '../src/components/ui/Textarea';

describe('Form Fields Accessibility (Input & Textarea)', () => {
    afterEach(() => {
        cleanup();
    });

    describe('Input', () => {
        it('associates label with input using htmlFor and id', () => {
            render(<Input label="Họ và tên" placeholder="Nhập họ tên" />);
            const input = screen.getByLabelText('Họ và tên');
            expect(input).toBeDefined();
            expect(input.getAttribute('placeholder')).toBe('Nhập họ tên');
        });

        it('sets aria-invalid, aria-describedby, and role="alert" when error is present', () => {
            render(<Input label="Email" error="Email không hợp lệ" id="email-field" />);
            const input = screen.getByLabelText('Email');
            expect(input.getAttribute('aria-invalid')).toBe('true');

            const describedBy = input.getAttribute('aria-describedby');
            expect(describedBy).toBeTruthy();

            const alert = screen.getByRole('alert');
            expect(alert).toBeDefined();
            expect(alert.textContent).toBe('Email không hợp lệ');
            expect(alert.id).toBe(describedBy);
        });

        it('associates helperText via aria-describedby when no error', () => {
            render(<Input label="Mật khẩu" helperText="Tối thiểu 8 ký tự" id="password-field" />);
            const input = screen.getByLabelText('Mật khẩu');
            expect(input.getAttribute('aria-invalid')).toBeNull();

            const describedBy = input.getAttribute('aria-describedby');
            expect(describedBy).toBe('password-field-helper');
            expect(screen.getByText('Tối thiểu 8 ký tự').id).toBe('password-field-helper');
        });
    });

    describe('Textarea', () => {
        it('associates label with textarea using htmlFor and id', () => {
            render(<Textarea label="Nội dung ghi chú" placeholder="Nhập ghi chú" />);
            const textarea = screen.getByLabelText('Nội dung ghi chú');
            expect(textarea).toBeDefined();
            expect(textarea.getAttribute('placeholder')).toBe('Nhập ghi chú');
        });

        it('sets aria-invalid, aria-describedby, and role="alert" when error is present', () => {
            render(<Textarea label="Mô tả" error="Mô tả quá ngắn" id="desc-field" />);
            const textarea = screen.getByLabelText('Mô tả');
            expect(textarea.getAttribute('aria-invalid')).toBe('true');

            const describedBy = textarea.getAttribute('aria-describedby');
            expect(describedBy).toBeTruthy();

            const alert = screen.getByRole('alert');
            expect(alert).toBeDefined();
            expect(alert.textContent).toBe('Mô tả quá ngắn');
            expect(alert.id).toBe(describedBy);
        });
    });
});
