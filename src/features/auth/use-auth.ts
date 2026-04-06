import { useMutation } from '@tanstack/react-query';

import { authService } from '@/src/lib/auth';

export const useLogin = () => useMutation({ mutationFn: authService.login });
export const useSignup = () => useMutation({ mutationFn: authService.signup });
export const useForgotPassword = () =>
  useMutation({ mutationFn: (email: string) => authService.sendForgotPasswordCode(email) });
export const useVerifyCode = () =>
  useMutation({
    mutationFn: ({
      email,
      code,
      context,
    }: {
      email: string;
      code: string;
      context: 'signup' | 'forgot';
    }) => authService.verifyCode(email, code, context),
  });
export const useResendCode = () =>
  useMutation({
    mutationFn: ({ email, context }: { email: string; context: 'signup' | 'forgot' }) =>
      authService.resendCode(email, context),
  });
export const useResetPassword = () =>
  useMutation({ mutationFn: ({ password }: { password: string }) => authService.resetPassword(password) });
