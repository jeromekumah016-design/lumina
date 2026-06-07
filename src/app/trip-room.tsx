import { useLocalSearchParams } from 'expo-router';
import TripRoomScreen from '../components/TripRoomScreen';

export default function TripRoomRoute() {
  const { city, propId } = useLocalSearchParams<{ city: string; propId: string }>();
  return <TripRoomScreen city={city || 'Chicago'} propId={propId || ''} />;
}
