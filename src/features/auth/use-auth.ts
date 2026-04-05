import { useMutation } from '@tanstack/react-query';

import { authService } from '@/src/lib/auth';

export const useLogin = () => useMutation({ mutationFn: authService.login });
export const useSignup = () => useMutation({ mutationFn: authService.signup });
export const useForgotPassword = () =>
  useMutation({ mutationFn: (email: string) => authService.sendForgotPasswordCode(email) });
export const useVerifyCode = () =>
  useMutation({ mutationFn: ({ email, code }: { email: string; code: string }) => authService.verifyCode(email, code) });
export const useResetPassword = () =>
  useMutation({ mutationFn: ({ password }: { password: string }) => authService.resetPassword(password) });

