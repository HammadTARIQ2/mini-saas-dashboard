import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@mini-saas/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { controlClasses, FormField } from '@/components/ui/FormField';
import { getErrorMessage } from '@/lib/api-client';
import { useAuth } from '../auth-context';
import { AuthLayout } from '../components/AuthLayout';
import { FormAlert } from '@/components/ui/FormAlert';
import { PasswordInput } from '@/components/ui/PasswordInput';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(from ?? '/', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {formError && <FormAlert message={formError} />}

        <FormField label="Email" error={errors.email?.message}>
          {(field) => (
            <input
              {...field}
              {...register('email')}
              type="email"
              autoComplete="email"
              className={controlClasses}
            />
          )}
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          {(field) => (
            <PasswordInput {...field} {...register('password')} autoComplete="current-password" />
          )}
        </FormField>

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-700 select-none">
          <input
            {...register('rememberMe')}
            type="checkbox"
            className="size-4 rounded border-slate-300 accent-indigo-600"
          />
          Remember me
        </label>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
