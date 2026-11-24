import { zodResolver } from '@hookform/resolvers/zod';
import { PASSWORD_MIN_LENGTH, registerSchema, type RegisterInput } from '@mini-saas/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { controlClasses, FormField } from '@/components/ui/FormField';
import { getErrorMessage } from '@/lib/api-client';
import { useAuth } from '../auth-context';
import { AuthLayout } from '../components/AuthLayout';
import { FormAlert } from '@/components/ui/FormAlert';
import { PasswordInput } from '@/components/ui/PasswordInput';

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerAccount(values);
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {formError && <FormAlert message={formError} />}

        <FormField label="Full name" error={errors.name?.message}>
          {(field) => (
            <input
              {...field}
              {...register('name')}
              autoComplete="name"
              className={controlClasses}
            />
          )}
        </FormField>

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

        <FormField
          label="Password"
          error={errors.password?.message}
          hint={`At least ${PASSWORD_MIN_LENGTH} characters`}
        >
          {(field) => (
            <PasswordInput {...field} {...register('password')} autoComplete="new-password" />
          )}
        </FormField>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
