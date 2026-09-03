import { useLocalSearchParams } from "expo-router";

import { SignInStep } from "@/components/auth/sign-in-step";
import { firstRouteParam, returnTo } from "@/modules/access";
import { useAuthJourney } from "@/modules/auth-journey";

export default function SignInScreen() {
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  return <SignInStep journey={useAuthJourney(returnTo.parse(firstRouteParam(params.returnTo)))} />;
}
