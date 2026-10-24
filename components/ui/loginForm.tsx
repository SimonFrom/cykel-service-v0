import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/stock components/input';
import { Label } from '@/components/ui/stock components/label';
import { Button } from '@/components/ui/stock components/button';
import { Text } from '@/components/ui/stock components/text';
import { useAuthStore } from '@/store/authStore';

type FormData = {
  email: string;
  password: string;
};

export function LoginForm() {
  const signIn = useAuthStore((s) => s.signIn);
  const authError = useAuthStore((s) => s.error);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }: FormData) => {
    await signIn(email.trim(), password);
  };

  return (
    <View className="w-full max-w-sm gap-4">
      <View className="gap-1">
        <Label nativeID="email">Email</Label>
        <Controller
          control={control}
          name="email"
          rules={{ required: 'Email er påkrævet' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              id="email"
              keyboardType="email-address"  
              autoCapitalize="none"
              autoComplete="email"
              textContentType="username"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              aria-labelledby="email"
            />
          )}
        />
        {errors.email && <Text className="text-xs text-destructive">{errors.email.message}</Text>}
      </View>

      <View className="gap-1">
        <Label nativeID="password">Adgangskode</Label>
        <Controller
          control={control}
          name="password"
          rules={{ required: 'Adgangskode er påkrævet' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              id="password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={handleSubmit(onSubmit)}
              value={value}
              aria-labelledby="password"
            />
          )}
        />
        {errors.password && (
          <Text className="text-xs text-destructive">{errors.password.message}</Text>
        )}
      </View>

      {authError && <Text className="text-xs text-destructive">{authError}</Text>}

      <Button onPress={handleSubmit(onSubmit)}>
        <Text>{isSubmitting ? 'Logger ind...' : 'Log ind'}</Text>
      </Button>
    </View>
  );
}


