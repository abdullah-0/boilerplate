import { createRouter, createWebHistory } from "vue-router";

import DashboardView from "@/views/DashboardView.vue";
import ForgotPasswordView from "@/views/ForgotPasswordView.vue";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import ResetPasswordView from "@/views/ResetPasswordView.vue";
import VerifyEmailView from "@/views/VerifyEmailView.vue";
import { useAuthStore } from "@/store/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: "/forgot-password",
      name: "forgotPassword",
      component: ForgotPasswordView,
    },
    {
      path: "/reset-password",
      name: "resetPassword",
      component: ResetPasswordView,
    },
    {
      path: "/verify-email",
      name: "verifyEmail",
      component: VerifyEmailView,
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (auth.isLoading) {
    await auth.hydrate();
  }

  if (to.meta.requiresAuth && !auth.user) {
    return { name: "login" };
  }

  if (to.meta.guestOnly && auth.user) {
    return { name: "dashboard" };
  }

  return true;
});

export default router;
