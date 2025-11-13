import AsyncStorage from '@react-native-async-storage/async-storage';
import PhotoManipulator, {
  TextOptions,
  TextAlign,
} from 'react-native-photo-manipulator';
import { Image } from 'react-native';

export const addTextWatermark = async (uri: string) => {
  const currentUser = await AsyncStorage.getItem('user');
  const parsedUser = currentUser ? JSON.parse(currentUser) : null;
  console.log(parsedUser);
  const label = parsedUser?.name || 'hello';

  const { width, height } = await new Promise<{
    width: number;
    height: number;
  }>((resolve, reject) => {
    Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
  });

  console.log(width, height);
  const pos = { x: width - 300, y: height - 100 };

  const actions: TextOptions[] = [
    {
      text: label,
      position: pos,
      textSize: 80,
      color: '#000000',
      thickness: 12,
      shadowColor: '#000000',
      shadowRadius: 16,
      shadowOffset: { x: 0, y: 0 },
      align: TextAlign.START,
    },

    {
      text: label,
      position: pos,
      textSize: 80,
      color: '#ffffff',
      thickness: 3,
      shadowColor: '#00000022',
      shadowRadius: 2,
      shadowOffset: { x: 1, y: 1 },
      align: TextAlign.START,
    },
  ];

  const resultUri = await PhotoManipulator.printText(uri, actions);
  return resultUri;
};
