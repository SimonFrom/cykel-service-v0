import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2Icon } from 'lucide-react-native';

export function Success() {
  <Alert icon={CheckCircle2Icon}>
    <AlertTitle>Det lykkedes!</AlertTitle>
    <AlertDescription>Ændringerne er gemt.</AlertDescription>
  </Alert>;
}
