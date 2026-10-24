import { View } from 'react-native';
import { Text } from '@/components/ui/stock components/text';
import { LoginForm } from '@/components/ui/loginForm';

export default function LoginScreen() {
  return (
    <View className="flex-1 items-centerground p-6">
      <Text className="text-2xl font-semibold">Log ind</Text>
      <LoginForm />
    </View>
  );
}